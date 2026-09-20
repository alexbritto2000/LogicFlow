import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Truck,
  UserCheck,
  DollarSign,
  Package,
  CheckCircle2,
  Clock,
  Search,
  Building2
} from 'lucide-react';
import {
  reportService,
  ShipmentReportItem,
  FinancialReportItem,
  VehicleExpenseReportItem,
  DriverPerformanceReportItem,
  ReportFilterParams,
} from '../../services/report.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

type ReportTab = 'shipments' | 'financial' | 'vehicles' | 'drivers';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('shipments');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Data states
  const [shipments, setShipments] = useState<ShipmentReportItem[]>([]);
  const [financials, setFinancials] = useState<FinancialReportItem[]>([]);
  const [vehicleExpenses, setVehicleExpenses] = useState<VehicleExpenseReportItem[]>([]);
  const [drivers, setDrivers] = useState<DriverPerformanceReportItem[]>([]);

  const { success, error: toastError } = useToast();

  const getFilterParams = (): ReportFilterParams => {
    const params: ReportFilterParams = {};
    if (fromDate) params.fromDate = new Date(fromDate).toISOString();
    if (toDate) params.toDate = new Date(toDate).toISOString();
    return params;
  };

  const fetchCurrentReport = useCallback(async () => {
    setIsLoading(true);
    const filters = getFilterParams();
    try {
      if (activeTab === 'shipments') {
        const res = await reportService.getShipmentReport(filters);
        if (res.success && res.data) setShipments(res.data);
      } else if (activeTab === 'financial') {
        const res = await reportService.getFinancialReport(filters);
        if (res.success && res.data) setFinancials(res.data);
      } else if (activeTab === 'vehicles') {
        const res = await reportService.getVehicleExpenseReport(filters);
        if (res.success && res.data) setVehicleExpenses(res.data);
      } else if (activeTab === 'drivers') {
        const res = await reportService.getDriverPerformanceReport(filters);
        if (res.success && res.data) setDrivers(res.data);
      }
    } catch {
      toastError('Error', 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, fromDate, toDate, toastError]);

  useEffect(() => {
    fetchCurrentReport();
  }, [fetchCurrentReport]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    const filters = getFilterParams();
    try {
      if (activeTab === 'shipments') {
        await reportService.exportShipmentReportCsv(filters);
      } else if (activeTab === 'financial') {
        await reportService.exportFinancialReportCsv(filters);
      } else if (activeTab === 'vehicles') {
        await reportService.exportVehicleExpenseReportCsv(filters);
      } else if (activeTab === 'drivers') {
        await reportService.exportDriverPerformanceReportCsv(filters);
      }
      success('Export Completed', 'Report downloaded as CSV.');
    } catch {
      toastError('Export Error', 'Failed to generate CSV export file.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Operational Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Query shipment performance, financial summaries, fleet maintenance expenses, and driver KPI analytics with instant CSV downloads.
          </p>
        </div>
        <Button
          onClick={handleExportCsv}
          isLoading={isExporting}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-4">
          {[
            { id: 'shipments', label: 'Shipment Performance', icon: Package },
            { id: 'financial', label: 'Financial & Invoices', icon: DollarSign },
            { id: 'vehicles', label: 'Vehicle Fleet & Expenses', icon: Truck },
            { id: 'drivers', label: 'Driver Activity', icon: UserCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={`py-3 px-1 border-b-2 font-medium text-xs flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>From:</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-36 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>To:</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-36 text-xs"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCurrentReport}
              className="text-xs"
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              Apply Filter
            </Button>
            {(fromDate || toDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="text-xs text-slate-500"
              >
                Reset
              </Button>
            )}
          </div>

          <div className="text-xs text-slate-400">
            {activeTab === 'shipments' && `${shipments.length} records`}
            {activeTab === 'financial' && `${financials.length} records`}
            {activeTab === 'vehicles' && `${vehicleExpenses.length} vehicles`}
            {activeTab === 'drivers' && `${drivers.length} drivers`}
          </div>
        </CardContent>
      </Card>

      {/* Report Data Tables */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
              Generating report data...
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* 1. Shipments Report */}
              {activeTab === 'shipments' && (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3">Shipment / Tracking</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Route (Origin → Dest)</th>
                      <th className="p-3">Assigned Fleet</th>
                      <th className="p-3">Freight (₹)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Booking Date</th>
                      <th className="p-3">Delivered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shipments.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{s.shipmentNumber}</div>
                          <div className="font-mono text-[11px] text-brand-600">{s.trackingNumber}</div>
                        </td>
                        <td className="p-3 font-medium text-slate-800">{s.customerName}</td>
                        <td className="p-3 text-slate-600">{s.origin} → {s.destination}</td>
                        <td className="p-3">
                          <div>{s.vehicleNumber || 'Unassigned'}</div>
                          <div className="text-[11px] text-slate-400">{s.driverName || 'No Driver'}</div>
                        </td>
                        <td className="p-3 font-semibold text-slate-900">₹{s.freightAmount.toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant={s.isDelivered ? 'success' : 'default'}>{s.status}</Badge>
                        </td>
                        <td className="p-3 text-slate-500">{new Date(s.bookingDate).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-600 font-medium">
                          {s.actualDeliveryDate ? new Date(s.actualDeliveryDate).toLocaleDateString() : 'In Transit'}
                        </td>
                      </tr>
                    ))}
                    {shipments.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">No shipments found for selected range.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* 2. Financial Report */}
              {activeTab === 'financial' && (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Invoice Date</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">Subtotal</th>
                      <th className="p-3 text-right">GST (18%)</th>
                      <th className="p-3 text-right">Grand Total</th>
                      <th className="p-3 text-right">Paid Amount</th>
                      <th className="p-3 text-right">Balance Due</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financials.map((f, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold font-mono text-brand-600">{f.invoiceNumber}</td>
                        <td className="p-3 font-medium text-slate-800">{f.customerName}</td>
                        <td className="p-3 text-slate-500">{new Date(f.invoiceDate).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-500">{new Date(f.dueDate).toLocaleDateString()}</td>
                        <td className="p-3 text-right">₹{f.subTotal.toLocaleString()}</td>
                        <td className="p-3 text-right">₹{f.tax.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-slate-900">₹{f.total.toLocaleString()}</td>
                        <td className="p-3 text-right text-emerald-600 font-semibold">₹{f.paidAmount.toLocaleString()}</td>
                        <td className="p-3 text-right text-rose-600 font-bold">₹{f.balance.toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant={f.balance === 0 ? 'success' : 'warning'}>{f.status}</Badge>
                        </td>
                      </tr>
                    ))}
                    {financials.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400">No invoices found for selected range.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* 3. Vehicle Expenses Report */}
              {activeTab === 'vehicles' && (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3">Vehicle #</th>
                      <th className="p-3">Vehicle Type</th>
                      <th className="p-3 text-center">Completed Trips</th>
                      <th className="p-3 text-right">Fuel Expenses (₹)</th>
                      <th className="p-3 text-right">Toll Taxes (₹)</th>
                      <th className="p-3 text-right">Maintenance (₹)</th>
                      <th className="p-3 text-right">Other Expenses (₹)</th>
                      <th className="p-3 text-right font-bold">Total Operating Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehicleExpenses.map((v, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">{v.vehicleNumber}</td>
                        <td className="p-3 text-slate-600">{v.vehicleType}</td>
                        <td className="p-3 text-center font-medium">{v.completedTrips}</td>
                        <td className="p-3 text-right">₹{v.fuelExpenses.toLocaleString()}</td>
                        <td className="p-3 text-right">₹{v.tollExpenses.toLocaleString()}</td>
                        <td className="p-3 text-right">₹{v.maintenanceExpenses.toLocaleString()}</td>
                        <td className="p-3 text-right">₹{v.otherExpenses.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-rose-600">₹{v.totalExpenses.toLocaleString()}</td>
                      </tr>
                    ))}
                    {vehicleExpenses.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">No vehicle expense data found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* 4. Driver Performance Report */}
              {activeTab === 'drivers' && (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3">Driver Name</th>
                      <th className="p-3">Driver Code</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">License Number</th>
                      <th className="p-3 text-center">Total Trips Assigned</th>
                      <th className="p-3 text-center">Completed Deliveries</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {drivers.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">{d.driverName}</td>
                        <td className="p-3 font-mono text-brand-600">{d.driverCode}</td>
                        <td className="p-3 text-slate-600">{d.phone}</td>
                        <td className="p-3 font-mono text-slate-700">{d.licenseNumber}</td>
                        <td className="p-3 text-center font-medium">{d.totalAssignments}</td>
                        <td className="p-3 text-center font-bold text-emerald-600">{d.completedDeliveries}</td>
                        <td className="p-3">
                          <Badge variant={d.status === 'Available' ? 'success' : 'default'}>{d.status}</Badge>
                        </td>
                      </tr>
                    ))}
                    {drivers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">No driver activity found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
