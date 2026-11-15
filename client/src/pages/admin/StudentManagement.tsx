import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Eye,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { studentService, Student } from '../../services/student.service';
import { academicService } from '../../services/academic.service';
import { guardianService } from '../../services/guardian.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';

export const StudentManagement: React.FC = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    admissionNumber: '',
    fullName: '',
    dob: '2010-01-01',
    gender: 'MALE',
    email: '',
    phone: '',
    address: '',
    classId: '',
    sectionId: '',
    guardianId: '',
    relationship: 'FATHER',
  });

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await studentService.list({
        page,
        limit: 10,
        search: search || undefined,
        classId: selectedClassId || undefined,
        status: selectedStatus || undefined,
      });
      setStudents(res.data);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotalStudents(res.meta.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, selectedClassId, selectedStatus]);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [cls, grds] = await Promise.all([
          academicService.listClasses(),
          guardianService.list(),
        ]);
        setClasses(cls);
        setGuardians(grds.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadDropdowns();
  }, []);

  const handleClassChangeInForm = async (cId: string) => {
    setFormData((prev) => ({ ...prev, classId: cId, sectionId: '' }));
    if (cId) {
      const secs = await academicService.listSections(cId);
      setSections(secs);
      if (secs.length > 0) {
        setFormData((prev) => ({ ...prev, sectionId: secs[0].id }));
      }
    } else {
      setSections([]);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await studentService.create({
        ...formData,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        guardianId: formData.guardianId || undefined,
      });
      setIsAddModalOpen(false);
      setFormData({
        admissionNumber: '',
        fullName: '',
        dob: '2010-01-01',
        gender: 'MALE',
        email: '',
        phone: '',
        address: '',
        classId: '',
        sectionId: '',
        guardianId: '',
        relationship: 'FATHER',
      });
      fetchStudents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create student record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to deactivate student ${name}?`)) {
      try {
        await studentService.delete(id);
        fetchStudents();
      } catch (e: any) {
        alert(e.message || 'Failed to deactivate student');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage student enrollments, cohort assignments, and profile records ({totalStudents} total).
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Enroll New Student
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
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
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <Button size="sm" variant="outline" onClick={fetchStudents}>
              Search
            </Button>
          </div>
        </div>
      </Card>

      {/* Students Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Admission No</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Class & Section</th>
                <th className="px-6 py-3.5">Gender</th>
                <th className="px-6 py-3.5">Primary Guardian</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                      Loading students...
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No student records found matching your filters.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-900 text-xs">
                      {st.admissionNumber}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{st.fullName}</td>
                    <td className="px-6 py-4">
                      {st.class.name} - {st.section.name}
                    </td>
                    <td className="px-6 py-4 text-xs capitalize text-slate-500">{st.gender.toLowerCase()}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {st.guardians?.[0]?.guardian?.fullName || (
                        <span className="text-slate-400 italic">None linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={st.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {st.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => navigate(`/admin/students/${st.id}`)}
                      >
                        Profile
                      </Button>
                      {st.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDeactivate(st.id, st.fullName)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              icon={<ChevronLeft className="h-3.5 w-3.5" />}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1 inline" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll New Student"
        maxWidth="2xl"
      >
        {formError && (
          <Alert type="danger" className="mb-4">
            {formError}
          </Alert>
        )}
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admission Number *
              </label>
              <input
                type="text"
                required
                placeholder="ADM-2026-099"
                value={formData.admissionNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, admissionNumber: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Student Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData((prev) => ({ ...prev, dob: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
              <select
                required
                value={formData.classId}
                onChange={(e) => handleClassChangeInForm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section *</label>
              <select
                required
                disabled={!formData.classId}
                value={formData.sectionId}
                onChange={(e) => setFormData((prev) => ({ ...prev, sectionId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none disabled:bg-slate-100"
              >
                <option value="">Select Section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    Section {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link Existing Guardian (Optional)
              </label>
              <select
                value={formData.guardianId}
                onChange={(e) => setFormData((prev) => ({ ...prev, guardianId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">No Guardian Linked</option>
                {guardians.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.fullName} ({g.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
              <select
                disabled={!formData.guardianId}
                value={formData.relationship}
                onChange={(e) => setFormData((prev) => ({ ...prev, relationship: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none disabled:bg-slate-100"
              >
                <option value="FATHER">Father</option>
                <option value="MOTHER">Mother</option>
                <option value="LEGAL_GUARDIAN">Legal Guardian</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Student Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
