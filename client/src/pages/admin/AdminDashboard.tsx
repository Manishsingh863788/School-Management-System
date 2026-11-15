import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  CalendarCheck,
  CreditCard,
  DollarSign,
  PlusCircle,
  TrendingUp,
  FileText,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportService } from '../../services/report.service';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const stats = await reportService.getDashboardStats();
        setData(stats);
      } catch (e) {
        console.error('Failed to load dashboard statistics', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const recent = data?.recentActivities || {};

  const PIE_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  return (
    <div className="space-y-8">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time institutional oversight and educational performance metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<PlusCircle className="h-4 w-4" />}
            onClick={() => navigate('/admin/students')}
          >
            Add Student
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<GraduationCap className="h-4 w-4" />}
            onClick={() => navigate('/admin/teachers')}
          >
            Add Teacher
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<CreditCard className="h-4 w-4" />}
            onClick={() => navigate('/admin/fees')}
          >
            Invoices & Fees
          </Button>
        </div>
      </div>

      {/* 7 Key Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={metrics.totalStudents ?? 0}
          icon={<Users className="h-5 w-5" />}
          color="brand"
          subtitle="Enrolled & Active"
        />
        <StatCard
          title="Total Teachers"
          value={metrics.totalTeachers ?? 0}
          icon={<GraduationCap className="h-5 w-5" />}
          color="indigo"
          subtitle="Active Faculty Members"
        />
        <StatCard
          title="Total Guardians"
          value={metrics.totalGuardians ?? 0}
          icon={<UserCheck className="h-5 w-5" />}
          color="emerald"
          subtitle="Registered Parents"
        />
        <StatCard
          title="Total Classes"
          value={metrics.totalClasses ?? 0}
          icon={<BookOpen className="h-5 w-5" />}
          color="amber"
          subtitle="Active Cohorts"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Today's Attendance"
          value={`${metrics.todayAttendancePercentage ?? 0}%`}
          icon={<CalendarCheck className="h-5 w-5" />}
          color="emerald"
          trend="Instructional day roll"
          trendUp={true}
          subtitle={`${metrics.todayTotalAttendance ?? 0} records recorded`}
        />
        <StatCard
          title="Total Fees Collected"
          value={`$${(metrics.totalFeesCollected ?? 0).toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          color="brand"
          trend="Cleared in ledger"
          trendUp={true}
          subtitle={`From $${(metrics.totalFeesInvoiced ?? 0).toLocaleString()} invoiced`}
        />
        <StatCard
          title="Outstanding Fees"
          value={`$${(metrics.totalFeesOutstanding ?? 0).toLocaleString()}`}
          icon={<CreditCard className="h-5 w-5" />}
          color="rose"
          subtitle="Pending student balances"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Fee Collection Chart */}
        <Card title="Monthly Fee Collection ($)" subtitle="Invoiced vs Collected Trends">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyFees || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  formatter={(val: any) => [`$${val.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="invoiced" name="Invoiced" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Attendance Trends */}
        <Card title="Weekly Attendance Rates (%)" subtitle="Daily aggregated percentage">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.attendanceTrends || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={[80, 100]} stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Class Distribution & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Class Distribution */}
        <Card title="Enrollment by Class" subtitle="Student distribution across cohorts">
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.studentDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="students"
                >
                  {(charts.studentDistribution || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {(charts.studentDistribution || []).map((item: any, i: number) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span>
                  {item.name}: <strong>{item.students}</strong>
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Admissions */}
        <Card title="Recent Admissions" subtitle="Latest enrolled students">
          <div className="space-y-3">
            {recent.newAdmissions?.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-slate-100"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800">{s.fullName}</div>
                  <div className="text-xs text-slate-400">
                    {s.admissionNumber} • {s.class.name}
                  </div>
                </div>
                <Badge variant="info">Active</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Payments */}
        <Card title="Recent Fee Settlements" subtitle="Ledger updates">
          <div className="space-y-3">
            {recent.recentPayments?.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-slate-100"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800">${p.amount}</div>
                  <div className="text-xs text-slate-400">
                    {p.studentName} • {p.method}
                  </div>
                </div>
                <Badge variant="success">Paid</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
