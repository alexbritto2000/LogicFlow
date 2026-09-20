import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowRightLeft,
  Truck,
  UserCheck,
  MapPin,
  Calendar,
  Phone,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { assignmentService, Assignment, CreateAssignmentPayload } from '../../services/assignment.service';
import { shipmentService, Shipment } from '../../services/shipment.service';
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

export const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dispatch Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingShipments, setPendingShipments] = useState<Shipment[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);

  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Release Dialog State
  const [isReleaseOpen, setIsReleaseOpen] = useState(false);
  const [assignmentToRelease, setAssignmentToRelease] = useState<Assignment | null>(null);

  const { success, error: toastError } = useToast();

  const loadAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await assignmentService.getActiveAssignments();
      if (res.success && res.data) {
        setAssignments(res.data);
      }
    } catch {
      toastError('Error', 'Failed to load active fleet assignments');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const openDispatchModal = async () => {
    setIsLoading(true);
    try {
      const [shipmentsRes, vehiclesRes, driversRes] = await Promise.all([
        shipmentService.getShipments({ pageSize: 50 }),
        vehicleService.getAvailableVehicles(),
        driverService.getAvailableDrivers(),
      ]);

      if (shipmentsRes.success && shipmentsRes.data) {
        // Filter shipments that are Created or Assigned without active vehicle
        const unassigned = shipmentsRes.data.items.filter(
          (s) => s.currentStatus <= 2 && !s.assignedVehicleNumber
        );
        setPendingShipments(unassigned);
        if (unassigned.length > 0) setSelectedShipmentId(unassigned[0].id.toString());
      }

      if (vehiclesRes.success && vehiclesRes.data) {
        setAvailableVehicles(vehiclesRes.data);
        if (vehiclesRes.data.length > 0) setSelectedVehicleId(vehiclesRes.data[0].id.toString());
      }

      if (driversRes.success && driversRes.data) {
        setAvailableDrivers(driversRes.data);
        if (driversRes.data.length > 0) setSelectedDriverId(driversRes.data[0].id.toString());
      }

      setNotes('');
      setIsModalOpen(true);
    } catch {
      toastError('Error', 'Unable to prepare fleet dispatch options');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentId || !selectedVehicleId || !selectedDriverId) {
      toastError('Validation', 'Please select shipment, vehicle, and driver');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateAssignmentPayload = {
        shipmentId: Number(selectedShipmentId),
        vehicleId: Number(selectedVehicleId),
        driverId: Number(selectedDriverId),
        notes,
      };

      const res = await assignmentService.assignFleet(payload);
      if (res.success) {
        success('Dispatch Assigned', 'Vehicle and driver assigned to shipment successfully.');
        setIsModalOpen(false);
        loadAssignments();
      } else {
        toastError('Dispatch Failed', res.message);
      }
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'Assignment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseConfirm = async () => {
    if (!assignmentToRelease) return;
    setIsSubmitting(true);
    try {
      const res = await assignmentService.releaseAssignment(assignmentToRelease.id, 'Trip completed / released');
      if (res.success) {
        success('Fleet Released', 'Vehicle and driver are now marked as available.');
        setIsReleaseOpen(false);
        loadAssignments();
      } else {
        toastError('Release Failed', res.message);
      }
    } catch {
      toastError('Error', 'Unable to release fleet assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fleet Dispatch & Assignments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Assign roadworthy trucks and certified drivers to active freight shipments.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openDispatchModal}
        >
          New Fleet Dispatch
        </Button>
      </div>

      {/* Active Dispatches Board */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Active Dispatches</span>
            <Badge variant="purple" size="sm">
              {assignments.length} Active
            </Badge>
          </div>
          <span className="text-[11px] text-slate-400">
            Vehicles and drivers currently on duty
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Shipment / Tracking</th>
                <th className="px-4 py-3.5">Consignment Route</th>
                <th className="px-4 py-3.5">Assigned Vehicle</th>
                <th className="px-4 py-3.5">Assigned Driver</th>
                <th className="px-4 py-3.5">Dispatched At</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Loading active dispatches...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No active dispatches right now. All fleet assets are idle or awaiting assignment.
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5">
                      <div>
                        <span className="font-bold text-slate-900 font-mono tracking-wider block">
                          {a.trackingNumber}
                        </span>
                        <span className="text-[11px] text-teal-600 font-mono">
                          {a.shipmentNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{a.customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{a.origin} → {a.destination}</span>
                      </div>
                      {a.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 truncate max-w-[200px]">
                          "{a.notes}"
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 font-mono block">
                            {a.vehicleNumber}
                          </span>
                          <span className="text-[11px] text-slate-500">{a.vehicleType}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{a.driverName}</span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {a.driverPhone}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-500">
                      <Calendar className="w-3 h-3 text-slate-400 inline mr-1" />
                      {new Date(a.assignedDate).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAssignmentToRelease(a);
                          setIsReleaseOpen(true);
                        }}
                      >
                        Release Fleet
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Fleet Dispatch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dispatch Fleet & Assign Driver"
        description="Select an unassigned shipment, an available transport vehicle, and an on-duty driver."
        maxWidth="2xl"
      >
        <form onSubmit={handleDispatchSubmit} className="space-y-4">
          {/* Pending Shipment */}
          <Select
            label="1. Select Pending Consignment"
            value={selectedShipmentId}
            onChange={(e) => setSelectedShipmentId(e.target.value)}
            required
          >
            {pendingShipments.length === 0 ? (
              <option value="">No pending shipments available</option>
            ) : (
              pendingShipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.trackingNumber} ({s.shipmentNumber}) - {s.origin} → {s.destination} ({s.customerName})
                </option>
              ))
            )}
          </Select>

          {/* Available Vehicle */}
          <Select
            label="2. Select Roadworthy Vehicle"
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            required
          >
            {availableVehicles.length === 0 ? (
              <option value="">No vehicles currently available</option>
            ) : (
              availableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicleNumber} - {v.make} {v.model} ({v.capacity}T capacity)
                </option>
              ))
            )}
          </Select>

          {/* Available Driver */}
          <Select
            label="3. Select Certified Driver"
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            required
          >
            {availableDrivers.length === 0 ? (
              <option value="">No drivers currently available</option>
            ) : (
              availableDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.driverCode}) - Phone: {d.phone}
                </option>
              ))
            )}
          </Select>

          {/* Dispatch Notes */}
          <Input
            label="Dispatch Instructions / Handover Notes"
            placeholder="e.g. Ensure tarpaulin cover is tightened; contact receiver 2h before arrival"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">Dispatch Business Rules:</span>
            <p>• Vehicle status will automatically become <span className="font-semibold text-teal-700">Assigned</span>.</p>
            <p>• Driver status will automatically become <span className="font-semibold text-teal-700">Assigned</span>.</p>
            <p>• Timeline audit history is recorded immediately.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={pendingShipments.length === 0 || availableVehicles.length === 0 || availableDrivers.length === 0}
            >
              Confirm Dispatch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Release Confirm Dialog */}
      <ConfirmDialog
        isOpen={isReleaseOpen}
        onClose={() => setIsReleaseOpen(false)}
        onConfirm={handleReleaseConfirm}
        title="Release Fleet & Driver"
        message={`Are you sure you want to release vehicle ${assignmentToRelease?.vehicleNumber} and driver ${assignmentToRelease?.driverName} back to available fleet?`}
        confirmText="Release to Available"
        variant="primary"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default AssignmentsPage;
