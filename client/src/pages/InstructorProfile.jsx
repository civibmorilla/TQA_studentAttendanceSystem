import React, { useState, useEffect } from 'react';
import API from '../services/api';

export default function InstructorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSensitive, setShowSensitive] = useState(false);

  const fetchProfile = async (unmask = false) => {
    try {
      const url = unmask ? '/auth/profile?unmask=true' : '/auth/profile';
      const res = await API.get(url);
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(false);
  }, []);

  const handleToggleSensitive = () => {
    const newState = !showSensitive;
    setShowSensitive(newState);
    fetchProfile(newState);
  };

  if (loading) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <p className="text-xs text-slate-400">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <p className="text-xs text-slate-400">Could not load profile data.</p>
      </div>
    );
  }

  const initials = profile.fullName ? profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
            📷 Scan Student Barcode / QR ID
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between mb-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">{profile.fullName}</h2>
              <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md text-[10px] font-bold">Instructor</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Instructor ID: <strong className="text-slate-600">{profile.userCustomId}</strong> • Email: <strong className="text-slate-600">{profile.email}</strong></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Personal Information</h3>
            <button
              onClick={handleToggleSensitive}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              {showSensitive ? '🔒 Hide Personal Details' : '👁️ Show Personal Details'}
            </button>
          </div>
          <div className="space-y-4 text-xs">
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Email Address</span><p className="font-medium text-slate-700 mt-0.5">{profile.email}</p></div>
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Contact No.</span><p className="font-medium text-slate-700 mt-0.5">{profile.contactNo || '—'}</p></div>
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Home Address</span><p className="font-medium text-slate-700 mt-0.5">{profile.address || '—'}</p></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Professional Information</h3>
          <div className="space-y-4 text-xs">
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Role</span><p className="font-medium text-slate-700 mt-0.5">{profile.role}</p></div>
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Custom ID</span><p className="font-medium text-slate-700 mt-0.5">{profile.userCustomId}</p></div>
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Account Created</span><p className="font-medium text-slate-700 mt-0.5">{new Date(profile.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}