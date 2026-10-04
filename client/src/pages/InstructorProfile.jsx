import React from 'react';

export default function InstructorProfile() {
  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
            📷 Scan Student Barcode / QR ID
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Term: <strong className="text-blue-600">1st Sem, 2026</strong>
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between mb-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
            👤
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">Juan Dela Cruz</h2>
              <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md text-[10px] font-bold">Engineering Faculty</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Instructor ID: <strong className="text-slate-600">0000-0000</strong> • Dept: <strong className="text-slate-600">Engineering Department</strong></p>
          </div>
        </div>
        <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-sm">
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Personal Information</h3>
          <div className="space-y-4 text-xs">
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Date of Birth</span><p className="font-medium text-slate-700 mt-0.5">January 1, 1985</p></div>
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Email Address</span><p className="font-medium text-slate-700 mt-0.5">juan.delacruz@school.edu</p></div>
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Contact No.</span><p className="font-medium text-slate-700 mt-0.5">0917-123-4567</p></div>
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Home Address</span><p className="font-medium text-slate-700 mt-0.5">456 Pioneer Blvd, Manila, Philippines</p></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Professional Information</h3>
          <div className="space-y-4 text-xs">
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Department</span><p className="font-medium text-slate-700 mt-0.5">Engineering Department</p></div>
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Position</span><p className="font-medium text-slate-700 mt-0.5">Assistant Professor III</p></div>
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Specialization</span><p className="font-medium text-slate-700 mt-0.5">Embedded Systems & Advanced Mathematics</p></div>
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Years of Service</span><p className="font-medium text-slate-700 mt-0.5">6 Years</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}