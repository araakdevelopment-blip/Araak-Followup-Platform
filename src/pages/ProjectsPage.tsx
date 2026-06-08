import { useState } from 'react';
import { useProjects, useStrategicTracks, useCreateProject, useUsers } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Calendar, Users } from 'lucide-react';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, ProjectStatus } from '../types/database';
import { Link } from 'react-router-dom';

export function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [trackFilter, setTrackFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: projects, isLoading, refetch } = useProjects(trackFilter || undefined, statusFilter || undefined);
  const { data: tracks } = useStrategicTracks();
  const { data: users } = useUsers();
  const { canCreate } = useAuth();

  const filteredProjects = projects?.filter((p) =>
    p.name_ar.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">المشاريع</h1>
          <p className="text-slate-500 text-sm">إدارة ومتابعة المشاريع الاستراتيجية</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>مشروع جديد</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-500">جاري تحميل البيانات...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects?.map((project: any) => (
            <div key={project.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg text-slate-800 mb-2">{project.name_ar}</h3>
              <div className="text-sm text-slate-500 mb-4">
                الحالة: <span className="font-medium text-emerald-600">{PROJECT_STATUS_LABELS[project.status as ProjectStatus]}</span>
              </div>
              <div className="text-xs text-slate-400 border-t pt-3">
                المسار: {project.strategic_track?.name_ar || 'غير محدد'}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          tracks={tracks || []}
          users={users || []}
          onClose={() => {
            setShowCreateModal(false);
            refetch(); // تحديث القائمة فور الإغلاق
          }}
        />
      )}
    </div>
  );
}

function CreateProjectModal({ tracks, users, onClose }: any) {
  const [formData, setFormData] = useState({
    name_ar: '',
    strategic_track_id: '',
    owner_id: '',
    start_date: new Date().toISOString().split('T')[0],
    target_end_date: '',
    status: 'on_track' // القيمة الافتراضية هنا تحل مشكلة الـ null
  });
  const [loading, setLoading] = useState(false);
  const createProject = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createProject.mutateAsync({
        ...formData,
        code: `PRJ-${Date.now().toString().slice(-4)}`,
        // التأكد من إرسال NULL بدلاً من النصوص الفارغة لقاعدة البيانات
        strategic_track_id: formData.strategic_track_id || null,
        owner_id: formData.owner_id || null,
      });
      onClose();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl">
        <h2 className="font-bold text-lg border-b pb-3">إنشاء مشروع جديد</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700">اسم المشروع</label>
          <input required className="w-full border p-2 rounded mt-1" onChange={(e) => setFormData({...formData, name_ar: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">المسار الاستراتيجي</label>
          <select className="w-full border p-2 rounded mt-1" onChange={(e) => setFormData({...formData, strategic_track_id: e.target.value})}>
            <option value="">اختر المسار...</option>
            {tracks.map((t: any) => <option key={t.id} value={t.id}>{t.name_ar}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 border p-2 rounded hover:bg-slate-50">إلغاء</button>
          <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700">
            {loading ? 'جاري الحفظ...' : 'حفظ المشروع'}
          </button>
        </div>
      </form>
    </div>
  );
}