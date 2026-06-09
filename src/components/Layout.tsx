import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnlineUsers, useHeartbeat } from '../hooks/useData';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Shield,
  MessageSquare,
  FolderOpen,
  Kanban,
  Wifi,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navItems: Array<{ path: string; label: string; icon: React.ElementType; adminOnly?: boolean }> = [
  { path: '/', label: 'لوحة المتابعة', icon: LayoutDashboard },
  { path: '/projects', label: 'المشاريع', icon: FolderKanban },
  { path: '/task-management', label: 'إدارة المهام', icon: Kanban },
  { path: '/messages', label: 'التواصل والملاحظات', icon: MessageSquare },
  { path: '/documents', label: 'مركز الوثائق', icon: FolderOpen },
  { path: '/reports', label: 'التقارير', icon: BarChart3 },
  { path: '/team', label: 'الفريق', icon: Users },
  { path: '/admin', label: 'الإدارة', icon: Shield, adminOnly: true },
];

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: 'bg-red-100', text: 'text-red-700' },
  ceo: { bg: 'bg-amber-100', text: 'text-amber-700' },
  deputy_development: { bg: 'bg-blue-100', text: 'text-blue-700' },
  deputy_investment: { bg: 'bg-purple-100', text: 'text-purple-700' },
  development_manager: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  monitoring_officer: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير النظام',
  ceo: 'الرئيس التنفيذي',
  deputy_development: 'نائب قطاع التنمية',
  deputy_investment: 'نائب قطاع الاستثمار',
  development_manager: 'مدير قطاع التنمية',
  monitoring_officer: 'مسؤول المتابعة',
};

export function Layout({ children }: LayoutProps) {
  const { profile, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showOnlinePanel, setShowOnlinePanel] = useState(false);

  const { data: onlineUsers } = useOnlineUsers();
  const { sendHeartbeat } = useHeartbeat();

  // Auto-heartbeat every 60s
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    sendHeartbeat(location.pathname);
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat(location.pathname);
    }, 60000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [location.pathname]);

  // Send heartbeat on path change
  useEffect(() => {
    sendHeartbeat(location.pathname);
  }, [location.pathname]);

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  const onlineCount = onlineUsers?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-slate-800">
          منصة المتابعة التنفيذية
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-slate-100"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 z-40 h-full bg-white border-l border-slate-200 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="hidden lg:flex items-center justify-between h-16 px-4 border-b border-slate-200">
            {!collapsed && (
              <Link to="/" className="text-lg font-bold text-slate-800">
                منصة المتابعة
              </Link>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Online users mini-widget in sidebar */}
          {!collapsed && (
            <div className="px-4 pb-2">
              <button
                onClick={() => setShowOnlinePanel(!showOnlinePanel)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <div className="relative">
                  <Wifi className="w-5 h-5 text-emerald-600" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-emerald-50" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium text-emerald-800">
                    {onlineCount} متواجد{onlineCount !== 1 ? 'ين' : ''}
                  </p>
                  <p className="text-xs text-emerald-600">الآن</p>
                </div>
                <div className="flex -space-y-1 space-y-reverse space-x-1 space-x-reverse">
                  {onlineUsers?.slice(0, 3).map((ou) => {
                    const name = (ou.user as any)?.full_name_ar || '?';
                    return (
                      <div
                        key={ou.user_id}
                        className="w-6 h-6 bg-emerald-200 rounded-full border-2 border-white flex items-center justify-center"
                        title={name}
                      >
                        <span className="text-emerald-700 text-[10px] font-bold">{name.charAt(0)}</span>
                      </div>
                    );
                  })}
                  {(onlineCount > 3) && (
                    <div className="w-6 h-6 bg-slate-200 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-slate-600 text-[10px] font-bold">+{onlineCount - 3}</span>
                    </div>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* User section */}
          <div className="border-t border-slate-200 p-3">
            {!collapsed && profile && (
              <div className="mb-3 px-3">
                <p className="text-sm font-medium text-slate-900 truncate">{profile.full_name_ar}</p>
                <p className="text-xs text-slate-500">
                  {ROLE_LABELS[profile.role] || profile.role}
                </p>
              </div>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>تسجيل الخروج</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main
        className={`transition-all duration-300 pt-16 lg:pt-0 ${
          collapsed ? 'lg:mr-20' : 'lg:mr-64'
        }`}
      >
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
          <h1 className="text-lg font-semibold text-slate-800">
            {visibleNavItems.find((item) => item.path === location.pathname)?.label || 'منصة المتابعة'}
          </h1>
          <div className="flex items-center gap-3">
            {/* Online indicator in top bar */}
            <button
              onClick={() => setShowOnlinePanel(!showOnlinePanel)}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="relative">
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <span className="text-sm font-medium text-slate-700">{onlineCount}</span>
            </button>
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Online users dropdown panel */}
        {showOnlinePanel && (
          <div className="absolute left-4 lg:left-auto lg:right-auto top-14 z-50 w-72">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <h3 className="font-semibold text-slate-800 text-sm">
                    {onlineCount} متواجد{onlineCount !== 1 ? 'ين' : ''} الآن
                  </h3>
                </div>
                <button onClick={() => setShowOnlinePanel(false)} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {onlineUsers?.map((ou) => {
                  const user = ou.user as any;
                  const roleColor = ROLE_COLORS[user?.role] || ROLE_COLORS.monitoring_officer;
                  return (
                    <div key={ou.user_id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                      <div className="relative">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-emerald-700 text-sm font-bold">
                            {user?.full_name_ar?.charAt(0) || '?'}
                          </span>
                        </div>
                        <span className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {user?.full_name_ar || 'مستخدم'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {ROLE_LABELS[user?.role] || user?.role}
                        </p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${roleColor.bg} ${roleColor.text}`}>
                        {user?.role === 'admin' ? 'مدير' : user?.role === 'ceo' ? 'رئيس' : 'عضو'}
                      </span>
                    </div>
                  );
                })}
                {(!onlineUsers || onlineUsers.length === 0) && (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    <Wifi className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>لا يوجد متواجدون حالياً</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
