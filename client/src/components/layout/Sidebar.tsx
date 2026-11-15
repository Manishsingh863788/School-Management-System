import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  BarChart3,
  ShieldAlert,
  BookMarked,
  FileSpreadsheet,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/admin/students', label: 'Students', icon: <Users className="h-5 w-5" /> },
    { to: '/admin/guardians', label: 'Guardians', icon: <UserCheck className="h-5 w-5" /> },
    { to: '/admin/teachers', label: 'Teachers', icon: <GraduationCap className="h-5 w-5" /> },
    { to: '/admin/academics', label: 'Academics', icon: <BookOpen className="h-5 w-5" /> },
    { to: '/admin/attendance', label: 'Attendance', icon: <CalendarCheck className="h-5 w-5" /> },
    { to: '/admin/examinations', label: 'Examinations', icon: <Award className="h-5 w-5" /> },
    { to: '/admin/fees', label: 'Fee Management', icon: <CreditCard className="h-5 w-5" /> },
    { to: '/admin/reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" /> },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: <ShieldAlert className="h-5 w-5" /> },
  ];

  const teacherLinks = [
    { to: '/teacher/dashboard', label: 'Teacher Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/teacher/attendance', label: 'Take Attendance', icon: <CalendarCheck className="h-5 w-5" /> },
    { to: '/teacher/marks', label: 'Marks Entry', icon: <FileSpreadsheet className="h-5 w-5" /> },
  ];

  const guardianLinks = [
    { to: '/guardian/dashboard', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/guardian/attendance', label: 'Attendance Calendar', icon: <CalendarCheck className="h-5 w-5" /> },
    { to: '/guardian/results', label: 'Report Cards', icon: <Award className="h-5 w-5" /> },
    { to: '/guardian/fees', label: 'Fees & Invoices', icon: <Receipt className="h-5 w-5" /> },
  ];

  const links =
    role === 'ADMIN' ? adminLinks : role === 'TEACHER' ? teacherLinks : guardianLinks;

  return (
    <aside className="w-64 bg-navy-950 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-navy-900 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-navy-900/60 bg-navy-950">
        <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <span className="font-bold text-base text-white tracking-tight">EduManage</span>
          <span className="block text-[10px] uppercase tracking-wider text-brand-400 font-semibold">
            School System
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {role} Workspace
        </div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-navy-900/60'
              }`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer Info Badge */}
      <div className="p-4 border-t border-navy-900/60 bg-navy-900/20">
        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <Sparkles className="h-4 w-4 text-brand-400" />
          <span>EduManage v1.0 Enterprise</span>
        </div>
      </div>
    </aside>
  );
};
