import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useTask,
  useTasks,
  useUpdateTask,
  useComments,
  useCreateComment,
  useApproveTask,
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  Send,
  Link2,
  Edit,
  Play,
  Pause,
  CheckSquare,
} from 'lucide-react';
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  PROJECT_STATUS_COLORS,
  TaskStatus,
  TaskPriority,
} from '../types/database';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: task, isLoading } = useTask(id!);
  const { data: allTasks } = useTasks(task?.project_id);
  const updateTask = useUpdateTask();
  const approveTask = useApproveTask();
  const { canApprove, profile, isCEO, isDeputy } = useAuth();

  const [newComment, setNewComment] = useState('');
  const createComment = useCreateComment();
  const { data: comments } = useComments(undefined, id);
  const [progressInput, setProgressInput] = useState(task?.progress_percentage || 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">المهمة غير موجودة</p>
        <Link to="/tasks" className="text-emerald-600 hover:underline mt-2 inline-block">
          العودة إلى المهام
        </Link>
      </div>
    );
  }

  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'completed';
  const canApproveTask =
    (canApprove || task.delegated_by === profile?.id) &&
    task.requires_approval &&
    task.status === 'awaiting_approval';

  const handleStatusChange = async (newStatus: TaskStatus) => {
    await updateTask.mutateAsync({ id: id!, updates: { status: newStatus } });
  };

  const handleProgressUpdate = async () => {
    await updateTask.mutateAsync({
      id: id!,
      updates: { progress_percentage: progressInput },
    });
  };

  const handleApprove = async (approved: boolean) => {
    await approveTask.mutateAsync({ id: id!, approved });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await createComment.mutateAsync({
      content: newComment,
      task_id: id!,
      is_official_note: false,
    });
    setNewComment('');
  };

  const taskStats = {
    pending: allTasks?.filter((t) => t.status === 'pending').length || 0,
    inProgress: allTasks?.filter((t) => t.status === 'in_progress').length || 0,
    completed: allTasks?.filter((t) => t.status === 'completed').length || 0,
    delayed: allTasks?.filter((t) => t.status === 'delayed').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/tasks" className="text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <ArrowRight className="w-4 h-4" />
          <span>المهام</span>
        </Link>
        <ChevronLeft className="w-4 h-4 text-slate-300" />
        <span className="text-slate-800 font-medium">{task.title_ar}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">{task.code}</p>
                <h1 className="text-2xl font-bold text-slate-800">{task.title_ar}</h1>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    task.priority === 'urgent'
                      ? 'bg-red-100 text-red-700'
                      : task.priority === 'high'
                      ? 'bg-amber-100 text-amber-700'
                      : task.priority === 'medium'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {TASK_PRIORITY_LABELS[task.priority as TaskPriority]}
                </span>
              </div>
            </div>

            {task.description && (
              <p className="text-slate-600 mb-4">{task.description}</p>
            )}

            {task.project && (
              <Link
                to={`/projects/${task.project.id}`}
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm"
              >
                <ArrowRight className="w-4 h-4" />
                <span>{task.project.name_ar}</span>
              </Link>
            )}

            {/* Progress section */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-700">نسبة الإنجاز</label>
                <span className="text-sm text-slate-500">{task.progress_percentage}%</span>
              </div>
              <div className="flex gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressInput}
                  onChange={(e) => setProgressInput(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <button
                  onClick={handleProgressUpdate}
                  disabled={progressInput === task.progress_percentage}
                  className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  تحديث
                </button>
              </div>
            </div>
          </div>

          {/* Status actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">تغيير الحالة</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => handleStatusChange('pending')}
                className={`p-3 rounded-lg border transition-all ${
                  task.status === 'pending'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Pause className="w-5 h-5 mx-auto text-slate-500 mb-1" />
                <span className="text-sm">{TASK_STATUS_LABELS.pending}</span>
              </button>
              <button
                onClick={() => handleStatusChange('in_progress')}
                className={`p-3 rounded-lg border transition-all ${
                  task.status === 'in_progress'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Play className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                <span className="text-sm">{TASK_STATUS_LABELS.in_progress}</span>
              </button>
              <button
                onClick={() => handleStatusChange('awaiting_approval')}
                className={`p-3 rounded-lg border transition-all ${
                  task.status === 'awaiting_approval'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <CheckSquare className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                <span className="text-sm">{TASK_STATUS_LABELS.awaiting_approval}</span>
              </button>
              <button
                onClick={() => handleStatusChange('completed')}
                className={`p-3 rounded-lg border transition-all ${
                  task.status === 'completed'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                <span className="text-sm">{TASK_STATUS_LABELS.completed}</span>
              </button>
            </div>

            {canApproveTask && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600 mb-2">المهمة بانتظار الاعتماد</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(true)}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    اعتماد وإتمام
                  </button>
                  <button
                    onClick={() => handleApprove(false)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    رفض وإعادة للمراجعة
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dependencies */}
          {task.dependencies && task.dependencies.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-800">المهام المرتبطة</h2>
              </div>
              <div className="space-y-2">
                {task.dependencies.map((dep: any) => (
                  <Link
                    key={dep.id}
                    to={`/tasks/${dep.depends_on_task_id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                  >
                    <span className="text-sm text-slate-700">
                      {dep.depends_on_task?.title_ar}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        dep.depends_on_task?.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {TASK_STATUS_LABELS[dep.depends_on_task?.status as TaskStatus] || ''}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-medium text-slate-800">التعليقات</h3>
            </div>
            <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
              {comments?.map((comment) => (
                <div key={comment.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {comment.user?.full_name_ar}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(comment.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{comment.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} className="p-4 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="أضف تعليقاً..."
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">الحالة الحالية</h3>
            <div
              className={`text-center p-4 rounded-lg ${
                task.status === 'completed'
                  ? 'bg-emerald-50'
                  : task.status === 'delayed'
                  ? 'bg-red-50'
                  : task.status === 'awaiting_approval'
                  ? 'bg-amber-50'
                  : 'bg-blue-50'
              }`}
            >
              <p
                className={`text-2xl font-bold ${
                  task.status === 'completed'
                    ? 'text-emerald-600'
                    : task.status === 'delayed'
                    ? 'text-red-600'
                    : task.status === 'awaiting_approval'
                    ? 'text-amber-600'
                    : 'text-blue-600'
                }`}
              >
                {TASK_STATUS_LABELS[task.status as TaskStatus]}
              </p>
            </div>
          </div>

          {/* Task info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">تفاصيل المهمة</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">تاريخ البداية</span>
                <span className="text-sm font-medium text-slate-800">
                  {new Date(task.start_date).toLocaleDateString('ar-SA')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">تاريخ الاستحقاق</span>
                <span
                  className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-slate-800'}`}
                >
                  {new Date(task.due_date).toLocaleDateString('ar-SA')}
                </span>
              </div>
              {task.estimated_hours && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">الساعات المقدرة</span>
                  <span className="text-sm font-medium text-slate-800">
                    {task.estimated_hours} ساعة
                  </span>
                </div>
              )}
              {task.actual_hours && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">الساعات الفعلية</span>
                  <span className="text-sm font-medium text-slate-800">
                    {task.actual_hours} ساعة
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* People */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">الأشخاص</h3>
            <div className="space-y-3">
              {task.assignee && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">المسؤول</p>
                    <p className="text-sm font-medium text-slate-800">
                      {task.assignee.full_name_ar}
                    </p>
                  </div>
                </div>
              )}
              {task.delegator && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">المكلف بالمهمة</p>
                    <p className="text-sm font-medium text-slate-800">
                      {task.delegator.full_name_ar}
                    </p>
                  </div>
                </div>
              )}
              {task.approved_by && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-200 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">اعتمدت بواسطة</p>
                    <p className="text-sm font-medium text-slate-800">
                      {/* Would need to fetch approved_by user */}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audit info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">معلومات النظام</h3>
            <div className="space-y-2 text-sm text-slate-500">
              <p>تاريخ الإنشاء: {new Date(task.created_at).toLocaleDateString('ar-SA')}</p>
              <p>آخر تحديث: {new Date(task.updated_at).toLocaleDateString('ar-SA')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
