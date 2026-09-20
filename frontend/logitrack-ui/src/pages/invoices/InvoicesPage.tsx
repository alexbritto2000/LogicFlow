import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Printer,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Eye,
  Trash2,
  Send,
  Download,
  Percent
} from 'lucide-react';
import { invoiceService, Invoice, InvoiceItem } from '../../services/invoice.service';
import { customerService, Customer } from '../../services/customer.service';
import { bookingService, Booking } from '../../services/booking.service';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Stats
  const [totalInvoiced, setTotalInvoiced] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);

  // Generate From Booking Modal
  const [isFromBookingOpen, setIsFromBookingOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [bookingTaxRate, setBookingTaxRate] = useState<number>(18);
  const [bookingDiscount, setBookingDiscount] = useState<number>(0);

  // Custom Invoice Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)
  );
  const [taxRatePercent, setTaxRatePercent] = useState<number>(18);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [items, setItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([
    { description: 'Logistics freight charges', quantity: 1, unitPrice: 0 },
  ]);

  // View / Print Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await invoiceService.getInvoices({
        pageNumber,
        pageSize,
        search: search || undefined,
      });
      if (res.success && res.data) {
        setInvoices(res.data.items);
        setTotalCount(res.data.totalCount);

        // Aggregate statistics from current page / records
        let invoiced = 0;
        let collected = 0;
        let outstanding = 0;
        let unpaid = 0;
        res.data.items.forEach((inv) => {
          invoiced += inv.total;
          collected += inv.paidAmount;
          outstanding += inv.balance;
          if (inv.balance > 0) unpaid++;
        });
        setTotalInvoiced(invoiced);
        setTotalCollected(collected);
        setTotalOutstanding(outstanding);
        setUnpaidCount(unpaid);
      }
    } catch {
      toastError('Error', 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, search, toastError]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const loadReferenceData = async () => {
    try {
      const [custRes, bookRes] = await Promise.all([
        customerService.getCustomers({ pageSize: 100 }),
        bookingService.getBookings({ pageSize: 100 }),
      ]);
      if (custRes.success && custRes.data) setCustomers(custRes.data.items);
      if (bookRes.success && bookRes.data) setBookings(bookRes.data.items);
    } catch {
      // silently handle
    }
  };

  const handleOpenFromBooking = () => {
    loadReferenceData();
    setSelectedBookingId('');
    setBookingTaxRate(18);
    setBookingDiscount(0);
    setIsFromBookingOpen(true);
  };

  const handleCreateFromBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) {
      toastError('Validation', 'Please select a booking.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await invoiceService.createFromBooking(
        parseInt(selectedBookingId, 10),
        bookingTaxRate,
        bookingDiscount
      );
      if (res.success && res.data) {
        success('Invoice Generated', `Invoice ${res.data.invoiceNumber} created successfully.`);
        setIsFromBookingOpen(false);
        fetchInvoices();
        setSelectedInvoice(res.data);
        setIsViewModalOpen(true);
      }
    } catch (err: any) {
      toastError('Failed to generate invoice', err.response?.data?.message || 'Server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCreateModal = () => {
    loadReferenceData();
    setSelectedCustomerId('');
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setDueDate(new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));
    setTaxRatePercent(18);
    setDiscountAmount(0);
    setItems([{ description: 'Freight transportation charges', quantity: 1, unitPrice: 0 }]);
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
  };

  const calculateSubtotal = () =>
    items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);

  const calculateTax = () =>
    Math.round(calculateSubtotal() * ((Number(taxRatePercent) || 0) / 100) * 100) / 100;

  const calculateTotal = () =>
    Math.max(0, calculateSubtotal() + calculateTax() - (Number(discountAmount) || 0));

  const handleCreateCustomInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toastError('Validation', 'Please select a customer.');
      return;
    }
    if (items.some((i) => !i.description.trim() || i.unitPrice <= 0)) {
      toastError('Validation', 'Please enter a valid description and price for all line items.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await invoiceService.createInvoice({
        customerId: parseInt(selectedCustomerId, 10),
        invoiceDate: new Date(invoiceDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        taxRatePercent,
        discount: discountAmount,
        items,
      });
      if (res.success && res.data) {
        success('Invoice Created', `Invoice ${res.data.invoiceNumber} created successfully.`);
        setIsCreateModalOpen(false);
        fetchInvoices();
        setSelectedInvoice(res.data);
        setIsViewModalOpen(true);
      }
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (invoiceId: number, status: number) => {
    try {
      await invoiceService.updateStatus(invoiceId, status);
      success('Status Updated', 'Invoice status updated successfully.');
      fetchInvoices();
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        const updated = await invoiceService.getInvoiceById(invoiceId);
        if (updated.success && updated.data) setSelectedInvoice(updated.data);
      }
    } catch {
      toastError('Error', 'Failed to update invoice status.');
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge variant="default">Draft</Badge>;
      case 2:
        return <Badge variant="info">Sent</Badge>;
      case 3:
        return <Badge variant="warning">Partially Paid</Badge>;
      case 4:
        return <Badge variant="success">Paid</Badge>;
      case 5:
        return <Badge variant="danger">Overdue</Badge>;
      case 6:
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      render: (inv) => (
        <div>
          <button
            onClick={() => {
              setSelectedInvoice(inv);
              setIsViewModalOpen(true);
            }}
            className="font-bold text-brand-600 hover:text-brand-800 hover:underline flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            {inv.invoiceNumber}
          </button>
          <span className="text-xs text-slate-400">
            Due: {new Date(inv.dueDate).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer',
      render: (inv) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <div>
            <div className="font-medium text-slate-900">{inv.customerName}</div>
            {inv.customerGst && (
              <span className="text-[11px] text-slate-400 font-mono">GST: {inv.customerGst}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Booking #',
      render: (inv) => (
        <span className="font-mono text-xs text-slate-600">
          {inv.bookingNumber || 'Direct Invoice'}
        </span>
      ),
    },
    {
      header: 'Total Amount',
      render: (inv) => (
        <div className="text-xs">
          <div className="font-bold text-slate-900 text-sm">₹{inv.total.toLocaleString()}</div>
          <div className="text-slate-400 text-[11px]">
            Sub: ₹{inv.subTotal.toLocaleString()} | GST: ₹{inv.tax.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Paid / Balance',
      render: (inv) => (
        <div className="text-xs">
          <div className="font-semibold text-emerald-600">Paid: ₹{inv.paidAmount.toLocaleString()}</div>
          <div className={`font-semibold ${inv.balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            Bal: ₹{inv.balance.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (inv) => getStatusBadge(inv.status),
    },
    {
      header: 'Actions',
      render: (inv) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedInvoice(inv);
              setIsViewModalOpen(true);
            }}
            className="flex items-center gap-1 text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </Button>
          {inv.status === 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(inv.id, 2)}
              className="text-xs text-blue-600 hover:bg-blue-50"
              title="Mark as Sent to Customer"
            >
              <Send className="w-3 h-3" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Freight Invoicing & Billing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate compliant tax invoices with GST (18%), discount calculations, printable bills, and tracking balances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleOpenFromBooking} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            From Booking
          </Button>
          <Button onClick={handleOpenCreateModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Custom Invoice
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Invoiced (Page)</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">₹{totalInvoiced.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Collected</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-0.5">₹{totalCollected.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Outstanding Balance</p>
              <h3 className="text-xl font-bold text-rose-600 mt-0.5">₹{totalOutstanding.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Unpaid / Partial Invoices</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{unpaidCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <DataTable<Invoice>
        columns={columns}
        data={invoices}
        totalCount={totalCount}
        pageNumber={pageNumber}
        pageSize={pageSize}
        onPageChange={setPageNumber}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        isLoading={isLoading}
        searchPlaceholder="Search invoice #, customer name, booking..."
        emptyTitle="No invoices created yet"
        emptyDescription="Create your first invoice manually or generate one from an existing booking."
      />

      {/* Generate From Booking Modal */}
      <Modal
        isOpen={isFromBookingOpen}
        onClose={() => setIsFromBookingOpen(false)}
        title="Generate Invoice from Booking"
        maxWidth="md"
      >
        <form onSubmit={handleCreateFromBooking} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Booking *
            </label>
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            >
              <option value="">-- Choose Booking --</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bookingNumber} - {b.customerName} (₹{b.freightAmount.toLocaleString()}) [{b.pickupCity} → {b.deliveryCity}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                GST / Tax Rate (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={bookingTaxRate}
                onChange={(e) => setBookingTaxRate(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Discount (₹)
              </label>
              <Input
                type="number"
                min={0}
                value={bookingDiscount}
                onChange={(e) => setBookingDiscount(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsFromBookingOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Generate Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Custom Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Custom Tax Invoice"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateCustomInvoice} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} {c.gstNumber ? `(${c.gstNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Invoice Date *
              </label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Due Date *
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Line Items
              </label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItemRow} className="text-xs flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Item
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="p-2.5 text-left">Description</th>
                    <th className="p-2.5 text-right w-20">Qty</th>
                    <th className="p-2.5 text-right w-28">Unit Price (₹)</th>
                    <th className="p-2.5 text-right w-28">Amount (₹)</th>
                    <th className="p-2.5 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="e.g. Mumbai to Delhi 10T Transport"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none focus:border-brand-500"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full text-xs p-1.5 text-right border border-slate-200 rounded focus:outline-none focus:border-brand-500"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full text-xs p-1.5 text-right border border-slate-200 rounded focus:outline-none focus:border-brand-500"
                          required
                        />
                      </td>
                      <td className="p-2 text-right font-medium text-slate-800">
                        ₹{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={items.length === 1}
                          className="text-slate-400 hover:text-rose-500 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-2 gap-3 w-full sm:w-64">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">GST Rate (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Discount (₹)</label>
                <Input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{calculateSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST ({taxRatePercent}%):</span>
                <span className="font-semibold">₹{calculateTax().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount:</span>
                <span className="font-semibold text-rose-600">-₹{(Number(discountAmount) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-brand-600">₹{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Invoice View Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Tax Invoice - ${selectedInvoice.invoiceNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedInvoice.status)}
                {selectedInvoice.bookingNumber && (
                  <span className="text-xs text-slate-500 font-mono">
                    Booking: {selectedInvoice.bookingNumber}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs print:hidden"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </Button>
            </div>

            {/* Invoice Document Canvas */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-xs text-slate-700 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">LOGITRACK LOGISTICS</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Commercial Freight & Fleet Transportation</p>
                  <p className="text-[11px] text-slate-400">GSTIN: 27AABCL1234F1Z8 | PAN: AABCL1234F</p>
                </div>
                <div className="text-right">
                  <h3 className="text-base font-bold text-slate-900 uppercase">Tax Invoice</h3>
                  <p className="font-mono font-bold text-brand-600 text-sm mt-0.5">{selectedInvoice.invoiceNumber}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Date: {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
                  </p>
                  <p className="text-[11px] font-semibold text-rose-600">
                    Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 flex justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Billed To:</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedInvoice.customerName}</div>
                  {selectedInvoice.customerAddress && (
                    <p className="text-slate-600 mt-0.5">{selectedInvoice.customerAddress}</p>
                  )}
                  {selectedInvoice.customerPhone && (
                    <p className="text-slate-500 mt-0.5">Phone: {selectedInvoice.customerPhone}</p>
                  )}
                </div>
                <div className="text-right">
                  {selectedInvoice.customerGst && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Customer GSTIN:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedInvoice.customerGst}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs">
                <thead className="bg-slate-100/75 border-y border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2 px-3 text-left w-12">#</th>
                    <th className="py-2 px-3 text-left">Description</th>
                    <th className="py-2 px-3 text-right w-16">Qty</th>
                    <th className="py-2 px-3 text-right w-24">Rate (₹)</th>
                    <th className="py-2 px-3 text-right w-28">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items.map((item, i) => (
                    <tr key={item.id || i}>
                      <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{item.description}</td>
                      <td className="py-2 px-3 text-right">{item.quantity}</td>
                      <td className="py-2 px-3 text-right">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900">
                        ₹{item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Calculation */}
              <div className="flex justify-end pt-3 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Sub Total:</span>
                    <span className="font-medium">₹{selectedInvoice.subTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18%):</span>
                    <span className="font-medium">₹{selectedInvoice.tax.toLocaleString()}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span>-₹{selectedInvoice.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="text-brand-600">₹{selectedInvoice.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-emerald-600">
                    <span>Amount Paid:</span>
                    <span>₹{selectedInvoice.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-rose-600 pt-1 border-t border-slate-100">
                    <span>Balance Due:</span>
                    <span>₹{selectedInvoice.balance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer Terms */}
              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600">Terms & Conditions:</p>
                <p>1. Payment is due within 15 days from the date of invoice.</p>
                <p>2. Please quote invoice number when remitting funds via NEFT/RTGS or UPI.</p>
                <p>3. This is a computer-generated invoice and does not require a physical signature.</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InvoicesPage;
