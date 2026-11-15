import React from 'react';
import { LogOut, User, Users, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export const Navbar: React.FC = () => {
  const { user, role, activeChild, linkedChildren, switchActiveChild, logout } = useAuth();

  const roleBadgeVariant = {
    ADMIN: 'danger',
    TEACHER: 'info',
    GUARDIAN: 'success',
  }[role || 'GUARDIAN'] as any;

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Role Context or Child Switcher */}
      <div className="flex items-center gap-4">
        {role === 'GUARDIAN' && linkedChildren.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5">
            <Users className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Student:</span>
            <select
              value={activeChild?.id || ''}
              onChange={(e) => switchActiveChild(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {linkedChildren.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.fullName} ({child.class.name}-{child.section.name})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="text-sm font-semibold text-slate-800 leading-tight">
              {user?.fullName}
            </div>
            <div className="text-xs text-slate-500">{user?.email}</div>
          </div>
          <Badge variant={roleBadgeVariant}>{role}</Badge>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <button
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
