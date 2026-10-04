import React from 'react';

export default function StudentAttendance() {
  const stats = { total: 20, present: 10, late: 5, absent: 5, rate: 62.5, targetMin: 80.0 };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-4">
        <a href="/student/subjects" className="text-xs font-semibold text-blue-600 hover:underline">← Back to My Subjects</a>
        <h1 className="text-2xl font-bold text-slate-800 mt-1">Calculus Attendance Record</h1>
        <p className="text-xs text-slate-400">Student: <strong>Juan Dela Cruz</strong> • Section: <strong>BSCpE-101</strong></p>
      </div>

      {stats.rate < stats.targetMin && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-700">
          <div className="flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <h4 className="text-xs font-bold">Attendance Target Alert</h4>
              <p className="text-[11px] text-rose-600">Your current overall attendance rate is <strong>{stats.rate}%</strong>, which is below the minimum required <strong>80.0% target</strong>.</p>
            </div>
          </div>
          <span className="text-xs bg-rose-100 text-rose-800 px-3 py-1 rounded-full font-bold">Action Required</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Classes</span>
          <div className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Present</span>
          <div className="text-3xl font-bold text-emerald-600 mt-2">{stats.present}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Late</span>
          <div className="text-3xl font-bold text-amber-500 mt-2">{stats.late}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Absent</span>
          <div className="text-3xl font-bold text-rose-500 mt-2">{stats.absent}</div>
        </div>
      </div>
    </div>
  );
}