import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, Search, Link2, Users } from 'lucide-react';
import { guardianService, Guardian } from '../../services/guardian.service';
import { studentService } from '../../services/student.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';

export const GuardianManagement: React.FC = () => {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createData, setCreateData] = useState({
    fullName: '',
    email: '',
    password: 'Password123!',
    phone: '',
    address: '',
    occupation: '',
  });

  const [linkData, setLinkData] = useState({
    studentId: '',
    relationship: 'FATHER',
    isPrimary: false,
  });

  const fetchGuardians = async () => {
    setIsLoading(true);
    try {
      const res = await guardianService.list({ search: search || undefined });
      setGuardians(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardians();
    studentService.list({ limit: 100 }).then((res) => setStudents(res.data || []));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await guardianService.create(createData);
      setIsAddOpen(false);
      setCreateData({
        fullName: '',
        email: '',
        password: 'Password123!',
        phone: '',
        address: '',
        occupation: '',
      });
      fetchGuardians();
    } catch (err: any) {
      setError(err.message || 'Failed to create guardian');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuardian) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await guardianService.linkStudent({
        guardianId: selectedGuardian.id,
        studentId: linkData.studentId,
        relationship: linkData.relationship as any,
        isPrimary: linkData.isPrimary,
      });
      setIsLinkOpen(false);
      fetchGuardians();
    } catch (err: any) {
      setError(err.message || 'Failed to link student');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Guardian Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Registered parents and legal guardians linked to students ({guardians.length} records).
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setIsAddOpen(true)}>
          Register Guardian
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by guardian name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchGuardians()}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchGuardians}>
            Search
          </Button>
        </div>
      </Card>

      {/* Guardians List */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Guardian Name</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5">Occupation</th>
                <th className="px-6 py-3.5">Linked Children</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Loading guardians...
                  </td>
                </tr>
              ) : guardians.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No guardian records found.
                  </td>
                </tr>
              ) : (
                guardians.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-semibold text-slate-900">{g.fullName}</td>
                    <td className="px-6 py-4 text-xs space-y-0.5">
                      <div className="text-slate-800 font-medium">{g.phone}</div>
                      <div className="text-slate-500">{g.user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">{g.occupation || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {g.studentLinks?.map((l) => (
                          <span
                            key={l.student.id}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-medium border border-slate-200"
                          >
                            <Users className="h-3 w-3 text-slate-400" />
                            {l.student.fullName} ({l.student.class.name})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Link2 className="h-3.5 w-3.5" />}
                        onClick={() => {
                          setSelectedGuardian(g);
                          setIsLinkOpen(true);
                        }}
                      >
                        Link Child
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Guardian Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Guardian">
        {error && (
          <Alert type="danger" className="mb-4">
            {error}
          </Alert>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={createData.fullName}
              onChange={(e) => setCreateData((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="e.g. John Doe"
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Login Email *</label>
              <input
                type="email"
                required
                value={createData.email}
                onChange={(e) => setCreateData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="parent@example.com"
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={createData.phone}
                onChange={(e) => setCreateData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 555-0192"
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Occupation</label>
              <input
                type="text"
                value={createData.occupation}
                onChange={(e) => setCreateData((prev) => ({ ...prev, occupation: e.target.value }))}
                placeholder="Civil Engineer"
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
              <input
                type="text"
                value={createData.password}
                onChange={(e) => setCreateData((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              value={createData.address}
              onChange={(e) => setCreateData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Street address, city"
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Register Guardian
            </Button>
          </div>
        </form>
      </Modal>

      {/* Link Student Modal */}
      <Modal
        isOpen={isLinkOpen}
        onClose={() => setIsLinkOpen(false)}
        title={`Link Student to ${selectedGuardian?.fullName || 'Guardian'}`}
      >
        {error && (
          <Alert type="danger" className="mb-4">
            {error}
          </Alert>
        )}
        <form onSubmit={handleLinkStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student *</label>
            <select
              required
              value={linkData.studentId}
              onChange={(e) => setLinkData((prev) => ({ ...prev, studentId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">Choose student to link</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} ({st.admissionNumber} - {st.class.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
            <select
              value={linkData.relationship}
              onChange={(e) => setLinkData((prev) => ({ ...prev, relationship: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="FATHER">Father</option>
              <option value="MOTHER">Mother</option>
              <option value="LEGAL_GUARDIAN">Legal Guardian</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={linkData.isPrimary}
              onChange={(e) => setLinkData((prev) => ({ ...prev, isPrimary: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="isPrimary" className="text-xs text-slate-700 font-medium cursor-pointer">
              Mark as Primary Contact
            </label>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsLinkOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Establish Relationship
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
