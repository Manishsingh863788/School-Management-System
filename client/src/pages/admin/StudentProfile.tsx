import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  CreditCard,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from 'lucide-react';
import { studentService, Student } from '../../services/student.service';
import { examService } from '../../services/exam.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'exams' | 'fees'>('attendance');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await studentService.getById(id);
        setStudent(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load student record');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-4">
        <Button variant="outline" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Alert type="danger">{error || 'Student not found'}</Alert>
      </div>
    );
  }

  const summary = student.summary || {};
  const attSummary = summary.attendance || {};
  const feeSummary = summary.fees || {};

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
          Back to Students
        </Button>
        <Badge variant={student.status === 'ACTIVE' ? 'success' : 'neutral'}>
          Status: {student.status}
        </Badge>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-2xl border border-brand-200 shadow-inner">
              {student.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {student.fullName}
                </h1>
                <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 rounded-md font-semibold text-slate-600 border border-slate-200">
                  {student.admissionNumber}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Class: <strong className="text-slate-800">{student.class.name}</strong> • Section:{' '}
                <strong className="text-slate-800">{student.section.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div>
              <span className="block text-slate-400 font-semibold uppercase">Attendance</span>
              <span className="text-base font-bold text-slate-900">{attSummary.percentage ?? 0}%</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="block text-slate-400 font-semibold uppercase">Fee Balance</span>
              <span className="text-base font-bold text-slate-900">
                ${feeSummary.outstanding ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Contact & Personal Metadata Grid */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>DOB: {new Date(student.dob).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="capitalize">Gender: {student.gender.toLowerCase()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-400" />
            <span>{student.email || 'No email provided'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span>{student.address || 'Address on file'}</span>
          </div>
        </div>
      </div>

      {/* Linked Guardians */}
      <Card title="Linked Guardians & Parents" subtitle="Family contact records">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {student.guardians && student.guardians.length > 0 ? (
            student.guardians.map((link: any) => (
              <div
                key={link.id}
                className="p-4 rounded-xl border border-slate-200/80 flex items-start gap-3 bg-slate-50/50"
              >
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {link.guardian.fullName}
                    </h4>
                    <Badge variant="neutral">{link.relationship}</Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <div>Phone: {link.guardian.phone}</div>
                    <div>Email: {link.guardian.user?.email}</div>
                    {link.guardian.occupation && <div>Occupation: {link.guardian.occupation}</div>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No guardians currently registered.</p>
          )}
        </div>
      </Card>

      {/* Tabs: Attendance, Examinations, Fee Invoices */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-200 space-x-8 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'attendance'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Attendance History ({student.attendance?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'exams'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Exam Marks & Results ({student.examResults?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'fees'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Fee Invoices ({student.invoices?.length || 0})
          </button>
        </div>

        {/* Tab 1: Attendance */}
        {activeTab === 'attendance' && (
          <Card title="Recent Roll Call Records">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Recorded By</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.attendance && student.attendance.length > 0 ? (
                    student.attendance.map((att: any) => (
                      <tr key={att.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {new Date(att.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-xs">{att.session}</td>
                        <td className="px-4 py-3">
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
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {att.recordedBy?.fullName || 'Faculty'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 italic">
                          {att.remarks || '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-xs">
                        No attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 2: Examinations */}
        {activeTab === 'exams' && (
          <Card title="Subject Examination Scores">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Examination</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Max Marks</th>
                    <th className="px-4 py-3">Obtained</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Report Card</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.examResults && student.examResults.length > 0 ? (
                    student.examResults.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {r.examSubject.examination.name}
                        </td>
                        <td className="px-4 py-3">
                          {r.examSubject.subject.name} ({r.examSubject.subject.code})
                        </td>
                        <td className="px-4 py-3">{r.examSubject.maxMarks}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {r.isAbsent ? 'ABSENT' : r.marksObtained}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              r.isAbsent
                                ? 'danger'
                                : r.marksObtained >= r.examSubject.passMarks
                                ? 'success'
                                : 'danger'
                            }
                          >
                            {r.isAbsent
                              ? 'Absent'
                              : r.marksObtained >= r.examSubject.passMarks
                              ? 'Passed'
                              : 'Failed'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={examService.downloadReportCardPdfUrl(
                              student.id,
                              r.examSubject.examination.id
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800"
                          >
                            <Download className="h-3.5 w-3.5" /> PDF Card
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-xs">
                        No examination results on record.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 3: Fees */}
        {activeTab === 'fees' && (
          <Card title="Student Fee Statements & Invoices">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Invoice No</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3">Paid Amount</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.invoices && student.invoices.length > 0 ? (
                    student.invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-semibold text-xs text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">${inv.totalAmount}</td>
                        <td className="px-4 py-3 text-emerald-600 font-semibold">${inv.paidAmount}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">${inv.balanceAmount}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              inv.status === 'PAID'
                                ? 'success'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-xs">
                        No fee invoices on file.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
