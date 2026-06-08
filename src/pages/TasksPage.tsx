import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useTasks,
  useProjects,
  useUsers,
  useCreateTask,
  useUpdateTask,
  useApproveTask,
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ArrowRight,
  Send,
} from 'lucide-react';
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TaskStatus,
  TaskPriority,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
} from '../types/database';

export function TasksPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: tasks, isLoading } = useTasks(projectId || undefined);
  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  const { canCreate, profile } = useAuth();

  const filteredTasks = tasks?.filter((t) => {
    const matchesSearch = t.title_ar.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;
    const matchesPriority = !priorityFilter || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const myTasks = filteredTasks?.filter((t) => t.assigned_to === profile?.id);
  const otherTasks = filteredTasks?.filter((t) => t.assigned_to !== profile?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">المهام</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة وتتبع المهام والأعمال</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>مهمة جديدة</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="البحث في المهام..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="">كل الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="completed">مكتمل</option>
              <option value="delayed">متأخر</option>
              <option value="awaiting_approval">بانتظار الاعتماد</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="">كل الأولويات</option>
              <option value="urgent">عاجلة</option>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* My Tasks */}
          {myTasks && myTasks.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">مهامي</h2>
              <div className="space-y-3">
                {myTasks.map((task) => (
                  <TaskCard key={task.id} task={task as any} />
                ))}
              </div>
            </div>
          )}

          {/* All Tasks */}
          <div>
            {myTasks && myTasks.length > 0 && (
              <h2 className="text-lg font-semibold text-slate-800 mb-4">جميع المهام</h2>
            )}
            <div className="space-y-3">
              {otherTasks?.map((task) => (
                <TaskCard key={task.id} task={task as any} />
              ))}
            </div>
          </div>

          {filteredTasks?.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">لا توجد مهام</p>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTaskModal
          projects={projects || []}
          users={users || []}
          defaultProject={projectId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  const { canApprove, profile } = useAuth();
  const updateTask = useUpdateTask();
  const approveTask = useApproveTask();

  const isOverdue =
    new Date(task.due_date) < new Date() && task.status !== 'completed';
  const needsApproval = task.requires_approval && task.status === 'awaiting_approval';
  const canApproveTask = canApprove || task.delegated_by === profile?.id;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    await updateTask.mutateAsync({ id: task.id, updates: { status: newStatus } });
  };

  const handleApprove = async (approved: boolean) => {
    await approveTask.mutateAsync({ id: task.id, approved });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <Link to={`/tasks/${task.id}`} className="text-lg font-medium text-slate-800 hover:text-emerald-600">
              {task.title_ar}
            </Link>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  task.priority === 'urgent'
                    ? 'bg-red-100 text-red-700'
                    : task.priority === 'high'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {TASK_PRIORITY_LABELS[task.priority]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span className={isOverdue ? 'text-red-500' : ''}>
                {new Date(task.due_date).toLocaleDateString('ar-SA')}
              </span>
            </span>
            {task.assignee && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{task.assignee.full_name_ar}</span>
              </span>
            )}
            {task.project && (
              <span className="flex items-center gap-1">
                <ArrowRight className="w-4 h-4" />
                <Link
                  to={`/projects/${task.project.id}`}
                  className="hover:text-emerald-600"
                >
                  {task.project.name_ar}
                </Link>
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${task.progress_percentage}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">{task.progress_percentage}%</span>
          </div>
        </div>

        {/* Status and actions */}
        <div className="flex flex-col items-end gap-2">
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            className="text-sm px-3 py-1 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="pending">قيد الانتظار</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="completed">مكتمل</option>
            <option value="delayed">متأخر</option>
            <option value="awaiting_approval">بانتظار الاعتماد</option>
          </select>

          {needsApproval && canApproveTask && (
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(true)}
                className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                اعتماد
              </button>
              <button
                onClick={() => handleApprove(false)}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                رفض
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateTaskModal({
  projects,
  users,
  defaultProject,
  onClose,
}: {
  projects: any[];
  users: any[];
  defaultProject: string | null;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title_ar: '',
    description: '',
    project_id: defaultProject || '',
    assigned_to: '',
    priority: 'medium' as TaskPriority,
    start_date: new Date().toISOString().split('T')[0],
    due_date: '',
    requires_approval: false,
  });
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const createTask = useCreateTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createTask.mutateAsync({
        ...formData,
        code: `TSK-${Date.now()}`,
        delegated_by: profile?.id,
      } as any);
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">إنشاء مهمة جديدة</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              عنوان المهمة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title_ar}
              onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              المشروع <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">اختر المشروع</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name_ar}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">المسؤول</label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">اختر المسؤول</option>
              {users.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.full_name_ar}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الأولوية</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                تاريخ البداية <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                تاريخ الاستحقاق <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requires_approval"
              checked={formData.requires_approval}
              onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="requires_approval" className="text-sm text-slate-600">
              يتطلب اعتماد
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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء المهمة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
