import React, { useEffect, useState } from 'react';
import { CalendarCheck, Filter, Search, Calendar } from 'lucide-react';
import { attendanceService } from '../../services/attendance.service';
import { academicService } from '../../services/academic.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';

export const AttendanceOverview: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [date, setDate] = useState<string>('2026-11-13');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.query({
        date: date || undefined,
        classId: selectedClassId || undefined,
        status: selectedStatus || undefined,
      });
      setRecords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    academicService.listClasses().then(setClasses);
    fetchAttendance();
  }, [date, selectedClassId, selectedStatus]);

  const total = records.length;
  const present = records.filter((r) => r.status === 'PRESENT').length;
  const late = records.filter((r) => r.status === 'LATE').length;
  const absent = records.filter((r) => r.status === 'ABSENT').length;
  const excused = records.filter((r) => r.status === 'EXCUSED').length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Oversight</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor daily institutional roll calls and individual attendance trends.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard title="Overall Rate" value={`${rate}%`} icon={<CalendarCheck className="h-4 w-4" />} color="brand" />
        <StatCard title="Present" value={present} icon={<CalendarCheck className="h-4 w-4" />} color="emerald" />
        <StatCard title="Late" value={late} icon={<CalendarCheck className="h-4 w-4" />} color="amber" />
        <StatCard title="Absent" value={absent} icon={<CalendarCheck className="h-4 w-4" />} color="rose" />
        <StatCard title="Excused" value={excused} icon={<CalendarCheck className="h-4 w-4" />} color="indigo" />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="EXCUSED">Excused</option>
          </select>

          <Button size="sm" variant="outline" onClick={fetchAttendance}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Records Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
              <tr>
                <th className="px-6 py-3.5">Admission No</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Class & Section</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Session</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading attendance data...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No attendance records found for this filter criteria.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900">
                      {r.student.admissionNumber}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{r.student.fullName}</td>
                    <td className="px-6 py-4">
                      {r.student.class.name} - {r.student.section.name}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{r.session}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          r.status === 'PRESENT'
                            ? 'success'
                            : r.status === 'LATE'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{r.recordedBy.fullName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
