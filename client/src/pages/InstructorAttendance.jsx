import React, { useState } from 'react';

export default function InstructorAttendance() {
  const [roster, setRoster] = useState([
    { id: '1', name: 'Juan Dela Cruz', studentId: '1234-0000', status: 'PRESENT' },
    { id: '2', name: 'Adrian Santos', studentId: '1234-0001', status: 'PRESENT' },
    { id: '3', name: 'Carlos Mendoza', studentId: '1234-0002', status: 'LATE' },
    { id: '4', name: 'Maria Garcia', studentId: '1234-0003', status: 'ABSENT' },
    { id: '5', name: 'Ana Reyes', studentId: '1234-0004', status: 'PRESENT' },
  ]);

  const handleToggle = (id, newStatus) => {
    setRoster(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Daily Attendance Sheet</h1>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm">
            📷 Scan Student Barcode / QR ID
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Term: <strong className="text-blue-600">1st Sem, 2026</strong>
          </span>
        </div>
      </div>

      {/* Cohort Selector Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Select Class Cohort Details</h2>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Program</label>
            <select className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>BSCpE</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Year Level</label>
            <select className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>1st Year</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Section</label>
            <select className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>101</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
            <select className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>Calculus</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Attendance Date</label>
            <input type="date" defaultValue="2026-08-24" className="w-full border border-blue-500 rounded-lg p-2 text-xs font-medium text-blue-700 bg-blue-50/30 outline-none" />
          </div>
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-slate-800">Student Roster Attendance Entry</h2>
          <span className="text-xs text-slate-500">Class Cohort: <strong className="text-slate-700">BSCpE-101 / Calculus</strong></span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
              <th className="py-3 px-4 rounded-l-lg">#</th>
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-4">Student ID</th>
              <th className="py-3 px-4 text-center rounded-r-lg">Attendance Status Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {roster.map((row, idx) => (
              <tr key={row.id}>
                <td className="py-4 px-4 text-slate-400 font-medium">{idx + 1}</td>
                <td className="py-4 px-4 font-bold text-slate-800">{row.name}</td>
                <td className="py-4 px-4 text-slate-500">{row.studentId}</td>
                <td className="py-4 px-4">
                  <div className="flex justify-center gap-1.5 mx-auto">
                    {[
                      { key: 'PRESENT', label: 'P', activeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' },
                      { key: 'LATE', label: 'L', activeClass: 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm' },
                      { key: 'ABSENT', label: 'A', activeClass: 'bg-rose-100 text-rose-700 border-rose-200 shadow-sm' }
                    ].map(btn => {
                      const isActive = row.status === btn.key;
                      return (
                        <button
                          key={btn.key}
                          onClick={() => handleToggle(row.id, btn.key)}
                          className={`w-9 h-8 rounded-lg font-bold text-xs border transition-all ${
                            isActive 
                              ? btn.activeClass 
                              : 'bg-white border-slate-100 text-slate-300 hover:text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-8 border-t border-slate-100 pt-6">
          <button className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition">
            Save Attendance Sheet
          </button>
        </div>
      </div>
    </div>
  );
}