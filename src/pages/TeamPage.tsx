import { useState } from 'react';
import { useUsers, useTasks } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Edit,
} from 'lucide-react';
import { USER_ROLE_LABELS, UserRole } from '../types/database';

export function TeamPage() {
  const { data: users, isLoading } = useUsers();
  const { data: tasks } = useTasks();
  const { isCEO, profile } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const getUserStats = (userId: string) => {
    const userTasks = tasks?.filter((t) => t.assigned_to === userId) || [];
    return {
      total: userTasks.length,
      completed: userTasks.filter((t) => t.status === 'completed').length,
      inProgress: userTasks.filter((t) => t.status === 'in_progress').length,
      delayed: userTasks.filter((t) => t.status === 'delayed').length,
    };
  };

  const roleColors: Record<UserRole, string> = {
    ceo: 'bg-amber-100 text-amber-700 border-amber-200',
    deputy_development: 'bg-blue-100 text-blue-700 border-blue-200',
    deputy_investment: 'bg-purple-100 text-purple-700 border-purple-200',
    development_manager: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    monitoring_officer: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">الفريق</h1>
        <p className="text-slate-500 text-sm mt-1">إدارة أعضاء الفريق والصلاحيات</p>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(USER_ROLE_LABELS).map(([role, label]) => {
          const count = users?.filter((u) => u.role === role).length || 0;
          return (
            <div
              key={role}
              className={`p-4 rounded-xl border ${roleColors[role as UserRole]}`}
            >
              <p className="text-sm opacity-80">{label}</p>
              <p className="text-2xl font-bold mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Team members grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users?.map((user) => {
            const stats = getUserStats(user.id);
            const isSelected = selectedUser === user.id;

            return (
              <div
                key={user.id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                  isSelected
                    ? 'border-emerald-500 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                        {user.full_name_ar.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{user.full_name_ar}</h3>
                        {user.full_name_en && (
                          <p className="text-sm text-slate-500">{user.full_name_en}</p>
                        )}
                      </div>
                    </div>
                    {isCEO && (
                      <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Role badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                      roleColors[user.role]
                    } ${user.is_active ? '' : 'opacity-50'}`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>{USER_ROLE_LABELS[user.role]}</span>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-2 text-sm text-slate-600 mb-4">
                    {user.department && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {user.department}
                      </p>
                    )}
                    {user.phone && (
                      <p className="flex items-center gap-2" dir="ltr">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {user.phone}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                      <p className="text-xs text-slate-500">المهام</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
                      <p className="text-xs text-slate-500">مكتمل</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                      <p className="text-xs text-slate-500">جاري</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{stats.delayed}</p>
                      <p className="text-xs text-slate-500">متأخر</p>
                    </div>
                  </div>

                  {/* Completion rate */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">معدل الإنجاز</span>
                      <span className="font-medium text-slate-700">
                        {stats.total > 0
                          ? Math.round((stats.completed / stats.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-emerald-500 to-emerald-400 rounded-full transition-all"
                        style={{
                          width: `${
                            stats.total > 0
                              ? Math.round((stats.completed / stats.total) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs ${
                        user.is_active ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          user.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      {user.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RACI Matrix explanation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          مصفوفة الصلاحيات (RACI Matrix)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { letter: 'R', label: 'المسؤول (Responsible)', desc: 'من ينفذ العمل فعلياً' },
            { letter: 'A', label: 'المحاسب (Accountable)', desc: 'المسؤول النهائي عن المهمة' },
            { letter: 'C', label: 'المستشار (Consulted)', desc: 'من يجب استشارته قبل التنفيذ' },
            { letter: 'I', label: 'المُبلغ (Informed)', desc: 'من يجب إبلاغه بالنتائج' },
          ].map((item) => (
            <div key={item.letter} className="p-4 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xl font-bold mb-2">
                {item.letter}
              </div>
              <h3 className="font-medium text-slate-800 text-sm">{item.label}</h3>
              <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
