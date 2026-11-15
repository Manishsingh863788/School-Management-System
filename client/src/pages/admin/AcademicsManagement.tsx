import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Layers, UserCheck, ShieldCheck } from 'lucide-react';
import { academicService } from '../../services/academic.service';
import { teacherService } from '../../services/teacher.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';

export const AcademicsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'classes' | 'sections' | 'subjects' | 'assignments'>('classes');

  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);

  // Forms
  const [classForm, setClassForm] = useState({ name: '', academicYearId: '', classTeacherId: '', description: '' });
  const [sectionForm, setSectionForm] = useState({ name: '', capacity: 40, classId: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' });
  const [assignForm, setAssignForm] = useState({ classId: '', sectionId: '', subjectId: '', teacherId: '' });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cls, secs, subs, asgns, yrs, tchs] = await Promise.all([
        academicService.listClasses(),
        academicService.listSections(),
        academicService.listSubjects(),
        academicService.listAssignments(),
        academicService.listYears(),
        teacherService.list(),
      ]);
      setClasses(cls);
      setSections(secs);
      setSubjects(subs);
      setAssignments(asgns);
      setYears(yrs);
      setTeachers(tchs.data || []);

      if (yrs.length > 0 && !classForm.academicYearId) {
        setClassForm((prev) => ({ ...prev, academicYearId: yrs[0].id }));
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

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await academicService.createClass(classForm);
      setIsAddClassOpen(false);
      setClassForm({ name: '', academicYearId: years[0]?.id || '', classTeacherId: '', description: '' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create class');
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await academicService.createSection({ ...sectionForm, capacity: Number(sectionForm.capacity) });
      setIsAddSectionOpen(false);
      setSectionForm({ name: '', capacity: 40, classId: '' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create section');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await academicService.createSubject(subjectForm);
      setIsAddSubjectOpen(false);
      setSubjectForm({ name: '', code: '', description: '' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create subject');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await academicService.createAssignment(assignForm);
      setIsAddAssignmentOpen(false);
      setAssignForm({ classId: '', sectionId: '', subjectId: '', teacherId: '' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to assign teacher');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Structure</h1>
          <p className="text-sm text-slate-500 mt-1">
            Classes, Sections, Curriculum Subjects, and Faculty Teaching Matrix.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'classes'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Classes ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'sections'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sections ({sections.length})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'subjects'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Subjects ({subjects.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'assignments'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Faculty Assignments ({assignments.length})
        </button>
      </div>

      {/* TAB 1: CLASSES */}
      {activeTab === 'classes' && (
        <Card
          title="Classes & Cohorts"
          subtitle="Grade levels and designated class teachers"
          action={
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setIsAddClassOpen(true)}>
              Add Class
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Class Name</th>
                  <th className="px-4 py-3">Academic Year</th>
                  <th className="px-4 py-3">Class Teacher</th>
                  <th className="px-4 py-3">Sections</th>
                  <th className="px-4 py-3">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{c.name}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">{c.academicYear.name}</td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {c.classTeacher?.fullName || <span className="italic text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        {c.sections?.map((s: any) => (
                          <span
                            key={s.id}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded border border-slate-200"
                          >
                            Sec {s.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{c._count?.students || 0} enrolled</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: SECTIONS */}
      {activeTab === 'sections' && (
        <Card
          title="Sections"
          subtitle="Section cohorts within classes"
          action={
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setIsAddSectionOpen(true)}>
              Add Section
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Section Name</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Current Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sections.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{s.class.name}</td>
                    <td className="px-4 py-3.5 font-bold text-brand-600">Section {s.name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{s.capacity} seats max</td>
                    <td className="px-4 py-3.5 text-slate-800 font-semibold">{s._count?.students || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: SUBJECTS */}
      {activeTab === 'subjects' && (
        <Card
          title="Curriculum Subjects"
          subtitle="Courses taught across the academic curriculum"
          action={
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setIsAddSubjectOpen(true)}>
              Add Subject
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Subject Name</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3.5 font-mono font-bold text-xs text-brand-700">{sub.code}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{sub.name}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{sub.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: TEACHER ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <Card
          title="Class-Subject Teacher Assignment Matrix"
          subtitle="Enforces valid teaching authorizations"
          action={
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setIsAddAssignmentOpen(true)}>
              Assign Teacher
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Assigned Faculty</th>
                  <th className="px-4 py-3">Employee ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{a.class.name}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">Section {a.section.name}</td>
                    <td className="px-4 py-3.5 font-bold text-brand-600">
                      {a.subject.name} ({a.subject.code})
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{a.teacher.fullName}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{a.teacher.employeeId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Class Modal */}
      <Modal isOpen={isAddClassOpen} onClose={() => setIsAddClassOpen(false)} title="Create New Class">
        {error && <Alert type="danger" className="mb-4">{error}</Alert>}
        <form onSubmit={handleCreateClass} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Class 11"
              value={classForm.name}
              onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year *</label>
            <select
              value={classForm.academicYearId}
              onChange={(e) => setClassForm((prev) => ({ ...prev, academicYearId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class Teacher</label>
            <select
              value={classForm.classTeacherId}
              onChange={(e) => setClassForm((prev) => ({ ...prev, classTeacherId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">No designated class teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAddClassOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Class</Button>
          </div>
        </form>
      </Modal>

      {/* Add Section Modal */}
      <Modal isOpen={isAddSectionOpen} onClose={() => setIsAddSectionOpen(false)} title="Create Section">
        {error && <Alert type="danger" className="mb-4">{error}</Alert>}
        <form onSubmit={handleCreateSection} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
            <select
              required
              value={sectionForm.classId}
              onChange={(e) => setSectionForm((prev) => ({ ...prev, classId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">Select target class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. C"
                value={sectionForm.name}
                onChange={(e) => setSectionForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
              <input
                type="number"
                min="10"
                value={sectionForm.capacity}
                onChange={(e) => setSectionForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAddSectionOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Section</Button>
          </div>
        </form>
      </Modal>

      {/* Add Subject Modal */}
      <Modal isOpen={isAddSubjectOpen} onClose={() => setIsAddSubjectOpen(false)} title="Add Subject">
        {error && <Alert type="danger" className="mb-4">{error}</Alert>}
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. BIO101"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm((prev) => ({ ...prev, code: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
              <input
                type="text"
                required
                placeholder="Biology"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              placeholder="Curriculum syllabus summary"
              value={subjectForm.description}
              onChange={(e) => setSubjectForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAddSubjectOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Subject</Button>
          </div>
        </form>
      </Modal>

      {/* Add Assignment Modal */}
      <Modal isOpen={isAddAssignmentOpen} onClose={() => setIsAddAssignmentOpen(false)} title="Assign Teacher to Class Subject">
        {error && <Alert type="danger" className="mb-4">{error}</Alert>}
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
            <select
              required
              value={assignForm.classId}
              onChange={(e) => {
                setAssignForm((prev) => ({ ...prev, classId: e.target.value, sectionId: '' }));
              }}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Section *</label>
            <select
              required
              value={assignForm.sectionId}
              onChange={(e) => setAssignForm((prev) => ({ ...prev, sectionId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">Select Section</option>
              {sections
                .filter((s) => s.classId === assignForm.classId)
                .map((s) => (
                  <option key={s.id} value={s.id}>Section {s.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
            <select
              required
              value={assignForm.subjectId}
              onChange={(e) => setAssignForm((prev) => ({ ...prev, subjectId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher *</label>
            <select
              required
              value={assignForm.teacherId}
              onChange={(e) => setAssignForm((prev) => ({ ...prev, teacherId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.fullName} ({t.employeeId})</option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAddAssignmentOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Assignment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
