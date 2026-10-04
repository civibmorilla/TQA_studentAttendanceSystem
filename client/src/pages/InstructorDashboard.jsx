import React, { useState } from 'react';

export default function InstructorDashboard() {
  const [roster, setRoster] = useState([
    { id: '1', name: 'Juan Dela Cruz', studentId: '1234-0000', status: 'PRESENT' },
    { id: '2', name: 'Adrian Santos', studentId: '1234-0001', status: 'PRESENT' },
    { id: '3', name: 'Carlos Mendoza', studentId: '1234-0002', status: 'LATE' },
    { id: '4', name: 'Maria Garcia', studentId: '1234-0003', status: 'ABSENT' },
  ]);

  const handleToggle = (id, newStatus) => {
    setRoster(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Daily Attendance Sheet</h1>
        <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
          📷 Scan Student Barcode / QR ID
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Student Roster Attendance Entry</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-4">Student ID</th>
              <th className="py-3 px-4 text-center">Status Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {roster.map((row, idx) => (
              <tr key={row.id}>
                <td className="py-3.5 px-4 text-slate-400">{idx + 1}</td>
                <td className="py-3.5 px-4 font-bold text-slate-800">{row.name}</td>
                <td className="py-3.5 px-4 text-slate-500">{row.studentId}</td>
                <td className="py-3.5 px-4">
                  <div className="flex justify-center gap-2 bg-slate-100 p-1.5 rounded-xl w-max mx-auto">
                    {[
                      { key: 'PRESENT', label: 'P', style: 'bg-emerald-500 text-white' },
                      { key: 'LATE', label: 'L', style: 'bg-amber-400 text-white' },
                      { key: 'ABSENT', label: 'A', style: 'bg-rose-500 text-white' }
                    ].map(btn => (
                      <button
                        key={btn.key}
                        onClick={() => handleToggle(row.id, btn.key)}
                        className={`w-9 h-8 rounded-lg font-bold text-xs transition ${
                          row.status === btn.key ? btn.style : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}