import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ programs: 0, instructors: 0, classes: 0 });
  const [recentInstructors, setRecentInstructors] = useState([]);
  const [recentClasses, setRecentClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await API.get('/auth/dashboard-stats');
        if (res.data.success) {
          setStats(res.data.stats);
          setRecentInstructors(res.data.recentInstructors || []);
          setRecentClasses(res.data.recentClasses || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">School Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm transition">
            📷 Scan Student Barcode / QR ID
          </button>
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
          <div className="text-3xl font-bold text-blue-600 mt-2">{loading ? '—' : stats.programs}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Instructors</span>
          <div className="text-3xl font-bold text-slate-800 mt-2">{loading ? '—' : stats.instructors}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Scheduled Classes</span>
          <div className="text-3xl font-bold text-slate-800 mt-2">{loading ? '—' : stats.classes}</div>
        </div>
      </div>

      {/* Lists Overview */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Faculty Directory</h3>
          {loading ? (
            <p className="text-xs text-slate-400">Loading instructors...</p>
          ) : recentInstructors.length === 0 ? (
            <p className="text-xs text-slate-400">No instructors registered yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentInstructors.map((instructor) => (
                <li key={instructor._id} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-700">{instructor.fullName}</p>
                    <p className="text-[10px] text-slate-400">{instructor.email}</p>
                  </div>
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">
                    Active
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Recent Classes</h3>
          {loading ? (
            <p className="text-xs text-slate-400">Loading classes...</p>
          ) : recentClasses.length === 0 ? (
            <p className="text-xs text-slate-400">No classes created yet.</p>
          ) : (
            <ul className="space-y-3 text-xs">
              {recentClasses.map((cls) => (
                <li key={cls._id} className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-700">{cls.title} ({cls.code})</p>
                    <p className="text-[10px] text-slate-400">{cls.section}</p>
                  </div>
                  <span className="text-slate-500 font-medium">{cls.schedule || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}