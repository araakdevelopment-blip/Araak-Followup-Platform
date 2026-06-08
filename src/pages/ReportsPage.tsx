import { useState } from 'react';
import {
  useDashboardStats,
  useProjects,
  useTasks,
  useStrategicTracks,
} from '../hooks/useData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
} from 'lucide-react';
import { PROJECT_STATUS_LABELS, TASK_STATUS_LABELS } from '../types/database';

export function ReportsPage() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const { data: stats } = useDashboardStats();
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();
  const { data: tracks } = useStrategicTracks();

  // Compute analytics
  const projectStatusData = projects
    ? Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => ({
        name: label,
        value: projects.filter((p) => p.status === key).length,
        color:
          key === 'on_track'
            ? '#10B981'
            : key === 'at_risk'
            ? '#F59E0B'
            : key === 'critical'
            ? '#EF4444'
            : key === 'completed'
            ? '#3B82F6'
            : '#94A3B8',
      }))
    : [];

  const taskStatusData = tasks
    ? Object.entries(TASK_STATUS_LABELS).map(([key, label]) => ({
        name: label,
        value: tasks.filter((t) => t.status === key).length,
      }))
    : [];

  const trackProgressData = tracks?.map((track) => {
    const trackProjects = projects?.filter((p) => p.strategic_track_id === track.id) || [];
    return {
      name: track.name_ar.split(' ').slice(0, 2).join(' '),
      completed: trackProjects.filter((p) => p.status === 'completed').length,
      inProgress: trackProjects.filter((p) => p.status === 'in_progress' || p.status === 'on_track').length,
      delayed: trackProjects.filter((p) => p.status === 'critical' || p.status === 'at_risk').length,
      color: track.color,
    };
  }) || [];

  const priorityData = tasks
    ? [
        { name: 'عاجلة', value: tasks.filter((t) => t.priority === 'urgent').length, color: '#EF4444' },
        { name: 'عالية', value: tasks.filter((t) => t.priority === 'high').length, color: '#F59E0B' },
        { name: 'متوسطة', value: tasks.filter((t) => t.priority === 'medium').length, color: '#3B82F6' },
        { name: 'منخفضة', value: tasks.filter((t) => t.priority === 'low').length, color: '#94A3B8' },
      ]
    : [];

  // Delayed tasks analysis
  const delayedTasksAnalysis = tasks
    ?.filter((t) => t.status === 'delayed')
    .map((t) => ({
      name: t.title_ar.substring(0, 20),
      daysDelayed: Math.ceil(
        (new Date().getTime() - new Date(t.due_date).getTime()) / (1000 * 60 * 60 * 24)
      ),
      priority: t.priority,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">التقارير والتحليلات</h1>
          <p className="text-slate-500 text-sm mt-1">مؤشرات الأداء وتحليل البيانات</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="week">آخر أسبوع</option>
            <option value="month">آخر شهر</option>
            <option value="quarter">آخر ربع سنة</option>
            <option value="year">آخر سنة</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <Download className="w-5 h-5" />
            <span>تصدير</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="إجمالي المشاريع"
          value={stats?.totalProjects || 0}
          change={'+2'}
          positive
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <SummaryCard
          title="معدل الإنجاز"
          value={`${stats?.avgProjectProgress || 0}%`}
          change={'+5%'}
          positive
          icon={CheckCircle2}
          color="bg-emerald-500"
        />
        <SummaryCard
          title="مشاريع حرجة"
          value={stats?.criticalProjects || 0}
          change={stats?.criticalProjects && stats.criticalProjects > 0 ? '!' : '0'}
          positive={false}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <SummaryCard
          title="مهام متأخرة"
          value={stats?.delayedTasks || 0}
          change={stats?.delayedTasks && stats.delayedTasks > 0 ? '!' : '0'}
          positive={false}
          icon={Clock}
          color="bg-amber-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">توزيع حالات المشاريع</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Priority Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">توزيع أولويات المهام</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Track Progress Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">تقدم المسارات الاستراتيجية</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trackProgressData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#10B981" name="مكتمل" />
              <Bar dataKey="inProgress" stackId="a" fill="#3B82F6" name="قيد التنفيذ" />
              <Bar dataKey="delayed" stackId="a" fill="#EF4444" name="متأخر" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">أداء المسارات الاستراتيجية</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 font-medium text-slate-500">المسار</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500">المشاريع</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500">مكتمل</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500">حرج</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500">متوسط التقدم</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {stats?.trackStats.map((track) => (
                <tr key={track.id} className="border-b border-slate-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: track.color }}
                      />
                      <span className="font-medium text-slate-800">{track.name_ar}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">{track.projectCount}</td>
                  <td className="py-3 px-4 text-center text-emerald-600">
                    {track.projectCount > 0
                      ? Math.round(
                          (((projects?.filter(
                            (p) =>
                              p.strategic_track_id === track.id && p.status === 'completed'
                          ).length || 0) /
                            track.projectCount) *
                            100)
                        )
                      : 0}
                    %
                  </td>
                  <td className="py-3 px-4 text-center">
                    {track.critical > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        {track.critical}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${track.avgProgress}%`,
                            backgroundColor: track.color,
                          }}
                        />
                      </div>
                      <span className="text-slate-600">{track.avgProgress}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        track.critical > 0
                          ? 'bg-red-100 text-red-700'
                          : track.atRisk > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {track.critical > 0
                        ? 'يحتاج تدخل'
                        : track.atRisk > 0
                        ? 'معرض للخطر'
                        : 'سليم'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delayed Tasks Analysis */}
      {delayedTasksAnalysis.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">تحليل المهام المتأخرة</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={delayedTasksAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="daysDelayed" fill="#EF4444" name="أيام التأخير" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  change,
  positive,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <div className="flex items-center gap-1 mt-1">
            {positive ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span
              className={`text-xs font-medium ${
                positive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {change}
            </span>
          </div>
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
