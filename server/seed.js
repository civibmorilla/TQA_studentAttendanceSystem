// Creates demo accounts and one class (section DEMO-301) with 4 subjects,
// all taught by INST-01, with 10 students enrolled in every subject.
//
// Safe to run more than once: existing accounts are kept, but their role,
// section and subject enrollment are corrected every run.
//
// Usage (from the server folder):
//   npm run seed                          -> uses MONGO_URI from server/.env
//   npm run seed -- --reset-passwords     -> also sets every demo account back to password123
//   MONGO_URI='mongodb+srv://...' npm run seed   -> seed another database (e.g. the live one)
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Program = require('./models/Program');
const Subject = require('./models/Subject');

dotenv.config();

const PASSWORD = 'password123';
const RESET_PASSWORDS = process.argv.includes('--reset-passwords');

const SECTION = 'DEMO-301';
const YEAR_LEVEL = '3rd Year';

const STAFF = [
  { userCustomId: 'ADMIN-01', fullName: 'Demo Admin', email: 'admin@demo.local', role: 'ADMIN' },
  { userCustomId: 'INST-01', fullName: 'Demo Instructor', email: 'instructor@demo.local', role: 'INSTRUCTOR' }
];

const STUDENTS = [
  'Juan Dela Cruz',
  'Maria Santos',
  'Jose Reyes',
  'Ana Garcia',
  'Mark Villanueva',
  'Kristine Mendoza',
  'Paolo Ramos',
  'Angelica Bautista',
  'Carlo Navarro',
  'Bea Fernandez'
].map((fullName, i) => {
  const n = String(i + 1).padStart(3, '0');
  return { userCustomId: `STU-${n}`, fullName, email: `student${i + 1}@demo.local`, role: 'STUDENT' };
});

// All four subjects belong to the same class (section DEMO-301) and the same instructor.
const SUBJECTS = [
  { code: 'TQA-DEMO', title: 'Test and Quality Assurance', schedule: 'Mon/Wed 8:30 AM - 10:00 AM', room: 'Room 301' },
  { code: 'WEB-DEMO', title: 'Web Systems and Technologies', schedule: 'Mon/Wed 10:30 AM - 12:00 PM', room: 'Room 302' },
  { code: 'DBMS-DEMO', title: 'Database Management Systems', schedule: 'Tue/Thu 1:00 PM - 2:30 PM', room: 'Computer Lab 2' },
  { code: 'NET-DEMO', title: 'Data Communications and Networking', schedule: 'Tue/Thu 3:00 PM - 4:30 PM', room: 'Computer Lab 3' }
];

async function upsertUser(data) {
  // Match on the login ID first, then on the email (avoids duplicate-email errors)
  let user = await User.findOne({ userCustomId: data.userCustomId });
  if (!user) user = await User.findOne({ email: data.email });

  if (!user) {
    user = await User.create({ ...data, password: PASSWORD, isActive: true });
    console.log(`  + created ${data.role.padEnd(10)} ${data.userCustomId}  ${data.fullName}`);
    return user;
  }

  // Existing account: make sure it is usable for the demo
  user.userCustomId = data.userCustomId;
  user.role = data.role;
  user.isActive = true;
  if (RESET_PASSWORDS) {
    user.password = PASSWORD; // re-hashed by the User model's pre-save hook
    user.mustChangePassword = false;
  }
  await user.save();
  console.log(`  = ${data.userCustomId} already exists${RESET_PASSWORDS ? ' (password reset)' : ' (password not changed)'}`);
  return user;
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing from server/.env');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding demo data...\n');

  // 1. Accounts
  const users = {};
  for (const u of [...STAFF, ...STUDENTS]) users[u.userCustomId] = await upsertUser(u);
  const instructor = users['INST-01'];

  // 2. Program
  let program = await Program.findOne({ code: 'BSCPE-DEMO' });
  if (!program) {
    program = await Program.create({ code: 'BSCPE-DEMO', name: 'BS Computer Engineering (Demo)' });
    console.log('\n  + created program BSCPE-DEMO');
  }

  // 3. Subjects of class DEMO-301, all taught by INST-01
  console.log('');
  const subjectIds = [];
  for (const s of SUBJECTS) {
    let subject = await Subject.findOne({ code: s.code, section: SECTION });
    if (!subject) {
      subject = await Subject.create({
        ...s,
        program: program._id,
        yearLevel: YEAR_LEVEL,
        section: SECTION,
        instructor: instructor._id
      });
      console.log(`  + created subject ${s.code.padEnd(10)} ${s.title}`);
    } else {
      // Make sure an older copy is still assigned to INST-01 and this class
      subject.instructor = instructor._id;
      subject.program = program._id;
      subject.yearLevel = YEAR_LEVEL;
      await subject.save();
      console.log(`  = subject ${s.code.padEnd(10)} already exists (assigned to INST-01)`);
    }
    subjectIds.push(subject._id);
  }

  // 4. Enroll all 10 students in every subject (updateOne leaves passwords alone)
  for (const s of STUDENTS) {
    await User.updateOne(
      { _id: users[s.userCustomId]._id },
      {
        $set: { isEnrolled: true, program: program._id, yearLevel: YEAR_LEVEL, section: SECTION },
        $addToSet: { enrolledSubjects: { $each: subjectIds } }
      }
    );
  }
  console.log(`\n  + enrolled STU-001..STU-${String(STUDENTS.length).padStart(3, '0')} in all ${subjectIds.length} subjects of ${SECTION}`);

  // 5. Quick check, so problems show up here instead of during the demo
  const count = await User.countDocuments({ role: 'STUDENT', isEnrolled: true, enrolledSubjects: { $all: subjectIds } });
  console.log(`  ✓ ${count} students are enrolled in all ${subjectIds.length} subjects`);

  console.log(`\nDone. New demo accounts use the password: ${PASSWORD}`);
  if (!RESET_PASSWORDS) console.log('Tip: run "npm run seed -- --reset-passwords" if an existing demo account cannot log in.');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
