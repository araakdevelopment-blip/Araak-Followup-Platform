import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navItems: Array<{ path: string; label: string; icon: React.ElementType; adminOnly?: boolean }> = [
  { path: '/', label: 'لوحة المتابعة', icon: LayoutDashboard },
  { path: '/projects', label: 'المشاريع', icon: FolderKanban },
  { path: '/tasks', label: 'المهام', icon: ListTodo },
  { path: '/reports', label: 'التقارير', icon: BarChart3 },
  { path: '/team', label: 'الفريق', icon: Users },
  { path: '/admin', label: 'الإدارة', icon: Shield, adminOnly: true },
];

export function Layout({ children }: LayoutProps) {
  const { profile, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

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

          {/* User section */}
          <div className="border-t border-slate-200 p-3">
            {!collapsed && profile && (
              <div className="mb-3 px-3">
                <p className="text-sm font-medium text-slate-900 truncate">{profile.full_name_ar}</p>
                <p className="text-xs text-slate-500">
                  {profile.role === 'ceo' && 'الرئيس التنفيذي'}
                  {profile.role === 'deputy_development' && 'نائب قطاع التنمية'}
                  {profile.role === 'deputy_investment' && 'نائب قطاع الاستثمار'}
                  {profile.role === 'development_manager' && 'مدير قطاع التنمية'}
                  {profile.role === 'monitoring_officer' && 'مسؤول المتابعة'}
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
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
