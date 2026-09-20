import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Truck, ShieldCheck, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: 'admin',
      password: 'Admin123!',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    const success = await login(data);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handleDemoFill = (role: 'admin' | 'dispatcher') => {
    if (role === 'admin') {
      setValue('usernameOrEmail', 'admin');
      setValue('password', 'Admin123!');
    } else {
      setValue('usernameOrEmail', 'dispatcher');
      setValue('password', 'Dispatch123!');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      {/* Left Branding Side (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/30">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">LogiTrack</h1>
            <p className="text-xs text-teal-400 font-medium">Enterprise Logistics System</p>
          </div>
        </div>

        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-medium mb-6">
            <ShieldCheck className="w-4 h-4" /> Next-Gen Fleet & Shipment Management
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
            Streamline your fleet, drivers, and freight operations with confidence.
          </h2>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed">
            Real-time shipment tracking, vehicle and driver compliance monitoring, automated dispatching, and full financial reconciliation in a unified platform.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur">
              <div className="text-2xl font-bold text-teal-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">Audit Trail & Compliance</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur">
              <div className="text-2xl font-bold text-teal-400">Live</div>
              <div className="text-xs text-slate-400 mt-1">Freight Tracking & POD</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} LogiTrack Inc. Production Architecture Ready.
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 bg-slate-800/40 p-8 rounded-2xl border border-slate-700/60 backdrop-blur-xl shadow-2xl">
          <div>
            {/* Mobile Brand */}
            <div className="flex lg:hidden items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white">LogiTrack</span>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to your account</h2>
            <p className="mt-1 text-xs text-slate-400">
              Access your logistics dispatch portal and operational controls.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                label="Username or Email"
                placeholder="admin or dispatcher"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.usernameOrEmail?.message}
                {...register('usernameOrEmail')}
                className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
                className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to LogiTrack
            </Button>
          </form>

          {/* Demo account quick login helper */}
          <div className="pt-4 border-t border-slate-700/60">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2 text-center">
              Quick Fill Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600/50 transition text-center"
              >
                SuperAdmin / Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('dispatcher')}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600/50 transition text-center"
              >
                Dispatcher
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
