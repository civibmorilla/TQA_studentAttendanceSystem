import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ programs: 0, instructors: 0, classes: 0 });
  const [recentInstructors, setRecentInstructors] = useState([]);
  const [recentClasses, setRecentClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Account Creation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState('STUDENT');
  const [formData, setFormData] = useState({
    userCustomId: '',
    fullName: '',
    email: '',
    password: '',
    role: 'STUDENT',
    contactNo: '',
    address: ''
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openCreateModal = (role) => {
    setModalRole(role);
    setFormData({
      userCustomId: '',
      fullName: '',
      email: '',
      password: '',
      role: role,
      contactNo: '',
      address: ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      const res = await API.post('/auth/register', formData);
      if (res.data.success) {
        setSuccessMsg(`Account for "${formData.fullName}" (${formData.role}) created successfully!`);
        setTimeout(() => setSuccessMsg(''), 4000);
        closeModal();
        fetchDashboardData();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create account. Please verify input.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">School Admin Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Manage system accounts, academic programs, and class structures.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/accounts')}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm transition"
          >
            👥 View All Accounts
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Management Actions</h2>
      
      {/* Account Creation Cards */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-slate-800">Create Student Account</h3>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">👤+</div>
            </div>
            <p className="text-xs text-slate-500 mb-6">Register a new student node in system and configure credentials.</p>
          </div>
          <button
            onClick={() => openCreateModal('STUDENT')}
            className="w-max px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
          >
            Create Student Account
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-slate-800">Create Instructor Account</h3>
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">👨‍🏫+</div>
            </div>
            <p className="text-xs text-slate-500 mb-6">Provision teaching credentials and faculty access permissions.</p>
          </div>
          <button
            onClick={() => openCreateModal('INSTRUCTOR')}
            className="w-max px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
          >
            Create Instructor Account
          </button>
        </div>
      </div>

      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">System Overview</h2>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div
          onClick={() => navigate('/admin/programs')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-blue-200 transition"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Programs</span>
          <div className="text-3xl font-bold text-blue-600 mt-2">{loading ? '—' : stats.programs}</div>
          <p className="text-[11px] text-blue-500 mt-1">Manage programs →</p>
        </div>
        <div
          onClick={() => navigate('/admin/accounts')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-slate-200 transition"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Instructors</span>
          <div className="text-3xl font-bold text-slate-800 mt-2">{loading ? '—' : stats.instructors}</div>
          <p className="text-[11px] text-slate-400 mt-1">View directory →</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Scheduled Classes</span>
          <div className="text-3xl font-bold text-slate-800 mt-2">{loading ? '—' : stats.classes}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total subjects offered</p>
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

      {/* Account Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                Create New {formData.role === 'STUDENT' ? 'Student' : formData.role === 'INSTRUCTOR' ? 'Instructor' : 'Admin'} Account
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Account Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="STUDENT">Student</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  ID Number (Username)
                </label>
                <input
                  type="text"
                  name="userCustomId"
                  placeholder={formData.role === 'STUDENT' ? 'e.g. BSCpE-2026-001' : 'e.g. INST-101'}
                  value={formData.userCustomId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Maria Santos"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. maria@school.edu"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Initial Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contact No (Optional)</label>
                  <input
                    type="text"
                    name="contactNo"
                    placeholder="0917-123-4567"
                    value={formData.contactNo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Address (Optional)</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Bataan, Philippines"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition"
                >
                  {modalLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}