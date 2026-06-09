import { useState, useCallback } from 'react';
import {
  useDocumentFolders,
  useDocuments,
  useCreateFolder,
  useUploadDocument,
  useDeleteDocument,
  useProjects,
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import {
  FolderOpen,
  File,
  FileText,
  FileSpreadsheet,
  Image,
  Download,
  Upload,
  Plus,
  Trash2,
  ChevronLeft,
  Search,
  Grid,
  List,
  Eye,
  Globe,
  Lock,
  MoreHorizontal,
} from 'lucide-react';

const FILE_ICONS: Record<string, React.ElementType> = {
  'application/pdf': FileText,
  'image/': Image,
  'spreadsheet': FileSpreadsheet,
  'excel': FileSpreadsheet,
  'default': File,
};

function getFileIcon(fileType?: string) {
  if (!fileType) return File;
  for (const [key, Icon] of Object.entries(FILE_ICONS)) {
    if (key !== 'default' && fileType.includes(key)) return Icon;
  }
  return FILE_ICONS.default;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPage() {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'الرئيسية' },
  ]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [projectIdFilter, setProjectIdFilter] = useState('');

  const { data: folders } = useDocumentFolders(currentFolder || undefined, projectIdFilter || undefined);
  const { data: documents } = useDocuments(currentFolder || undefined, projectIdFilter || undefined);
  const { data: projects } = useProjects();
  const { profile } = useAuth();

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolder(folderId);
    setFolderPath((prev) => [...prev, { id: folderId, name: folderName }]);
  };

  const navigateUp = () => {
    if (folderPath.length <= 1) return;
    const newPath = folderPath.slice(0, -1);
    setFolderPath(newPath);
    setCurrentFolder(newPath[newPath.length - 1].id);
  };

  const filteredDocs = documents?.filter((d) =>
    d.title_ar.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">مركز الوثائق</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة ومشاركة الملفات والوثائق</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>رفع ملف</span>
          </button>
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            <span>مجلد جديد</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            {folderPath.map((item, index) => (
              <span key={index} className="flex items-center gap-2">
                {index > 0 && <ChevronLeft className="w-4 h-4 text-slate-300" />}
                <button
                  onClick={() => {
                    if (index < folderPath.length - 1) {
                      const newPath = folderPath.slice(0, index + 1);
                      setFolderPath(newPath);
                      setCurrentFolder(item.id);
                    }
                  }}
                  className={`hover:text-emerald-600 ${
                    index === folderPath.length - 1 ? 'text-slate-800 font-medium' : 'text-slate-500'
                  }`}
                >
                  {item.name}
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في الملفات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-3 pr-9 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={projectIdFilter}
              onChange={(e) => setProjectIdFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">كل المشاريع</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>{p.name_ar}</option>
              ))}
            </select>
            <div className="bg-slate-100 rounded-lg p-1 flex">
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 rounded-md ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded-md ${view === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Folders */}
      {folders && folders.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-3">المجلدات</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => navigateToFolder(folder.id, folder.name_ar)}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <FolderOpen className="w-10 h-10 text-amber-500" />
                <span className="text-sm text-slate-700 font-medium truncate w-full text-center">{folder.name_ar}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 mb-3">
          الملفات ({filteredDocs?.length || 0})
        </h2>

        {view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredDocs?.map((doc) => {
              const Icon = getFileIcon(doc.file_type);
              return (
                <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 rounded-lg ${
                      doc.file_type?.includes('pdf') ? 'bg-red-100' :
                      doc.file_type?.includes('image') ? 'bg-purple-100' :
                      doc.file_type?.includes('sheet') || doc.file_type?.includes('excel') ? 'bg-green-100' :
                      'bg-blue-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        doc.file_type?.includes('pdf') ? 'text-red-600' :
                        doc.file_type?.includes('image') ? 'text-purple-600' :
                        doc.file_type?.includes('sheet') || doc.file_type?.includes('excel') ? 'text-green-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 hover:bg-slate-100 rounded-lg" title="عرض">
                        <Eye className="w-4 h-4 text-slate-400" />
                      </a>
                      <a href={doc.file_url} download
                        className="p-1.5 hover:bg-slate-100 rounded-lg" title="تحميل">
                        <Download className="w-4 h-4 text-slate-400" />
                      </a>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-slate-800 line-clamp-2 mb-1">{doc.title_ar}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{formatFileSize(doc.file_size)}</span>
                    {doc.is_public ? (
                      <Globe className="w-3.5 h-3.5 text-emerald-500" title="عام" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400" title="خاص" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {(doc.uploader as any)?.full_name_ar} · {new Date(doc.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">الملف</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">النوع</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">الحجم</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">رفع بواسطة</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">التاريخ</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs?.map((doc) => {
                  const Icon = getFileIcon(doc.file_type);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-800">{doc.title_ar}</p>
                            <p className="text-xs text-slate-400">v{doc.version}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">{doc.file_type?.split('/').pop() || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{formatFileSize(doc.file_size)}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{(doc.uploader as any)?.full_name_ar}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{new Date(doc.created_at).toLocaleDateString('ar-SA')}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 hover:bg-slate-100 rounded-lg" title="عرض">
                            <Eye className="w-4 h-4 text-slate-400" />
                          </a>
                          <a href={doc.file_url} download
                            className="p-1.5 hover:bg-slate-100 rounded-lg" title="تحميل">
                            <Download className="w-4 h-4 text-slate-400" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {(!filteredDocs || filteredDocs.length === 0) && (!folders || folders.length === 0) && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <FolderOpen className="w-16 h-16 mx-auto text-slate-200 mb-3" />
            <p className="text-slate-500 text-lg">لا توجد ملفات</p>
            <p className="text-slate-400 text-sm mt-1">ارفع ملفاتك أو أنشئ مجلداً جديداً</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewFolder && (
        <NewFolderModal
          parentId={currentFolder}
          onClose={() => setShowNewFolder(false)}
          onCreated={(folder) => {
            setShowNewFolder(false);
          }}
        />
      )}
      {showUpload && (
        <UploadDocumentModal
          folderId={currentFolder}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}

function NewFolderModal({
  parentId,
  onClose,
  onCreated,
}: {
  parentId: string | null;
  onClose: () => void;
  onCreated: (folder: any) => void;
}) {
  const [name, setName] = useState('');
  const createFolder = useCreateFolder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const folder = await createFolder.mutateAsync({
      name_ar: name,
      parent_folder_id: parentId || undefined,
    });
    onCreated(folder);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">مجلد جديد</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">اسم المجلد *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">إلغاء</button>
            <button type="submit" disabled={createFolder.isPending}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {createFolder.isPending ? 'جاري الإنشاء...' : 'إنشاء'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UploadDocumentModal({
  folderId,
  onClose,
}: {
  folderId: string | null;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title_ar: '',
    description: '',
    file_url: '',
    file_type: '',
    file_size: 0,
    is_public: false,
    project_id: '',
  });
  const uploadDoc = useUploadDocument();
  const { data: projects } = useProjects();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await uploadDoc.mutateAsync({
      ...formData,
      folder_id: folderId || undefined,
      project_id: formData.project_id || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">رفع ملف جديد</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">عنوان الملف *</label>
            <input type="text" value={formData.title_ar}
              onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })} required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رابط الملف *</label>
            <input type="url" value={formData.file_url}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })} required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="https://..." dir="ltr" />
            <p className="text-xs text-slate-400 mt-1">أدخل رابط الملف المباشر</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">نوع الملف</label>
            <select value={formData.file_type}
              onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="">اختر النوع</option>
              <option value="application/pdf">PDF</option>
              <option value="image/png">صورة PNG</option>
              <option value="image/jpeg">صورة JPEG</option>
              <option value="application/vnd.ms-excel">Excel</option>
              <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word</option>
              <option value="text/plain">نص</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
            <textarea value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">المشروع</label>
            <select value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="">بدون مشروع</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>{p.name_ar}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_public" checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            <label htmlFor="is_public" className="text-sm text-slate-600 flex items-center gap-1">
              <Globe className="w-4 h-4" /> ملف عام (مرئي للجميع)
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">إلغاء</button>
            <button type="submit" disabled={uploadDoc.isPending}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {uploadDoc.isPending ? 'جاري الرفع...' : 'رفع الملف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
