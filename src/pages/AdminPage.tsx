import { useState } from 'react';
import { useUsers, useUpdateUserProfile, useDeactivateUser, useGrantPermission, useRevokePermission, useUserPermissions } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield,
  UserPlus,
  Edit,
  Trash2,
  Key,
  Mail,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { USER_ROLE_LABELS, UserRole } from '../types/database';

export function AdminPage() {
  const { isAdmin } = useAuth();
  const { data: users, isLoading } = useUsers();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const updateUserProfile = useUpdateUserProfile();
  const deactivateUser = useDeactivateUser();
  const grantPermission = useGrantPermission();
  const revokePermission = useRevokePermission();

  const filteredUsers = users?.filter(
    (u) =>
      u.full_name_ar.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    ceo: 'bg-amber-100 text-amber-700 border-amber-200',
    deputy_development: 'bg-blue-100 text-blue-700 border-blue-200',
    deputy_investment: 'bg-purple-100 text-purple-700 border-purple-200',
    development_manager: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    monitoring_officer: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-800">غير مصرح</h2>
        <p className="text-slate-500 mt-2">لا تملك صلاحية الوصول لهذه الصفحة</p>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await updateUserProfile.mutateAsync({ id: userId, updates: { role: newRole } });
  };

  const handleDeactivate = async (userId: string) => {
    if (confirm('هل أنت متأكد من إلغاء تفعيل هذا المستخدم؟')) {
      await deactivateUser.mutateAsync(userId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إدارة المستخدمين والصلاحيات</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة الحسابات وتعيين الصلاحيات</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="البحث بالمستخدمين..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">المستخدم</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">الدور</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">القسم</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">الحالة</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.full_name_ar.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{user.full_name_ar}</p>
                        {user.department && (
                          <p className="text-xs text-slate-500">{user.department}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      className={`text-sm px-3 py-1 rounded-full border ${roleColors[user.role as UserRole]}`}
                    >
                      {Object.entries(USER_ROLE_LABELS).map(([role, label]) => (
                        <option key={role} value={role}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {user.department || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        user.is_active ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {user.is_active ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          نشط
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          غير نشط
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditUser(user);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeactivate(user.id)}
                        disabled={!user.is_active}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="إلغاء التفعيل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role descriptions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">صلاحيات الأدوار</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(USER_ROLE_LABELS).map(([role, label]) => (
            <RoleDescription key={role} role={role as UserRole} label={label} />
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => {
            setShowEditModal(false);
            setEditUser(null);
          }}
        />
      )}
    </div>
  );
}

function RoleDescription({ role, label }: { role: UserRole; label: string }) {
  const descriptions: Record<UserRole, string[]> = {
    admin: ['إدارة كاملة للنظام', 'إضافة/حذف المستخدمين', 'تعديل الصلاحيات', 'رؤية جميع البيانات'],
    ceo: ['رؤية جميع المشاريع والمهام', 'اعتماد المهام', 'إضافة ملاحظات رسمية', 'تغيير حالات المشاريع'],
    deputy_development: ['رؤية مشاريع قطاع التنمية فقط', 'إضافة مهام ومشاريع', 'تفويض المهام', 'اعتماد المهام'],
    deputy_investment: ['رؤية مشاريع الاستثمار فقط', 'إضافة مهام ومشاريع', 'تفويض المهام', 'اعتماد المهام'],
    development_manager: ['رؤية مشاريعه المخصصة فقط', 'إضافة مهام', 'تحديث التقدم'],
    monitoring_officer: ['رؤية جميع البيانات', 'إضافة تقارير وملاحظات', 'تحديث التقدم', 'لا يمكن الحذف أو الاعتماد'],
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg">
      <h3 className="font-medium text-slate-800 mb-2">{label}</h3>
      <ul className="text-xs text-slate-600 space-y-1">
        {descriptions[role].map((desc, i) => (
          <li key={i} className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            {desc}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EditUserModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [formData, setFormData] = useState({
    full_name_ar: user.full_name_ar || '',
    full_name_en: user.full_name_en || '',
    department: user.department || '',
    phone: user.phone || '',
    role: user.role,
    is_active: user.is_active,
  });

  const updateUserProfile = useUpdateUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile.mutateAsync({ id: user.id, updates: formData });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">تعديل بيانات المستخدم</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الاسم (عربي)</label>
              <input
                type="text"
                value={formData.full_name_ar}
                onChange={(e) => setFormData({ ...formData, full_name_ar: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الاسم (إنجليزي)</label>
              <input
                type="text"
                value={formData.full_name_en}
                onChange={(e) => setFormData({ ...formData, full_name_en: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">القسم/الإدارة</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الدور</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {Object.entries(USER_ROLE_LABELS).map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="is_active" className="text-sm text-slate-600">
              الحساب نشط
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={updateUserProfile.isPending}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {updateUserProfile.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
