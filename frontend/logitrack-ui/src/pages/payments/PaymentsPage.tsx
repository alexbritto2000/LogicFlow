import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  DollarSign,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Search,
  ArrowDownLeft,
  Smartphone,
  Landmark,
  Banknote,
  Receipt
} from 'lucide-react';
import { paymentService, Payment } from '../../services/payment.service';
import { invoiceService, Invoice } from '../../services/invoice.service';
import { customerService, Customer } from '../../services/customer.service';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Stats
  const [totalCollected, setTotalCollected] = useState(0);
  const [upiBankTotal, setUpiBankTotal] = useState(0);
  const [cashTotal, setCashTotal] = useState(0);

  // Record Payment Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 16));
  const [paymentMethod, setPaymentMethod] = useState<number>(2); // 2: BankTransfer
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await paymentService.getPayments({
        pageNumber,
        pageSize,
        search: search || undefined,
      });
      if (res.success && res.data) {
        setPayments(res.data.items);
        setTotalCount(res.data.totalCount);

        let total = 0;
        let upiBank = 0;
        let cash = 0;
        res.data.items.forEach((p) => {
          total += p.amount;
          if (p.paymentMethod === 1) cash += p.amount;
          else upiBank += p.amount;
        });
        setTotalCollected(total);
        setUpiBankTotal(upiBank);
        setCashTotal(cash);
      }
    } catch {
      toastError('Error', 'Failed to load payments history');
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, search, toastError]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const loadCustomers = async () => {
    try {
      const res = await customerService.getCustomers({ pageSize: 100 });
      if (res.success && res.data) setCustomers(res.data.items);
    } catch {
      // silently handle
    }
  };

  const handleCustomerChange = async (custId: string) => {
    setSelectedCustomerId(custId);
    setSelectedInvoiceId('');
    if (!custId) {
      setCustomerInvoices([]);
      return;
    }
    try {
      const res = await invoiceService.getInvoices({ customerId: parseInt(custId, 10), pageSize: 50 });
      if (res.success && res.data) {
        // filter invoices with positive balance
        const pending = res.data.items.filter((i) => i.balance > 0);
        setCustomerInvoices(pending);
      }
    } catch {
      // ignore
    }
  };

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    if (!invId) return;
    const inv = customerInvoices.find((i) => i.id === parseInt(invId, 10));
    if (inv) {
      setAmount(inv.balance);
    }
  };

  const handleOpenRecordModal = () => {
    loadCustomers();
    setSelectedCustomerId('');
    setSelectedInvoiceId('');
    setAmount(0);
    setPaymentDate(new Date().toISOString().slice(0, 16));
    setPaymentMethod(2);
    setReferenceNumber('');
    setRemarks('');
    setIsRecordModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toastError('Validation', 'Please select a customer.');
      return;
    }
    if (amount <= 0) {
      toastError('Validation', 'Payment amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await paymentService.recordPayment({
        customerId: parseInt(selectedCustomerId, 10),
        invoiceId: selectedInvoiceId ? parseInt(selectedInvoiceId, 10) : undefined,
        amount,
        paymentDate: new Date(paymentDate).toISOString(),
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      if (res.success && res.data) {
        success('Payment Recorded', `Payment ${res.data.paymentNumber} of ₹${amount.toLocaleString()} received.`);
        setIsRecordModalOpen(false);
        fetchPayments();
      }
    } catch (err: any) {
      toastError('Payment Failed', err.response?.data?.message || 'Server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodBadge = (method: number) => {
    switch (method) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            <Banknote className="w-3 h-3" /> Cash
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            <Landmark className="w-3 h-3" /> Bank Transfer
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
            <FileText className="w-3 h-3" /> Cheque
          </span>
        );
      case 4:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            <Smartphone className="w-3 h-3" /> UPI / QR
          </span>
        );
      default:
        return <Badge variant="default">Other</Badge>;
    }
  };

  const columns: Column<Payment>[] = [
    {
      header: 'Payment #',
      render: (p) => (
        <div>
          <div className="font-bold font-mono text-slate-900">{p.paymentNumber}</div>
          <div className="text-[11px] text-slate-400">
            {new Date(p.paymentDate).toLocaleDateString()} {new Date(p.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      render: (p) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-800">{p.customerName}</span>
        </div>
      ),
    },
    {
      header: 'Applied To',
      render: (p) => (
        <div className="text-xs">
          {p.invoiceNumber ? (
            <div className="font-mono text-brand-600 font-semibold flex items-center gap-1">
              <Receipt className="w-3 h-3" /> {p.invoiceNumber}
            </div>
          ) : p.bookingNumber ? (
            <div className="font-mono text-slate-600">Booking: {p.bookingNumber}</div>
          ) : (
            <span className="text-slate-400">On Account Credit</span>
          )}
        </div>
      ),
    },
    {
      header: 'Amount Paid',
      render: (p) => (
        <div className="font-bold text-emerald-600 text-sm">
          ₹{p.amount.toLocaleString()}
        </div>
      ),
    },
    {
      header: 'Method',
      render: (p) => getMethodBadge(p.paymentMethod),
    },
    {
      header: 'Reference / UTR',
      render: (p) => (
        <div className="text-xs font-mono text-slate-600">
          {p.referenceNumber || <span className="text-slate-400 font-sans italic">None</span>}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (p) => <Badge variant="success">Completed</Badge>,
    },
    {
      header: 'Recorded By',
      render: (p) => (
        <span className="text-xs text-slate-500">{p.createdBy || 'System'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Receipts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture customer collections across Bank Transfers, UPI, Cheques, and Cash with instant invoice balance reconciliation.
          </p>
        </div>
        <Button onClick={handleOpenRecordModal} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Record Payment
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Collections (Page)</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">₹{totalCollected.toLocaleString()}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{totalCount} payment transactions</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Digital / Bank / UPI</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-0.5">₹{upiBankTotal.toLocaleString()}</h3>
              <p className="text-[11px] text-blue-600 mt-0.5">Electronic settlements</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Landmark className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Cash Collections</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-0.5">₹{cashTotal.toLocaleString()}</h3>
              <p className="text-[11px] text-amber-600 mt-0.5">Direct cash counter</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Banknote className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <DataTable<Payment>
        columns={columns}
        data={payments}
        totalCount={totalCount}
        pageNumber={pageNumber}
        pageSize={pageSize}
        onPageChange={setPageNumber}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        isLoading={isLoading}
        searchPlaceholder="Search payment #, customer, reference..."
        emptyTitle="No payments recorded yet"
        emptyDescription="Record customer receipts against outstanding invoices or direct freight bookings."
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Customer Payment"
        maxWidth="lg"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Link to Outstanding Invoice (Optional)
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                disabled={!selectedCustomerId || customerInvoices.length === 0}
              >
                <option value="">-- No Specific Invoice --</option>
                {customerInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - Bal: ₹{inv.balance.toLocaleString()} (Total: ₹{inv.total.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Amount Received (₹) *
              </label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Date & Time *
              </label>
              <Input
                type="datetime-local"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(Number(e.target.value))}
                className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                required
              >
                <option value={2}>Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value={4}>UPI / QR Code</option>
                <option value={1}>Cash</option>
                <option value={3}>Cheque / Demand Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reference / UTR / Cheque #
              </label>
              <Input
                placeholder="e.g. UTR1289382103"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Remarks & Transaction Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cleared via HDFC Bank, credited against bill 002."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 p-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Confirm Payment Receipt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentsPage;
