import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Package,
  MapPin,
  Clock,
  Truck,
  User,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { shipmentService, TrackingResult } from '../../services/shipment.service';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';

export const TrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [trackingInput, setTrackingInput] = useState(queryParam);
  const [trackingData, setTrackingData] = useState<TrackingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const performTracking = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await shipmentService.trackByNumber(code.trim());
      if (res.success && res.data) {
        setTrackingData(res.data);
      } else {
        setTrackingData(null);
        setErrorMsg(res.message || 'No shipment found with this tracking number.');
      }
    } catch (err: any) {
      setTrackingData(null);
      setErrorMsg(err.response?.data?.message || 'Unable to track shipment. Please verify the tracking number.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queryParam) {
      setTrackingInput(queryParam);
      performTracking(queryParam);
    }
  }, [queryParam, performTracking]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingInput.trim()) {
      setSearchParams({ q: trackingInput.trim() });
      performTracking(trackingInput.trim());
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Created':
        return <Badge variant="default" size="md">Created</Badge>;
      case 'Assigned':
        return <Badge variant="info" size="md">Vehicle Assigned</Badge>;
      case 'PickedUp':
        return <Badge variant="purple" size="md">Picked Up</Badge>;
      case 'InTransit':
        return <Badge variant="warning" size="md">In Transit</Badge>;
      case 'OutForDelivery':
        return <Badge variant="warning" size="md">Out For Delivery</Badge>;
      case 'Delivered':
        return <Badge variant="success" size="md">Delivered</Badge>;
      case 'Cancelled':
      default:
        return <Badge variant="danger" size="md">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Search Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          Real-Time Consignment Tracking
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Your Shipment Live
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Enter your LogiTrack tracking code (e.g. <span className="font-mono font-bold text-slate-700">LT2026000001</span>) or shipment number.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto mt-4">
          <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden border border-slate-200 bg-white p-1.5 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500">
            <div className="pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Enter Tracking Number (e.g. LT2026000001)..."
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="rounded-xl px-6"
            >
              Track
            </Button>
          </div>
        </form>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Tracking Result View */}
      {trackingData && (
        <div className="space-y-6 animate-in fade-in-50">
          {/* Status Header Card */}
          <Card className="border-teal-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-teal-900 to-slate-900 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300 block">
                    Tracking Number
                  </span>
                  <h2 className="text-2xl font-bold font-mono tracking-wider text-white mt-0.5">
                    {trackingData.trackingNumber}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Shipment: <span className="font-mono text-teal-300">{trackingData.shipmentNumber}</span> • Customer: {trackingData.customerName}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300 block mb-1.5">
                    Consignment Status
                  </span>
                  <div>{getStatusBadge(trackingData.currentStatus)}</div>
                </div>
              </div>
            </div>

            {/* Route & Progress Card */}
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                {/* Origin */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Origin</span>
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
                    {trackingData.origin}
                  </h4>
                </div>

                {/* Arrow / Live Location */}
                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-teal-600 block">Current Checkpoint</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    {trackingData.currentLocation}
                  </p>
                </div>

                {/* Destination */}
                <div className="space-y-1 sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination</span>
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2 sm:justify-end">
                    <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
                    {trackingData.destination}
                  </h4>
                </div>
              </div>

              {/* Transit Details Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase text-[10px] font-bold">Estimated Delivery</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(trackingData.estimatedDeliveryDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px] font-bold">Actual Delivery</span>
                  <span className="font-semibold text-slate-800">
                    {trackingData.actualDeliveryDate
                      ? new Date(trackingData.actualDeliveryDate).toLocaleDateString()
                      : 'In Transit'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px] font-bold">Assigned Truck</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {trackingData.assignedVehicle || 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px] font-bold">Driver</span>
                  <span className="font-semibold text-slate-800">
                    {trackingData.assignedDriver || 'Pending'}
                  </span>
                </div>
              </div>

              {/* Status Audit Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" /> Milestone Tracking Progression
                </h4>

                <div className="relative pl-6 border-l-2 border-teal-200 space-y-6 ml-3">
                  {trackingData.timeline.map((item, idx) => (
                    <div key={item.id || idx} className="relative">
                      {/* Milestone Marker */}
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-4 border-teal-600 shadow-sm" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.statusName}</span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.updatedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium mt-0.5">
                          📍 {item.location}
                        </p>
                        {item.remarks && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 italic">
                            "{item.remarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TrackingPage;
