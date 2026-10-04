import React, { useState } from 'react';

export default function StudentProfile() {
  const [showSensitive, setShowSensitive] = useState(false);

  const studentData = {
    name: 'Juan Dela Cruz',
    studentId: 'BSCpE-1234-0000',
    sectionBadge: 'BSCpE-101',
    dob: 'January 1, 2000',
    email: 'juandelacruz@gmail.com',
    contact: '09876543210',
    address: '123 Rizal St. Bataan, Philippines',
    program: 'Bachelor of Science in Computer Engineering',
    yearLevel: '3rd Year',
    section: 'BSCpE-101',
    enrollmentStatus: 'Regular Student'
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm">
            📷 Scan Student Barcode / QR ID
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Term: <strong className="text-blue-600">1st Sem, 2026</strong>
          </span>
        </div>
      </div>

      {/* Main Profile Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between mb-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
            👤
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">{studentData.name}</h2>
              <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                {studentData.sectionBadge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Student ID: <strong className="text-slate-600">{studentData.studentId}</strong></p>
          </div>
        </div>

        <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-sm">
          Edit Profile
        </button>
      </div>

      {/* Profile Details Split Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Personal Information (Includes QA Issue #7 Masking) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Personal Information</h3>
            <button
              onClick={() => setShowSensitive(!showSensitive)}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              {showSensitive ? '🔒 Hide Personal Details' : '👁️ Show Personal Details'}
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Date of Birth</span>
              <p className="font-medium text-slate-700 mt-0.5">{studentData.dob}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
              <p className="font-medium text-slate-700 mt-0.5">{studentData.email}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Contact No.</span>
              <p className="font-medium text-slate-700 mt-0.5">
                {showSensitive ? studentData.contact : '••••••••3210'}
              </p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Home Address</span>
              <p className="font-medium text-slate-700 mt-0.5">
                {showSensitive ? studentData.address : '123 •••••••• Bataan, Philippines'}
              </p>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Academic Information</h3>

          <div className="space-y-4 text-xs">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Program</span>
              <p className="font-medium text-slate-700 mt-0.5">{studentData.program}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Year Level</span>
              <p className="font-medium text-slate-700 mt-0.5">{studentData.yearLevel}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Section</span>
              <p className="font-medium text-slate-700 mt-0.5">{studentData.section}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Enrollment Status</span>
              <p className="font-medium text-slate-700 mt-0.5">{studentData.enrollmentStatus}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}