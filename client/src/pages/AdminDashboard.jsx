import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const overviewStats = {
    programs: 4,
    instructors: 15,
    classes: 48
  };

  const activeInstructors = [
    { name: 'Juan Dela Cruz', dept: 'Engineering', status: 'Active' },
    { name: 'Maria Santos', dept: 'IT', status: 'Active' },
    { name: 'Carlos Mendoza', dept: 'Computer Science', status: 'On Leave' },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">School Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm transition">
            📷 Scan Student Barcode / QR ID
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Term: <strong className="text-blue-600">1st Sem, 2026</strong>
          </span>
        </div>
      </div>

      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Management Actions</h2>
      
      {/* Account Creation Cards */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-slate-800">Create Student Account</h3>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">👤+</div>
            </div>
            <p className="text-xs text-slate-500 mb-6">Register a new student node in system</p>
          </div>
          <button onClick={() => navigate('/admin/accounts')} className="w-max px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition">
            Create Account
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-slate-800">Create Instructor Account</h3>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">👨‍🏫+</div>
            </div>
            <p className="text-xs text-slate-500 mb-6">Provision credentials for faculty members</p>
          </div>
          <button onClick={() => navigate('/admin/accounts')} className="w-max px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition">
            Create Account
          </button>
        </div>
      </div>

      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">System Overview</h2>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Programs</span>
          <div className="text-3xl font-bold text-blue-600 mt-2">{overviewStats.programs}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Instructors</span>
          <div className="text-3xl font-bold text-slate-800 mt-2">{overviewStats.instructors}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Scheduled Classes</span>
          <div className="text-3xl font-bold text-slate-800 mt-2">{overviewStats.classes}</div>
        </div>
      </div>

      {/* Lists Overview */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Faculty Directory</h3>
          <ul className="space-y-3">
            {activeInstructors.map((instructor, idx) => (
              <li key={idx} className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-700">{instructor.name}</p>
                  <p className="text-[10px] text-slate-400">{instructor.dept}</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${instructor.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {instructor.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Recent Classes</h3>
          <ul className="space-y-3 text-xs">
            <li className="flex justify-between items-center">
              <div><p className="font-bold text-slate-700">Calculus (MATH-301)</p><p className="text-[10px] text-slate-400">BSCpE-101</p></div>
              <span className="text-slate-500 font-medium">08:30 AM</span>
            </li>
            <li className="flex justify-between items-center">
              <div><p className="font-bold text-slate-700">Embedded Systems (CPE-401)</p><p className="text-[10px] text-slate-400">BSCpE-301</p></div>
              <span className="text-slate-500 font-medium">01:30 PM</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}