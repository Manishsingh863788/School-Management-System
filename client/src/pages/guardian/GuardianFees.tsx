import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, AlertCircle, DollarSign, Receipt } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { feeService } from '../../services/fee.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';

export const GuardianFees: React.FC = () => {
  const { activeChild } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadInvoices = async () => {
    if (!activeChild) return;
    setIsLoading(true);
    try {
      const res = await feeService.listInvoices({ studentId: activeChild.id });
      setInvoices(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [activeChild]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setError(null);
    setIsSubmitting(true);
    setSuccessMsg(null);

    try {
      const idempotencyKey = `GUARDIAN-PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await feeService.recordPayment({
        invoiceId: selectedInvoice.id,
        amount: Number(paymentAmount),
        paymentMethod,
        idempotencyKey,
        notes: `Guardian online simulated payment via ${paymentMethod}`,
      });
      setIsPayOpen(false);
      setSuccessMsg(`Payment of $${paymentAmount} settled successfully!`);
      loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Payment simulation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeChild) {
    return <div className="p-8 text-center text-slate-400">Please select a student.</div>;
  }

  const totalDue = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Statements & Billing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Itemized invoices and online simulated payment portal for <strong>{activeChild.fullName}</strong>.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div>
            <span className="block text-[11px] font-semibold uppercase text-slate-400">Total Outstanding</span>
            <span className="text-xl font-bold text-slate-900">${totalDue.toLocaleString()}</span>
          </div>
          <Badge variant={totalDue === 0 ? 'success' : 'danger'}>
            {totalDue === 0 ? 'Clear' : 'Payment Due'}
          </Badge>
        </div>
      </div>

      {successMsg && <Alert type="success">{successMsg}</Alert>}

      {/* Invoices List */}
      <Card title="Fee Invoices" subtitle="Itemized tuition, laboratory, and examination dues">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
              <tr>
                <th className="px-6 py-3.5">Invoice Number</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5">Total Billed</th>
                <th className="px-6 py-3.5">Paid Amount</th>
                <th className="px-6 py-3.5">Balance Due</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No fee invoices found for this student.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">${inv.totalAmount}</td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold">${inv.paidAmount}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">${inv.balanceAmount}</td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-right">
                      {inv.balanceAmount > 0 ? (
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<CreditCard className="h-3.5 w-3.5" />}
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentAmount(inv.balanceAmount);
                            setIsPayOpen(true);
                          }}
                        >
                          Pay Now
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Simulated Payment Modal */}
      <Modal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        title={`Simulate Fee Payment - ${selectedInvoice?.invoiceNumber}`}
      >
        {error && <Alert type="danger" className="mb-4">{error}</Alert>}
        <form onSubmit={handlePay} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Student:</span>
              <strong className="text-slate-900">{activeChild.fullName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice:</span>
              <strong className="font-mono text-slate-900">{selectedInvoice?.invoiceNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Balance Due:</span>
              <strong className="text-rose-600">${selectedInvoice?.balanceAmount}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              min="1"
              max={selectedInvoice?.balanceAmount}
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm font-bold text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Simulated Payment Method *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['UPI', 'CARD', 'CASH'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`p-3 rounded-lg border text-xs font-bold text-center transition-all ${
                    paymentMethod === method
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {method === 'UPI' ? 'UPI (Simulation)' : method === 'CARD' ? 'Card (Simulation)' : 'Bank / Cash'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsPayOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Confirm ${paymentAmount} Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
