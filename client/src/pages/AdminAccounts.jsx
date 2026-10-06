import React, { useState, useEffect } from 'react';
import API from '../services/api';

export default function AdminAccounts() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this account?')) return;
    try {
      await API.delete(`/auth/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate user.');
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userCustomId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Account Management</h1>
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 w-64"
          />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-xs text-slate-400 py-8 text-center">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No users found.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-mono text-slate-500">{user.userCustomId}</td>
                    <td className="py-4 px-4 font-bold text-slate-800">{user.fullName}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        user.role === 'INSTRUCTOR' ? 'bg-indigo-50 text-indigo-600' 
                        : user.role === 'ADMIN' ? 'bg-amber-50 text-amber-600'
                        : 'bg-blue-50 text-blue-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">{user.email}</td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => handleDeactivate(user._id)}
                        className="px-4 py-1.5 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition shadow-sm font-semibold"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}