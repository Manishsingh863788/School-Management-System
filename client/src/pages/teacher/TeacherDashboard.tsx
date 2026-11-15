import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, FileSpreadsheet, BookOpen, Users, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacher = user?.profile;

  const assignments = teacher?.assignments || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 to-navy-900 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.fullName}!</h1>
        <p className="text-brand-200 text-sm mt-1">
          Faculty Portal • {teacher?.qualification || 'Instructional Staff'} • Employee ID:{' '}
          <span className="font-mono">{teacher?.employeeId}</span>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="primary"
            className="bg-white text-brand-900 hover:bg-brand-50"
            icon={<CalendarCheck className="h-4 w-4" />}
            onClick={() => navigate('/teacher/attendance')}
          >
            Take Daily Roll Call
          </Button>
          <Button
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
            icon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={() => navigate('/teacher/marks')}
          >
            Enter Exam Marks
          </Button>
        </div>
      </div>

      {/* Teaching Schedule & Assigned Classes */}
      <Card
        title="Your Assigned Classes & Subjects"
        subtitle="You are authorized to record attendance and enter examination marks for these cohorts"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((a: any) => (
            <div
              key={a.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-500 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                  {a.subject.code}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {a.class.name} - Sec {a.section.name}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-base">{a.subject.name}</h4>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Authorized Cohort</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-brand-600 hover:text-brand-700 p-0"
                  onClick={() => navigate('/teacher/attendance')}
                >
                  Record Attendance →
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
