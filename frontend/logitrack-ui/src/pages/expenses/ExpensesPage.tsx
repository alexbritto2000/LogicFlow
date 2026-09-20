import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Plus,
  Fuel,
  Wrench,
  Car,
  Receipt,
  FileCheck,
  Truck,
  Trash2,
  Calendar,
  AlertCircle,
  Download,
  Filter
} from 'lucide-react';
import { expenseService, Expense, ExpenseSummary } from '../../services/expense.service';
import { vehicleService, Vehicle } from '../../services/vehicle.service';
import { shipmentService, Shipment } from '../../services/shipment.service';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Stats
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalExpenses: 0,
    fuelExpenses: 0,
    tollExpenses: 0,
    maintenanceExpenses: 0,
    driverAllowanceExpenses: 0,
    otherExpenses: 0,
  });

  // Record Expense Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [expenseType, setExpenseType] = useState<number>(1); // 1: Fuel
  const [amount, setAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 16));
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Expense Dialog
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const [expRes, sumRes] = await Promise.all([
        expenseService.getExpenses({
          pageNumber,
          pageSize,
          search: search || undefined,
          expenseType: typeFilter,
        }),
        expenseService.getSummary(),
      ]);

      if (expRes.success && expRes.data) {
        setExpenses(expRes.data.items);
        setTotalCount(expRes.data.totalCount);
      }
      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }
    } catch {
      toastError('Error', 'Failed to load expense records');
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, search, typeFilter, toastError]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const loadReferenceData = async () => {
    try {
      const [vehRes, shipRes] = await Promise.all([
        vehicleService.getVehicles({ pageSize: 100 }),
        shipmentService.getShipments({ pageSize: 100 }),
      ]);
      if (vehRes.success && vehRes.data) setVehicles(vehRes.data.items);
      if (shipRes.success && shipRes.data) setShipments(shipRes.data.items);
    } catch {
      // ignore
    }
  };

  const handleOpenRecordModal = () => {
    loadReferenceData();
    setExpenseType(1);
    setAmount(0);
    setExpenseDate(new Date().toISOString().slice(0, 16));
    setSelectedVehicleId('');
    setSelectedShipmentId('');
    setDescription('');
    setReceiptFile(null);
    setIsRecordModalOpen(true);
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toastError('Validation', 'Expense amount must be greater than zero.');
      return;
    }
    if (!description.trim()) {
      toastError('Validation', 'Please describe the expense purpose or vendor.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ExpenseType', expenseType.toString());
      formData.append('Amount', amount.toString());
      formData.append('ExpenseDate', new Date(expenseDate).toISOString());
      formData.append('Description', description.trim());
      if (selectedVehicleId) formData.append('VehicleId', selectedVehicleId);
      if (selectedShipmentId) formData.append('ShipmentId', selectedShipmentId);
      if (receiptFile) formData.append('ReceiptFile', receiptFile);

      await expenseService.recordExpense(formData);
      success('Expense Logged', 'Expense record and receipt attached successfully.');
      setIsRecordModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      toastError('Failed to record expense', err.response?.data?.message || 'Server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await expenseService.deleteExpense(expenseToDelete.id);
      success('Expense Removed', 'The expense record was deleted.');
      setExpenseToDelete(null);
      fetchExpenses();
    } catch {
      toastError('Error', 'Failed to delete expense record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getExpenseTypeBadge = (type: number) => {
    switch (type) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            <Fuel className="w-3 h-3" /> Fuel
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            <Car className="w-3 h-3" /> Toll Tax
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
            <Wrench className="w-3 h-3" /> Maintenance
          </span>
        );
      case 4:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            Driver Allowance
          </span>
        );
      case 5:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
            Parking
          </span>
        );
      default:
        return <Badge variant="default">Other</Badge>;
    }
  };

  const columns: Column<Expense>[] = [
    {
      header: 'Date & Time',
      render: (e) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-900">{new Date(e.expenseDate).toLocaleDateString()}</div>
          <div className="text-slate-400">{new Date(e.expenseDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      ),
    },
    {
      header: 'Type',
      render: (e) => getExpenseTypeBadge(e.expenseType),
    },
    {
      header: 'Description / Purpose',
      render: (e) => (
        <div>
          <div className="font-medium text-slate-800 text-xs">{e.description}</div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
            {e.vehicleNumber && (
              <span className="flex items-center gap-1 text-slate-700">
                <Truck className="w-3 h-3 text-blue-500" /> {e.vehicleNumber}
              </span>
            )}
            {e.shipmentNumber && (
              <span className="font-mono text-brand-600">Shipment: {e.shipmentNumber}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Amount',
      render: (e) => (
        <div className="font-bold text-rose-600 text-sm">₹{e.amount.toLocaleString()}</div>
      ),
    },
    {
      header: 'Receipt Document',
      render: (e) => (
        <div>
          {e.receiptFile ? (
            <a
              href={`http://localhost:5000/uploads/${e.receiptFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              Receipt
            </a>
          ) : (
            <span className="text-xs text-slate-400">No Receipt</span>
          )}
        </div>
      ),
    },
    {
      header: 'Logged By',
      render: (e) => (
        <span className="text-xs text-slate-500">{e.createdBy || 'System'}</span>
      ),
    },
    {
      header: 'Action',
      render: (e) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpenseToDelete(e)}
          className="text-xs text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trip & Fleet Expenses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track direct transportation expenses including diesel fuel, toll receipts, driver trip allowances, and maintenance.
          </p>
        </div>
        <Button onClick={handleOpenRecordModal} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Log Expense
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Fleet Expenses</p>
              <h3 className="text-xl font-bold text-rose-600 mt-0.5">₹{summary.totalExpenses.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Diesel / Fuel Total</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">₹{summary.fuelExpenses.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Fuel className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Highway Toll Taxes</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">₹{summary.tollExpenses.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Maintenance & Allowance</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                ₹{(summary.maintenanceExpenses + summary.driverAllowanceExpenses).toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2 pt-1">
        {[
          { label: 'All Expenses', value: undefined },
          { label: 'Fuel (Diesel)', value: 1 },
          { label: 'Toll Tax', value: 2 },
          { label: 'Maintenance', value: 3 },
          { label: 'Driver Allowance', value: 4 },
          { label: 'Parking & Others', value: 5 },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => {
              setTypeFilter(tab.value);
              setPageNumber(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === tab.value
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <DataTable<Expense>
        columns={columns}
        data={expenses}
        totalCount={totalCount}
        pageNumber={pageNumber}
        pageSize={pageSize}
        onPageChange={setPageNumber}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        isLoading={isLoading}
        searchPlaceholder="Search description, vehicle number, shipment..."
        emptyTitle="No expenses logged yet"
        emptyDescription="Keep your operating costs organized by recording fuel receipts, toll tickets, and driver allowances."
      />

      {/* Record Expense Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Log Fleet or Trip Expense"
        maxWidth="lg"
      >
        <form onSubmit={handleRecordExpense} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Expense Category *
              </label>
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(Number(e.target.value))}
                className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                required
              >
                <option value={1}>Fuel (Diesel / Petrol / CNG)</option>
                <option value={2}>Fastag / Toll Tax</option>
                <option value={3}>Vehicle Maintenance / Repairs</option>
                <option value={4}>Driver Food & Trip Allowance (Bhatta)</option>
                <option value={5}>Parking / Loading Charges</option>
                <option value={6}>Other Operational Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Amount (₹) *
              </label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Linked Vehicle (Optional)
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">-- No Vehicle Assigned --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} ({v.vehicleType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Linked Shipment (Optional)
              </label>
              <select
                value={selectedShipmentId}
                onChange={(e) => setSelectedShipmentId(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">-- No Specific Shipment --</option>
                {shipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shipmentNumber} ({s.origin} → {s.destination})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Expense Date & Time *
              </label>
              <Input
                type="datetime-local"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Bill / Receipt Attachment
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">Accepts JPG, PNG, WEBP, or PDF (Max 10 MB)</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description / Petrol Pump / Vendor *
            </label>
            <Input
              placeholder="e.g. 120 Liters Diesel at Indian Oil Highway Pump, Surat"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Expense Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense Record"
        message={`Are you sure you want to delete this expense of ₹${expenseToDelete?.amount.toLocaleString()} for "${expenseToDelete?.description}"? This action cannot be undone.`}
        confirmText="Delete Record"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ExpensesPage;
