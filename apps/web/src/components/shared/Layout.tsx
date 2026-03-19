import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, Package, Shield, Bell, Check, X, Layers, Target, Lightbulb, CalendarRange, Globe, ChevronDown, Briefcase, LogOut, User, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotifications, useUnreadCount, useMarkNotificationRead, useMarkAllRead } from '../../hooks/use-notifications';
import { Button } from '../ui/button';
import { useAuthStore } from '../../store/auth-store';
import { ActiveTimerBar } from '../projects/TaskTimer';
import telnubLogo from '../../assets/telnub-logo.svg';

interface NavItem {
  to: string;
  key: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  prefixes: string[];
  items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry;
}

const navStructure: NavEntry[] = [
  { to: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  {
    labelKey: 'nav.groupPrograms',
    icon: Layers,
    prefixes: ['/programs', '/projects'],
    items: [
      { to: '/programs', key: 'nav.programs', icon: Layers },
      { to: '/projects', key: 'nav.projects', icon: FolderKanban },
    ],
  },
  {
    labelKey: 'nav.groupSales',
    icon: Briefcase,
    prefixes: ['/opportunities'],
    items: [
      { to: '/opportunities', key: 'nav.opportunities', icon: Target },
    ],
  },
  {
    labelKey: 'nav.groupPersonnel',
    icon: Users,
    prefixes: ['/personnel', '/skills', '/capacity'],
    items: [
      { to: '/personnel', key: 'nav.personnel', icon: Users },
      { to: '/skills', key: 'nav.skills', icon: Lightbulb },
      { to: '/capacity', key: 'nav.capacity', icon: CalendarRange },
    ],
  },
  { to: '/inventory', key: 'nav.inventory', icon: Package },
  { to: '/users', key: 'nav.users', icon: Shield },
];

function CollapsibleGroup({
  labelKey,
  icon: Icon,
  defaultOpen,
  t,
  children,
}: {
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen: boolean;
  t: (key: string) => string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Auto-open when route matches
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{t(labelKey)}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="space-y-0.5 mt-0.5">{children}</div>}
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [bellOpen, setBellOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const unread = useUnreadCount();
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const unreadCount = unread.data?.data?.count ?? 0;

  const toggleLang = () => {
    const next = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  // Close sidebar on route change (mobile)
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  // close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sidebarContent = (
    <>
      <div className="p-4 border-b flex items-center gap-3">
        <a href="https://www.telnub.com/" target="_blank" rel="noopener noreferrer" className="shrink-0">
          <img src={telnubLogo} alt="TelNub" className="h-10 w-10 hover:opacity-80 transition-opacity" />
        </a>
        <div className="min-w-0">
          <h1 className="text-sm font-bold leading-tight">{t('app.name')}</h1>
          <p className="text-[10px] text-muted-foreground lowercase">{t('app.tagline')}</p>
        </div>
        {/* Close button for mobile sidebar */}
        <button
          onClick={closeSidebar}
          className="ml-auto md:hidden p-1 rounded-md hover:bg-accent"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navStructure.map((entry, idx) => {
          if (!isGroup(entry)) {
            const isActive = location.pathname.startsWith(entry.to);
            const Icon = entry.icon;
            return (
              <Link
                key={entry.to}
                to={entry.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(entry.key)}
              </Link>
            );
          }

          // Group with collapsible children
          const groupActive = entry.prefixes.some((p) => location.pathname.startsWith(p));
          const GroupIcon = entry.icon;

          return (
            <CollapsibleGroup key={idx} labelKey={entry.labelKey} icon={GroupIcon} defaultOpen={groupActive} t={t}>
              {entry.items.map((child) => {
                const childActive = location.pathname.startsWith(child.to);
                const ChildIcon = child.icon;
                return (
                  <Link
                    key={child.to}
                    to={child.to}
                    className={`flex items-center gap-3 pl-9 pr-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      childActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <ChildIcon className="h-3.5 w-3.5" />
                    {t(child.key)}
                  </Link>
                );
              })}
            </CollapsibleGroup>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 border-r bg-card flex flex-col
          transform transition-transform duration-200 ease-in-out
          md:static md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b bg-card flex items-center justify-end px-3 md:px-6 gap-2 md:gap-3 shrink-0">
          {/* Hamburger menu — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-md hover:bg-accent mr-auto"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {authUser && (
            <div className="hidden sm:flex items-center gap-2 mr-auto pl-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="font-medium text-foreground">{authUser.displayName}</span>
              <span className="text-xs">({authUser.role})</span>
            </div>
          )}
          <ActiveTimerBar />
          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-xs">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{i18n.language === 'es' ? 'EN' : 'ES'}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-xs text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t('auth.logout')}</span>
          </Button>
          <div className="relative" ref={bellRef}>
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => setBellOpen(!bellOpen)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>

            {bellOpen && (
              <div className="absolute right-0 top-10 w-[calc(100vw-2rem)] sm:w-80 max-h-96 overflow-y-auto rounded-lg border bg-popover shadow-lg z-50">
                <div className="flex items-center justify-between p-3 border-b">
                  <span className="text-sm font-semibold">{t('notifications.title')}</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-auto py-1"
                      onClick={() => markAllRead.mutate()}
                    >
                      <Check className="h-3 w-3 mr-1" /> {t('notifications.markAllRead')}
                    </Button>
                  )}
                </div>

                {notifications.data?.data && notifications.data.data.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {t('notifications.empty')}
                  </div>
                )}

                {notifications.data?.data?.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3 border-b last:border-b-0 text-sm ${
                      !n.isRead ? 'bg-accent/40' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{n.title}</p>
                      <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleDateString()}{' '}
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {!n.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 shrink-0"
                        onClick={() => markRead.mutate({ id: n.id, isRead: true })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
