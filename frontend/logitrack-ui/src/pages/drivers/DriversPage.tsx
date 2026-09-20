import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Edit2, Trash2, Eye, UserCheck, Phone, Mail, Award, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { driverService, Driver, DriverDetail } from '../../services/driver.service';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

const driverSchema = z.object({
  driverCode: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5, 'Address is required'),
  drivingLicenseNumber: z.string().min(5, 'Driving license number is required'),
  licenseExpiryDate: z.string().min(1, 'License expiry date is required'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  status: z.coerce.number(),
});

type DriverFormData = z.infer<typeof driverSchema>;

export const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
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
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverDetail, setDriverDetail] = useState<DriverDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
  });

  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await driverService.getDrivers({
        pageNumber,
        pageSize,
        search,
        status: statusFilter,
        sortBy,
        isAscending,
      });
      if (res.success && res.data) {
        setDrivers(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } catch {
      toastError('Error', 'Failed to load drivers');
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, search, statusFilter, sortBy, isAscending, toastError]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleOpenCreate = () => {
    setSelectedDriver(null);
    reset({
      driverCode: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      drivingLicenseNumber: '',
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      joiningDate: new Date().toISOString().split('T')[0],
      status: 1, // Available
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (driver: Driver, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDriver(driver);
    setValue('driverCode', driver.driverCode);
    setValue('name', driver.name);
    setValue('phone', driver.phone);
    setValue('email', driver.email || '');
    setValue('address', driver.address);
    setValue('drivingLicenseNumber', driver.drivingLicenseNumber);
    setValue('licenseExpiryDate', driver.licenseExpiryDate.split('T')[0]);
    setValue('joiningDate', driver.joiningDate.split('T')[0]);
    setValue('status', driver.status);
    setIsFormModalOpen(true);
  };

  const handleViewDetail = async (driver: Driver) => {
    try {
      const res = await driverService.getDriverById(driver.id);
      if (res.success && res.data) {
        setDriverDetail(res.data);
        setIsDetailModalOpen(true);
      }
    } catch {
      toastError('Error', 'Unable to retrieve driver details');
    }
  };

  const handleOpenDelete = (driver: Driver, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDriver(driver);
    setIsConfirmOpen(true);
  };

  const onFormSubmit = async (data: DriverFormData) => {
    setIsSubmitting(true);
    try {
      if (selectedDriver) {
        const res = await driverService.updateDriver(selectedDriver.id, data);
        if (res.success) {
          success('Driver Updated', `${data.name} has been updated.`);
          setIsFormModalOpen(false);
          fetchDrivers();
        } else {
          toastError('Update Failed', res.message);
        }
      } else {
        const res = await driverService.createDriver(data);
        if (res.success) {
          success('Driver Created', `${data.name} registered into system.`);
          setIsFormModalOpen(false);
          fetchDrivers();
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
    if (!selectedDriver) return;
    setIsSubmitting(true);
    try {
      const res = await driverService.deleteDriver(selectedDriver.id);
      if (res.success) {
        success('Driver Deactivated', `${selectedDriver.name} marked as inactive.`);
        setIsConfirmOpen(false);
        fetchDrivers();
      }
    } catch {
      toastError('Error', 'Could not deactivate driver.');
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
      case 3: // OnLeave
        return <Badge variant="warning" size="sm">On Leave</Badge>;
      case 4: // Inactive
      default:
        return <Badge variant="danger" size="sm">{name || 'Inactive'}</Badge>;
    }
  };

  const getExpiryBadge = (status: string, date: string) => {
    const formatted = new Date(date).toLocaleDateString();
    if (status === 'Expired') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-500" /> Expired ({formatted})
        </span>
      );
    }
    if (status === 'ExpiringSoon') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-500" /> Renew Soon ({formatted})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Valid ({formatted})
      </span>
    );
  };

  const columns: Column<Driver>[] = [
    {
      header: 'Driver Code',
      accessor: 'driverCode',
      sortable: true,
      sortBy: 'drivercode',
      render: (d) => (
        <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
          {d.driverCode}
        </span>
      ),
    },
    {
      header: 'Driver Name',
      sortable: true,
      sortBy: 'name',
      render: (d) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
            {d.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{d.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">DL: {d.drivingLicenseNumber}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      render: (d) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{d.phone}</span>
          </div>
          {d.email && (
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Mail className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[130px]">{d.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'License Expiry',
      sortable: true,
      sortBy: 'licenseexpiry',
      render: (d) => getExpiryBadge(d.licenseExpiryStatus, d.licenseExpiryDate),
    },
    {
      header: 'Status',
      sortable: true,
      sortBy: 'status',
      render: (d) => getStatusBadge(d.status, d.statusName),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleViewDetail(d)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleOpenEdit(d, e)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
            title="Edit Driver"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleOpenDelete(d, e)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
            title="Deactivate Driver"
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Driver Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage transport drivers, commercial driving licenses, compliance, and active duties.
          </p>
        </div>
      </div>

      {/* Filter bar & Data Table */}
      <DataTable
        columns={columns}
        data={drivers}
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
        searchPlaceholder="Search driver name, code, phone, license..."
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
              aria-label="Filter drivers by status"
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">All Statuses</option>
              <option value="1">Available</option>
              <option value="2">Assigned</option>
              <option value="3">On Leave</option>
              <option value="4">Inactive</option>
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
            Add Driver
          </Button>
        }
      />

      {/* Add / Edit Driver Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedDriver ? 'Edit Driver' : 'Add New Driver'}
        description="Register commercial driver credentials, license numbers, and emergency contact details."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Rajesh Kumar"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Phone Number"
              placeholder="e.g. +91 98765 43210"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address (Optional)"
              type="email"
              placeholder="e.g. rajesh@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Driver Code (Optional)"
              placeholder="Auto-generated if blank"
              error={errors.driverCode?.message}
              {...register('driverCode')}
            />
          </div>

          <Input
            label="Residential Address"
            placeholder="e.g. 23 Gandhi Street, Saidapet, Chennai"
            error={errors.address?.message}
            {...register('address')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Driving License Number"
              placeholder="e.g. DL-01-2015-001234"
              error={errors.drivingLicenseNumber?.message}
              {...register('drivingLicenseNumber')}
            />
            <Input
              label="License Expiry Date"
              type="date"
              error={errors.licenseExpiryDate?.message}
              {...register('licenseExpiryDate')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Joining Date"
              type="date"
              error={errors.joiningDate?.message}
              {...register('joiningDate')}
            />
            <Select label="Status" error={errors.status?.message} {...register('status')}>
              <option value="1">Available</option>
              <option value="2">Assigned</option>
              <option value="3">On Leave</option>
              <option value="4">Inactive</option>
            </Select>
          </div>

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
              {selectedDriver ? 'Update Driver' : 'Register Driver'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Driver Details Drawer/Modal */}
      {driverDetail && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Driver: ${driverDetail.name}`}
          description={`Code: ${driverDetail.driverCode}`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Contact</span>
                <span className="font-semibold text-slate-800 block">{driverDetail.phone}</span>
                <span className="text-[11px] text-slate-500">{driverDetail.email || 'No email registered'}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">License Number</span>
                <span className="font-semibold text-slate-800 font-mono block">{driverDetail.drivingLicenseNumber}</span>
                <span className="mt-1 block">{getExpiryBadge(driverDetail.licenseExpiryStatus, driverDetail.licenseExpiryDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Duty Status</span>
                <span className="mt-1 inline-block">{getStatusBadge(driverDetail.status, driverDetail.statusName)}</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Address</span>
                <span className="font-semibold text-slate-800">{driverDetail.address}</span>
              </div>
            </div>

            {/* Compliance Documents */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Driver Documents ({driverDetail.documents.length})
              </h4>
              {driverDetail.documents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No additional driver verification files uploaded.</p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  {driverDetail.documents.map((doc) => (
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
                        {doc.expiryStatus === 'Expired' ? (
                          <Badge variant="danger" size="sm">Expired</Badge>
                        ) : doc.expiryStatus === 'ExpiringSoon' ? (
                          <Badge variant="warning" size="sm">Expiring Soon</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Valid</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Trips */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Recent Assigned Trips ({driverDetail.recentAssignments.length})
              </h4>
              {driverDetail.recentAssignments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No previous shipment trips assigned.</p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  {driverDetail.recentAssignments.map((a) => (
                    <div key={a.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {a.shipmentNumber} ({a.trackingNumber})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Truck: {a.vehicleNumber} • Date: {new Date(a.assignedDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        {a.isActive ? (
                          <Badge variant="info" size="sm">On Duty</Badge>
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
        title="Deactivate Driver"
        message={`Are you sure you want to deactivate driver ${selectedDriver?.name}? They will no longer be eligible for dispatch assignments.`}
        confirmText="Deactivate"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default DriversPage;
