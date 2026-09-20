import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  UserCheck,
  Package,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Plus,
  ArrowRight,
  Clock,
  ShieldAlert,
  CreditCard,
  Building2,
  Receipt,
  Activity,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  dashboardService,
  DashboardSummary,
  MonthlyFinancialTrend,
  StatusDistribution,
  RecentActivity,
} from '../../services/dashboard.service';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b', '#06b6d4'];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<MonthlyFinancialTrend[]>([]);
  const [distribution, setDistribution] = useState<StatusDistribution[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [sumRes, trendRes, distRes, actRes] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getFinancialTrends(6),
          dashboardService.getShipmentDistribution(),
          dashboardService.getRecentActivities(8),
        ]);

        if (sumRes.success && sumRes.data) setSummary(sumRes.data);
        if (trendRes.success && trendRes.data) setTrends(trendRes.data);
        if (distRes.success && distRes.data) setDistribution(distRes.data);
        if (actRes.success && actRes.data) setActivities(actRes.data);
      } catch {
        // Handled gracefully
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading Logistics Management metrics...</p>
      </div>
    );
  }

  const pieData = distribution.map((d) => ({
    name: d.status,
    value: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Logistics Operations Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-700">{user?.fullName || user?.username}</span>!
            Here is the real-time operational overview for{' '}
            <span className="font-medium text-slate-800">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/bookings')}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Booking
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/assignments')}
            className="flex items-center gap-1.5 text-xs"
          >
            <Truck className="w-3.5 h-3.5" />
            Dispatch Fleet
          </Button>
        </div>
      </div>

      {/* Compliance / Expiry Alert Banner */}
      {(summary.expiredDocuments > 0 || summary.expiringSoonDocuments > 0) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="font-semibold text-sm">Regulatory Compliance & Document Expiry Warning</div>
              <p className="text-xs text-amber-800 mt-0.5">
                {summary.expiredDocuments > 0 && (
                  <span className="font-bold text-rose-700">{summary.expiredDocuments} documents are EXPIRED. </span>
                )}
                {summary.expiringSoonDocuments > 0 && (
                  <span>{summary.expiringSoonDocuments} vehicle/driver documents are expiring within 30 days. </span>
                )}
                Immediate renewal is required to prevent dispatch blocks.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/documents')}
            className="text-xs bg-white text-amber-900 border-amber-300 hover:bg-amber-100 shrink-0"
          >
            Review Vault
          </Button>
        </div>
      )}

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Financial Overview */}
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue & Collections</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900">₹{summary.totalRevenue.toLocaleString()}</div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span className="text-emerald-600 font-medium">Rec: ₹{summary.totalCollected.toLocaleString()}</span>
                <span className="text-rose-600 font-medium">Due: ₹{summary.outstandingReceivables.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Shipments */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shipment Velocity</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900">{summary.activeShipments}</div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>Active in Transit</span>
                <span className="text-emerald-600 font-semibold">{summary.deliveredToday} Delivered Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Availability */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle Fleet Readiness</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900">
                {summary.availableVehicles}{' '}
                <span className="text-xs font-normal text-slate-400">/ {summary.totalVehicles} Total</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span className="text-amber-600 font-medium">{summary.inTransitVehicles} On Road</span>
                <span className="text-rose-600 font-medium">{summary.maintenanceVehicles} Maintenance</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Fleet */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Certified Drivers</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900">
                {summary.availableDrivers}{' '}
                <span className="text-xs font-normal text-slate-400">/ {summary.totalDrivers} Drivers</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span className="text-purple-600 font-medium">{summary.assignedDrivers} Dispatched</span>
                <span className="text-slate-400 font-medium">{summary.onLeaveDrivers} On Leave</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Row: Financials + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue vs Expenses Chart (2 Cols) */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Monthly Revenue vs. Fleet Expenses</h3>
                <p className="text-[11px] text-slate-400">6-Month financial performance trajectory (₹ INR)</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                  <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Status Distribution Pie Chart (1 Col) */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-2">
              <h3 className="font-bold text-slate-900 text-sm">Shipment Pipeline</h3>
              <p className="text-[11px] text-slate-400">Current active consignment stages</p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} consignments`, name]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(val) => <span className="text-[11px] text-slate-600">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-400">No active shipments in pipeline</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Highlights & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet & Resource Utilization (1 Col) */}
        <Card className="space-y-4">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Fleet & Driver Capacity</h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span>Vehicles Available ({summary.availableVehicles}/{summary.totalVehicles})</span>
                  <span>{summary.totalVehicles > 0 ? Math.round((summary.availableVehicles / summary.totalVehicles) * 100) : 0}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${summary.totalVehicles > 0 ? (summary.availableVehicles / summary.totalVehicles) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span>Vehicles In-Transit ({summary.inTransitVehicles}/{summary.totalVehicles})</span>
                  <span>{summary.totalVehicles > 0 ? Math.round((summary.inTransitVehicles / summary.totalVehicles) * 100) : 0}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{
                      width: `${summary.totalVehicles > 0 ? (summary.inTransitVehicles / summary.totalVehicles) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span>Drivers Available ({summary.availableDrivers}/{summary.totalDrivers})</span>
                  <span>{summary.totalDrivers > 0 ? Math.round((summary.availableDrivers / summary.totalDrivers) * 100) : 0}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${summary.totalDrivers > 0 ? (summary.availableDrivers / summary.totalDrivers) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                Quick Operations
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/bookings')}
                  className="p-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-left text-xs font-medium flex items-center justify-between"
                >
                  Bookings <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/shipments')}
                  className="p-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-left text-xs font-medium flex items-center justify-between"
                >
                  Shipments <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/invoices')}
                  className="p-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-left text-xs font-medium flex items-center justify-between"
                >
                  Invoicing <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="p-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-left text-xs font-medium flex items-center justify-between"
                >
                  Reports <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Operational Activity Log (2 Cols) */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-600" />
                  Recent Operations & System Audit Feed
                </h3>
                <p className="text-[11px] text-slate-400">Live operational timeline across shipments, assignments, and payments</p>
              </div>
            </div>

            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                      <div>
                        <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                          {act.title}
                        </span>
                        <p className="text-slate-600 text-xs mt-0.5">{act.description}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">No system audit activities recorded yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
