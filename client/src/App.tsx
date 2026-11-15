import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Unauthorized } from './pages/auth/Unauthorized';
import { NotFound } from './pages/auth/NotFound';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentManagement } from './pages/admin/StudentManagement';
import { StudentProfile } from './pages/admin/StudentProfile';
import { GuardianManagement } from './pages/admin/GuardianManagement';
import { TeacherManagement } from './pages/admin/TeacherManagement';
import { AcademicsManagement } from './pages/admin/AcademicsManagement';
import { AttendanceOverview } from './pages/admin/AttendanceOverview';
import { ExamManagement } from './pages/admin/ExamManagement';
import { FeeManagement } from './pages/admin/FeeManagement';
import { ReportsView } from './pages/admin/ReportsView';
import { AuditLogsView } from './pages/admin/AuditLogsView';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherAttendance } from './pages/teacher/TeacherAttendance';
import { TeacherMarksEntry } from './pages/teacher/TeacherMarksEntry';

// Guardian Pages
import { GuardianDashboard } from './pages/guardian/GuardianDashboard';
import { GuardianAttendance } from './pages/guardian/GuardianAttendance';
import { GuardianResults } from './pages/guardian/GuardianResults';
import { GuardianFees } from './pages/guardian/GuardianFees';

const RootRedirect: React.FC = () => {
  const { user, role, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
  if (role === 'GUARDIAN') return <Navigate to="/guardian/dashboard" replace />;

  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<RootRedirect />} />

          {/* ADMIN PROTECTED ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<StudentManagement />} />
              <Route path="/admin/students/:id" element={<StudentProfile />} />
              <Route path="/admin/guardians" element={<GuardianManagement />} />
              <Route path="/admin/teachers" element={<TeacherManagement />} />
              <Route path="/admin/academics" element={<AcademicsManagement />} />
              <Route path="/admin/attendance" element={<AttendanceOverview />} />
              <Route path="/admin/examinations" element={<ExamManagement />} />
              <Route path="/admin/fees" element={<FeeManagement />} />
              <Route path="/admin/reports" element={<ReportsView />} />
              <Route path="/admin/audit-logs" element={<AuditLogsView />} />
            </Route>
          </Route>

          {/* TEACHER PROTECTED ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/attendance" element={<TeacherAttendance />} />
              <Route path="/teacher/marks" element={<TeacherMarksEntry />} />
            </Route>
          </Route>

          {/* GUARDIAN PROTECTED ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['GUARDIAN']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/guardian/dashboard" element={<GuardianDashboard />} />
              <Route path="/guardian/attendance" element={<GuardianAttendance />} />
              <Route path="/guardian/results" element={<GuardianResults />} />
              <Route path="/guardian/fees" element={<GuardianFees />} />
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
