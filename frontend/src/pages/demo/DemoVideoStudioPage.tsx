import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  Video,
  Download,
  CheckCircle2,
  Truck,
  Package,
  ShieldCheck,
  FileCheck,
  Receipt,
  DollarSign,
  MapPin,
  Clock,
  Volume2,
  VolumeX,
  Share2,
  Copy,
  Sparkles,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

interface Scene {
  id: number;
  duration: number; // in seconds
  title: string;
  badge: string;
  headline: string;
  subheadline: string;
  category: string;
}

const SCENES: Scene[] = [
  {
    id: 1,
    duration: 8,
    badge: 'THE LOGISTICS REVOLUTION',
    category: 'Intro',
    title: 'Transform Transport Chaos',
    headline: 'Still Managing Fleet Operations on Spreadsheets & WhatsApp?',
    subheadline: 'Transport companies lose up to 18% margin to delayed dispatches, misplaced PODs, and slow billing.',
  },
  {
    id: 2,
    duration: 9,
    badge: 'COMMAND CENTER',
    category: 'Live Dashboard',
    title: 'Real-Time Operations Dashboard',
    headline: 'One Single Pane of Glass for Your Entire Fleet & Revenue',
    subheadline: 'Real-time vehicle availability, live transit stages, automated expiry alerts, and 6-month financial trajectory.',
  },
  {
    id: 3,
    duration: 9,
    badge: 'DISPATCH AUTOMATION',
    category: 'Smart Dispatch',
    title: 'Conflict-Free Fleet Assignment',
    headline: 'Assign Vehicles & Certified Drivers in 2 Clicks',
    subheadline: 'Automated compliance guards block maintenance trucks, expired licenses, and conflicting trips automatically.',
  },
  {
    id: 4,
    duration: 9,
    badge: 'CUSTOMER EXPERIENCE',
    category: 'Public Tracking',
    title: 'Self-Service Consignment Tracking',
    headline: 'Zero Phone Calls: Live Customer Tracking Timelines',
    subheadline: 'Share tracking links with clients (LT-2026-000001) showing origin-to-destination milestones in real time.',
  },
  {
    id: 5,
    duration: 9,
    badge: 'PROOF OF DELIVERY',
    category: 'Digital POD',
    title: 'Instant Delivery Confirmation & Asset Release',
    headline: 'Capture Digital POD & Release Trucks Immediately',
    subheadline: 'Receiver verification and signed challan uploads auto-release vehicles & drivers back to Available status.',
  },
  {
    id: 6,
    duration: 8,
    badge: 'FINANCIAL SETTLEMENTS',
    category: 'GST Invoicing',
    title: '1-Click Freight Invoicing & UPI/Bank Collections',
    headline: 'Convert Completed Trips into 18% GST Invoices Instantly',
    subheadline: 'Automate tax math, print commercial bills, and reconcile NEFT/UPI/Cheque payments with zero balance leakage.',
  },
  {
    id: 7,
    duration: 8,
    badge: 'COMMERCIAL READY',
    category: 'Call To Action',
    title: 'Scale Your Logistics Business Today',
    headline: 'Modernize Your Logistics Company with LogiTrack',
    subheadline: 'Commercial-grade SaaS platform built for small-to-medium fleet owners, brokers, and 3PL providers.',
  },
];

export const DemoVideoStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1'>('16:9');
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const totalDuration = SCENES.reduce((acc, s) => acc + s.duration, 0); // 60s
  const currentScene = SCENES[currentSceneIndex];

  // Playback timer
  useEffect(() => {
    if (!isPlaying || isRecording) return;

    const intervalTime = 100; // 100ms
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (intervalTime / (totalDuration * 1000)) * 100;
        if (next >= 100) {
          return 0; // loop
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, isRecording, totalDuration]);

  // Sync scene with progress
  useEffect(() => {
    let accumulated = 0;
    const currentSeconds = (progress / 100) * totalDuration;

    for (let i = 0; i < SCENES.length; i++) {
      accumulated += SCENES[i].duration;
      if (currentSeconds <= accumulated || i === SCENES.length - 1) {
        setCurrentSceneIndex(i);
        break;
      }
    }
  }, [progress, totalDuration]);

  // Video Generation Engine using HTML5 Canvas & MediaRecorder
  const startRecording = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRecording(true);
    setIsPlaying(false);
    setProgress(0);
    setCurrentSceneIndex(0);
    setRecordingProgress(0);
    recordedChunksRef.current = [];

    const stream = canvas.captureStream(60); // 60 FPS
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 6000000, // 6 Mbps HD quality
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LogiTrack_LinkedIn_Demo_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsRecording(false);
      setIsPlaying(true);
      success('Video Downloaded!', 'Your high-definition LinkedIn demo video is saved in your Downloads folder!');
    };

    mediaRecorderRef.current = recorder;
    recorder.start(100);

    // Drive recorded playback through each scene
    const totalFrames = totalDuration * 60;
    let frame = 0;

    const renderLoop = () => {
      frame++;
      const currentPct = (frame / totalFrames) * 100;
      setProgress(currentPct);
      setRecordingProgress(Math.min(100, Math.round(currentPct)));

      // Draw canvas
      drawCanvasFrame(canvas, currentPct);

      if (frame < totalFrames) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      } else {
        recorder.stop();
      }
    };

    renderLoop();
  };

  // Canvas drawing function for high-res recording
  const drawCanvasFrame = (canvas: HTMLCanvasElement, pct: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle background mesh grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Determine current scene from percentage
    let accumulated = 0;
    const currentSeconds = (pct / 100) * totalDuration;
    let sceneIdx = 0;
    for (let i = 0; i < SCENES.length; i++) {
      accumulated += SCENES[i].duration;
      if (currentSeconds <= accumulated || i === SCENES.length - 1) {
        sceneIdx = i;
        break;
      }
    }
    const scene = SCENES[sceneIdx];

    // Top Header: LogiTrack Logo & Badge
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('LOGITRACK', 80, 80);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Logistics & Fleet Operating System', 240, 80);

    // Scene Category Pill
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(width - 320, 55, 240, 36, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(scene.badge, width - 200, 78);
    ctx.textAlign = 'left';

    // Main Headline & Subheadline
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Inter, sans-serif';
    ctx.fillText(scene.headline, 80, 170);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText(scene.subheadline, 80, 215);

    // Draw Visual Mockup Cards Based on Scene
    drawSceneVisuals(ctx, scene.id, width, height);

    // Bottom Progress Bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(80, height - 60, width - 160, 8);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(80, height - 60, (width - 160) * (pct / 100), 8);

    // Timestamp
    ctx.fillStyle = '#64748b';
    ctx.font = '14px monospace';
    const curSec = Math.floor(currentSeconds);
    ctx.fillText(`00:${curSec < 10 ? '0' + curSec : curSec} / 01:00`, width - 200, height - 35);
  };

  const drawSceneVisuals = (ctx: CanvasRenderingContext2D, sceneId: number, width: number, height: number) => {
    const cardX = 80;
    const cardY = 270;
    const cardW = width - 160;
    const cardH = height - 370;

    // Outer Container Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.stroke();

    // Browser Mac Window Header Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cardX + 30, cardY + 28, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cardX + 48, cardY + 28, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(cardX + 66, cardY + 28, 6, 0, Math.PI * 2);
    ctx.fill();

    // URL Bar
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(cardX + 90, cardY + 16, 400, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.font = '11px monospace';
    ctx.fillText('https://app.logitrack.com/operations/live', cardX + 105, cardY + 32);

    // Content Based on Scene
    if (sceneId === 1) {
      // Intro: 3 Value Pillars
      const pillars = [
        { title: 'Fleet & Drivers', desc: 'Real-time readiness & automated license renewal alerts', val: '100% Compliant' },
        { title: 'Live Consignments', desc: 'Milestone tracking with public customer self-service link', val: 'Zero Calls' },
        { title: 'Digital POD & Invoices', desc: 'Signed challan capture with 18% GST calculation', val: 'Fast Billing' },
      ];
      pillars.forEach((p, idx) => {
        const px = cardX + 40 + idx * 370;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(px, cardY + 80, 340, 240, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillText(p.title, px + 25, cardY + 130);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(p.desc, px + 25, cardY + 170);

        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.beginPath();
        ctx.roundRect(px + 25, cardY + 230, 140, 32, 16);
        ctx.fill();

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(p.val, px + 40, cardY + 251);
      });
    } else if (sceneId === 2) {
      // Dashboard: Metrics + Trajectory Chart
      const stats = [
        { label: 'MONTHLY REVENUE', val: '₹18,40,000', color: '#38bdf8' },
        { label: 'ACTIVE SHIPMENTS', val: '42 In-Transit', color: '#10b981' },
        { label: 'FLEET READINESS', val: '94% Available', color: '#f59e0b' },
        { label: 'COLLECTED RATIO', val: '86% Paid', color: '#a855f7' },
      ];
      stats.forEach((s, idx) => {
        const sx = cardX + 40 + idx * 280;
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(sx, cardY + 70, 260, 90, 10);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(s.label, sx + 20, cardY + 98);

        ctx.fillStyle = s.color;
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillText(s.val, sx + 20, cardY + 135);
      });

      // Chart simulation
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const points = [
        [cardX + 60, cardY + 300],
        [cardX + 260, cardY + 280],
        [cardX + 460, cardY + 290],
        [cardX + 660, cardY + 230],
        [cardX + 860, cardY + 240],
        [cardX + 1060, cardY + 190],
      ];
      points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt[0], pt[1]);
        else ctx.lineTo(pt[0], pt[1]);
      });
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText('▲ Revenue Trajectory (+28% MoM Operating Profit)', cardX + 60, cardY + 340);
    } else if (sceneId === 3) {
      // Dispatch Board
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(cardX + 40, cardY + 70, 1080, 260, 12);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText('DISPATCH ASSIGNMENT #SH-2026-000001 (Mumbai → Delhi, 16 Tonnes)', cardX + 70, cardY + 115);

      ctx.fillStyle = '#10b981';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('✔ Assigned Vehicle: MH-12-AB-1234 (Taurus 16T) [COMPLIANCE VERIFIED]', cardX + 70, cardY + 160);

      ctx.fillStyle = '#10b981';
      ctx.fillText('✔ Assigned Driver: Rajesh Kumar (DL Valid until 2028)', cardX + 70, cardY + 200);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.beginPath();
      ctx.roundRect(cardX + 70, cardY + 235, 200, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText('DISPATCH CONFIRMED', cardX + 85, cardY + 260);
    } else if (sceneId === 4) {
      // Tracking Timeline
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(cardX + 40, cardY + 70, 1080, 260, 12);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('WAYBILL: LT-2026-000001 | Tata Steel Ltd', cardX + 70, cardY + 115);

      const milestones = [
        { title: 'Booking Placed', time: '10:00 AM', done: true },
        { title: 'Fleet Dispatched', time: '12:30 PM', done: true },
        { title: 'In Transit (Surat Hub)', time: '06:15 PM', done: true },
        { title: 'Out For Delivery', time: 'Tomorrow 9 AM', done: false },
      ];

      milestones.forEach((m, idx) => {
        const mx = cardX + 70 + idx * 260;
        ctx.fillStyle = m.done ? '#10b981' : '#64748b';
        ctx.beginPath();
        ctx.arc(mx, cardY + 175, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText(m.title, mx - 30, cardY + 215);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(m.time, mx - 20, cardY + 235);
      });
    } else if (sceneId === 5) {
      // Digital POD
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(cardX + 40, cardY + 70, 520, 260, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText('Verified Delivery Confirmation', cardX + 70, cardY + 115);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('Receiver: Sunil Verma (+91 98765 43210)', cardX + 70, cardY + 155);
      ctx.fillText('Challan: STAMP AFFIXED & SIGNED', cardX + 70, cardY + 190);
      ctx.fillText('Time: 18 Sep 2026, 04:30 PM', cardX + 70, cardY + 225);

      // Asset auto release indicator
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(cardX + 600, cardY + 70, 520, 260, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillText('⚡ Automated Asset Release', cardX + 630, cardY + 120);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '15px Inter, sans-serif';
      ctx.fillText('Truck MH-12-AB-1234 → Available', cardX + 630, cardY + 170);
      ctx.fillText('Driver Rajesh Kumar → Available', cardX + 630, cardY + 210);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText('Ready for next dispatch immediate turnaround', cardX + 630, cardY + 260);
    } else if (sceneId === 6) {
      // Invoicing & Tax Math
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(cardX + 40, cardY + 70, 1080, 260, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillText('TAX INVOICE #INV-2026-000042 | GSTIN: 27AABCL1234F1Z8', cardX + 70, cardY + 115);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('Freight Amount (SubTotal): ₹65,000', cardX + 70, cardY + 160);
      ctx.fillText('Goods & Services Tax (18% GST): ₹11,700', cardX + 70, cardY + 195);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText('Grand Total: ₹76,700', cardX + 70, cardY + 245);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('✔ Payment Status: Settled via Bank Transfer (HDFC UTR92810)', cardX + 450, cardY + 245);
    } else if (sceneId === 7) {
      // CTA
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cardX + 140, cardY + 70, 880, 250, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Stop Wasting Margin. Automate Your Transport Business.', cardX + 580, cardY + 140);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText('Built with .NET 10 & React. Commercial-Ready SaaS Architecture.', cardX + 580, cardY + 185);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText('👉 Comment "DEMO" or DM to Schedule a Live Walkthrough', cardX + 580, cardY + 245);
      ctx.textAlign = 'left';
    }
  };

  const copyLinkedInPost = () => {
    const text = `🚛 Transport business owners & 3PL operators: Are you still running multi-crore fleet operations across messy WhatsApp groups and Excel sheets?

Here is the harsh reality:
❌ Drivers forget to send physical PODs for days.
❌ Dispatchers book trucks with expiring fitness/permits and get fined at state borders.
❌ Invoices sit pending for weeks because rates & taxes are computed manually.

We built LogiTrack to solve this once and for all.

Here is what it does in 60 seconds:
1️⃣ Live Fleet & Driver Control Center: Track truck capacity, driver readiness, and revenue trajectory in one pane.
2️⃣ Compliance-Guarded Dispatches: Automatic blocks for trucks in maintenance or drivers with expired licenses.
3️⃣ Zero-Call Customer Tracking: Live public milestone tracking (Mumbai to Delhi) your clients can check themselves.
4️⃣ Instant Proof of Delivery (POD): Upload receiver challans digitally and auto-release vehicles for next trips instantly.
5️⃣ 1-Click 18% GST Invoicing: Reconcile freight balances, calculate tax, and record Bank/UPI payments with zero leaks.

Built on high-performance .NET 10 and React 19 architecture, ready for multi-tenant deployment.

🎥 Watch the 60-second product walkthrough below!

💬 Want a private live demo or access to the codebase? Drop a comment "DEMO" or send me a DM!

#Logistics #SupplyChain #FleetManagement #Trucking #Transportation #SaaS #DotNet #React #B2BLogistics #Startup`;

    navigator.clipboard.writeText(text);
    success('Copied!', 'LinkedIn post caption copied to your clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">LinkedIn Video Studio & Demo Reel</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 60s HD Reel
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export a high-impact, customer-attracting product demo video ready to post directly to LinkedIn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={copyLinkedInPost}
            className="flex items-center gap-2 text-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy LinkedIn Post Caption
          </Button>

          <Button
            onClick={startRecording}
            isLoading={isRecording}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs shadow-md shadow-rose-600/20"
          >
            <Video className="w-4 h-4" />
            {isRecording ? `Recording... (${recordingProgress}%)` : '🔴 Record & Export LinkedIn Video'}
          </Button>
        </div>
      </div>

      {/* Main Studio Video Player Display */}
      <Card className="overflow-hidden border-slate-800 bg-slate-950 text-white shadow-2xl">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400 font-mono ml-2">
              LogiTrack Studio — Scene {currentSceneIndex + 1} of {SCENES.length}: {currentScene.title}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Aspect Ratio:</span>
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`px-2 py-1 rounded text-xs font-semibold ${
                aspectRatio === '16:9' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'
              }`}
            >
              16:9 (Desktop)
            </button>
            <button
              onClick={() => setAspectRatio('1:1')}
              className={`px-2 py-1 rounded text-xs font-semibold ${
                aspectRatio === '1:1' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'
              }`}
            >
              1:1 (Square)
            </button>
          </div>
        </div>

        <CardContent className="p-6 flex flex-col items-center justify-center bg-slate-950">
          {/* Real-time HTML5 Canvas for recording & rendering */}
          <div
            className={`relative w-full rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-900 transition-all ${
              aspectRatio === '16:9' ? 'aspect-video max-w-5xl' : 'aspect-square max-w-2xl'
            }`}
          >
            <canvas
              ref={canvasRef}
              width={1920}
              height={aspectRatio === '16:9' ? 1080 : 1920}
              className="w-full h-full object-contain"
            />

            {/* Live Interactive UI Overlay if not recording */}
            {!isRecording && (
              <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-between pointer-events-none select-none bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xl">
                      LT
                    </div>
                    <div>
                      <div className="font-black tracking-wider text-xl text-white">LOGITRACK</div>
                      <div className="text-xs text-slate-400">Logistics & Fleet Operating System</div>
                    </div>
                  </div>

                  <div className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    {currentScene.badge}
                  </div>
                </div>

                {/* Scene Content Center */}
                <div className="space-y-4 max-w-3xl">
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
                    {currentScene.headline}
                  </h2>
                  <p className="text-sm sm:text-lg text-slate-300 leading-relaxed font-normal drop-shadow-sm">
                    {currentScene.subheadline}
                  </p>
                </div>

                {/* Bottom Timeline & Time */}
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-100 ease-linear rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{currentScene.category}</span>
                    <span>
                      {Math.floor((progress / 100) * totalDuration)}s / {totalDuration}s
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="w-full max-w-5xl mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={isRecording}
                className="text-white border-slate-700 bg-slate-900 hover:bg-slate-800"
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProgress(0);
                  setCurrentSceneIndex(0);
                }}
                disabled={isRecording}
                className="text-white border-slate-700 bg-slate-900 hover:bg-slate-800"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Restart
              </Button>
            </div>

            {/* Scene Selector Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {SCENES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    // Jump to scene
                    let acc = 0;
                    for (let i = 0; i < idx; i++) acc += SCENES[i].duration;
                    setProgress((acc / totalDuration) * 100);
                  }}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium transition ${
                    currentSceneIndex === idx
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {idx + 1}. {s.category}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn Post Copy & Launch Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4 text-brand-600" /> Ready-to-Post LinkedIn Caption
              </h3>
              <Button size="sm" variant="outline" onClick={copyLinkedInPost} className="text-xs">
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy Text
              </Button>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-sans whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto">
              {`🚛 Transport business owners & 3PL operators: Are you still running multi-crore fleet operations across messy WhatsApp groups and Excel sheets?

Here is the harsh reality:
❌ Drivers forget to send physical PODs for days.
❌ Dispatchers book trucks with expiring fitness/permits and get fined at state borders.
❌ Invoices sit pending for weeks because rates & taxes are computed manually.

We built LogiTrack to solve this once and for all.

Here is what it does in 60 seconds:
1️⃣ Live Fleet & Driver Control Center: Track truck capacity, driver readiness, and revenue trajectory in one pane.
2️⃣ Compliance-Guarded Dispatches: Automatic blocks for trucks in maintenance or drivers with expired licenses.
3️⃣ Zero-Call Customer Tracking: Live public milestone tracking (Mumbai to Delhi) your clients can check themselves.
4️⃣ Instant Proof of Delivery (POD): Upload receiver challans digitally and auto-release vehicles for next trips instantly.
5️⃣ 1-Click 18% GST Invoicing: Reconcile freight balances, calculate tax, and record Bank/UPI payments with zero leaks.

Built on high-performance .NET 10 and React 19 architecture, ready for multi-tenant deployment.

🎥 Watch the 60-second product walkthrough below!

💬 Want a private live demo or access to the codebase? Drop a comment "DEMO" or send me a DM!

#Logistics #SupplyChain #FleetManagement #Trucking #Transportation #SaaS #DotNet #React #B2BLogistics`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-600" /> How to Record & Post on LinkedIn
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-950">Option 1: 1-Click Automatic Recording (Recommended)</span>
                  <p className="mt-0.5 text-emerald-800">
                    Click the red <strong>"🔴 Record & Export LinkedIn Video"</strong> button above. The studio will play all 7 scenes, capture 60 FPS HD frames, and automatically save <strong>LogiTrack_LinkedIn_Demo.webm</strong> into your Downloads folder!
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-950">Option 2: Record Live Walkthrough with Loom or OBS</span>
                  <p className="mt-0.5 text-blue-800">
                    Open Loom or OBS, share your screen at{' '}
                    <a href="http://localhost:5173/bookings" target="_blank" className="font-mono text-brand-600 underline">
                      http://localhost:5173/bookings
                    </a>
                    , and narrate for 60 seconds following the script on the left!
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-800 block">LinkedIn Posting Best Practices:</span>
                <p>• Post on Tuesday or Thursday between 8:00 AM - 10:30 AM for maximum B2B logistics engagement.</p>
                <p>• Upload the video directly to LinkedIn as a native video (do not link to YouTube).</p>
                <p>• Reply to every comment within the first 60 minutes to trigger LinkedIn's algorithm boost.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoVideoStudioPage;
