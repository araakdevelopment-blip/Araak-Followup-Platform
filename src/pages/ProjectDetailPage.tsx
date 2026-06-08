import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useProject,
  useTasks,
  useUpdateProject,
  useComments,
  useCreateComment,
  useKPIs,
  useUpdateKPI,
  useProgressUpdates,
  useCreateProgressUpdate,
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight,
  Calendar,
  Users,
  TrendingUp,
  MessageSquare,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit,
  ChevronLeft,
  BarChart3,
  Send,
  FileText,
  Upload,
} from 'lucide-react';
import {
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  ProjectStatus,
} from '../types/database';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'kpi' | 'comments' | 'updates'>('overview');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const { data: project, isLoading } = useProject(id!);
  const { data: tasks } = useTasks(id);
  const { data: comments } = useComments(id);
  const { data: kpis } = useKPIs(id);
  const { data: progressUpdates } = useProgressUpdates(id);
  const { canApprove, isCEO, profile } = useAuth();

  const updateProject = useUpdateProject();
  const createComment = useCreateComment();
  const updateKPI = useUpdateKPI();
  const createProgressUpdate = useCreateProgressUpdate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">المشروع غير موجود</p>
        <Link to="/projects" className="text-emerald-600 hover:underline mt-2 inline-block">
          العودة إلى المشاريع
        </Link>
      </div>
    );
  }

  const statusColors =
    PROJECT_STATUS_COLORS[project.status as ProjectStatus] || PROJECT_STATUS_COLORS.on_track;
  const statusLabel = PROJECT_STATUS_LABELS[project.status as ProjectStatus] || project.status;

  const daysRemaining = Math.ceil(
    (new Date(project.target_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const taskStats = {
    total: tasks?.length || 0,
    completed: tasks?.filter((t) => t.status === 'completed').length || 0,
    delayed: tasks?.filter((t) => t.status === 'delayed').length || 0,
    inProgress: tasks?.filter((t) => t.status === 'in_progress').length || 0,
  };

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    await updateProject.mutateAsync({ id: id!, updates: { status: newStatus } });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/projects" className="text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <ArrowRight className="w-4 h-4" />
          <span>المشاريع</span>
        </Link>
        <ChevronLeft className="w-4 h-4 text-slate-300" />
        <span className="text-slate-800 font-medium">{project.name_ar}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: project.strategic_track?.color || '#3B82F6' }}
              >
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{project.code}</p>
                <h1 className="text-2xl font-bold text-slate-800">{project.name_ar}</h1>
                {project.name_en && <p className="text-slate-500">{project.name_en}</p>}
              </div>
            </div>
            {project.description && (
              <p className="text-slate-600 mt-4 max-w-2xl">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isCEO && (
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="on_track">يسير وفق الخطة</option>
                <option value="at_risk">معرض للخطر</option>
                <option value="critical">حرج</option>
                <option value="completed">مكتمل</option>
                <option value="postponed">مؤجل</option>
                <option value="cancelled">ملغي</option>
              </select>
            )}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${statusColors.bg} ${statusColors.text}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusColors.dot}`} />
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Calendar className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">تاريخ البداية</p>
              <p className="text-sm font-medium text-slate-800">
                {new Date(project.start_date).toLocaleDateString('ar-SA')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">
                {daysRemaining > 0 ? 'الأيام المتبقية' : 'الأيام المتأخرة'}
              </p>
              <p
                className={`text-sm font-medium ${
                  daysRemaining < 0 ? 'text-red-600' : 'text-slate-800'
                }`}
              >
                {Math.abs(daysRemaining)} يوم
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Users className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">المسؤول</p>
              <p className="text-sm font-medium text-slate-800">
                {project.owner?.full_name_ar || 'غير محدد'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">التقدم</p>
              <p className="text-sm font-medium text-slate-800">{project.progress_percentage}%</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-500">نسبة الإنجاز</span>
            <span className="font-medium text-slate-700">{project.progress_percentage}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${project.progress_percentage}%` }}
            />
          </div>
        </div>

        {/* CEO Notes */}
        {project.ceo_notes && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800 mb-1">ملاحظات الرئيس التنفيذي</p>
            <p className="text-amber-700">{project.ceo_notes}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: TrendingUp },
            { id: 'tasks', label: `المهام (${taskStats.total})`, icon: CheckCircle2 },
            { id: 'updates', label: 'التحديثات', icon: FileText },
            { id: 'kpi', label: 'المؤشرات', icon: BarChart3 },
            { id: 'comments', label: 'التعليقات', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm text-slate-500 mb-2">المهام المكتملة</h3>
            <p className="text-3xl font-bold text-emerald-600">{taskStats.completed}</p>
            <p className="text-xs text-slate-400 mt-1">من {taskStats.total} مهمة</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm text-slate-500 mb-2">قيد التنفيذ</h3>
            <p className="text-3xl font-bold text-blue-600">{taskStats.inProgress}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm text-slate-500 mb-2">متأخرة</h3>
            <p className="text-3xl font-bold text-red-600">{taskStats.delayed}</p>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-medium text-slate-800">قائمة المهام</h3>
            <Link
              to={`/tasks/new?project=${id}`}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              <span>مهمة جديدة</span>
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {tasks?.map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{task.title_ar}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400">{task.code}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
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
                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm ${
                      task.status === 'completed'
                        ? 'text-emerald-600'
                        : task.status === 'delayed'
                        ? 'text-red-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${task.progress_percentage}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
            {(!tasks || tasks.length === 0) && (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد مهام بعد</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'updates' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-medium text-slate-800">تحديثات التقدم</h3>
            <button
              onClick={() => setShowUpdateModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تحديث</span>
            </button>
          </div>
          <div className="p-4 space-y-4">
            {progressUpdates?.map((update) => (
              <div key={update.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-700 text-xs font-bold">
                        {update.user?.full_name_ar?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{update.user?.full_name_ar}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(update.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      update.update_type === 'progress'
                        ? 'bg-blue-100 text-blue-700'
                        : update.update_type === 'milestone'
                        ? 'bg-emerald-100 text-emerald-700'
                        : update.update_type === 'issue'
                        ? 'bg-red-100 text-red-700'
                        : update.update_type === 'report'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {update.update_type === 'progress' && 'تقدم'}
                    {update.update_type === 'milestone' && 'إنجاز'}
                    {update.update_type === 'issue' && 'مشكلة'}
                    {update.update_type === 'report' && 'تقرير'}
                    {update.update_type === 'note' && 'ملاحظة'}
                  </span>
                </div>
                <h4 className="font-medium text-slate-800 mb-1">{update.title}</h4>
                {update.content && <p className="text-sm text-slate-600">{update.content}</p>}
                {update.progress_before !== undefined && update.progress_after !== undefined && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <span className="text-slate-500">التقدم:</span>
                    <span className="text-slate-600">{update.progress_before}%</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-emerald-600 font-medium">{update.progress_after}%</span>
                  </div>
                )}
              </div>
            ))}
            {(!progressUpdates || progressUpdates.length === 0) && (
              <div className="text-center py-8 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد تحديثات بعد</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'kpi' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-medium text-slate-800">مؤشرات الأداء الرئيسية</h3>
          </div>
          <div className="p-4 space-y-4">
            {kpis?.map((kpi) => (
              <div key={kpi.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-slate-800">{kpi.name_ar}</h4>
                    {kpi.description && (
                      <p className="text-sm text-slate-500">{kpi.description}</p>
                    )}
                  </div>
                  <span className="text-lg font-bold text-emerald-600">
                    {kpi.actual_value} / {kpi.target_value}
                    {kpi.unit && <span className="text-sm text-slate-500"> {kpi.unit}</span>}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        ((kpi.actual_value / kpi.target_value) * 100) | 0,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {(!kpis || kpis.length === 0) && (
              <div className="text-center py-8 text-slate-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد مؤشرات أداء</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'comments' && (
        <CommentsSection projectId={id!} comments={comments || []} />
      )}

      {/* Progress Update Modal */}
      {showUpdateModal && (
        <ProgressUpdateModal
          projectId={id!}
          currentProgress={project.progress_percentage}
          onClose={() => setShowUpdateModal(false)}
        />
      )}
    </div>
  );
}

function CommentsSection({
  projectId,
  comments,
}: {
  projectId: string;
  comments: any[];
}) {
  const [newComment, setNewComment] = useState('');
  const [isOfficial, setIsOfficial] = useState(false);
  const { profile } = useAuth();
  const createComment = useCreateComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await createComment.mutateAsync({
      content: newComment,
      project_id: projectId,
      is_official_note: isOfficial,
    });
    setNewComment('');
    setIsOfficial(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-medium text-slate-800">التعليقات والملاحظات</h3>
      </div>
      <div className="p-4 space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`p-4 rounded-lg ${
              comment.is_official_note
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-slate-50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 text-xs font-bold">
                    {comment.user?.full_name_ar?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{comment.user?.full_name_ar}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(comment.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
              {comment.is_official_note && (
                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">
                  ملاحظة رسمية
                </span>
              )}
            </div>
            <p className="text-slate-700 whitespace-pre-wrap">{comment.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id="official"
            checked={isOfficial}
            onChange={(e) => setIsOfficial(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="official" className="text-sm text-slate-600">
            ملاحظة رسمية
          </label>
        </div>
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder="أضف تعليقاً..."
          />
          <button
            type="submit"
            disabled={!newComment.trim() || createComment.isPending}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

function ProgressUpdateModal({
  projectId,
  currentProgress,
  onClose,
}: {
  projectId: string;
  currentProgress: number;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    update_type: 'progress' as 'progress' | 'note' | 'report' | 'milestone' | 'issue',
    progress_after: currentProgress,
  });
  const createProgressUpdate = useCreateProgressUpdate();
  const updateProject = useUpdateProject();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createProgressUpdate.mutateAsync({
        project_id: projectId,
        update_type: formData.update_type,
        title: formData.title,
        content: formData.content,
        progress_before: currentProgress,
        progress_after: formData.progress_after,
      });

      // Update project progress if changed
      if (formData.progress_after !== currentProgress) {
        await updateProject.mutateAsync({
          id: projectId,
          updates: { progress_percentage: formData.progress_after },
        });
      }

      onClose();
    } catch (error) {
      console.error('Error creating progress update:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">إضافة تحديث تقدم</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              نوع التحديث <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.update_type}
              onChange={(e) =>
                setFormData({ ...formData, update_type: e.target.value as any })
              }
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="progress">تقدم</option>
              <option value="milestone">إنجاز مرحلة</option>
              <option value="issue">مشكلة/عائق</option>
              <option value="report">تقرير</option>
              <option value="note">ملاحظة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              العنوان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="ملخص التحديث"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">التفاصيل</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="وصف تفصيلي للتحديث..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              نسبة الإنجاز: {formData.progress_after}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress_after}
              onChange={(e) => setFormData({ ...formData, progress_after: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>الحالي: {currentProgress}%</span>
              <span>الجديد: {formData.progress_after}%</span>
            </div>
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
              disabled={loading || !formData.title.trim()}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'إضافة التحديث'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
