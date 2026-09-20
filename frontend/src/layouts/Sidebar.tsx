import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Truck,
  UserCheck,
  FileText,
  CalendarCheck,
  Package,
  Search,
  ArrowRightLeft,
  CheckSquare,
  Receipt,
  CreditCard,
  Coins,
  BarChart3,
  UserCog,
  Video,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['*'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['Admin', 'Operations'] },
    { name: 'Vehicles', href: '/vehicles', icon: Truck, roles: ['Admin', 'Dispatcher'] },
    { name: 'Drivers', href: '/drivers', icon: UserCheck, roles: ['Admin', 'Dispatcher'] },
    { name: 'Documents', href: '/documents', icon: FileText, roles: ['Admin', 'Dispatcher'] },
    { name: 'Bookings', href: '/bookings', icon: CalendarCheck, roles: ['Admin', 'Operations'] },
    { name: 'Shipments', href: '/shipments', icon: Package, roles: ['Admin', 'Operations', 'Dispatcher', 'Driver'] },
    { name: 'Shipment Tracking', href: '/tracking', icon: Search, roles: ['*'] },
    { name: 'Dispatch & Assignments', href: '/assignments', icon: ArrowRightLeft, roles: ['Admin', 'Dispatcher'] },
    { name: 'Delivery / POD', href: '/delivery', icon: CheckSquare, roles: ['Admin', 'Dispatcher', 'Driver'] },
    { name: 'Invoices', href: '/invoices', icon: Receipt, roles: ['Admin', 'Accountant'] },
    { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['Admin', 'Accountant'] },
    { name: 'Expenses', href: '/expenses', icon: Coins, roles: ['Admin', 'Accountant'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['Admin', 'Accountant', 'Operations'] },
    { name: 'LinkedIn Video Studio', href: '/demo-studio', icon: Video, roles: ['*'] },
    { name: 'User Management', href: '/users', icon: UserCog, roles: ['SuperAdmin', 'Admin'] },
  ];

  const filteredNav = navigation.filter(
    (item) => item.roles.includes('*') || hasRole(item.roles)
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-30',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-teal-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">LogiTrack</span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-teal-400">Operations</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Badge */}
        {user && (
          <div className="mx-4 my-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xs">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.fullName}</p>
              <span className="inline-block text-[10px] font-medium text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded">
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-teal-500/10 text-teal-400 font-semibold border-l-2 border-teal-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-teal-400" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          LogiTrack v1.0 • Enterprise
        </div>
      </aside>
    </>
  );
};
