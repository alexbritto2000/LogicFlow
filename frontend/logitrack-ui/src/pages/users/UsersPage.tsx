import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { userService, User, Role } from '../../services/user.service';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Add User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRoleId, setEditRoleId] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Deactivate Dialog
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await userService.getUsers({
        pageNumber,
        pageSize,
        search: search || undefined,
        roleId: roleFilter,
      });
      if (res.success && res.data) {
        setUsers(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } catch {
      toastError('Error', 'Failed to load user accounts');
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, search, roleFilter, toastError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await userService.getRoles();
        if (res.success && res.data) setRoles(res.data);
      } catch {
        // ignore
      }
    };
    loadRoles();
  }, []);

  const handleOpenAddModal = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setSelectedRoleId(roles[0]?.id?.toString() || '');
    setIsAddModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim() || !fullName.trim() || !selectedRoleId) {
      toastError('Validation', 'All mandatory fields marked with * are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await userService.createUser({
        username: username.trim(),
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        roleId: parseInt(selectedRoleId, 10),
      });

      if (res.success && res.data) {
        success('User Created', `User ${res.data.username} has been registered successfully.`);
        setIsAddModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      toastError('Creation Failed', err.response?.data?.message || 'Server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditFullName(user.fullName);
    setEditPhone(user.phone || '');
    setEditRoleId(user.roleId.toString());
    setEditIsActive(user.isActive);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const res = await userService.updateUser(editingUser.id, {
        email: editEmail.trim(),
        fullName: editFullName.trim(),
        phone: editPhone.trim() || undefined,
        roleId: parseInt(editRoleId, 10),
        isActive: editIsActive,
      });

      if (res.success && res.data) {
        success('User Updated', `User profile updated for ${res.data.username}.`);
        setIsEditModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      toastError('Update Failed', err.response?.data?.message || 'Server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenResetModal = (user: User) => {
    setResetUser(user);
    setNewPassword('');
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !newPassword.trim()) return;
    setIsSubmitting(true);
    try {
      await userService.resetPassword(resetUser.id, newPassword);
      success('Password Reset', `Password has been reset for user ${resetUser.username}.`);
      setIsResetModalOpen(false);
    } catch (err: any) {
      toastError('Reset Failed', err.response?.data?.message || 'Server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;
    setIsDeactivating(true);
    try {
      await userService.deleteUser(userToDeactivate.id);
      success('User Deactivated', `User ${userToDeactivate.username} account disabled.`);
      setUserToDeactivate(null);
      fetchUsers();
    } catch {
      toastError('Error', 'Failed to deactivate user.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const getRoleBadgeVariant = (roleName: string): any => {
    switch (roleName) {
      case 'SuperAdmin':
      case 'Admin':
        return 'danger';
      case 'Dispatcher':
        return 'warning';
      case 'Operations':
        return 'info';
      case 'Accountant':
        return 'purple';
      case 'Driver':
        return 'success';
      default:
        return 'default';
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'User / Login ID',
      render: (u) => (
        <div>
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            {u.fullName}
          </div>
          <div className="text-xs text-slate-400 font-mono">@{u.username}</div>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      render: (u) => (
        <div className="text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{u.email}</span>
          </div>
          {u.phone && (
            <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{u.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'System Role',
      render: (u) => (
        <Badge variant={getRoleBadgeVariant(u.roleName)}>
          {u.roleName}
        </Badge>
      ),
    },
    {
      header: 'Account Status',
      render: (u) => (
        <Badge variant={u.isActive ? 'success' : 'default'}>
          {u.isActive ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
    {
      header: 'Registered On',
      render: (u) => (
        <span className="text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      header: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEditModal(u)}
            className="text-xs"
            title="Edit User"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenResetModal(u)}
            className="text-xs text-amber-600 hover:bg-amber-50"
            title="Reset Password"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </Button>
          {u.isActive && u.username !== 'admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserToDeactivate(u)}
              className="text-xs text-rose-600 hover:bg-rose-50"
              title="Deactivate Account"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Administration & Access Control</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage system operators, dispatchers, accountants, drivers, credentials, and role-based permissions.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add New User
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total System Users</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount}</h3>
              <p className="text-[11px] text-blue-600 mt-0.5">Registered accounts</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Active Operators</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">
                {users.filter((u) => u.isActive).length}
              </h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">Currently enabled</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Configured Security Roles</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-0.5">{roles.length}</h3>
              <p className="text-[11px] text-purple-600 mt-0.5">RBAC role types</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <DataTable<User>
        columns={columns}
        data={users}
        totalCount={totalCount}
        pageNumber={pageNumber}
        pageSize={pageSize}
        onPageChange={setPageNumber}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        isLoading={isLoading}
        searchPlaceholder="Search username, full name, email, phone..."
        emptyTitle="No user accounts found"
        emptyDescription="Create your first operator account to grant access to the logistics portal."
      />

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New System User"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <Input
                placeholder="e.g. Ramesh Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Username (Login ID) *
              </label>
              <Input
                placeholder="e.g. ramesh_dispatch"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <Input
                type="email"
                placeholder="ramesh@logitrack.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <Input
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                System Role *
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                required
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} - {r.description || 'System role'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create User Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit User - ${editingUser.username}`}
          maxWidth="lg"
        >
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <Input
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  System Role *
                </label>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  required
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
              />
              <label htmlFor="editIsActive" className="text-xs font-medium text-slate-700 cursor-pointer">
                Account Active & Allowed to Sign In
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title={`Reset Password - ${resetUser.username}`}
          maxWidth="md"
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-slate-500">
              Enter a new temporary or permanent password for <span className="font-semibold text-slate-800">{resetUser.fullName}</span>.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                New Password *
              </label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button variant="outline" type="button" onClick={() => setIsResetModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Update Password
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deactivate User Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Operator Account"
        message={`Are you sure you want to deactivate ${userToDeactivate?.fullName} (@${userToDeactivate?.username})? They will no longer be able to log in to the portal.`}
        confirmText="Deactivate User"
        variant="danger"
        isLoading={isDeactivating}
      />
    </div>
  );
};

export default UsersPage;
