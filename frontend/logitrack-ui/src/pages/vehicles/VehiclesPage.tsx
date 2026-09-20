import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Edit2, Trash2, Eye, Truck, Gauge, AlertCircle, FileCheck2, Calendar } from 'lucide-react';
import { vehicleService, Vehicle, VehicleDetail } from '../../services/vehicle.service';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

const vehicleSchema = z.object({
  vehicleNumber: z.string().min(4, 'Vehicle number is required (e.g. TN-01-AB-1234)'),
  vehicleType: z.string().min(2, 'Vehicle type is required'),
  make: z.string().min(2, 'Make is required (e.g. Tata, Ashok Leyland)'),
  model: z.string().min(2, 'Model is required'),
  year: z.coerce.number().min(1990).max(new Date().getFullYear() + 1),
  capacity: z.coerce.number().min(0.1, 'Capacity must be greater than 0'),
  fuelType: z.string().min(2, 'Fuel type is required'),
  currentOdometer: z.coerce.number().min(0, 'Odometer must be positive'),
  status: z.coerce.number(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string | undefined>('id');
  const [isAscending, setIsAscending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleDetail, setVehicleDetail] = useState<VehicleDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
  });

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await vehicleService.getVehicles({
        pageNumber,
        pageSize,
        search,
        status: statusFilter,
        sortBy,
        isAscending,
      });
      if (res.success && res.data) {
        setVehicles(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } catch {
      toastError('Error', 'Failed to load vehicles');
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, search, statusFilter, sortBy, isAscending, toastError]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleOpenCreate = () => {
    setSelectedVehicle(null);
    reset({
      vehicleNumber: '',
      vehicleType: '14ft Truck',
      make: 'Tata',
      model: '407 Gold SFC',
      year: new Date().getFullYear(),
      capacity: 3.5,
      fuelType: 'Diesel',
      currentOdometer: 0,
      status: 1, // Available
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVehicle(vehicle);
    setValue('vehicleNumber', vehicle.vehicleNumber);
    setValue('vehicleType', vehicle.vehicleType);
    setValue('make', vehicle.make);
    setValue('model', vehicle.model);
    setValue('year', vehicle.year);
    setValue('capacity', vehicle.capacity);
    setValue('fuelType', vehicle.fuelType);
    setValue('currentOdometer', vehicle.currentOdometer);
    setValue('status', vehicle.status);
    setIsFormModalOpen(true);
  };

  const handleViewDetail = async (vehicle: Vehicle) => {
    try {
      const res = await vehicleService.getVehicleById(vehicle.id);
      if (res.success && res.data) {
        setVehicleDetail(res.data);
        setIsDetailModalOpen(true);
      }
    } catch {
      toastError('Error', 'Unable to retrieve vehicle details');
    }
  };

  const handleOpenDelete = (vehicle: Vehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVehicle(vehicle);
    setIsConfirmOpen(true);
  };

  const onFormSubmit = async (data: VehicleFormData) => {
    setIsSubmitting(true);
    try {
      if (selectedVehicle) {
        const res = await vehicleService.updateVehicle(selectedVehicle.id, data);
        if (res.success) {
          success('Vehicle Updated', `${data.vehicleNumber} has been updated.`);
          setIsFormModalOpen(false);
          fetchVehicles();
        } else {
          toastError('Update Failed', res.message);
        }
      } else {
        const res = await vehicleService.createVehicle(data);
        if (res.success) {
          success('Vehicle Added', `${data.vehicleNumber} registered into fleet.`);
          setIsFormModalOpen(false);
          fetchVehicles();
        } else {
          toastError('Registration Failed', res.message);
        }
      }
    } catch (err: any) {
      toastError('Operation Failed', err.response?.data?.message || 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedVehicle) return;
    setIsSubmitting(true);
    try {
      const res = await vehicleService.deleteVehicle(selectedVehicle.id);
      if (res.success) {
        success('Vehicle Deactivated', `${selectedVehicle.vehicleNumber} marked as inactive.`);
        setIsConfirmOpen(false);
        fetchVehicles();
      }
    } catch {
      toastError('Error', 'Could not deactivate vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: number, name: string) => {
    switch (status) {
      case 1: // Available
        return <Badge variant="success" size="sm">Available</Badge>;
      case 2: // Assigned
        return <Badge variant="info" size="sm">Assigned</Badge>;
      case 3: // InTransit
        return <Badge variant="purple" size="sm">In Transit</Badge>;
      case 4: // Maintenance
        return <Badge variant="warning" size="sm">Maintenance</Badge>;
      case 5: // Inactive
      default:
        return <Badge variant="danger" size="sm">{name || 'Inactive'}</Badge>;
    }
  };

  const columns: Column<Vehicle>[] = [
    {
      header: 'Vehicle Number',
      accessor: 'vehicleNumber',
      sortable: true,
      sortBy: 'vehiclenumber',
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
            <Truck className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900 tracking-wider font-mono">
            {v.vehicleNumber}
          </span>
        </div>
      ),
    },
    {
      header: 'Make & Model',
      render: (v) => (
        <div>
          <p className="font-semibold text-slate-900">{v.make} {v.model}</p>
          <p className="text-[11px] text-slate-500">{v.vehicleType} • {v.year}</p>
        </div>
      ),
    },
    {
      header: 'Capacity',
      sortable: true,
      sortBy: 'capacity',
      render: (v) => (
        <span className="font-semibold text-slate-800">
          {v.capacity} Tons
        </span>
      ),
    },
    {
      header: 'Odometer',
      render: (v) => (
        <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          <span>{v.currentOdometer.toLocaleString()} km</span>
        </div>
      ),
    },
    {
      header: 'Doc Status',
      render: (v) => {
        if (v.expiredDocumentsCount > 0) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <AlertCircle className="w-3 h-3" /> {v.expiredDocumentsCount} Expired
            </span>
          );
        }
        if (v.expiringSoonDocumentsCount > 0) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <AlertCircle className="w-3 h-3" /> {v.expiringSoonDocumentsCount} Soon
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <FileCheck2 className="w-3 h-3" /> Valid
          </span>
        );
      },
    },
    {
      header: 'Status',
      sortable: true,
      sortBy: 'status',
      render: (v) => getStatusBadge(v.status, v.statusName),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (v) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleViewDetail(v)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleOpenEdit(v, e)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
            title="Edit Vehicle"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleOpenDelete(v, e)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
            title="Deactivate Vehicle"
          >
            <Trash2 className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fleet & Vehicles</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage transport fleet, capacities, maintenance statuses, and compliance.
          </p>
        </div>
      </div>

      {/* Filter bar & Data Table */}
      <DataTable
        columns={columns}
        data={vehicles}
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
        searchPlaceholder="Search vehicle number, make, model..."
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
              aria-label="Filter vehicles by status"
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">All Statuses</option>
              <option value="1">Available</option>
              <option value="2">Assigned</option>
              <option value="3">In Transit</option>
              <option value="4">Maintenance</option>
              <option value="5">Inactive</option>
            </select>
          </div>
        }
        actionButton={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreate}
          >
            Add Vehicle
          </Button>
        }
      />

      {/* Add / Edit Vehicle Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        description="Register or update vehicle specs, payload capacity, and operational status."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Vehicle Number"
              placeholder="e.g. TN-01-AB-1234"
              error={errors.vehicleNumber?.message}
              {...register('vehicleNumber')}
            />
            <Input
              label="Vehicle Type"
              placeholder="e.g. 14ft Truck, 20ft Container"
              error={errors.vehicleType?.message}
              {...register('vehicleType')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Make"
              placeholder="e.g. Tata, Ashok Leyland"
              error={errors.make?.message}
              {...register('make')}
            />
            <Input
              label="Model"
              placeholder="e.g. 407 Gold, 1618"
              error={errors.model?.message}
              {...register('model')}
            />
            <Input
              label="Manufacturing Year"
              type="number"
              placeholder="e.g. 2023"
              error={errors.year?.message}
              {...register('year')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Capacity (Tons)"
              type="number"
              step="0.1"
              placeholder="e.g. 5.5"
              error={errors.capacity?.message}
              {...register('capacity')}
            />
            <Select label="Fuel Type" error={errors.fuelType?.message} {...register('fuelType')}>
              <option value="Diesel">Diesel</option>
              <option value="CNG">CNG</option>
              <option value="Electric">Electric</option>
              <option value="Petrol">Petrol</option>
            </Select>
            <Input
              label="Current Odometer (km)"
              type="number"
              placeholder="e.g. 45000"
              error={errors.currentOdometer?.message}
              {...register('currentOdometer')}
            />
          </div>

          <Select label="Operational Status" error={errors.status?.message} {...register('status')}>
            <option value="1">Available</option>
            <option value="2">Assigned</option>
            <option value="3">In Transit</option>
            <option value="4">Maintenance</option>
            <option value="5">Inactive</option>
          </Select>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {selectedVehicle ? 'Update Vehicle' : 'Register Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Vehicle Details Drawer/Modal */}
      {vehicleDetail && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Vehicle ${vehicleDetail.vehicleNumber}`}
          description={`${vehicleDetail.make} ${vehicleDetail.model} (${vehicleDetail.year})`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Type</span>
                <span className="font-semibold text-slate-800">{vehicleDetail.vehicleType}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Capacity</span>
                <span className="font-semibold text-slate-800">{vehicleDetail.capacity} Tons</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Fuel / Odo</span>
                <span className="font-semibold text-slate-800">
                  {vehicleDetail.fuelType} • {vehicleDetail.currentOdometer.toLocaleString()} km
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Status</span>
                <span className="mt-0.5 inline-block">
                  {getStatusBadge(vehicleDetail.status, vehicleDetail.statusName)}
                </span>
              </div>
            </div>

            {/* Compliance Documents Tab */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                <span>Vehicle Documents ({vehicleDetail.documents.length})</span>
              </h4>
              {vehicleDetail.documents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No documents uploaded for this vehicle.</p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  {vehicleDetail.documents.map((doc) => {
                    const isExpired = doc.expiryStatus === 'Expired';
                    const isSoon = doc.expiryStatus === 'ExpiringSoon';
                    return (
                      <div key={doc.id} className="p-3 bg-white flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            {doc.documentTypeName} - {doc.documentNumber}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          {isExpired ? (
                            <Badge variant="danger" size="sm">Expired</Badge>
                          ) : isSoon ? (
                            <Badge variant="warning" size="sm">Expiring Soon</Badge>
                          ) : (
                            <Badge variant="success" size="sm">Valid</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Assignments History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Recent Dispatch Assignments ({vehicleDetail.recentAssignments.length})
              </h4>
              {vehicleDetail.recentAssignments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No previous dispatch assignments recorded.</p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  {vehicleDetail.recentAssignments.map((a) => (
                    <div key={a.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {a.shipmentNumber} ({a.trackingNumber})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Driver: {a.driverName} • Assigned: {new Date(a.assignedDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        {a.isActive ? (
                          <Badge variant="info" size="sm">Active Trip</Badge>
                        ) : (
                          <Badge variant="default" size="sm">Completed</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Deactivate Vehicle"
        message={`Are you sure you want to deactivate vehicle ${selectedVehicle?.vehicleNumber}? It will be marked inactive and cannot be dispatched.`}
        confirmText="Deactivate"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default VehiclesPage;
