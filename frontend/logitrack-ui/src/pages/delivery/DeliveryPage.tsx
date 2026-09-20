import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  FileCheck,
  Truck,
  UserCheck,
  MapPin,
  Plus,
  Eye,
  ShieldCheck,
  Building2,
  Clock,
  Download,
  AlertCircle
} from 'lucide-react';
import { deliveryService, Delivery } from '../../services/delivery.service';
import { shipmentService, Shipment } from '../../services/shipment.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Card, CardContent } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { useToast } from '../../context/ToastContext';

export const DeliveryPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Stats
  const [totalDelivered, setTotalDelivered] = useState(0);
  const [podCount, setPodCount] = useState(0);
  const [pendingShipmentsCount, setPendingShipmentsCount] = useState(0);

  // Record Delivery Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [activeShipments, setActiveShipments] = useState<Shipment[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 16));
  const [deliveryRemarks, setDeliveryRemarks] = useState('');
  const [podFile, setPodFile] = useState<File | null>(null);
  const [podPreviewUrl, setPodPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View POD / Detail Modal
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { success, error: toastError } = useToast();

  const loadDeliveries = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await deliveryService.getDeliveries({
        pageNumber,
        pageSize,
        search: search || undefined,
      });
      setDeliveries(res.items);
      setTotalCount(res.totalCount);
      setTotalDelivered(res.totalCount);
      const withPod = res.items.filter((d) => !!d.proofOfDeliveryFile).length;
      setPodCount(withPod);
    } catch {
      toastError('Error', 'Failed to load delivery records');
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, search, toastError]);

  const loadPendingShipments = async () => {
    try {
      const res = await shipmentService.getShipments({ pageSize: 50 });
      if (res.success && res.data) {
        // Shipments eligible for delivery: not delivered (6) and not cancelled (7)
        const pending = res.data.items.filter((s) => s.currentStatus !== 6 && s.currentStatus !== 7);
        setActiveShipments(pending);
        setPendingShipmentsCount(pending.length);
      }
    } catch {
      // silently handle
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  useEffect(() => {
    loadPendingShipments();
  }, []);

  const handleOpenRecordModal = () => {
    loadPendingShipments();
    setSelectedShipmentId('');
    setReceiverName('');
    setReceiverPhone('');
    setDeliveryDate(new Date().toISOString().slice(0, 16));
    setDeliveryRemarks('');
    setPodFile(null);
    setPodPreviewUrl(null);
    setIsRecordModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toastError('File Too Large', 'Maximum file size allowed is 10 MB.');
        return;
      }
      setPodFile(file);
      if (file.type.startsWith('image/')) {
        setPodPreviewUrl(URL.createObjectURL(file));
      } else {
        setPodPreviewUrl(null);
      }
    }
  };

  const handleRecordDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentId) {
      toastError('Validation', 'Please select a shipment to deliver.');
      return;
    }
    if (!receiverName.trim()) {
      toastError('Validation', 'Receiver Name is required.');
      return;
    }
    if (!receiverPhone.trim()) {
      toastError('Validation', 'Receiver Phone number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ShipmentId', selectedShipmentId);
      formData.append('ReceiverName', receiverName.trim());
      formData.append('ReceiverPhone', receiverPhone.trim());
      formData.append('DeliveryDate', new Date(deliveryDate).toISOString());
      if (deliveryRemarks.trim()) {
        formData.append('DeliveryRemarks', deliveryRemarks.trim());
      }
      if (podFile) {
        formData.append('ProofOfDeliveryFile', podFile);
      }

      await deliveryService.recordDelivery(formData);
      success('Delivery Confirmed', 'Shipment status updated to Delivered and fleet assets released.');
      setIsRecordModalOpen(false);
      loadDeliveries();
      loadPendingShipments();
    } catch (err: any) {
      toastError('Failed to record delivery', err.response?.data?.message || 'Server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Delivery>[] = [
    {
      header: 'Shipment / Tracking',
      render: (d) => (
        <div>
          <div className="font-semibold text-slate-900">{d.shipmentNumber}</div>
          <div className="text-xs text-brand-600 font-mono flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3 h-3" />
            {d.trackingNumber}
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      render: (d) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-800">{d.customerName}</span>
        </div>
      ),
    },
    {
      header: 'Route',
      render: (d) => (
        <div className="text-xs">
          <div className="text-slate-500">From: {d.origin}</div>
          <div className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            To: {d.destination}
          </div>
        </div>
      ),
    },
    {
      header: 'Receiver',
      render: (d) => (
        <div>
          <div className="font-medium text-slate-900">{d.receiverName}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            Phone: {d.receiverPhone}
          </div>
        </div>
      ),
    },
    {
      header: 'Delivered At',
      render: (d) => (
        <div className="text-xs text-slate-600">
          <div className="font-medium text-slate-800">{new Date(d.deliveryDate).toLocaleDateString()}</div>
          <div className="text-slate-400">{new Date(d.deliveryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      ),
    },
    {
      header: 'Delivered By Fleet',
      render: (d) => (
        <div className="text-xs">
          {d.vehicleNumber ? (
            <div className="flex items-center gap-1 text-slate-800 font-medium">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              {d.vehicleNumber}
            </div>
          ) : (
            <span className="text-slate-400">No Vehicle</span>
          )}
          {d.driverName && (
            <div className="flex items-center gap-1 text-slate-500 mt-0.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              {d.driverName}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'POD Proof',
      render: (d) => (
        <div>
          {d.proofOfDeliveryFile ? (
            <a
              href={`http://localhost:5000/uploads/${d.proofOfDeliveryFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              View POD
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-slate-400 bg-slate-100">
              No Document
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (d) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedDelivery(d);
            setIsDetailModalOpen(true);
          }}
          className="flex items-center gap-1 text-xs"
        >
          <Eye className="w-3.5 h-3.5" />
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deliveries & Proof of Delivery (POD)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Confirm customer delivery, capture receiver details, upload signed POD, and automatically release vehicles and drivers.
          </p>
        </div>
        <Button onClick={handleOpenRecordModal} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Record Delivery
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Confirmed Deliveries</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalDelivered}</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Successfully fulfilled
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">PODs Attached</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{podCount}</h3>
              <p className="text-[11px] text-blue-600 mt-0.5 flex items-center gap-1">
                <FileCheck className="w-3 h-3" /> Signed & archived
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Pending Shipments</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingShipmentsCount}</h3>
              <p className="text-[11px] text-amber-600 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> In transit / out for delivery
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries Table */}
      <DataTable<Delivery>
        columns={columns}
        data={deliveries}
        totalCount={totalCount}
        pageNumber={pageNumber}
        pageSize={pageSize}
        onPageChange={setPageNumber}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        isLoading={isLoading}
        searchPlaceholder="Search shipment, tracking, receiver..."
        emptyTitle="No deliveries recorded yet"
        emptyDescription="Record your first delivery when a shipment reaches its final destination."
      />

      {/* Record Delivery Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Delivery & Proof of Delivery (POD)"
        maxWidth="lg"
      >
        <form onSubmit={handleRecordDelivery} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Shipment to Deliver *
            </label>
            <select
              value={selectedShipmentId}
              onChange={(e) => setSelectedShipmentId(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            >
              <option value="">-- Choose Shipment --</option>
              {activeShipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shipmentNumber} ({s.trackingNumber}) - {s.customerName} | Dest: {s.destination} [{s.statusName}]
                </option>
              ))}
            </select>
            {activeShipments.length === 0 && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> No active pending shipments available for delivery.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Receiver Name *
              </label>
              <Input
                placeholder="Full name of person who received cargo"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Receiver Phone *
              </label>
              <Input
                placeholder="Mobile number of receiver"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Delivery Date & Time *
              </label>
              <Input
                type="datetime-local"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Signed POD Document (Image / PDF)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">Accepts JPG, PNG, WEBP, or PDF (Max 10 MB)</p>
            </div>
          </div>

          {podPreviewUrl && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs font-medium text-slate-600 mb-2">POD Image Preview:</p>
              <img
                src={podPreviewUrl}
                alt="POD Preview"
                className="h-40 object-contain rounded border border-slate-200 bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Delivery Remarks / Condition Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Received in sound condition, stamp affixed, unboxed in good order."
              value={deliveryRemarks}
              onChange={(e) => setDeliveryRemarks(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 p-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-800">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Automatic Asset Release:</span> Confirming this delivery will
              automatically transition this shipment to <strong>Delivered</strong> and immediately release the assigned
              vehicle and driver back to <strong>Available</strong> status for next dispatches.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || activeShipments.length === 0}>
              Confirm Delivery & Release Fleet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delivery Details & POD Viewer Modal */}
      {selectedDelivery && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Delivery Details - ${selectedDelivery.shipmentNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block">Tracking Number</span>
                <span className="font-mono font-bold text-slate-800">{selectedDelivery.trackingNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Customer</span>
                <span className="font-semibold text-slate-800">{selectedDelivery.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Origin</span>
                <span className="text-slate-700">{selectedDelivery.origin}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Destination</span>
                <span className="text-slate-700 font-semibold">{selectedDelivery.destination}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
                  <UserCheck className="w-4 h-4 text-emerald-600" /> Receiver Information
                </h4>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Receiver Name:</span>
                  <span className="font-medium text-slate-800">{selectedDelivery.receiverName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Receiver Phone:</span>
                  <span className="font-medium text-slate-800">{selectedDelivery.receiverPhone}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Delivered On:</span>
                  <span className="font-medium text-slate-800">{new Date(selectedDelivery.deliveryDate).toLocaleString()}</span>
                </div>
                {selectedDelivery.deliveredBy && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recorded By User:</span>
                    <span className="font-medium text-slate-800">{selectedDelivery.deliveredBy}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
                  <Truck className="w-4 h-4 text-blue-600" /> Fleet Assignment at Delivery
                </h4>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Vehicle Number:</span>
                  <span className="font-medium text-slate-800">{selectedDelivery.vehicleNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Driver Name:</span>
                  <span className="font-medium text-slate-800">{selectedDelivery.driverName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fleet Status:</span>
                  <span className="font-medium text-emerald-600">Released to Available</span>
                </div>
              </div>
            </div>

            {selectedDelivery.deliveryRemarks && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700 block mb-1">Remarks & Observations:</span>
                <p className="text-slate-600 italic">{selectedDelivery.deliveryRemarks}</p>
              </div>
            )}

            {/* POD Document Display */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
              <h4 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" /> Signed Proof of Delivery (POD)
              </h4>
              {selectedDelivery.proofOfDeliveryFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-mono">
                      File: {selectedDelivery.proofOfDeliveryFile}
                    </span>
                    <a
                      href={`http://localhost:5000/uploads/${selectedDelivery.proofOfDeliveryFile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Original
                    </a>
                  </div>
                  {/* Inline preview if image */}
                  <div className="bg-white p-2 border border-slate-200 rounded-lg flex items-center justify-center">
                    <img
                      src={`http://localhost:5000/uploads/${selectedDelivery.proofOfDeliveryFile}`}
                      alt="Proof of Delivery Document"
                      className="max-h-72 object-contain rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                  No physical POD document uploaded for this delivery.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DeliveryPage;
