import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Components
import Sidebar from './components/Sidebar';
import RequireRole from './components/RequireRole';
import ChangePasswordModal from './components/ChangePasswordModal';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import AdminAccounts from './pages/AdminAccounts';
import AdminPrograms from './pages/AdminPrograms';
import AdminEnrollmentKeys from './pages/AdminEnrollmentKeys';
import AdminSubjects from './pages/AdminSubjects';
import AdminTerms from './pages/AdminTerms';
import AdminImport from './pages/AdminImport';
import AdminAudit from './pages/AdminAudit';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorAttendance from './pages/InstructorAttendance';
import InstructorProfile from './pages/InstructorProfile';
import InstructorQrSession from './pages/InstructorQrSession';
import InstructorExcuses from './pages/InstructorExcuses';
import Reports from './pages/Reports';
import IdCards from './pages/IdCards';
import StudentDashboard from './pages/StudentDashboard';
import StudentSubjects from './pages/StudentSubjects';
import StudentAttendance from './pages/StudentAttendance';
import StudentProfile from './pages/StudentProfile';
import StudentCheckIn from './pages/StudentCheckIn';

// Layout for every logged-in page: role guard + sidebar (collapsible on phones)
const PortalLayout = ({ children, role }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mustChange, setMustChange] = useState(() => localStorage.getItem('mustChangePassword') === '1');

  return (
    <RequireRole role={role}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar activeRole={role} mobileOpen={menuOpen} onNavigate={() => setMenuOpen(false)} />
        {menuOpen && (
          <div className="no-print fixed inset-0 z-30 bg-slate-900/40 md:hidden" onClick={() => setMenuOpen(false)} />
        )}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {/* Mobile top bar (the sidebar is off-screen below the md breakpoint) */}
          <div className="no-print md:hidden sticky top-0 z-20 flex items-center gap-3 bg-white border-b border-slate-200 px-4 py-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="w-11 h-11 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 text-lg"
            >
              ☰
            </button>
            <span className="font-black text-slate-800 text-base uppercase tracking-tight">ClassPulse</span>
          </div>
          {children}
        </main>
      </div>
      {mustChange && <ChangePasswordModal forced onClose={() => setMustChange(false)} />}
    </RequireRole>
  );
};

const page = (role, element) => <PortalLayout role={role}>{element}</PortalLayout>;

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={page('ADMIN', <AdminDashboard />)} />
        <Route path="/admin/terms" element={page('ADMIN', <AdminTerms />)} />
        <Route path="/admin/programs" element={page('ADMIN', <AdminPrograms />)} />
        <Route path="/admin/subjects" element={page('ADMIN', <AdminSubjects />)} />
        <Route path="/admin/accounts" element={page('ADMIN', <AdminAccounts />)} />
        <Route path="/admin/import" element={page('ADMIN', <AdminImport />)} />
        <Route path="/admin/enrollment-keys" element={page('ADMIN', <AdminEnrollmentKeys />)} />
        <Route path="/admin/reports" element={page('ADMIN', <Reports />)} />
        <Route path="/admin/id-cards" element={page('ADMIN', <IdCards />)} />
        <Route path="/admin/audit" element={page('ADMIN', <AdminAudit />)} />

        {/* Instructor */}
        <Route path="/instructor/dashboard" element={page('INSTRUCTOR', <InstructorDashboard />)} />
        <Route path="/instructor/qr-session" element={page('INSTRUCTOR', <InstructorQrSession />)} />
        <Route path="/instructor/attendance" element={page('INSTRUCTOR', <InstructorAttendance />)} />
        <Route path="/instructor/excuses" element={page('INSTRUCTOR', <InstructorExcuses />)} />
        <Route path="/instructor/reports" element={page('INSTRUCTOR', <Reports />)} />
        <Route path="/instructor/id-cards" element={page('INSTRUCTOR', <IdCards />)} />
        <Route path="/instructor/profile" element={page('INSTRUCTOR', <InstructorProfile />)} />

        {/* Student */}
        <Route path="/student/dashboard" element={page('STUDENT', <StudentDashboard />)} />
        <Route path="/student/check-in" element={page('STUDENT', <StudentCheckIn />)} />
        <Route path="/student/subjects" element={page('STUDENT', <StudentSubjects />)} />
        <Route path="/student/attendance" element={page('STUDENT', <StudentAttendance />)} />
        <Route path="/student/profile" element={page('STUDENT', <StudentProfile />)} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
