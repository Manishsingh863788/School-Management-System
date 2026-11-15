import React, { useEffect, useState } from 'react';
import { CalendarCheck, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendance.service';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';

export const GuardianAttendance: React.FC = () => {
  const { activeChild } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeChild) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await attendanceService.getForStudent(activeChild.id);
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [activeChild]);

  if (!activeChild) {
    return <div className="p-8 text-center text-slate-400">Please select a student.</div>;
  }

  const summary = data?.summary || {};
  const records = data?.records || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Record</h1>
        <p className="text-sm text-slate-500 mt-1">
          Attendance history and session roll call log for <strong>{activeChild.fullName}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard title="Overall Rate" value={`${summary.percentage ?? 0}%`} icon={<CalendarCheck className="h-4 w-4" />} color="brand" />
        <StatCard title="Present" value={summary.present ?? 0} icon={<CalendarCheck className="h-4 w-4" />} color="emerald" />
        <StatCard title="Late" value={summary.late ?? 0} icon={<CalendarCheck className="h-4 w-4" />} color="amber" />
        <StatCard title="Absent" value={summary.absent ?? 0} icon={<CalendarCheck className="h-4 w-4" />} color="rose" />
        <StatCard title="Excused" value={summary.excused ?? 0} icon={<CalendarCheck className="h-4 w-4" />} color="indigo" />
      </div>

      <Card title="Session Attendance Log" subtitle="Recorded by assigned faculty">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
              <tr>
                <th className="px-6 py-3.5">Instructional Date</th>
                <th className="px-6 py-3.5">Session</th>
                <th className="px-6 py-3.5">Attendance Status</th>
                <th className="px-6 py-3.5">Recorded By</th>
                <th className="px-6 py-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No attendance records found for this student.
                  </td>
                </tr>
              ) : (
                records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">{r.session}</td>
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
                    <td className="px-6 py-4 text-xs text-slate-400 italic">{r.remarks || '—'}</td>
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
