import React, { useEffect, useState } from 'react';
import { Award, Download, CheckCircle, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { examService } from '../../services/exam.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';

export const GuardianResults: React.FC = () => {
  const { activeChild } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [reportCard, setReportCard] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    examService.listExams().then((data) => {
      setExams(data);
      if (data.length > 0) {
        setSelectedExamId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!activeChild || !selectedExamId) return;

    const loadCard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await examService.getReportCard(activeChild.id, selectedExamId);
        setReportCard(res);
      } catch (e: any) {
        setError(e.message || 'Report card is not yet published for this examination.');
        setReportCard(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadCard();
  }, [activeChild, selectedExamId]);

  if (!activeChild) {
    return <div className="p-8 text-center text-slate-400">Please select a student.</div>;
  }

  const results = reportCard?.results;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Progress & Report Card</h1>
          <p className="text-sm text-slate-500 mt-1">
            Official term examination marks, grades, and PDF report cards for{' '}
            <strong>{activeChild.fullName}</strong>.
          </p>
        </div>

        {results && (
          <a
            href={examService.downloadReportCardPdfUrl(activeChild.id, selectedExamId)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 shadow-sm transition-colors"
          >
            <Download className="h-4 w-4" /> Download Official PDF Report Card
          </a>
        )}
      </div>

      {/* Select Examination */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-700">Select Examination:</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.term})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {error && <Alert type="info">{error}</Alert>}

      {/* Report Card Details */}
      {results && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center">
              <span className="text-xs font-semibold uppercase text-slate-400">Total Marks</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {results.totalObtainedMarks} / {results.totalMaxMarks}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center">
              <span className="text-xs font-semibold uppercase text-slate-400">Percentage</span>
              <div className="text-2xl font-bold text-brand-600 mt-1">
                {results.overallPercentage}%
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center">
              <span className="text-xs font-semibold uppercase text-slate-400">Overall Grade</span>
              <div className="text-2xl font-bold text-indigo-700 mt-1">{results.overallGrade}</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center">
              <span className="text-xs font-semibold uppercase text-slate-400">Result Status</span>
              <div
                className={`text-2xl font-bold mt-1 ${
                  results.overallPassed ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {results.overallPassed ? 'PASSED' : 'NEEDS REMEDIAL'}
              </div>
            </div>
          </div>

          {/* Subject Breakdown Table */}
          <Card title="Subject Performance Breakdown" subtitle="Evaluated using server-side grading rules">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
                  <tr>
                    <th className="px-6 py-3.5">Subject</th>
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Max Marks</th>
                    <th className="px-6 py-3.5">Passing Marks</th>
                    <th className="px-6 py-3.5">Marks Obtained</th>
                    <th className="px-6 py-3.5">Percentage</th>
                    <th className="px-6 py-3.5">Grade</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.subjects?.map((sub: any) => (
                    <tr key={sub.subjectId} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{sub.subjectName}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{sub.subjectCode}</td>
                      <td className="px-6 py-4">{sub.maxMarks}</td>
                      <td className="px-6 py-4 text-slate-500">{sub.passMarks}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {sub.isAbsent ? 'ABSENT' : sub.marksObtained}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">{sub.percentage}%</td>
                      <td className="px-6 py-4 font-bold text-brand-700">{sub.grade}</td>
                      <td className="px-6 py-4">
                        <Badge variant={sub.isPassed ? 'success' : 'danger'}>
                          {sub.isPassed ? 'Passed' : 'Failed'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
