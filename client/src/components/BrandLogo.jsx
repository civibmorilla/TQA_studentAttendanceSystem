import React from 'react';

export default function BrandLogo({ role }) {
  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN': return 'System SuperAdmin';
      case 'INSTRUCTOR': return 'Instructor Portal';
      case 'STUDENT': return 'Student Portal';
      default: return 'Attendance Portal';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md font-bold text-lg">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
      </div>
      <div>
        <h1 className="font-black text-gray-900 text-lg leading-tight tracking-tight uppercase">ClassPulse</h1>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">by XI Labs</span>
          <span className="text-gray-300">•</span>
          <span className="text-[10px] text-gray-500 font-medium">{getRoleBadge()}</span>
        </div>
      </div>
    </div>
  );
}