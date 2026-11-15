import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Award,
  CreditCard,
  User,
  Users,
  Download,
  Bell,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/student.service';
import { examService } from '../../services/exam.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';

export const GuardianDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeChild, linkedChildren } = useAuth();
  const [studentDetails, setStudentDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeChild) return;
    const loadDetails = async () => {
      setIsLoading(true);
      try {
        const data = await studentService.getById(activeChild.id);
        setStudentDetails(data);
      } catch (e) {
        console.error('Failed to load child details', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [activeChild]);

  if (!activeChild) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Student Linked</h3>
        <p className="text-xs text-slate-500 mt-1">
          No students are currently linked to your parent account. Please contact school administration.
        </p>
      </div>
    );
  }

  const attSummary = studentDetails?.summary?.attendance || {};
  const feeSummary = studentDetails?.summary?.fees || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xl border border-brand-100">
              {activeChild.fullName
                .split(' ')
                .map((n: string) => n[0])
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {activeChild.fullName}
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 bg-slate-100 rounded font-semibold text-slate-600 border border-slate-200">
                  {activeChild.admissionNumber}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Class: <strong className="text-slate-800">{activeChild.class.name}</strong> • Section:{' '}
                <strong className="text-slate-800">{activeChild.section.name}</strong> • Enrolled in EduManage
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<CalendarCheck className="h-4 w-4" />}
              onClick={() => navigate('/guardian/attendance')}
            >
              Attendance
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={<Award className="h-4 w-4" />}
              onClick={() => navigate('/guardian/results')}
            >
              Report Cards
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<CreditCard className="h-4 w-4" />}
              onClick={() => navigate('/guardian/fees')}
            >
              Pay Fees
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Attendance Rate"
          value={`${attSummary.percentage ?? 0}%`}
          icon={<CalendarCheck className="h-5 w-5" />}
          color="emerald"
          subtitle={`${attSummary.present ?? 0} days present out of ${attSummary.total ?? 0} sessions`}
        />
        <StatCard
          title="Outstanding Fee Balance"
          value={`$${feeSummary.outstanding ?? 0}`}
          icon={<CreditCard className="h-5 w-5" />}
          color={feeSummary.outstanding > 0 ? 'rose' : 'emerald'}
          subtitle={feeSummary.outstanding > 0 ? 'Pending invoice due' : 'All invoices fully settled'}
        />
        <StatCard
          title="Examination Status"
          value={studentDetails?.examResults?.length ? 'Published' : 'Upcoming'}
          icon={<Award className="h-5 w-5" />}
          color="brand"
          subtitle="Mid-Term & Term Assessments"
        />
      </div>

      {/* Announcements & Recent Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Announcements */}
        <Card title="School Notices & Announcements" subtitle="Official circulars for parents">
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800">Mid-Term Examination Report Cards Released</span>
                <span className="text-[10px] text-slate-400">November 10, 2026</span>
              </div>
              <p className="text-slate-600">
                Official report cards for Mid-Term Examination 2026 have been published and are available
                for direct PDF download in the parent portal.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800">Annual Science Fair & Exhibition</span>
                <span className="text-[10px] text-slate-400">November 04, 2026</span>
              </div>
              <p className="text-slate-600">
                Guardians are cordially invited to visit student interactive robotics and biology exhibitions
                in the central campus auditorium.
              </p>
            </div>
          </div>
        </Card>

        {/* Recent Attendance Roll */}
        <Card title="Recent Roll Call Records" subtitle="Last 5 instructional sessions">
          <div className="space-y-2">
            {studentDetails?.attendance?.slice(0, 5).map((att: any) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    {new Date(att.date).toLocaleDateString()}
                  </div>
                  <div className="text-[11px] text-slate-400">{att.session} Session</div>
                </div>
                <Badge
                  variant={
                    att.status === 'PRESENT'
                      ? 'success'
                      : att.status === 'LATE'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {att.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
