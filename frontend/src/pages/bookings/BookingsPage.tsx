import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus,
  Eye,
  CalendarCheck,
  MapPin,
  Package,
  Calendar,
  IndianRupee,
  XCircle,
  Truck,
} from 'lucide-react';
import { bookingService, Booking, BookingDetail } from '../../services/booking.service';
import { customerService, Customer } from '../../services/customer.service';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

const bookingSchema = z.object({
  customerId: z.coerce.number().min(1, 'Please select a customer'),
  pickupAddress: z.string().min(5, 'Pickup address is required'),
  pickupCity: z.string().min(2, 'Pickup city is required'),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
  deliveryCity: z.string().min(2, 'Delivery city is required'),
  pickupDate: z.string().min(1, 'Pickup date is required'),
  expectedDeliveryDate: z.string().min(1, 'Expected delivery date is required'),
  cargoDescription: z.string().min(3, 'Cargo description is required'),
  cargoWeight: z.coerce.number().min(1, 'Weight must be at least 1 kg'),
  numberOfPackages: z.coerce.number().min(1, 'Packages count must be at least 1'),
  freightAmount: z.coerce.number().min(0, 'Freight amount must be positive'),
  paymentType: z.string(),
  specialInstructions: z.string().optional(),
  autoCreateShipment: z.boolean(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string | undefined>('id');
  const [isAscending, setIsAscending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      pickupDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentType: 'Prepaid',
      autoCreateShipment: true,
      cargoWeight: 500,
      numberOfPackages: 10,
      freightAmount: 15000,
    },
  });

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await bookingService.getBookings({
        pageNumber,
        pageSize,
        search,
        status: statusFilter,
        sortBy,
        isAscending,
      });
      if (res.success && res.data) {
        setBookings(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } catch {
      toastError('Error', 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, search, statusFilter, sortBy, isAscending, toastError]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const openCreateModal = async () => {
    try {
      const res = await customerService.getCustomers({ pageSize: 100, isActive: true });
      if (res.success && res.data) {
        setCustomers(res.data.items);
      }
      reset();
      setIsCreateModalOpen(true);
    } catch {
      toastError('Error', 'Failed to load customers for booking form');
    }
  };

  const handleViewDetail = async (booking: Booking) => {
    try {
      const res = await bookingService.getBookingById(booking.id);
      if (res.success && res.data) {
        setBookingDetail(res.data);
        setIsDetailModalOpen(true);
      }
    } catch {
      toastError('Error', 'Unable to retrieve booking details');
    }
  };

  const handleOpenCancel = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setIsCancelConfirmOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedBooking) return;
    setIsSubmitting(true);
    try {
      const res = await bookingService.cancelBooking(selectedBooking.id);
      if (res.success) {
        success('Booking Cancelled', `${selectedBooking.bookingNumber} has been cancelled.`);
        setIsCancelConfirmOpen(false);
        fetchBookings();
      } else {
        toastError('Cancellation Failed', res.message);
      }
    } catch {
      toastError('Error', 'Could not cancel booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFormSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    try {
      const res = await bookingService.createBooking(data);
      if (res.success) {
        success('Booking Created', `${res.data?.bookingNumber} successfully created.`);
        setIsCreateModalOpen(false);
        fetchBookings();
      } else {
        toastError('Creation Failed', res.message);
      }
    } catch (err: any) {
      toastError('Creation Error', err.response?.data?.message || 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: number, name: string) => {
    switch (status) {
      case 1: // Draft
        return <Badge variant="default" size="sm">Draft</Badge>;
      case 2: // Confirmed
        return <Badge variant="info" size="sm">Confirmed</Badge>;
      case 3: // Assigned
        return <Badge variant="purple" size="sm">Assigned</Badge>;
      case 4: // PickedUp
        return <Badge variant="purple" size="sm">Picked Up</Badge>;
      case 5: // InTransit
        return <Badge variant="warning" size="sm">In Transit</Badge>;
      case 6: // OutForDelivery
        return <Badge variant="warning" size="sm">Out For Delivery</Badge>;
      case 7: // Delivered
        return <Badge variant="success" size="sm">Delivered</Badge>;
      case 8: // Cancelled
      default:
        return <Badge variant="danger" size="sm">{name || 'Cancelled'}</Badge>;
    }
  };

  const columns: Column<Booking>[] = [
    {
      header: 'Booking #',
      accessor: 'bookingNumber',
      sortable: true,
      sortBy: 'bookingnumber',
      render: (b) => (
        <span className="font-bold text-slate-900 font-mono tracking-wider bg-slate-100 px-2 py-0.5 rounded text-[11px]">
          {b.bookingNumber}
        </span>
      ),
    },
    {
      header: 'Customer',
      render: (b) => (
        <div>
          <p className="font-semibold text-slate-900">{b.customerName}</p>
          <p className="text-[11px] text-slate-400 font-mono">{b.customerCode}</p>
        </div>
      ),
    },
    {
      header: 'Route',
      render: (b) => (
        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>{b.pickupCity} → {b.deliveryCity}</span>
        </div>
      ),
    },
    {
      header: 'Cargo',
      render: (b) => (
        <div>
          <p className="text-slate-800 font-medium truncate max-w-[160px]">{b.cargoDescription}</p>
          <p className="text-[11px] text-slate-400">
            {b.cargoWeight.toLocaleString()} kg • {b.numberOfPackages} pkgs
          </p>
        </div>
      ),
    },
    {
      header: 'Freight',
      sortable: true,
      sortBy: 'freightamount',
      render: (b) => (
        <div>
          <span className="font-bold text-slate-900">₹{b.freightAmount.toLocaleString()}</span>
          <span className="block text-[10px] text-slate-400 uppercase font-semibold">{b.paymentType}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      sortable: true,
      sortBy: 'status',
      render: (b) => getStatusBadge(b.status, b.statusName),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleViewDetail(b)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {b.status !== 7 && b.status !== 8 && (
            <button
              onClick={(e) => handleOpenCancel(b, e)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
              title="Cancel Booking"
            >
              <XCircle className="w-4 h-4" />
            </button>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cargo Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Book freight orders, specify pickup & destination points, and create automated shipments.
          </p>
        </div>
      </div>

      {/* Filter bar & Data Table */}
      <DataTable
        columns={columns}
        data={bookings}
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
        searchPlaceholder="Search booking number, customer, city, cargo..."
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
              aria-label="Filter bookings by status"
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">All Statuses</option>
              <option value="2">Confirmed</option>
              <option value="3">Assigned</option>
              <option value="4">Picked Up</option>
              <option value="5">In Transit</option>
              <option value="6">Out For Delivery</option>
              <option value="7">Delivered</option>
              <option value="8">Cancelled</option>
            </select>
          </div>
        }
        actionButton={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openCreateModal}
          >
            Create Booking
          </Button>
        }
      />

      {/* Create Booking Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Freight Booking"
        description="Book a new consignment with pickup/delivery dates and automatic shipment generation."
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <Select
            label="Select Shipper / Customer"
            error={errors.customerId?.message}
            {...register('customerId')}
          >
            <option value="">-- Choose Customer --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName} ({c.customerCode}) - {c.city}
              </option>
            ))}
          </Select>

          {/* Pickup Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Pickup Address"
                placeholder="e.g. Warehouse 4, Guindy Industrial Area"
                error={errors.pickupAddress?.message}
                {...register('pickupAddress')}
              />
            </div>
            <Input
              label="Pickup City"
              placeholder="e.g. Chennai"
              error={errors.pickupCity?.message}
              {...register('pickupCity')}
            />
          </div>

          {/* Delivery Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Delivery Address"
                placeholder="e.g. Plot 19, Electronic City Phase 1"
                error={errors.deliveryAddress?.message}
                {...register('deliveryAddress')}
              />
            </div>
            <Input
              label="Delivery City"
              placeholder="e.g. Bangalore"
              error={errors.deliveryCity?.message}
              {...register('deliveryCity')}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Pickup Date"
              type="date"
              error={errors.pickupDate?.message}
              {...register('pickupDate')}
            />
            <Input
              label="Expected Delivery Date"
              type="date"
              error={errors.expectedDeliveryDate?.message}
              {...register('expectedDeliveryDate')}
            />
          </div>

          {/* Cargo Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Cargo Description"
                placeholder="e.g. Automotive components & gearboxes"
                error={errors.cargoDescription?.message}
                {...register('cargoDescription')}
              />
            </div>
            <Input
              label="Cargo Weight (kg)"
              type="number"
              placeholder="e.g. 1500"
              error={errors.cargoWeight?.message}
              {...register('cargoWeight')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Number of Packages"
              type="number"
              placeholder="e.g. 25"
              error={errors.numberOfPackages?.message}
              {...register('numberOfPackages')}
            />
            <Input
              label="Freight Amount (₹)"
              type="number"
              placeholder="e.g. 18500"
              error={errors.freightAmount?.message}
              {...register('freightAmount')}
            />
            <Select label="Payment Type" error={errors.paymentType?.message} {...register('paymentType')}>
              <option value="Prepaid">Prepaid</option>
              <option value="ToPay">ToPay (Collect on Delivery)</option>
              <option value="Credit">Credit Billing (Monthly)</option>
            </Select>
          </div>

          <Input
            label="Special Handling Instructions (Optional)"
            placeholder="e.g. Handle with care, fragile glass parts, keep upright"
            error={errors.specialInstructions?.message}
            {...register('specialInstructions')}
          />

          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3">
            <input
              id="autoShipment"
              type="checkbox"
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              {...register('autoCreateShipment')}
            />
            <label htmlFor="autoShipment" className="text-xs font-semibold text-teal-900 cursor-pointer">
              Automatically generate shipment and tracking number (LT-YYYY-XXXXXX)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>

      {/* Booking Details Modal */}
      {bookingDetail && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Booking ${bookingDetail.bookingNumber}`}
          description={`Customer: ${bookingDetail.customerName} (${bookingDetail.customerCode})`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {/* Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Booking Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(bookingDetail.bookingDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Freight Amount</span>
                <span className="font-bold text-slate-900 text-sm">₹{bookingDetail.freightAmount.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 block">({bookingDetail.paymentType})</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Weight / Pkgs</span>
                <span className="font-semibold text-slate-800">
                  {bookingDetail.cargoWeight} kg • {bookingDetail.numberOfPackages} pkgs
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Status</span>
                <span className="mt-1 inline-block">
                  {getStatusBadge(bookingDetail.status, bookingDetail.statusName)}
                </span>
              </div>
            </div>

            {/* Route Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] uppercase font-bold text-teal-600 block mb-1">Pickup Location</span>
                <p className="font-semibold text-slate-800">{bookingDetail.pickupAddress}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">City: {bookingDetail.pickupCity}</p>
                <p className="text-slate-500 text-[11px]">Date: {new Date(bookingDetail.pickupDate).toLocaleDateString()}</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-1">Delivery Destination</span>
                <p className="font-semibold text-slate-800">{bookingDetail.deliveryAddress}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">City: {bookingDetail.deliveryCity}</p>
                <p className="text-slate-500 text-[11px]">Expected: {new Date(bookingDetail.expectedDeliveryDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Associated Shipments */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Linked Shipments ({bookingDetail.shipments.length})
              </h4>
              {bookingDetail.shipments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No shipments linked to this booking yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  {bookingDetail.shipments.map((s) => (
                    <div key={s.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 block font-mono">{s.shipmentNumber}</span>
                        <span className="text-[11px] text-teal-600 font-bold font-mono">
                          Tracking: {s.trackingNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Location: {s.currentLocation}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full block mb-1">
                          {s.currentStatus}
                        </span>
                        {s.assignedVehicle && (
                          <span className="text-[10px] text-slate-500 block">
                            Truck: {s.assignedVehicle} • Driver: {s.assignedDriver}
                          </span>
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

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Booking"
        message={`Are you sure you want to cancel booking ${selectedBooking?.bookingNumber}?`}
        confirmText="Cancel Booking"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default BookingsPage;
