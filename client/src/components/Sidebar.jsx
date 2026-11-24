import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import ChangePasswordModal from './ChangePasswordModal';
import EditProfileModal from './EditProfileModal';
import Avatar from './Avatar';

const MENU = {
  STUDENT: [
    { label: 'Dashboard', icon: '🏠', path: '/student/dashboard' },
    { label: 'QR Check-in', icon: '📷', path: '/student/check-in' },
    { label: 'Subjects', icon: '📖', path: '/student/subjects' },
    { label: 'Attendance & Excuses', icon: '📅', path: '/student/attendance' },
    { label: 'Profile', icon: '👤', path: '/student/profile' }
  ],
  INSTRUCTOR: [
    { label: 'Dashboard', icon: '🏠', path: '/instructor/dashboard' },
    { label: 'QR Check-in', icon: '🔳', path: '/instructor/qr-session' },
    { label: 'Attendance Sheet', icon: '📅', path: '/instructor/attendance' },
    { label: 'Excuse Letters', icon: '✉️', path: '/instructor/excuses' },
    { label: 'Reports', icon: '📊', path: '/instructor/reports' },
    { label: 'QR ID Cards', icon: '🪪', path: '/instructor/id-cards' },
    { label: 'Profile', icon: '👤', path: '/instructor/profile' }
  ],
  ADMIN: [
    { label: 'Dashboard', icon: '🏠', path: '/admin/dashboard' },
    { label: 'Academic Terms', icon: '🗓️', path: '/admin/terms' },
    { label: 'Programs', icon: '📚', path: '/admin/programs' },
    { label: 'Subjects & Classes', icon: '🏫', path: '/admin/subjects' },
    { label: 'Accounts', icon: '👥', path: '/admin/accounts' },
    { label: 'Import Students', icon: '📥', path: '/admin/import' },
    { label: 'Enrollment Keys', icon: '🔑', path: '/admin/enrollment-keys' },
    { label: 'Reports', icon: '📊', path: '/admin/reports' },
    { label: 'QR ID Cards', icon: '🪪', path: '/admin/id-cards' },
    { label: 'Audit Log', icon: '🧾', path: '/admin/audit' }
  ]
};

export default function Sidebar({ activeRole = 'STUDENT', mobileOpen = false, onNavigate = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = localStorage.getItem('userName') || 'User';
  const [term, setTerm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [photo, setPhoto] = useState(() => {
    try { return localStorage.getItem('userPhoto') || ''; } catch { return ''; }
  });

  useEffect(() => {
    API.get('/terms').then((res) => setTerm(res.data.active)).catch(() => {});
    // Load the current picture (cached in localStorage so it shows instantly next time)
    API.get('/auth/me')
      .then((res) => {
        const p = res.data.data?.photo || '';
        setPhoto(p);
        try { if (p) localStorage.setItem('userPhoto', p); else localStorage.removeItem('userPhoto'); } catch { /* ignore */ }
      })
      .catch(() => {});
    const onUpdate = (e) => setPhoto(e.detail?.photo || '');
    window.addEventListener('profile-updated', onUpdate);
    return () => window.removeEventListener('profile-updated', onUpdate);
  }, []);

  const navItems = MENU[activeRole] || MENU.STUDENT;

  const handleLogout = () => {
    ['token', 'userName', 'userRole', 'mustChangePassword', 'userPhoto'].forEach((k) => localStorage.removeItem(k));
    navigate('/login');
  };

  return (
    <aside
      className={`no-print w-64 bg-white border-r border-slate-200 flex flex-col justify-between min-h-screen p-5 select-none fixed inset-y-0 left-0 z-40 overflow-y-auto transition-transform md:static md:translate-x-0 ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
      aria-label="Main navigation"
    >
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 mb-4">
          <img src="/logo-icon.png" alt="" width="40" height="40" className="w-10 h-10 rounded-xl shadow-md shadow-blue-900/20" />
          <div>
            <p className="font-black text-slate-800 text-base leading-tight tracking-tight uppercase">ClassPulse</p>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">by XI Labs</p>
          </div>
        </div>

        {/* Current academic term */}
        <div className="mb-5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
          Term: <strong className="text-blue-700">{term ? term.name : 'not set'}</strong>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); onNavigate(); }}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-2.5 min-h-11 rounded-xl text-sm font-semibold transition-all ${
                  isActive ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className="text-base" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        <button
          onClick={() => setShowProfile(true)}
          className="w-full pt-4 border-t border-slate-200 flex items-center gap-3 mb-2 text-left rounded-xl hover:bg-slate-50 transition"
          title="Edit your profile picture and contact details"
        >
          <Avatar name={userName} photo={photo} />
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
            <span className="text-xs text-slate-500 block"><span className="capitalize">{activeRole.toLowerCase()}</span> · <span className="text-blue-600 font-semibold">Edit profile</span></span>
          </div>
        </button>
        <button
          onClick={() => setShowPassword(true)}
          className="w-full flex items-center gap-2 px-4 py-2.5 min-h-11 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <span aria-hidden="true">🔒</span><span>Change password</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 min-h-11 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
        >
          <span aria-hidden="true">🚪</span><span>Logout</span>
        </button>
      </div>

      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
      {showProfile && <EditProfileModal onClose={() => setShowProfile(false)} />}
    </aside>
  );
}
