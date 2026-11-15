import React, { useEffect, useState } from 'react';
import { GraduationCap, Plus, Search, BookOpen, Mail, Phone, Calendar } from 'lucide-react';
import { teacherService, Teacher } from '../../services/teacher.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';

export const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    password: 'Password123!',
    phone: '',
    qualification: '',
    joiningDate: '2026-08-01',
  });

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await teacherService.list({ search: search || undefined });
      setTeachers(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await teacherService.create(formData);
      setIsAddOpen(false);
      setFormData({
        employeeId: '',
        fullName: '',
        email: '',
        password: 'Password123!',
        phone: '',
        qualification: '',
        joiningDate: '2026-08-01',
      });
      fetchTeachers();
    } catch (err: any) {
      setError(err.message || 'Failed to create teacher record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty & Teachers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage instructional staff, academic schedules, and class assignments ({teachers.length} faculty members).
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setIsAddOpen(true)}>
          Add Teacher
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by teacher name, employee ID, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTeachers()}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchTeachers}>
            Search
          </Button>
        </div>
      </Card>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading faculty records...</div>
        ) : teachers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No teachers found.</div>
        ) : (
          teachers.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg border border-indigo-100">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base">{t.fullName}</h3>
                    <span className="font-mono text-xs text-slate-500">{t.employeeId}</span>
                  </div>
                </div>
                <Badge variant={t.status === 'ACTIVE' ? 'success' : 'neutral'}>{t.status}</Badge>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{t.user.email}</span>
                </div>
                {t.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{t.phone}</span>
                  </div>
                )}
                {t.qualification && (
                  <div className="text-slate-500 italic mt-1">{t.qualification}</div>
                )}
              </div>

              {/* Teaching Assignments */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Teaching Schedule ({t.assignments?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {t.assignments && t.assignments.length > 0 ? (
                    t.assignments.map((a) => (
                      <span
                        key={a.id}
                        className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium border border-slate-200"
                      >
                        {a.class.name}-{a.section.name}: {a.subject.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No subjects assigned yet</span>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Teacher Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Faculty Member">
        {error && (
          <Alert type="danger" className="mb-4">
            {error}
          </Alert>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                placeholder="EMP-1099"
                value={formData.employeeId}
                onChange={(e) => setFormData((prev) => ({ ...prev, employeeId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Dr. Jane Smith"
                value={formData.fullName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                placeholder="teacher@edumanage.academy"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                placeholder="+1 555-0199"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Qualifications</label>
              <input
                type="text"
                placeholder="M.Sc. Mathematics, B.Ed."
                value={formData.qualification}
                onChange={(e) => setFormData((prev) => ({ ...prev, qualification: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Teacher Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
