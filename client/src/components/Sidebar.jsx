import React from 'react';

export default function Sidebar({ activeRole = 'STUDENT', activeTab = 'Dashboard', setActiveTab }) {
  // Define role-specific navigation menu items
  const menuConfig = {
    STUDENT: [
      { id: 'Dashboard', label: 'Dashboard', icon: '🏠' },
      { id: 'Profile', label: 'Profile', icon: '👤' },
      { id: 'Subjects', label: 'Subjects', icon: '📖' },
      { id: 'Attendance', label: 'Attendance', icon: '📅' },
    ],
    INSTRUCTOR: [
      { id: 'Dashboard', label: 'Dashboard', icon: '🏠' },
      { id: 'Attendance', label: 'Attendance', icon: '📅' },
      { id: 'Profile', label: 'Profile', icon: '👤' },
    ],
    ADMIN: [
      { id: 'Dashboard', label: 'Dashboard', icon: '🏠' },
      { id: 'Programs', label: 'Programs', icon: '📚' },
      { id: 'Accounts', label: 'Accounts', icon: '👥' },
    ]
  };

  const navItems = menuConfig[activeRole] || menuConfig.STUDENT;

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between min-h-screen p-6 select-none">
      <div>
        {/* Top Brand Logo Section */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-base">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base leading-tight tracking-tight">Attendify</h1>
          </div>
        </div>

        {/* Dynamic Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab && setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Identity Widget */}
      <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-500/20">
          JD
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-slate-800 truncate">Juan Dela Cruz</p>
          <span className="text-[10px] text-slate-400 capitalize font-medium block">
            {activeRole.toLowerCase()} Account
          </span>
        </div>
      </div>
    </aside>
  );
}