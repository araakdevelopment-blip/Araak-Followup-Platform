import { useState, useRef, useEffect } from 'react';
import {
  useChannels,
  useChannelMessages,
  useSendMessage,
  useCreateChannel,
  useUsers,
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import {
  MessageSquare,
  Send,
  Plus,
  Users,
  Hash,
  Pin,
  Trash2,
  Edit,
  StickyNote,
  X,
  Check,
  Search,
  Smile,
} from 'lucide-react';

const NOTE_COLORS = [
  { name: 'رمادي', value: '#F3F4F6' },
  { name: 'أحمر', value: '#FEE2E2' },
  { name: 'برتقالي', value: '#FFEDD5' },
  { name: 'أصفر', value: '#FEF9C3' },
  { name: 'أخضر', value: '#DCFCE7' },
  { name: 'أزرق', value: '#DBEAFE' },
  { name: 'بنفسجي', value: '#EDE9FE' },
  { name: 'وردي', value: '#FCE7F3' },
];

export function MessagesPage() {
  const [activeTab, setActiveTab] = useState<'messages' | 'notes'>('messages');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNewNote, setShowNewNote] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">التواصل والملاحظات</h1>
          <p className="text-slate-500 text-sm mt-1">التواصل الداخلي وتدوين الملاحظات السريعة</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveTab('messages'); setShowNewChannel(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>محادثة جديدة</span>
          </button>
          <button
            onClick={() => { setActiveTab('notes'); setShowNewNote(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <StickyNote className="w-4 h-4" />
            <span>ملاحظة جديدة</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'messages' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          الرسائل
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'notes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <StickyNote className="w-4 h-4" />
          الملاحظات
        </button>
      </div>

      {/* Content */}
      {activeTab === 'messages' ? (
        <MessagesSection
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
          showNewChannel={showNewChannel}
          onCloseNewChannel={() => setShowNewChannel(false)}
        />
      ) : (
        <NotesSection
          showNewNote={showNewNote}
          onCloseNewNote={() => setShowNewNote(false)}
        />
      )}
    </div>
  );
}

function MessagesSection({
  selectedChannel,
  onSelectChannel,
  showNewChannel,
  onCloseNewChannel,
}: {
  selectedChannel: string | null;
  onSelectChannel: (id: string | null) => void;
  showNewChannel: boolean;
  onCloseNewChannel: () => void;
}) {
  const { data: channels } = useChannels();
  const { profile } = useAuth();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-280px)]">
      {/* Channels sidebar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-3 border-b border-slate-200">
          <h3 className="font-medium text-slate-800 text-sm">المحادثات</h3>
        </div>
        <div className="overflow-y-auto h-full max-h-[calc(100vh-340px)]">
          {channels?.map((channel) => {
            const isActive = selectedChannel === channel.id;
            const channelIcon = channel.channel_type === 'direct' ? MessageSquare :
              channel.channel_type === 'group' ? Users : Hash;
            const Icon = channelIcon;

            return (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-slate-50 transition-colors ${
                  isActive ? 'bg-emerald-50 border-r-2 border-emerald-500' : ''
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {channel.name_ar}
                  </p>
                  <p className="text-xs text-slate-400">
                    {channel.members?.length || 0} عضو
                  </p>
                </div>
              </button>
            );
          })}
          {(!channels || channels.length === 0) && (
            <div className="p-6 text-center text-slate-400 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>لا توجد محادثات</p>
              <p className="text-xs mt-1">ابدأ محادثة جديدة</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {selectedChannel ? (
          <ChatView channelId={selectedChannel} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-lg">اختر محادثة للبدء</p>
              <p className="text-sm mt-1">أو أنشئ محادثة جديدة</p>
            </div>
          </div>
        )}
      </div>

      {/* New channel modal */}
      {showNewChannel && (
        <NewChannelModal onClose={onCloseNewChannel} onCreated={onSelectChannel} />
      )}
    </div>
  );
}

function ChatView({ channelId }: { channelId: string }) {
  const { data: messages } = useChannelMessages(channelId);
  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await sendMessage.mutateAsync({ channel_id: channelId, content: newMessage });
    setNewMessage('');
  };

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((msg) => {
          const isOwn = msg.sender_id === profile?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-start' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${isOwn ? '' : ''}`}>
                {!isOwn && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-700 text-xs font-bold">
                        {(msg.sender as any)?.full_name_ar?.charAt(0) || '?'}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-600">{(msg.sender as any)?.full_name_ar}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                <div className={`rounded-xl px-4 py-2.5 ${
                  isOwn
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {isOwn && (
                    <p className="text-xs mt-1 text-emerald-200">
                      {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                {msg.attachment_url && (
                  <div className="mt-1">
                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                      ملف مرفق
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {(!messages || messages.length === 0) && (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>ابدأ المحادثة</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالة..."
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sendMessage.isPending}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </>
  );
}

function NewChannelModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'direct' | 'group'>('group');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { data: users } = useUsers();
  const createChannel = useCreateChannel();
  const { profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const channel = await createChannel.mutateAsync({
      name,
      type,
      memberIds: selectedMembers,
    });
    onCreated(channel.id);
    onClose();
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">محادثة جديدة</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">اسم المحادثة *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">النوع</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="group">مجموعة</option>
              <option value="direct">مباشر</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الأعضاء</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {users?.filter((u) => u.id !== profile?.id).map((user) => (
                <label key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(user.id)}
                    onChange={() => toggleMember(user.id)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-700 text-xs font-bold">{user.full_name_ar.charAt(0)}</span>
                  </div>
                  <span className="text-sm text-slate-700">{user.full_name_ar}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">إلغاء</button>
            <button type="submit" disabled={createChannel.isPending}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {createChannel.isPending ? 'جاري الإنشاء...' : 'إنشاء المحادثة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NotesSection({
  showNewNote,
  onCloseNewNote,
}: {
  showNewNote: boolean;
  onCloseNewNote: () => void;
}) {
  const { data: notes } = useNotes();
  const deleteNote = useDeleteNote();
  const updateNote = useUpdateNote();
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const handleTogglePin = async (noteId: string, isPinned: boolean) => {
    await updateNote.mutateAsync({ id: noteId, updates: { is_pinned: !isPinned } });
  };

  const pinnedNotes = notes?.filter((n) => n.is_pinned) || [];
  const regularNotes = notes?.filter((n) => !n.is_pinned) || [];

  return (
    <div className="space-y-6">
      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
            <Pin className="w-4 h-4" /> مثبتة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onTogglePin={() => handleTogglePin(note.id, note.is_pinned)}
                onDelete={() => deleteNote.mutateAsync(note.id)}
                isEditing={editingNote === note.id}
                onEdit={() => setEditingNote(note.id)}
                onCancelEdit={() => setEditingNote(null)}
                onSaveEdit={(updates) => {
                  updateNote.mutateAsync({ id: note.id, updates });
                  setEditingNote(null);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Notes */}
      <div>
        {pinnedNotes.length > 0 && (
          <h2 className="text-sm font-semibold text-slate-500 mb-3">الملاحظات</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {regularNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onTogglePin={() => handleTogglePin(note.id, note.is_pinned)}
              onDelete={() => deleteNote.mutateAsync(note.id)}
              isEditing={editingNote === note.id}
              onEdit={() => setEditingNote(note.id)}
              onCancelEdit={() => setEditingNote(null)}
              onSaveEdit={(updates) => {
                updateNote.mutateAsync({ id: note.id, updates });
                setEditingNote(null);
              }}
            />
          ))}
        </div>
      </div>

      {(!notes || notes.length === 0) && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <StickyNote className="w-16 h-16 mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 text-lg">لا توجد ملاحظات</p>
          <p className="text-slate-400 text-sm mt-1">أضف ملاحظة جديدة لتدوين أفكارك وملاحظاتك</p>
        </div>
      )}

      {showNewNote && <NewNoteModal onClose={onCloseNewNote} />}
    </div>
  );
}

function NoteCard({
  note,
  onTogglePin,
  onDelete,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
}: {
  note: any;
  onTogglePin: () => void;
  onDelete: () => void;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (updates: any) => void;
}) {
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content || '');

  if (isEditing) {
    return (
      <div className="rounded-xl border-2 border-emerald-300 p-4 shadow-sm" style={{ backgroundColor: note.color }}>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full font-semibold text-slate-800 bg-transparent border-none outline-none mb-2"
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          className="w-full text-sm text-slate-600 bg-transparent border-none outline-none resize-none"
        />
        <div className="flex gap-2 mt-3">
          <button onClick={onCancelEdit}
            className="px-3 py-1 text-xs bg-white/60 rounded-lg hover:bg-white text-slate-600">إلغاء</button>
          <button onClick={() => onSaveEdit({ title: editTitle, content: editContent })}
            className="px-3 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">حفظ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow group" style={{ backgroundColor: note.color }}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-slate-800 text-sm line-clamp-1">{note.title}</h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onTogglePin} className="p-1 hover:bg-white/50 rounded" title={note.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}>
            <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? 'text-emerald-600' : 'text-slate-400'}`} />
          </button>
          <button onClick={onEdit} className="p-1 hover:bg-white/50 rounded" title="تعديل">
            <Edit className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button onClick={onDelete} className="p-1 hover:bg-white/50 rounded" title="حذف">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
      {note.content && (
        <p className="text-sm text-slate-600 line-clamp-4 whitespace-pre-wrap">{note.content}</p>
      )}
      {note.project && (
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
          <Hash className="w-3 h-3" />
          {(note.project as any).name_ar}
        </p>
      )}
      <p className="text-xs text-slate-400 mt-2">
        {new Date(note.updated_at).toLocaleDateString('ar-SA')}
      </p>
    </div>
  );
}

function NewNoteModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: '#FEF9C3',
    project_id: '',
  });
  const createNote = useCreateNote();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createNote.mutateAsync({
      title: formData.title,
      content: formData.content,
      color: formData.color,
      project_id: formData.project_id || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">ملاحظة جديدة</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">العنوان *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">المحتوى</label>
            <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">اللون</label>
            <div className="flex gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c.value })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    formData.color === c.value ? 'border-slate-800 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">إلغاء</button>
            <button type="submit" disabled={createNote.isPending}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {createNote.isPending ? 'جاري الحفظ...' : 'إنشاء الملاحظة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
