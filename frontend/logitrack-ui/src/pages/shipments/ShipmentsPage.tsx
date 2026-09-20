import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  MapPin,
  Truck,
  User,
  Clock,
  ExternalLink,
  Edit3,
  Eye,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { shipmentService, Shipment, ShipmentDetail } from '../../services/shipment.service';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

export const ShipmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string | undefined>('id');
  const [isAscending, setIsAscending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Status Update Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [shipmentDetail, setShipmentDetail] = useState<ShipmentDetail | null>(null);
  const [newStatus, setNewStatus] = useState<number>(3); // PickedUp
  const [newLocation, setNewLocation] = useState<string>('');
  const [newRemarks, setNewRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchShipments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await shipmentService.getShipments({
        pageNumber,
        pageSize,
        search,
        status: statusFilter,
        sortBy,
        isAscending,
      });
      if (res.success && res.data) {
        setShipments(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } catch {
      toastError('Error', 'Failed to load shipments');
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, search, statusFilter, sortBy, isAscending, toastError]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleOpenStatusModal = (shipment: Shipment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedShipment(shipment);
    setNewStatus(shipment.currentStatus + 1 <= 6 ? shipment.currentStatus + 1 : shipment.currentStatus);
    setNewLocation(shipment.currentLocation);
    setNewRemarks('');
    setIsStatusModalOpen(true);
  };

  const handleViewDetail = async (shipment: Shipment) => {
    try {
      const res = await shipmentService.getShipmentById(shipment.id);
      if (res.success && res.data) {
        setShipmentDetail(res.data);
        setIsDetailModalOpen(true);
      }
    } catch {
      toastError('Error', 'Unable to retrieve shipment details');
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !newLocation) {
      toastError('Validation', 'Location is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await shipmentService.updateStatus(
        selectedShipment.id,
        newStatus,
        newLocation,
        newRemarks
      );
      if (res.success) {
        success('Status Updated', `Shipment status updated.`);
        setIsStatusModalOpen(false);
        fetchShipments();
      } else {
        toastError('Update Failed', res.message);
      }
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: number, name: string) => {
    switch (status) {
      case 1: // Created
        return <Badge variant="default" size="sm">Created</Badge>;
      case 2: // Assigned
        return <Badge variant="info" size="sm">Assigned</Badge>;
      case 3: // PickedUp
        return <Badge variant="purple" size="sm">Picked Up</Badge>;
      case 4: // InTransit
        return <Badge variant="warning" size="sm">In Transit</Badge>;
      case 5: // OutForDelivery
        return <Badge variant="warning" size="sm">Out For Delivery</Badge>;
      case 6: // Delivered
        return <Badge variant="success" size="sm">Delivered</Badge>;
      case 7: // Cancelled
      default:
        return <Badge variant="danger" size="sm">{name || 'Cancelled'}</Badge>;
    }
  };

  const columns: Column<Shipment>[] = [
    {
      header: 'Tracking #',
      accessor: 'trackingNumber',
      sortable: true,
      sortBy: 'trackingnumber',
      render: (s) => (
        <div>
          <span className="font-bold text-teal-700 font-mono tracking-wider bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-xs block">
            {s.trackingNumber}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            {s.shipmentNumber}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer / Booking',
      render: (s) => (
        <div>
          <p className="font-semibold text-slate-900">{s.customerName}</p>
          <p className="text-[11px] text-slate-500 font-mono">{s.bookingNumber}</p>
        </div>
      ),
    },
    {
      header: 'Route & Current Location',
      render: (s) => (
        <div>
          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
            <span>{s.origin}</span>
            <span className="text-slate-400">→</span>
            <span>{s.destination}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-teal-600 font-medium mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[180px]">{s.currentLocation}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Fleet / Driver',
      render: (s) => (
        <div className="text-xs">
          {s.assignedVehicleNumber ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold font-mono">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                <span>{s.assignedVehicleNumber}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <User className="w-3 h-3 text-slate-400" />
                <span>{s.assignedDriverName}</span>
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      header: 'Est. Delivery',
      sortable: true,
      sortBy: 'estimateddelivery',
      render: (s) => (
        <div className="text-[11px] text-slate-600">
          <Calendar className="w-3 h-3 text-slate-400 inline mr-1" />
          {new Date(s.estimatedDeliveryDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: 'Status',
      sortable: true,
      sortBy: 'status',
      render: (s) => getStatusBadge(s.currentStatus, s.statusName),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleViewDetail(s)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition"
            title="View Timeline"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleOpenStatusModal(s, e)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
            title="Update Status / Location"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/tracking?q=${s.trackingNumber}`)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition"
            title="Track Consignment"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Shipments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of in-transit freight, status milestones, and assigned vehicles.
          </p>
        </div>
      </div>

      {/* Filter bar & Data Table */}
      <DataTable
        columns={columns}
        data={shipments}
        totalCount={totalCount}
        pageNumber={pageNumber}
        pageSize={pageSize}
        onPageChange={setPageNumber}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        onSortChange={(col, asc) => {
          setSortBy(col);
          setIsAscending(asc);
        }}
        currentSortBy={sortBy}
        isAscending={isAscending}
        isLoading={isLoading}
        searchPlaceholder="Search tracking number, shipment #, customer, route..."
        onRowClick={handleViewDetail}
        filterComponent={
          <div className="w-44">
            <select
              value={statusFilter ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val === '' ? undefined : Number(val));
                setPageNumber(1);
              }}
              aria-label="Filter shipments by status"
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">All Statuses</option>
              <option value="1">Created</option>
              <option value="2">Assigned</option>
              <option value="3">Picked Up</option>
              <option value="4">In Transit</option>
              <option value="5">Out For Delivery</option>
              <option value="6">Delivered</option>
              <option value="7">Cancelled</option>
            </select>
          </div>
        }
      />

      {/* Update Shipment Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Update Status: ${selectedShipment?.trackingNumber}`}
        description="Log transit progress, checkpoint updates, and milestone progression."
        maxWidth="lg"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <Select
            label="Shipment Milestone / Status"
            value={newStatus}
            onChange={(e) => setNewStatus(Number(e.target.value))}
          >
            <option value="1">Created</option>
            <option value="2">Vehicle Assigned</option>
            <option value="3">Picked Up</option>
            <option value="4">In Transit</option>
            <option value="5">Out For Delivery</option>
            <option value="6">Delivered</option>
            <option value="7">Cancelled</option>
          </Select>

          <Input
            label="Current Location / Checkpoint"
            placeholder="e.g. Vellore Tollway Plaza, Bangalore Regional Hub"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            required
          />

          <Input
            label="Operational Remarks (Optional)"
            placeholder="e.g. Cleared security check, passing through toll without delay"
            value={newRemarks}
            onChange={(e) => setNewRemarks(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Log Status Update
            </Button>
          </div>
        </form>
      </Modal>

      {/* Shipment Details & Timeline Modal */}
      {shipmentDetail && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Shipment: ${shipmentDetail.trackingNumber}`}
          description={`${shipmentDetail.origin} → ${shipmentDetail.destination}`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {/* Top Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Booking / Shipper</span>
                <span className="font-semibold text-slate-800 block">{shipmentDetail.customerName}</span>
                <span className="text-[11px] text-slate-500 font-mono">{shipmentDetail.bookingNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Fleet Assigned</span>
                <span className="font-bold text-slate-900 font-mono block">
                  {shipmentDetail.assignedVehicleNumber || 'Not Assigned'}
                </span>
                <span className="text-[11px] text-slate-500">{shipmentDetail.assignedDriverName || 'No Driver'}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Cargo Details</span>
                <span className="font-semibold text-slate-800 block">{shipmentDetail.cargoDescription}</span>
                <span className="text-[11px] text-slate-500">
                  {shipmentDetail.cargoWeight} kg • {shipmentDetail.numberOfPackages} pkgs
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Status</span>
                <span className="mt-1 inline-block">
                  {getStatusBadge(shipmentDetail.currentStatus, shipmentDetail.statusName)}
                </span>
              </div>
            </div>

            {/* Status History Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" /> Milestone Audit Timeline
              </h4>

              <div className="relative pl-6 border-l-2 border-teal-200 space-y-6 ml-3">
                {shipmentDetail.statusHistories.map((hist, idx) => (
                  <div key={hist.id || idx} className="relative">
                    {/* Circle marker */}
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-white border-4 border-teal-600 shadow-sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{hist.statusName}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(hist.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        📍 {hist.location}
                      </p>
                      {hist.remarks && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1.5 italic">
                          "{hist.remarks}"
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">Logged by: {hist.updatedBy || 'System'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ShipmentsPage;
