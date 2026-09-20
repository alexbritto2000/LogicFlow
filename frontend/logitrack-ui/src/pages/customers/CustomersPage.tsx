import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Edit2, Trash2, Eye, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { customerService, Customer, CustomerDetail } from '../../services/customer.service';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

const customerSchema = z.object({
  customerCode: z.string().optional(),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  contactPerson: z.string().min(2, 'Contact person is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email address is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(4, 'Pincode is required'),
  gstNumber: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | undefined>('id');
  const [isAscending, setIsAscending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await customerService.getCustomers({
        pageNumber,
        pageSize,
        search,
        sortBy,
        isAscending,
      });
      if (res.success && res.data) {
        setCustomers(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } catch {
      toastError('Error', 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, search, sortBy, isAscending, toastError]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    reset({
      customerCode: '',
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstNumber: '',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setValue('customerCode', customer.customerCode);
    setValue('companyName', customer.companyName);
    setValue('contactPerson', customer.contactPerson);
    setValue('phone', customer.phone);
    setValue('email', customer.email);
    setValue('address', customer.address);
    setValue('city', customer.city);
    setValue('state', customer.state);
    setValue('pincode', customer.pincode);
    setValue('gstNumber', customer.gstNumber || '');
    setIsFormModalOpen(true);
  };

  const handleViewDetail = async (customer: Customer) => {
    try {
      const res = await customerService.getCustomerById(customer.id);
      if (res.success && res.data) {
        setCustomerDetail(res.data);
        setIsDetailModalOpen(true);
      }
    } catch {
      toastError('Error', 'Unable to retrieve customer details');
    }
  };

  const handleOpenDelete = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setIsConfirmOpen(true);
  };

  const onFormSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      if (selectedCustomer) {
        const res = await customerService.updateCustomer(selectedCustomer.id, data);
        if (res.success) {
          success('Customer Updated', `${data.companyName} has been updated.`);
          setIsFormModalOpen(false);
          fetchCustomers();
        } else {
          toastError('Update Failed', res.message);
        }
      } else {
        const res = await customerService.createCustomer(data);
        if (res.success) {
          success('Customer Created', `${data.companyName} has been registered.`);
          setIsFormModalOpen(false);
          fetchCustomers();
        } else {
          toastError('Creation Failed', res.message);
        }
      }
    } catch (err: any) {
      toastError('Operation Failed', err.response?.data?.message || 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    try {
      const res = await customerService.deleteCustomer(selectedCustomer.id);
      if (res.success) {
        success('Customer Deactivated', `${selectedCustomer.companyName} deactivated.`);
        setIsConfirmOpen(false);
        fetchCustomers();
      }
    } catch {
      toastError('Error', 'Could not deactivate customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Customer>[] = [
    {
      header: 'Customer Code',
      accessor: 'customerCode',
      sortable: true,
      sortBy: 'customercode',
      render: (c) => (
        <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
          {c.customerCode}
        </span>
      ),
    },
    {
      header: 'Company & Contact',
      sortable: true,
      sortBy: 'companyname',
      render: (c) => (
        <div>
          <p className="font-semibold text-slate-900">{c.companyName}</p>
          <p className="text-[11px] text-slate-500">{c.contactPerson}</p>
        </div>
      ),
    },
    {
      header: 'Phone / Email',
      render: (c) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{c.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Mail className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[150px]">{c.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Location',
      sortable: true,
      sortBy: 'city',
      render: (c) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span>
            {c.city}, {c.state}
          </span>
        </div>
      ),
    },
    {
      header: 'Bookings',
      render: (c) => (
        <Badge variant="purple" size="sm">
          {c.totalBookings} orders
        </Badge>
      ),
    },
    {
      header: 'Status',
      render: (c) => (
        <Badge variant={c.isActive ? 'success' : 'danger'} size="sm">
          {c.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleViewDetail(c)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleOpenEdit(c, e)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleOpenDelete(c, e)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
            title="Deactivate Customer"
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage corporate shippers, billing details, and booking histories.
          </p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={customers}
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
        searchPlaceholder="Search customer, contact, city, phone..."
        onRowClick={handleViewDetail}
        actionButton={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreate}
          >
            Add Customer
          </Button>
        }
      />

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
        description="Provide shipper corporate identity, billing address, and contact details."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              placeholder="e.g. ABC Cargo Pvt Ltd"
              error={errors.companyName?.message}
              {...register('companyName')}
            />
            <Input
              label="Contact Person"
              placeholder="e.g. Arun Ramanathan"
              error={errors.contactPerson?.message}
              {...register('contactPerson')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              placeholder="e.g. +91 94440 12345"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. arun@abclogistics.example"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <Input
            label="Street Address"
            placeholder="e.g. Plot 12, Guindy Industrial Area"
            error={errors.address?.message}
            {...register('address')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="City"
              placeholder="e.g. Chennai"
              error={errors.city?.message}
              {...register('city')}
            />
            <Input
              label="State"
              placeholder="e.g. Tamil Nadu"
              error={errors.state?.message}
              {...register('state')}
            />
            <Input
              label="Pincode"
              placeholder="e.g. 600032"
              error={errors.pincode?.message}
              {...register('pincode')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GST Number (Optional)"
              placeholder="e.g. 33AAAAA0000A1Z5"
              error={errors.gstNumber?.message}
              {...register('gstNumber')}
            />
            <Input
              label="Custom Code (Optional)"
              placeholder="Auto-generated if blank"
              error={errors.customerCode?.message}
              {...register('customerCode')}
            />
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
              {selectedCustomer ? 'Update Customer' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Details Drawer/Modal */}
      {customerDetail && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={customerDetail.companyName}
          description={`Customer Code: ${customerDetail.customerCode}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Contact Person</span>
                <span className="font-semibold text-slate-800">{customerDetail.contactPerson}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Phone</span>
                <span className="font-semibold text-slate-800">{customerDetail.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Email</span>
                <span className="font-semibold text-slate-800 truncate block">{customerDetail.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">GSTIN</span>
                <span className="font-semibold text-slate-800">{customerDetail.gstNumber || 'N/A'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Billing Address</span>
                <span className="font-semibold text-slate-800">
                  {customerDetail.address}, {customerDetail.city}, {customerDetail.state} - {customerDetail.pincode}
                </span>
              </div>
            </div>

            {/* Recent Bookings History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Recent Bookings ({customerDetail.recentBookings.length})
              </h4>
              {customerDetail.recentBookings.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No bookings recorded for this customer yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  {customerDetail.recentBookings.map((b) => (
                    <div key={b.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 block">{b.bookingNumber}</span>
                        <span className="text-[11px] text-slate-500">
                          {b.originCity} → {b.destinationCity}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">₹{b.freightAmount.toLocaleString()}</span>
                        <span className="text-[10px] font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                          {b.status}
                        </span>
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
        title="Deactivate Customer"
        message={`Are you sure you want to deactivate ${selectedCustomer?.companyName}? They will no longer appear in new booking picklists.`}
        confirmText="Deactivate"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default CustomersPage;
