import React, { useState } from 'react';

export default function AdminAccounts() {
  const [users] = useState([
    { id: '1234-0000', name: 'Juan Dela Cruz', role: 'Instructor', dept: 'Engineering', status: 'Active' },
    { id: '1234-0001', name: 'Maria Garcia', role: 'Student', dept: 'BSCpE-101', status: 'Active' },
    { id: '1234-0002', name: 'Adrian Santos', role: 'Student', dept: 'BSIT-201', status: 'Inactive' },
  ]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Account Management</h1>
        <button className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition flex items-center gap-2">
          <span className="text-lg leading-none">+</span> Create New Account
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">System Users Directory</h3>
            <p className="text-xs text-slate-500 mt-1">View, edit, deactivate, or manage permissions for existing accounts.</p>
          </div>
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            className="px-4 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Dept / Section</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {users.map((user, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-4 font-mono text-slate-500">{user.id}</td>
                  <td className="py-4 px-4 font-bold text-slate-800">{user.name}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${user.role === 'Instructor' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">{user.dept}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="px-4 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition shadow-sm font-semibold mr-2">
                      Edit
                    </button>
                    <button className="px-4 py-1.5 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition shadow-sm font-semibold">
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}