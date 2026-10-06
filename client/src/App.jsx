import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import Components
import Sidebar from './components/Sidebar';

// Import Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminAccounts from './pages/AdminAccounts';
import AdminPrograms from './pages/AdminPrograms';
import AdminEnrollmentKeys from './pages/AdminEnrollmentKeys';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorAttendance from './pages/InstructorAttendance';
import InstructorProfile from './pages/InstructorProfile';
import StudentDashboard from './pages/StudentDashboard';
import StudentSubjects from './pages/StudentSubjects';
import StudentAttendance from './pages/StudentAttendance';
import StudentProfile from './pages/StudentProfile';
import Register from './pages/Register';

// A reusable layout wrapper that includes the Sidebar
const PortalLayout = ({ children, role }) => {
  const location = useLocation();

  // Determine active tab based on URL path
  let activeTab = 'Dashboard';
  if (location.pathname.includes('subjects')) activeTab = 'Subjects';
  if (location.pathname.includes('attendance')) activeTab = 'Attendance';
  if (location.pathname.includes('profile')) activeTab = 'Profile';
  if (location.pathname.includes('programs')) activeTab = 'Programs';
  if (location.pathname.includes('accounts')) activeTab = 'Accounts';
  if (location.pathname.includes('enrollment-keys')) activeTab = 'EnrollmentKeys';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeRole={role} activeTab={activeTab} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> { }

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<PortalLayout role="ADMIN"><AdminDashboard /></PortalLayout>} />
        <Route path="/admin/programs" element={<PortalLayout role="ADMIN"><AdminPrograms /></PortalLayout>} />
        <Route path="/admin/accounts" element={<PortalLayout role="ADMIN"><AdminAccounts /></PortalLayout>} />
        <Route path="/admin/enrollment-keys" element={<PortalLayout role="ADMIN"><AdminEnrollmentKeys /></PortalLayout>} />

        {/* Instructor Routes */}
        <Route path="/instructor/dashboard" element={<PortalLayout role="INSTRUCTOR"><InstructorDashboard /></PortalLayout>} />
        <Route path="/instructor/attendance" element={<PortalLayout role="INSTRUCTOR"><InstructorAttendance /></PortalLayout>} />
        <Route path="/instructor/profile" element={<PortalLayout role="INSTRUCTOR"><InstructorProfile /></PortalLayout>} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<PortalLayout role="STUDENT"><StudentDashboard /></PortalLayout>} />
        <Route path="/student/subjects" element={<PortalLayout role="STUDENT"><StudentSubjects /></PortalLayout>} />
        <Route path="/student/attendance" element={<PortalLayout role="STUDENT"><StudentAttendance /></PortalLayout>} />
        <Route path="/student/profile" element={<PortalLayout role="STUDENT"><StudentProfile /></PortalLayout>} />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}