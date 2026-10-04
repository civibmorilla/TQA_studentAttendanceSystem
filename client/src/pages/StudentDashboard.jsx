import React from 'react';

export default function StudentDashboard() {
  const classes = [
    { subject: 'Calculus', instructor: 'Mr. A', time: '08:30 AM', status: 'Present' },
    { subject: 'NSTP', instructor: 'Mr. B', time: '10:30 AM', status: 'Late' },
    { subject: 'Chemistry', instructor: 'Ms. A', time: '01:30 PM', status: 'Present' },
    { subject: 'Ethics', instructor: 'Ms. B', time: '03:30 PM', status: 'Present' },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back, Juan Dela Cruz</h1>
          <p className="text-xs text-slate-500">Always remember to tap in for your classes today.</p>
        </div>
        <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg shadow-sm">
          August 24, 2026
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Classes</span>
          <div className="text-3xl font-bold text-slate-800 mt-2">48</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Present</span>
          <div className="text-3xl font-bold text-emerald-600 mt-2">42</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Late</span>
          <div className="text-3xl font-bold text-amber-500 mt-2">4</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Absent</span>
          <div className="text-3xl font-bold text-rose-500 mt-2">2</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Today's Class Attendance</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Instructor</th>
              <th className="py-3 px-4">Schedule Time</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {classes.map((item, i) => (
              <tr key={i}>
                <td className="py-3.5 px-4 font-bold">{item.subject}</td>
                <td className="py-3.5 px-4">{item.instructor}</td>
                <td className="py-3.5 px-4">{item.time}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                    item.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}