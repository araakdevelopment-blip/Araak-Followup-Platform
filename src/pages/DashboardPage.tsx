import { useDashboardStats, useProjects, useTasks } from '../hooks/useData';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ListTodo,
  FolderKanban,
  Users,
} from 'lucide-react';
import {
 PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '../types/database';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const statusData = stats
    ? [
        { name: 'يسير وفق الخطة', value: stats.onTrackProjects, color: '#10B981' },
        { name: 'معرض للخطر', value: stats.atRiskProjects, color: '#F59E0B' },
        { name: 'حرج', value: stats.criticalProjects, color: '#EF4444' },
        { name: 'مكتمل', value: stats.completedProjects, color: '#3B82F6' },
      ]
    : [];

  const taskStatusData = tasks
    ? [
        { name: 'مكتمل', value: tasks.filter((t) => t.status === 'completed').length, color: '#10B981' },
        { name: 'قيد التنفيذ', value: tasks.filter((t) => t.status === 'in_progress').length, color: '#3B82F6' },
        { name: 'متأخر', value: tasks.filter((t) => t.status === 'delayed').length, color: '#EF4444' },
        { name: 'قيد الانتظار', value: tasks.filter((t) => t.status === 'pending').length, color: '#94A3B8' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المشاريع"
          value={stats?.totalProjects || 0}
          subtitle={`${stats?.completedProjects || 0} مكتمل`}
          icon={FolderKanban}
          color="bg-blue-500"
        />
        <StatCard
          title="المشاريع الحرجة"
          value={stats?.criticalProjects || 0}
          subtitle="تحتاج تدخل فوري"
          icon={AlertTriangle}
          color="bg-red-500"
          urgent={stats?.criticalProjects ? stats.criticalProjects > 0 : false}
        />
        <StatCard
          title="المهام المتأخرة"
          value={stats?.delayedTasks || 0}
          subtitle={`${stats?.urgentTasks || 0} عاجلة`}
          icon={Clock}
          color="bg-amber-500"
          urgent={stats?.delayedTasks ? stats.delayedTasks > 0 : false}
        />
        <StatCard
          title="نسبة الإنجاز"
          value={`${stats?.avgProjectProgress || 0}%`}
          subtitle="متوسط التقدم"
          icon={TrendingUp}
          color="bg-emerald-500"
        />
      </div>

      {/* RAG Status Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">نظام إشارات الحالة (RAG)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard
            status="on_track"
            label="أخضر - وفق الخطة"
            count={stats?.onTrackProjects || 0}
            description="المشاريع التي تسير وفق الجدول الزمني المحدد"
            color="bg-emerald-500"
            textColor="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <StatusCard
            status="at_risk"
            label="أصفر - معرض للخطر"
            count={stats?.atRiskProjects || 0}
            description="تجاوز الموعد النهائي بـ 48 ساعة أو انحراف بسيط"
            color="bg-amber-500"
            textColor="text-amber-600"
            bgColor="bg-amber-50"
          />
          <StatusCard
            status="critical"
            label="أحمر - حرج"
            count={stats?.criticalProjects || 0}
            description="عوائق جوهرية تستوجب تدخل الرئيس التنفيذي"
            color="bg-red-500"
            textColor="text-red-600"
            bgColor="bg-red-50"
          />
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project status pie chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">توزيع حالات المشاريع</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks status pie chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">توزيع حالات المهام</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strategic Tracks Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">تقدم المسارات الاستراتيجية</h2>
        <div className="space-y-4">
          {stats?.trackStats.map((track) => (
            <div key={track.id} className="flex items-center gap-4">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: track.color || '#3B82F6' }}
              />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700">{track.name_ar}</span>
                  <span className="text-sm text-slate-500">{track.avgProgress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${track.avgProgress}%`,
                      backgroundColor: track.color || '#3B82F6',
                    }}
                  />
                </div>
                <div className="flex gap-3 mt-1 text-xs text-slate-500">
                  <span>{track.projectCount} مشروع</span>
                  {track.critical > 0 && (
                    <span className="text-red-500">{track.critical} حرج</span>
                  )}
                  {track.atRisk > 0 && (
                    <span className="text-amber-500">{track.atRisk} معرض للخطر</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent projects */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-800">المشاريع الأخيرة</h2>
          <Link to="/projects" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            عرض الكل
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">
                  المشروع
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">
                  المسار
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">
                  الحالة
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">
                  التقدم
                </th>
              </tr>
            </thead>
            <tbody>
              {projects?.slice(0, 5).map((project) => (
                <tr key={project.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-sm font-medium text-slate-800 hover:text-emerald-600"
                    >
                      {project.name_ar}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-600">
                      {project.strategic_track?.name_ar}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${project.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {project.progress_percentage}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  urgent,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  urgent?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-5 ${
        urgent ? 'border-red-200 bg-red-50/50' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${urgent ? 'text-red-600' : 'text-slate-800'}`}>
            {value}
          </p>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  status,
  label,
  count,
  description,
  color,
  textColor,
  bgColor,
}: {
  status: string;
  label: string;
  count: number;
  description: string;
  color: string;
  textColor: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-xl p-5 border border-slate-200`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-4 h-4 rounded-full ${color}`} />
        <span className="font-medium text-slate-800">{label}</span>
      </div>
      <p className={`text-4xl font-bold ${textColor} mb-2`}>{count}</p>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = PROJECT_STATUS_COLORS[status as keyof typeof PROJECT_STATUS_COLORS] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    dot: 'bg-gray-500',
  };
  const label = PROJECT_STATUS_LABELS[status as keyof typeof PROJECT_STATUS_LABELS] || status;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}
