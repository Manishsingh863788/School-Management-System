import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, Plus, Receipt, ShieldCheck, CheckCircle } from 'lucide-react';
import { feeService } from '../../services/fee.service';
import { academicService } from '../../services/academic.service';
import { studentService } from '../../services/student.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';

export const FeeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'structures' | 'payments'>('invoices');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddStructureOpen, setIsAddStructureOpen] = useState(false);
  const [isGenerateInvoiceOpen, setIsGenerateInvoiceOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Forms
  const [structForm, setStructForm] = useState({
    name: '',
    academicYearId: '',
    classId: '',
    description: '',
    items: [
      { category: 'TUITION', amount: 2000 },
      { category: 'LABORATORY', amount: 500 },
      { category: 'LIBRARY', amount: 300 },
    ],
  });

  const [genForm, setGenForm] = useState({
    feeStructureId: '',
    dueDate: '2026-12-15',
    classId: '',
  });

  const [payForm, setPayForm] = useState({
    amount: 0,
    paymentMethod: 'CASH',
    notes: 'Simulated cash deposit',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invRes, strRes, payRes, clsRes, yrRes, stRes] = await Promise.all([
        feeService.listInvoices(),
        feeService.listStructures(),
        feeService.listPayments(),
        academicService.listClasses(),
        academicService.listYears(),
        studentService.list({ limit: 100 }),
      ]);
      setInvoices(invRes.data || []);
      setStructures(strRes || []);
      setPayments(payRes || []);
      setClasses(clsRes || []);
      setYears(yrRes || []);
      setStudents(stRes.data || []);

      if (yrRes.length > 0 && !structForm.academicYearId) {
        setStructForm((prev) => ({ ...prev, academicYearId: yrRes[0].id }));
      }
      if (clsRes.length > 0 && !structForm.classId) {
        setStructForm((prev) => ({ ...prev, classId: clsRes[0].id }));
      }
      if (strRes.length > 0 && !genForm.feeStructureId) {
        setGenForm((prev) => ({ ...prev, feeStructureId: strRes[0].id }));
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

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await feeService.createStructure(structForm);
      setIsAddStructureOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create fee structure');
    }
  };

  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await feeService.generateInvoices({
        ...genForm,
        classId: genForm.classId || undefined,
      });
      setIsGenerateInvoiceOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoices');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setError(null);
    try {
      const idempotencyKey = `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await feeService.recordPayment({
        invoiceId: selectedInvoice.id,
        amount: Number(payForm.amount),
        paymentMethod: payForm.paymentMethod as any,
        idempotencyKey,
        notes: payForm.notes,
      });
      setIsPaymentModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Payment simulation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Ledger & Billing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Fee structure schedules, invoice generation, and double-entry simulated payments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddStructureOpen(true)}
          >
            Create Structure
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Receipt className="h-4 w-4" />}
            onClick={() => setIsGenerateInvoiceOpen(true)}
          >
            Generate Invoices
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'invoices'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'structures'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Fee Structures ({structures.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'payments'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payment Transactions ({payments.length})
        </button>
      </div>

      {/* INVOICES LIST */}
      {activeTab === 'invoices' && (
        <Card title="Student Billed Invoices" subtitle="Invoice total = Paid amount + Outstanding balance">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Invoice No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Paid Amount</th>
                  <th className="px-4 py-3">Balance Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">{inv.student.fullName}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">{inv.student.class.name}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">${inv.totalAmount}</td>
                    <td className="px-4 py-3.5 text-emerald-600 font-semibold">${inv.paidAmount}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">${inv.balanceAmount}</td>
                    <td className="px-4 py-3.5">
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
                    <td className="px-4 py-3.5 text-right">
                      {inv.balanceAmount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<CreditCard className="h-3.5 w-3.5" />}
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPayForm({
                              amount: inv.balanceAmount,
                              paymentMethod: 'CASH',
                              notes: 'Simulated counter payment',
                            });
                            setIsPaymentModalOpen(true);
                          }}
                        >
                          Collect Payment
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* STRUCTURES LIST */}
      {activeTab === 'structures' && (
        <Card title="Fee Schedules & Itemized Rates" subtitle="Configured rate templates">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {structures.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{s.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Class: {s.class.name} • Year: {s.academicYear.name}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-brand-600">${s.totalAmount}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  {s.items?.map((it: any) => (
                    <div key={it.id} className="flex justify-between text-slate-600">
                      <span>{it.category}</span>
                      <strong className="text-slate-900">${it.amount}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* PAYMENTS LIST */}
      {activeTab === 'payments' && (
        <Card title="Simulated Payment Transactions Ledger" subtitle="Non-repudiation audit of receipts">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3">Txn Reference</th>
                  <th className="px-4 py-3">Invoice No</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-900">
                      {p.transactionReference}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                      {p.invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">{p.invoice.student.fullName}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-800">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">${p.amount}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant="success">{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Collect Payment Modal (Simulated Payment) */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Simulate Fee Payment - ${selectedInvoice?.invoiceNumber}`}
      >
        {error && <Alert type="danger" className="mb-4">{error}</Alert>}
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Student:</span>
              <strong className="text-slate-900">{selectedInvoice?.student?.fullName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Outstanding Balance:</span>
              <strong className="text-rose-600">${selectedInvoice?.balanceAmount}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount ($) *
            </label>
            <input
              type="number"
              step="0.01"
              max={selectedInvoice?.balanceAmount}
              min="1"
              required
              value={payForm.amount}
              onChange={(e) => setPayForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Simulated Payment Method *
            </label>
            <select
              value={payForm.paymentMethod}
              onChange={(e) => setPayForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="CASH">Cash (Simulation)</option>
              <option value="UPI">UPI (Simulation)</option>
              <option value="CARD">Card (Simulation)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Notes</label>
            <input
              type="text"
              value={payForm.notes}
              onChange={(e) => setPayForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Execute Simulated Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Generate Invoices Modal */}
      <Modal isOpen={isGenerateInvoiceOpen} onClose={() => setIsGenerateInvoiceOpen(false)} title="Generate Fee Invoices">
        {error && <Alert type="danger" className="mb-4">{error}</Alert>}
        <form onSubmit={handleGenerateInvoices} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Structure *</label>
            <select
              value={genForm.feeStructureId}
              onChange={(e) => setGenForm((prev) => ({ ...prev, feeStructureId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              {structures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (${s.totalAmount} - {s.class.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
            <input
              type="date"
              required
              value={genForm.dueDate}
              onChange={(e) => setGenForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsGenerateInvoiceOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Generate Invoices</Button>
          </div>
        </form>
      </Modal>

      {/* Create Structure Modal */}
      <Modal isOpen={isAddStructureOpen} onClose={() => setIsAddStructureOpen(false)} title="Create Fee Structure">
        {error && <Alert type="danger" className="mb-4">{error}</Alert>}
        <form onSubmit={handleCreateStructure} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Structure Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Grade 10 Standard Annual Fee"
              value={structForm.name}
              onChange={(e) => setStructForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class *</label>
              <select
                value={structForm.classId}
                onChange={(e) => setStructForm((prev) => ({ ...prev, classId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year *</label>
              <select
                value={structForm.academicYearId}
                onChange={(e) => setStructForm((prev) => ({ ...prev, academicYearId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAddStructureOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Structure</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
