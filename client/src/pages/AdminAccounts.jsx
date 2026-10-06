import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';

export default function AdminAccounts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Account creation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [notification, setNotification] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await API.get('/auth/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Check if query params ask to create an account
    const createRole = searchParams.get('create');
    if (createRole) {
      setFormData(prev => ({ ...prev, role: createRole.toUpperCase() }));
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Toggle user active status (Deactivate / Reactivate)
  const handleToggleActiveStatus = async (user) => {
    const newStatus = user.isActive === false ? true : false;
    const actionText = newStatus ? 'reactivate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${actionText} the account for "${user.fullName}"?`)) {
      return;
    }

    try {
      const res = await API.put(`/auth/users/${user._id}`, { isActive: newStatus });
      if (res.data.success) {
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: newStatus } : u));
        showNotification(`Account for "${user.fullName}" has been ${newStatus ? 'reactivated' : 'deactivated'}.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${actionText} user account.`);
    }
  };

  // Permanently delete user
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete user "${user.fullName}" (${user.userCustomId})? This action cannot be reversed.`)) {
      return;
    }

    try {
      const res = await API.delete(`/auth/users/${user._id}`);
      if (res.data.success) {
        setUsers(prev => prev.filter(u => u._id !== user._id));
        showNotification(`User account "${user.fullName}" has been permanently removed.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      const res = await API.post('/auth/register', formData);
      if (res.data.success) {
        showNotification(`Account for "${formData.fullName}" created successfully!`);
        setIsModalOpen(false);
        setSearchParams({});
        fetchUsers();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setModalLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userCustomId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    const isUserActive = user.isActive !== false;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isUserActive) ||
      (statusFilter === 'DEACTIVATED' && !isUserActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Account Management</h1>
          <p className="text-xs text-slate-500 mt-1">Manage system accounts, status activation, and roles.</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              userCustomId: '',
              fullName: '',
              email: '',
              password: '',
              role: 'STUDENT',
              contactNo: '',
              address: ''
            });
            setModalError('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition"
        >
          <span>👤+</span>
          <span>Create New User</span>
        </button>
      </div>

      {notification && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>✅ {notification}</span>
          <button onClick={() => setNotification('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* Main Directory Table Box */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">System Users Directory</h3>
            <p className="text-xs text-slate-500 mt-1">Total {users.length} registered accounts across all roles.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <input 
              type="text" 
              placeholder="Search name, ID, or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 w-64 bg-white"
            />

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="INSTRUCTOR">Instructor</option>
              <option value="ADMIN">Admin</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="DEACTIVATED">Deactivated Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-xs text-slate-400 py-8 text-center">Loading users from database...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No matching users found.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredUsers.map((user) => {
                  const isActive = user.isActive !== false;
                  return (
                    <tr key={user._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-4 font-mono font-semibold text-slate-600">{user.userCustomId}</td>
                      <td className="py-4 px-4 font-bold text-slate-800">{user.fullName}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          user.role === 'INSTRUCTOR' ? 'bg-indigo-50 text-indigo-600' 
                          : user.role === 'ADMIN' ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{user.email}</td>
                      <td className="py-4 px-4">
                        {isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ● Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            ○ Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        {/* Deactivate / Reactivate Button */}
                        {isActive ? (
                          <button 
                            onClick={() => handleToggleActiveStatus(user)}
                            className="px-3 py-1.5 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition shadow-sm font-semibold"
                            title="Deactivate account without deleting data"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleToggleActiveStatus(user)}
                            className="px-3 py-1.5 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition shadow-sm font-semibold"
                            title="Reactivate account"
                          >
                            Reactivate
                          </button>
                        )}

                        {/* Separate Delete Button */}
                        <button 
                          onClick={() => handleDeleteUser(user)}
                          className="px-3 py-1.5 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition shadow-sm font-semibold"
                          title="Permanently remove account from database"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                Create New User Account
              </h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchParams({});
                }} 
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
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
                  placeholder="e.g. Alex Morgan"
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
                  placeholder="e.g. alex@school.edu"
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
                  onClick={() => {
                    setIsModalOpen(false);
                    setSearchParams({});
                  }}
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