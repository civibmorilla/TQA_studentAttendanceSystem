// Creates demo accounts + one class so the app can be tested end to end.
// Safe to run more than once: anything that already exists is left untouched.
// Usage:  cd server  &&  npm run seed
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Program = require('./models/Program');
const Subject = require('./models/Subject');

dotenv.config();

const PASSWORD = 'password123';

const DEMO_USERS = [
  { userCustomId: 'ADMIN-01', fullName: 'Demo Admin', email: 'admin@demo.local', role: 'ADMIN' },
  { userCustomId: 'INST-01', fullName: 'Demo Instructor', email: 'instructor@demo.local', role: 'INSTRUCTOR' },
  { userCustomId: 'STU-001', fullName: 'Juan Dela Cruz', email: 'student1@demo.local', role: 'STUDENT' },
  { userCustomId: 'STU-002', fullName: 'Maria Santos', email: 'student2@demo.local', role: 'STUDENT' },
  { userCustomId: 'STU-003', fullName: 'Jose Reyes', email: 'student3@demo.local', role: 'STUDENT' }
];

async function upsertUser(data) {
  let user = await User.findOne({ userCustomId: data.userCustomId });
  if (user) {
    console.log(`  = ${data.userCustomId} already exists (password not changed)`);
    return user;
  }
  user = await User.create({ ...data, password: PASSWORD });
  console.log(`  + created ${data.role.padEnd(10)} ${data.userCustomId}`);
  return user;
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing from server/.env');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding demo data...');

  const users = {};
  for (const u of DEMO_USERS) users[u.userCustomId] = await upsertUser(u);

  let program = await Program.findOne({ code: 'BSCPE-DEMO' });
  if (!program) {
    program = await Program.create({ code: 'BSCPE-DEMO', name: 'BS Computer Engineering (Demo)' });
    console.log('  + created program BSCPE-DEMO');
  }

  let subject = await Subject.findOne({ code: 'TQA-DEMO', section: 'DEMO-301' });
  if (!subject) {
    subject = await Subject.create({
      code: 'TQA-DEMO',
      title: 'Test and Quality Assurance',
      program: program._id,
      yearLevel: '3rd Year',
      section: 'DEMO-301',
      instructor: users['INST-01']._id,
      schedule: 'Mon/Wed 8:30 AM - 10:00 AM',
      room: 'Room 301'
    });
    console.log('  + created subject TQA-DEMO (DEMO-301)');
  }

  // Enroll the demo students in the demo class (updateOne avoids touching passwords)
  for (const id of ['STU-001', 'STU-002', 'STU-003']) {
    await User.updateOne(
      { _id: users[id]._id },
      {
        $set: { isEnrolled: true, program: program._id, yearLevel: '3rd Year', section: 'DEMO-301' },
        $addToSet: { enrolledSubjects: subject._id }
      }
    );
  }
  console.log('  + enrolled STU-001..003 in TQA-DEMO');

  console.log(`\nDone. All new demo accounts use the password: ${PASSWORD}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
