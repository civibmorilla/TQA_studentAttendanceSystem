import React from 'react';

export default function StudentSubjects() {
  const courses = [
    {
      code: 'MATH-301',
      title: 'Calculus',
      instructor: 'Mr. A',
      schedule: 'Mon/Wed • 8:30 AM - 10:00 AM',
      room: 'Room 402'
    },
    {
      code: 'NSTP-101',
      title: 'NSTP',
      instructor: 'Mr. B',
      schedule: 'Tue/Thu • 10:30 AM - 12:00 PM',
      room: 'Gymnasium'
    },
    {
      code: 'CHEM-204',
      title: 'Chemistry',
      instructor: 'Ms. A',
      schedule: 'Wed/Fri • 1:30 PM - 3:00 PM',
      room: 'Science Lab B'
    },
    {
      code: 'ETH-102',
      title: 'Ethics',
      instructor: 'Ms. B',
      schedule: 'Fri • 3:30 PM - 5:30 PM',
      room: 'Room 205'
    }
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Enrolled Subjects</h1>
          <p className="text-xs text-slate-400 mt-1">
            You are currently enrolled in {courses.length} academic subjects this semester.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm">
            📷 Scan Student Barcode / QR ID
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Term: <strong className="text-blue-600">1st Sem, 2026</strong>
          </span>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-2 gap-6">
        {courses.map((course) => (
          <div key={course.code} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{course.code}</span>
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                  📖
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">{course.title}</h3>

              <div className="space-y-1.5 text-xs text-slate-500 mb-6">
                <p><strong className="text-slate-700 font-semibold">Instructor:</strong> {course.instructor}</p>
                <p><strong className="text-slate-700 font-semibold">Schedule:</strong> {course.schedule}</p>
                <p><strong className="text-slate-700 font-semibold">Room:</strong> {course.room}</p>
              </div>
            </div>

            <a
              href="/student/attendance"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl text-center shadow-md shadow-blue-600/20 transition block"
            >
              View Attendance Record
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}