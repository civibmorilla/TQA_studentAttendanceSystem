import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function InstructorDashboard() {
  const navigate = useNavigate();

  const assignedClasses = [
    { code: 'MATH-301', title: 'Calculus', section: 'BSCpE-101', schedule: 'Mon/Wed • 8:30 AM - 10:00 AM', room: 'Room 402' },
    { code: 'MATH-302', title: 'Advanced Math', section: 'BSIT-201', schedule: 'Tue/Thu • 10:30 AM - 12:00 PM', room: 'Room 405' },
    { code: 'CPE-401', title: 'Embedded Systems', section: 'BSCpE-301', schedule: 'Wed/Fri • 1:30 PM - 3:30 PM', room: 'Lab A' },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Instructor Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Welcome back, Prof. Juan Dela Cruz. Here are your assigned classes.</p>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Term: <strong className="text-blue-600">1st Sem, 2026</strong>
        </span>
      </div>

      <h2 className="text-sm font-bold text-slate-800 mb-4">My Schedule & Classes</h2>
      <div className="grid grid-cols-2 gap-6">
        {assignedClasses.map((cls, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{cls.code}</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold">{cls.section}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">{cls.title}</h3>
              <div className="space-y-1.5 text-xs text-slate-500 mb-6">
                <p><strong className="text-slate-700 font-semibold">Schedule:</strong> {cls.schedule}</p>
                <p><strong className="text-slate-700 font-semibold">Room:</strong> {cls.room}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/instructor/attendance')}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-semibold text-xs rounded-xl text-center transition block border border-blue-100 hover:border-blue-600"
            >
              Open Attendance Sheet
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}