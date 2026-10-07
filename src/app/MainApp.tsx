import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BookHeart,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleHelp,
  Command,
  Dumbbell,
  Leaf,
  LayoutGrid,
  ListTodo,
  LockKeyhole,
  LogOut,
  Monitor,
  NotebookPen,
  Settings2,
  Moon,
  Sun,
  Timer,
  Target,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { CSSProperties, TouchEvent, WheelEvent } from 'react';
import { useUserStore } from '@/infrastructure/auth/useUserStore';
import { MODULE_REGISTRY } from '@/shared/domain/moduleRegistry';
import type { ModuleKey } from '@/shared/types';
import { calculateArcPositions } from '@/shared/lib/circleMenu';

const MODULE_ICONS: Record<string, LucideIcon> = {
  ListTodo,
  NotebookPen,
  Timer,
  ChartNoAxesColumnIncreasing,
  CalendarDays,
  Wallet,
  Target,
  BookHeart,
  Dumbbell,
};

const getGreeting = (hour: number) => {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const now = new Date();
const DATE_INFO = {
  today: new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now),
  greeting: getGreeting(now.getHours()),
};

export const MainApp = () => {
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const toggleModule = useUserStore((state) => state.toggleModule);
  const updatePreferences = useUserStore((state) => state.updatePreferences);
  const [selectedModule, setSelectedModule] = useState<ModuleKey | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [supportsHover, setSupportsHover] = useState(false);
  const [mobileModuleIndex, setMobileModuleIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const modules = useMemo(
    () =>
      (user?.preferences.enabledModules ?? [])
        .map((key) => MODULE_REGISTRY[key])
        .sort((a, b) => a.order - b.order),
    [user?.preferences.enabledModules],
  );
  const hasManyModules = modules.length > 6;
  const positions = calculateArcPositions(
    modules.length,
    supportsHover ? (hasManyModules ? 450 : 280) : (hasManyModules ? 150 : 124),
    hasManyModules ? 205 : 210,
    hasManyModules ? 335 : 330,
  );
  const selectedConfig = selectedModule ? MODULE_REGISTRY[selectedModule] : null;
  const mobileModule = modules.length > 0
    ? modules[mobileModuleIndex % modules.length]
    : null;

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setSupportsHover(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleToggleModule = (module: ModuleKey) => {
    const isEnabled = user?.preferences.enabledModules.includes(module) ?? false;
    toggleModule(module);
    if (isEnabled && selectedModule === module) setSelectedModule(null);
  };

  const selectModule = (module: ModuleKey) => {
    setSelectedModule(module);
    setIsMenuOpen(false);
  };

  const moveMobileModule = (direction: number) => {
    if (modules.length < 2) return;
    setMobileModuleIndex((index) => (index + direction + modules.length) % modules.length);
  };

  const handleMobileWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) < 8 && Math.abs(event.deltaY) < 8) return;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
    moveMobileModule(delta > 0 ? 1 : -1);
  };

  const handleMobileTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    const end = event.changedTouches[0];
    if (!start || !end) return;

    const deltaX = end.clientX - start.x;
    const deltaY = end.clientY - start.y;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 28) return;

    const forward = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX < 0 : deltaY < 0;
    moveMobileModule(forward ? 1 : -1);
  };

  const today = DATE_INFO.today;

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="wordmark" href="#" onClick={(event) => {
          event.preventDefault();
          setSelectedModule(null);
        }}>
          <span className="wordmark-icon"><Leaf size={17} /></span>
          growise
        </a>
        <div className="header-actions">
          <button className="header-link" type="button" onClick={() => setIsSettingsOpen(true)}>
            <Settings2 size={17} />
            <span>Settings</span>
          </button>
          <span className="header-divider" />
          <span className="user-avatar" aria-label={user?.username}>
            {user?.username.slice(0, 1).toUpperCase()}
          </span>
          <button className="icon-button signout-button" type="button" onClick={logout} aria-label="Sign out" title="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <section className="workspace">
        <div className="workspace-topline">
          <span className="date-pill"><span className="date-dot" />{today}</span>
          <span className="private-label"><LockIcon /> Private to this device</span>
        </div>

        {selectedConfig ? (
          <div className="module-page">
            <button className="back-link" type="button" onClick={() => setSelectedModule(null)}>
              <ChevronDown size={15} className="back-chevron" /> Overview
            </button>
            <span className="module-page-icon">
              {(() => {
                const Icon = MODULE_ICONS[selectedConfig.icon] ?? LayoutGrid;
                return <Icon size={24} strokeWidth={1.7} />;
              })()}
            </span>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>{selectedConfig.name}</h1>
            <p className="workspace-copy">{selectedConfig.description}</p>
            <div className="coming-card">
              <div className="coming-card-icon"><CircleHelp size={20} /></div>
              <div>
                <h2>Your {selectedConfig.name.toLowerCase()} space is ready.</h2>
                <p>This module will grow here as we build out your workspace.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <p className="eyebrow">{today.toUpperCase()}</p>
            <h1>{DATE_INFO.greeting}, {user?.username.split(' ')[0] || 'there'}<span className="title-period">.</span></h1>
            <p className="dashboard-intro">A little space to make progress on what matters to you.</p>

            <div className="dashboard-card">
              <div className="dashboard-card-heading">
                <span className="dashboard-card-icon"><Command size={18} /></span>
                <span className="eyebrow">YOUR SPACE</span>
              </div>
              <h2>{modules.length ? 'Your tools, all in one place.' : 'Start with a space that feels like yours.'}</h2>
              <p>
                {modules.length
                  ? 'Open your Growise menu to jump into a module. You can update your setup in Settings at any time.'
                  : 'Choose the tools you want to use from Settings. Nothing you don’t need has to be here.'}
              </p>
              <button className="text-action" type="button" onClick={() => setIsSettingsOpen(true)}>
                {modules.length ? 'Manage your tools' : 'Choose your tools'}
                <ArrowUpRight size={16} />
              </button>
              <div className="dashboard-decoration" aria-hidden="true">
                <span className="decoration-orbit orbit-one" />
                <span className="decoration-orbit orbit-two" />
                <span className="decoration-leaf"><Leaf size={36} strokeWidth={1.15} /></span>
              </div>
            </div>

            {modules.length > 0 && (
              <div className="module-summary">
                <span className="eyebrow">YOUR MODULES</span>
                <div className="summary-list">
                  {modules.map((module) => {
                    const Icon = MODULE_ICONS[module.icon] ?? LayoutGrid;
                    return (
                      <button key={module.key} type="button" onClick={() => selectModule(module.key)}>
                        <span className="summary-icon"><Icon size={16} /></span>
                        {module.name}
                        <ArrowUpRight size={14} className="summary-arrow" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {isMenuOpen && (
        <button
          className="menu-backdrop"
          type="button"
          aria-label="Close module menu"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      <div
        className={`radial-menu ${isMenuOpen ? 'is-open' : ''} ${hasManyModules ? 'has-many' : ''} ${supportsHover ? '' : 'is-touch'}`}
        aria-label="Module menu"
        onMouseLeave={() => {
          if (supportsHover) setIsMenuOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setIsMenuOpen(false);
        }}
      >
        {!supportsHover && isMenuOpen && mobileModule && (
          <div
            className="mobile-module-picker"
            onWheel={handleMobileWheel}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
            }}
            onTouchEnd={handleMobileTouchEnd}
          >
            <button
              type="button"
              className="mobile-picker-arrow"
              aria-label="Previous module"
              onClick={() => moveMobileModule(-1)}
              disabled={modules.length < 2}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="mobile-picker-current"
              aria-label={`Open ${mobileModule.name}`}
              onClick={() => selectModule(mobileModule.key)}
            >
              {(() => {
                const Icon = MODULE_ICONS[mobileModule.icon] ?? LayoutGrid;
                return <span className="mobile-picker-icon"><Icon size={25} strokeWidth={1.8} /></span>;
              })()}
              <span className="mobile-picker-label">{mobileModule.name}</span>
            </button>
            <button
              type="button"
              className="mobile-picker-arrow"
              aria-label="Next module"
              onClick={() => moveMobileModule(1)}
              disabled={modules.length < 2}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
        {modules.map((module, index) => {
          const Icon = MODULE_ICONS[module.icon] ?? LayoutGrid;
          const position = positions[index];
          return (
            <button
              className="radial-item"
              key={module.key}
              type="button"
              tabIndex={isMenuOpen ? 0 : -1}
              aria-hidden={!isMenuOpen}
              aria-label={`Open ${module.name}`}
              title={module.name}
              style={{
                '--item-x': `${position?.x ?? 0}px`,
                '--item-y': `${position?.y ?? 0}px`,
                '--item-delay': `${index * 35}ms`,
              } as CSSProperties}
              onMouseEnter={() => {
                if (supportsHover) setIsMenuOpen(true);
              }}
              onClick={() => selectModule(module.key)}
            >
              <span className="radial-item-icon"><Icon size={21} strokeWidth={1.8} /></span>
              <span className="radial-item-label">{module.name}</span>
            </button>
          );
        })}
        <button
          className="launcher-button"
          type="button"
          aria-label={isMenuOpen ? 'Close module menu' : 'Open module menu'}
          aria-expanded={isMenuOpen}
          onMouseEnter={() => {
            if (supportsHover) setIsMenuOpen(true);
          }}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X size={23} /> : <span className="launcher-grid"><span /><span /><span /><span /></span>}
        </button>
        <span className="launcher-caption">{isMenuOpen ? 'CLOSE' : 'EXPLORE'}</span>
      </div>

      {isSettingsOpen && (
        <div className="settings-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsSettingsOpen(false);
        }}>
          <section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="settings-header">
              <div>
                <p className="eyebrow">PERSONALIZE</p>
                <h2 id="settings-title">Your settings</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close settings" onClick={() => setIsSettingsOpen(false)}>
                <X size={19} />
              </button>
            </div>
            <p className="settings-description">Turn tools on or off whenever your needs change.</p>
            <div className="appearance-setting">
              <div className="appearance-copy">
                <strong>Appearance</strong>
                <span>Choose how Growise looks on this device.</span>
              </div>
              <div className="theme-options" role="group" aria-label="Color theme">
                {([
                  { value: 'light', label: 'Light', Icon: Sun },
                  { value: 'dark', label: 'Dark', Icon: Moon },
                  { value: 'system', label: 'System', Icon: Monitor },
                ] as const).map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    className={`theme-option ${user?.preferences.theme === value ? 'is-active' : ''}`}
                    aria-pressed={user?.preferences.theme === value}
                    onClick={() => updatePreferences({ theme: value })}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-module-list">
              {Object.values(MODULE_REGISTRY).sort((a, b) => a.order - b.order).map((module) => {
                const Icon = MODULE_ICONS[module.icon] ?? LayoutGrid;
                const enabled = user?.preferences.enabledModules.includes(module.key) ?? false;
                return (
                  <button
                    key={module.key}
                    type="button"
                    className="settings-module"
                    aria-pressed={enabled}
                    onClick={() => handleToggleModule(module.key)}
                  >
                    <span className="settings-module-icon"><Icon size={19} /></span>
                    <span className="settings-module-copy">
                      <strong>{module.name}</strong>
                      <span>{module.description}</span>
                    </span>
                    <span className={`toggle-switch ${enabled ? 'enabled' : ''}`} aria-hidden="true">
                      <span />
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="settings-footer">
              <span className="local-note"><LockIcon /> Saved on this device</span>
              <button className="primary-button" type="button" onClick={() => setIsSettingsOpen(false)}>Done</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

function LockIcon() {
  return <LockKeyhole className="tiny-lock" size={13} aria-hidden="true" />;
}
