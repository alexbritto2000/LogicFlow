import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  UploadCloud,
  Download,
  Trash2,
  Truck,
  UserCheck,
  Calendar,
  Clock,
} from 'lucide-react';
import { documentService, DocumentItem, DocumentSummary } from '../../services/document.service';
import { vehicleService, Vehicle } from '../../services/vehicle.service';
import { driverService, Driver } from '../../services/driver.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';

export const DocumentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vehicle' | 'driver' | 'alerts'>('alerts');
  const [summary, setSummary] = useState<DocumentSummary>({
    expiredCount: 0,
    expiringIn7DaysCount: 0,
    expiringIn30DaysCount: 0,
    totalDocumentsCount: 0,
  });

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'Vehicle' | 'Driver'>('Vehicle');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [docType, setDocType] = useState<string>('1');
  const [docNumber, setDocNumber] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);

  const { success, error: toastError } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const summaryRes = await documentService.getSummary();
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }

      let docsRes;
      if (activeTab === 'alerts') {
        docsRes = await documentService.getExpiringDocuments(30);
      } else if (activeTab === 'vehicle') {
        docsRes = await documentService.getVehicleDocuments();
      } else {
        docsRes = await documentService.getDriverDocuments();
      }

      if (docsRes.success && docsRes.data) {
        setDocuments(docsRes.data);
      }
    } catch {
      toastError('Error', 'Failed to load document records');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openUploadModal = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        vehicleService.getVehicles({ pageSize: 100 }),
        driverService.getDrivers({ pageSize: 100 }),
      ]);
      if (vRes.success && vRes.data) setVehicles(vRes.data.items);
      if (dRes.success && dRes.data) setDrivers(dRes.data.items);

      if (vRes.data?.items.length) {
        setSelectedEntityId(vRes.data.items[0].id.toString());
      }

      setIsUploadModalOpen(true);
    } catch {
      toastError('Error', 'Could not prepare document upload');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toastError('Validation Error', 'Please select a document file (.pdf, .jpg, .png)');
      return;
    }
    if (!selectedEntityId || !docNumber) {
      toastError('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('documentNumber', docNumber);
      formData.append('documentType', docType);
      formData.append('issueDate', issueDate);
      formData.append('expiryDate', expiryDate);
      formData.append('remarks', remarks);
      formData.append('file', selectedFile);

      if (targetType === 'Vehicle') {
        formData.append('vehicleId', selectedEntityId);
        const res = await documentService.uploadVehicleDocument(formData);
        if (res.success) {
          success('Document Uploaded', 'Vehicle document saved successfully.');
          setIsUploadModalOpen(false);
          loadData();
        } else {
          toastError('Upload Failed', res.message);
        }
      } else {
        formData.append('driverId', selectedEntityId);
        const res = await documentService.uploadDriverDocument(formData);
        if (res.success) {
          success('Document Uploaded', 'Driver document saved successfully.');
          setIsUploadModalOpen(false);
          loadData();
        } else {
          toastError('Upload Failed', res.message);
        }
      }
    } catch (err: any) {
      toastError('Upload Error', err.response?.data?.message || 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    setIsSubmitting(true);
    try {
      const res =
        docToDelete.entityType === 'Vehicle'
          ? await documentService.deleteVehicleDocument(docToDelete.id)
          : await documentService.deleteDriverDocument(docToDelete.id);

      if (res.success) {
        success('Document Deleted', 'Document record removed.');
        setIsConfirmOpen(false);
        loadData();
      } else {
        toastError('Delete Failed', res.message);
      }
    } catch {
      toastError('Error', 'Unable to delete document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, daysUntil: number) => {
    if (status === 'Expired') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-500" /> Expired ({Math.abs(daysUntil)} days ago)
        </span>
      );
    }
    if (status === 'ExpiringSoon') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Expires in {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Valid ({daysUntil} days left)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance & Document Vault</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track statutory transport licenses, commercial insurance, fitness certificates, and pollution permits.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<UploadCloud className="w-4 h-4" />}
          onClick={openUploadModal}
        >
          Upload Document
        </Button>
      </div>

      {/* Expiry Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expired Card */}
        <Card className="border-rose-200 bg-rose-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-rose-700">Expired Documents</p>
              <h3 className="text-2xl font-extrabold text-rose-900 mt-1">{summary.expiredCount}</h3>
              <p className="text-[11px] text-rose-600 mt-0.5 font-medium">Requires immediate renewal</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Expiring in 7 Days */}
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-amber-700">Expiring in 7 Days</p>
              <h3 className="text-2xl font-extrabold text-amber-900 mt-1">{summary.expiringIn7DaysCount}</h3>
              <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Urgent action needed</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Expiring in 30 Days */}
        <Card className="border-sky-200 bg-sky-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-sky-700">Expiring in 30 Days</p>
              <h3 className="text-2xl font-extrabold text-sky-900 mt-1">{summary.expiringIn30DaysCount}</h3>
              <p className="text-[11px] text-sky-600 mt-0.5 font-medium">Plan renewal schedule</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Documents */}
        <Card className="border-teal-200 bg-teal-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-teal-700">Total Tracked</p>
              <h3 className="text-2xl font-extrabold text-teal-900 mt-1">{summary.totalDocumentsCount}</h3>
              <p className="text-[11px] text-teal-600 mt-0.5 font-medium">Active compliance certificates</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'alerts'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            All Expiring Alerts ({summary.expiredCount + summary.expiringIn30DaysCount})
          </button>
          <button
            onClick={() => setActiveTab('vehicle')}
            className={`py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'vehicle'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Vehicle Documents
          </button>
          <button
            onClick={() => setActiveTab('driver')}
            className={`py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'driver'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Driver Documents
          </button>
        </nav>
      </div>

      {/* Documents List Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Asset / Holder</th>
                <th className="px-4 py-3.5">Document Type</th>
                <th className="px-4 py-3.5">Document #</th>
                <th className="px-4 py-3.5">Validity Dates</th>
                <th className="px-4 py-3.5">Compliance Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Loading compliance documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No documents found in this section.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={`${doc.entityType}-${doc.id}`} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs ${
                            doc.entityType === 'Vehicle'
                              ? 'bg-teal-50 text-teal-700'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {doc.entityType === 'Vehicle' ? (
                            <Truck className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{doc.entityIdentifier}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">{doc.entityType}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {doc.documentType}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700 text-[11px]">
                      {doc.documentNumber}
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-500">
                      <div>Issued: {new Date(doc.issueDate).toLocaleDateString()}</div>
                      <div className="font-semibold text-slate-800">
                        Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {getStatusBadge(doc.expiryStatus, doc.daysUntilExpiry)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.filePath && (
                          <a
                            href={doc.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition"
                            title="Download / View File"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setDocToDelete(doc);
                            setIsConfirmOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Compliance Document"
        description="Upload digital copies of RC, commercial insurance, fitness, or driver licenses."
        maxWidth="2xl"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {/* Target Entity Radio */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Document Applies To
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTargetType('Vehicle');
                  if (vehicles.length > 0) setSelectedEntityId(vehicles[0].id.toString());
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                  targetType === 'Vehicle'
                    ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Truck className="w-4 h-4" /> Vehicle Fleet
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetType('Driver');
                  if (drivers.length > 0) setSelectedEntityId(drivers[0].id.toString());
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                  targetType === 'Driver'
                    ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <UserCheck className="w-4 h-4" /> Transport Driver
              </button>
            </div>
          </div>

          {/* Select Entity */}
          {targetType === 'Vehicle' ? (
            <Select
              label="Select Vehicle"
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicleNumber} - {v.make} {v.model} ({v.capacity}T)
                </option>
              ))}
            </Select>
          ) : (
            <Select
              label="Select Driver"
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.driverCode}) - DL: {d.drivingLicenseNumber}
                </option>
              ))}
            </Select>
          )}

          {/* Document Type */}
          {targetType === 'Vehicle' ? (
            <Select
              label="Document Type"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="1">RC (Registration Certificate)</option>
              <option value="2">Commercial Insurance</option>
              <option value="3">Fitness Certificate</option>
              <option value="4">State/National Permit</option>
              <option value="5">Pollution Under Control (PUC)</option>
              <option value="6">Other Document</option>
            </Select>
          ) : (
            <Select
              label="Document Type"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="1">Commercial Driving License</option>
              <option value="2">Medical Fitness Certificate</option>
              <option value="3">National ID Proof (Aadhaar/PAN)</option>
              <option value="4">Other Document</option>
            </Select>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Document Number"
              placeholder="e.g. INS-2026-887711"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Upload File (.pdf, .png, .jpg)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Issue Date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
            <Input
              label="Expiry Date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Remarks / Policy Details (Optional)"
            placeholder="e.g. Comprehensive bumper-to-bumper policy with RSA"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUploadModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Upload & Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Document Record"
        message={`Are you sure you want to remove document ${docToDelete?.documentNumber} for ${docToDelete?.entityIdentifier}? The attached digital file will also be deleted.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default DocumentsPage;
