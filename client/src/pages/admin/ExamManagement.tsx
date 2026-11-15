import React, { useEffect, useState } from 'react';
import { Award, Plus, Calendar, FileText, CheckCircle } from 'lucide-react';
import { examService } from '../../services/exam.service';
import { academicService } from '../../services/academic.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';

export const ExamManagement: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [gradeRules, setGradeRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    academicYearId: '',
    term: 'MID_TERM',
    startDate: '2026-10-15',
    endDate: '2026-10-25',
    status: 'PUBLISHED',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [exList, yrList, clsList, subList, grList] = await Promise.all([
        examService.listExams(),
        academicService.listYears(),
        academicService.listClasses(),
        academicService.listSubjects(),
        examService.listGradeRules(),
      ]);
      setExams(exList);
      setYears(yrList);
      setClasses(clsList);
      setSubjects(subList);
      setGradeRules(grList);

      if (yrList.length > 0 && !form.academicYearId) {
        setForm((prev) => ({ ...prev, academicYearId: yrList[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await examService.createExam({
        ...form,
        examSubjects: [
          { subjectId: subjects[0]?.id, classId: classes[0]?.id, maxMarks: 100, passMarks: 40 },
          { subjectId: subjects[1]?.id, classId: classes[0]?.id, maxMarks: 100, passMarks: 40 },
        ],
      });
      setIsAddOpen(false);
      setForm({
        name: '',
        academicYearId: years[0]?.id || '',
        term: 'MID_TERM',
        startDate: '2026-10-15',
        endDate: '2026-10-25',
        status: 'PUBLISHED',
      });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create exam');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examination Engine</h1>
          <p className="text-sm text-slate-500 mt-1">
            Exam scheduling, maximum marks configuration, and server-side grading evaluation.
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setIsAddOpen(true)}>
          Schedule Examination
        </Button>
      </div>

      {/* Configured Grading Scale */}
      <Card title="Active Grading Scale" subtitle="Server-side automatic mark boundary thresholds">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {gradeRules.map((rule) => (
            <div
              key={rule.grade}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 text-center"
            >
              <div className="text-lg font-bold text-brand-700">{rule.grade}</div>
              <div className="text-xs font-semibold text-slate-700 mt-0.5">
                {rule.minPercentage}% – {rule.maxPercentage}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{rule.description || 'Standard'}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Examinations List */}
      <Card title="Scheduled & Published Examinations" subtitle="Term examinations and assessment subjects">
        <div className="divide-y divide-slate-100">
          {exams.map((ex) => (
            <div key={ex.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{ex.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Year: {ex.academicYear.name} • Term: {ex.term} •{' '}
                    {new Date(ex.startDate).toLocaleDateString()} to{' '}
                    {new Date(ex.endDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={ex.status === 'PUBLISHED' ? 'success' : 'info'}>{ex.status}</Badge>
              </div>

              {/* Exam Subjects Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ex.examSubjects?.map((es: any) => (
                  <div
                    key={es.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {es.subject.name} ({es.subject.code})
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {es.class.name} • Max: {es.maxMarks} • Pass: {es.passMarks}
                      </div>
                    </div>
                    <Badge variant="neutral">{es._count?.results || 0} marks entered</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Exam Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Examination">
        {error && <Alert type="danger" className="mb-4">{error}</Alert>}
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Examination Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Final Term Examination 2026"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
              <select
                value={form.academicYearId}
                onChange={(e) => setForm((prev) => ({ ...prev, academicYearId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Term</label>
              <select
                value={form.term}
                onChange={(e) => setForm((prev) => ({ ...prev, term: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="FIRST_TERM">First Term</option>
                <option value="MID_TERM">Mid Term</option>
                <option value="FINAL_TERM">Final Term</option>
                <option value="UNIT_TEST">Unit Test</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Examination</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
