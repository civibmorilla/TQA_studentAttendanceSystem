import React, { useState } from 'react';

export default function Login() {
  const [role, setRole] = useState('STUDENT');
  const [username, setUsername] = useState('juan.delacruz');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Submitting login credentials:", { role, username, password });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-200">
            <span className="font-bold text-xl">a</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Students Attendance System</h2>
          <p className="text-sm text-slate-500">Secure attendance tracking portal</p>
        </div>

        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider text-center">
          Select Your Portal Role
        </label>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { id: 'STUDENT', label: 'Student' },
            { id: 'INSTRUCTOR', label: 'Instructor' },
            { id: 'ADMIN', label: 'Admin' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRole(item.id)}
              className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all ${
                role === item.id
                  ? 'border-blue-600 bg-blue-50/50 text-blue-600 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Username / Student ID</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 text-sm"
          >
            Login
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account? <a href="/register" className="text-blue-600 font-semibold hover:underline">Create an account</a>
        </p>
      </div>
    </div>
  );
}