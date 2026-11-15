import React, { useEffect, useState } from 'react';
import { CalendarCheck, CheckCircle2, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendance.service';
import { studentService } from '../../services/student.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

export const TeacherAttendance: React.FC = () => {
  const { user } = useAuth();
  const assignments = user?.profile?.assignments || [];

  const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState<'MORNING' | 'AFTERNOON'>('MORNING');

  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successSummary, setSuccessSummary] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeAssignment = assignments[selectedAssignmentIndex];

  // Fetch enrolled students for the active class and section
  useEffect(() => {
    if (!activeAssignment) return;
    const loadStudents = async () => {
      setIsLoadingStudents(true);
      setError(null);
      setSuccessSummary(null);
      try {
        const res = await studentService.list({
          classId: activeAssignment.class.id,
          sectionId: activeAssignment.section.id,
          status: 'ACTIVE',
          limit: 100,
        });
        const enrolled = res.data || [];
        setStudents(enrolled);

        // Default all to PRESENT
        const initialMap: Record<string, any> = {};
        enrolled.forEach((s: any) => {
          initialMap[s.id] = 'PRESENT';
        });
        setAttendanceMap(initialMap);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch enrolled students');
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadStudents();
  }, [selectedAssignmentIndex, date, session]);

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment) return;
    setError(null);
    setIsSubmitting(true);
    setSuccessSummary(null);

    try {
      const records = students.map((s) => ({
        studentId: s.id,
        status: attendanceMap[s.id] || 'PRESENT',
        remarks: remarksMap[s.id] || undefined,
      }));

      const res = await attendanceService.submit({
        classId: activeAssignment.class.id,
        sectionId: activeAssignment.section.id,
        date,
        session,
        records,
      });

      setSuccessSummary(res.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to save roll call attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (assignments.length === 0) {
    return (
      <Alert type="warning">
        You do not have any classes or sections currently assigned to your teacher account. Contact the
        administrator to assign teaching cohorts.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Record Daily Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Select your authorized class cohort, date, and morning/afternoon roll call session.
        </p>
      </div>

      {/* Cohort Selector Header Card */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Cohort *</label>
            <select
              value={selectedAssignmentIndex}
              onChange={(e) => setSelectedAssignmentIndex(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              {assignments.map((a: any, idx: number) => (
                <option key={a.id} value={idx}>
                  {a.class.name} - Section {a.section.name} ({a.subject.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instructional Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Session *</label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="MORNING">Morning Session</option>
              <option value="AFTERNOON">Afternoon Session</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Feedback Messages */}
      {error && <Alert type="danger">{error}</Alert>}
      {successSummary && (
        <Alert type="success" title="Attendance Recorded Successfully!">
          Roll call submitted for <strong>{successSummary.total}</strong> students (Present:{' '}
          <strong>{successSummary.present}</strong>, Late: <strong>{successSummary.late}</strong>,
          Absent: <strong>{successSummary.absent}</strong>, Excused:{' '}
          <strong>{successSummary.excused}</strong>).
        </Alert>
      )}

      {/* Attendance Roster */}
      <Card
        title={`Roll Call Roster: ${activeAssignment?.class.name} - Section ${activeAssignment?.section.name}`}
        subtitle={`${students.length} enrolled students`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Admission No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remarks / Slip Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingStudents ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      Loading class roster...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No active students found in this class section.
                    </td>
                  </tr>
                ) : (
                  students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-900">
                        {st.admissionNumber}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">{st.fullName}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((statusVal) => {
                            const isSelected = attendanceMap[st.id] === statusVal;
                            const colors = {
                              PRESENT: isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-50 text-slate-700 hover:bg-emerald-50',
                              ABSENT: isSelected
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-slate-50 text-slate-700 hover:bg-rose-50',
                              LATE: isSelected
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-slate-50 text-slate-700 hover:bg-amber-50',
                              EXCUSED: isSelected
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-slate-50 text-slate-700 hover:bg-sky-50',
                            }[statusVal];

                            return (
                              <button
                                key={statusVal}
                                type="button"
                                onClick={() => handleStatusChange(st.id, statusVal)}
                                className={`text-xs px-2.5 py-1 rounded-md font-semibold border transition-all ${colors}`}
                              >
                                {statusVal}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <input
                          type="text"
                          placeholder="Optional remark..."
                          value={remarksMap[st.id] || ''}
                          onChange={(e) =>
                            setRemarksMap((prev) => ({ ...prev, [st.id]: e.target.value }))
                          }
                          className="w-full text-xs rounded border border-slate-200 p-1.5 focus:border-brand-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={students.length === 0}
              isLoading={isSubmitting}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              Submit Attendance Roster
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
