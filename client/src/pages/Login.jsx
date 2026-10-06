import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

export default function Login() {
  const navigate = useNavigate();

  // The role state must exactly match the database enums
  const [role, setRole] = useState('STUDENT');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sends the exact credentials to your Render/Local Node server
      const response = await API.post('/auth/login', { username, password, role });

      if (response.data.success) {
        // Save the JWT token and user info to local storage for protected routes
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userName', response.data.name);
        localStorage.setItem('userRole', response.data.role);

        // Route dynamically based on the verified role from the database
        if (response.data.role === 'STUDENT') navigate('/student/dashboard');
        if (response.data.role === 'INSTRUCTOR') navigate('/instructor/dashboard');
        if (response.data.role === 'ADMIN') navigate('/admin/dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mx-auto mb-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">CLASSPULSE</h2>
          <p className="text-xs font-semibold text-slate-500 italic mt-0.5">Student Attendance Management & Tracking System</p>
          <p className="text-[11px] font-bold text-blue-600 mt-1 uppercase tracking-wider">by XI Labs</p>
        </div>

        {/* Role Selector Tabs - Crucial for passing the correct role to the backend */}
        <div className="flex justify-between bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setRole('STUDENT')}
            className={`flex-1 py-2 rounded-lg transition ${role === 'STUDENT' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setRole('INSTRUCTOR')}
            className={`flex-1 py-2 rounded-lg transition ${role === 'INSTRUCTOR' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            Instructor
          </button>
          <button
            type="button"
            onClick={() => setRole('ADMIN')}
            className={`flex-1 py-2 rounded-lg transition ${role === 'ADMIN' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">ID Number</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your ID"
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
              placeholder="Enter your password"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 text-sm"
          >
            {isLoading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}