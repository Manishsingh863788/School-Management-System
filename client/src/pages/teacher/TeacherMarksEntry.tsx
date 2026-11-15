import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { examService } from '../../services/exam.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

export const TeacherMarksEntry: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.profile?.id;

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedExamSubjectId, setSelectedExamSubjectId] = useState<string>('');
  const [examSubjectData, setExamSubjectData] = useState<any | null>(null);

  const [marksMap, setMarksMap] = useState<Record<string, number>>({});
  const [absentMap, setAbsentMap] = useState<Record<string, boolean>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load published exams
  useEffect(() => {
    examService.listExams().then((data) => {
      setExams(data);
      if (data.length > 0) {
        setSelectedExamId(data[0].id);
      }
    });
  }, []);

  const currentExam = exams.find((e) => e.id === selectedExamId);
  const availableExamSubjects = currentExam?.examSubjects || [];

  useEffect(() => {
    if (availableExamSubjects.length > 0 && !selectedExamSubjectId) {
      setSelectedExamSubjectId(availableExamSubjects[0].id);
    }
  }, [selectedExamId, availableExamSubjects]);

  // Load marks sheet for selected exam subject
  useEffect(() => {
    if (!selectedExamSubjectId) return;

    const loadSheet = async () => {
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);
      try {
        const data = await examService.getMarksSheet(selectedExamSubjectId);
        setExamSubjectData(data);

        const m: Record<string, number> = {};
        const ab: Record<string, boolean> = {};
        const rm: Record<string, string> = {};

        data.students.forEach((s: any) => {
          m[s.studentId] = s.marksObtained !== null ? s.marksObtained : 0;
          ab[s.studentId] = s.isAbsent || false;
          rm[s.studentId] = s.remarks || '';
        });

        setMarksMap(m);
        setAbsentMap(ab);
        setRemarksMap(rm);
      } catch (e: any) {
        setError(e.message || 'Failed to load examination marks sheet');
      } finally {
        setIsLoading(false);
      }
    };

    loadSheet();
  }, [selectedExamSubjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examSubjectData) return;
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const maxMarks = examSubjectData.examSubject.maxMarks;
      // Client-side guard check
      for (const s of examSubjectData.students) {
        const mark = marksMap[s.studentId];
        if (mark > maxMarks) {
          throw new Error(
            `Mark (${mark}) for student ${s.fullName} cannot exceed maximum allowed marks (${maxMarks}).`
          );
        }
        if (mark < 0) {
          throw new Error(`Marks cannot be negative.`);
        }
      }

      const payload = examSubjectData.students.map((s: any) => ({
        studentId: s.studentId,
        marksObtained: Number(marksMap[s.studentId] || 0),
        isAbsent: absentMap[s.studentId] || false,
        remarks: remarksMap[s.studentId] || undefined,
      }));

      await examService.submitMarks({
        examSubjectId: selectedExamSubjectId,
        marks: payload,
      });

      setSuccessMsg(
        `Successfully saved marks for ${payload.length} students in ${examSubjectData.examSubject.subjectName}.`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to submit marks');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examination Marks Entry</h1>
        <p className="text-sm text-slate-500 mt-1">
          Record and validate scores for students in your assigned cohorts.
        </p>
      </div>

      {/* Selectors */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Examination *</label>
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setSelectedExamSubjectId('');
              }}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.academicYear.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Subject & Class *
            </label>
            <select
              value={selectedExamSubjectId}
              onChange={(e) => setSelectedExamSubjectId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              {availableExamSubjects.map((es: any) => (
                <option key={es.id} value={es.id}>
                  {es.class.name}: {es.subject.name} (Max Marks: {es.maxMarks})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {error && <Alert type="danger">{error}</Alert>}
      {successMsg && <Alert type="success">{successMsg}</Alert>}

      {/* Marks Sheet Table */}
      {examSubjectData && (
        <Card
          title={`Marks Sheet: ${examSubjectData.examSubject.subjectName}`}
          subtitle={`Class: ${examSubjectData.examSubject.className} • Max Marks: ${examSubjectData.examSubject.maxMarks} • Pass Marks: ${examSubjectData.examSubject.passMarks}`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
                  <tr>
                    <th className="px-4 py-3">Admission No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Absent?</th>
                    <th className="px-4 py-3">Marks Obtained</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Loading marks sheet...
                      </td>
                    </tr>
                  ) : examSubjectData.students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No enrolled students found in this class.
                      </td>
                    </tr>
                  ) : (
                    examSubjectData.students.map((st: any) => {
                      const isAb = absentMap[st.studentId] || false;
                      const markVal = marksMap[st.studentId] ?? 0;
                      const isOver = markVal > examSubjectData.examSubject.maxMarks;

                      return (
                        <tr key={st.studentId} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                            {st.admissionNumber}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">{st.fullName}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">Sec {st.section}</td>
                          <td className="px-4 py-3">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={isAb}
                                onChange={(e) =>
                                  setAbsentMap((prev) => ({
                                    ...prev,
                                    [st.studentId]: e.target.checked,
                                  }))
                                }
                                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                              />
                              <span className="text-slate-600">Mark Absent</span>
                            </label>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max={examSubjectData.examSubject.maxMarks}
                              step="0.5"
                              disabled={isAb}
                              value={isAb ? '' : markVal}
                              onChange={(e) =>
                                setMarksMap((prev) => ({
                                  ...prev,
                                  [st.studentId]: Number(e.target.value),
                                }))
                              }
                              className={`w-28 rounded-lg border p-1.5 text-sm font-bold focus:outline-none ${
                                isOver
                                  ? 'border-rose-500 text-rose-600 bg-rose-50'
                                  : 'border-slate-300 text-slate-900 focus:border-brand-500'
                              } disabled:bg-slate-100 disabled:text-slate-400`}
                            />
                            {isOver && (
                              <span className="block text-[10px] text-rose-600 font-semibold mt-0.5">
                                Exceeds {examSubjectData.examSubject.maxMarks} max
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              placeholder="Feedback / comment..."
                              value={remarksMap[st.studentId] || ''}
                              onChange={(e) =>
                                setRemarksMap((prev) => ({
                                  ...prev,
                                  [st.studentId]: e.target.value,
                                }))
                              }
                              className="w-full text-xs rounded border border-slate-200 p-1.5 focus:border-brand-500 focus:outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                icon={<Save className="h-4 w-4" />}
              >
                Submit & Calculate Results
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
