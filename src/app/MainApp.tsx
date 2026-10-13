import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  BookHeart,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  Command,
  Dumbbell,
  FolderKanban,
  GripVertical,
  Leaf,
  Link2,
  LayoutGrid,
  ListTodo,
  LockKeyhole,
  LogOut,
  NotebookPen,
  Settings2,
  Timer,
  Target,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useUserStore } from '@/infrastructure/auth/useUserStore';
import { MODULE_REGISTRY } from '@/shared/domain/moduleRegistry';
import type { ModuleKey } from '@/shared/types';
import { moduleDescription, moduleName, translate, type Language } from '@/shared/i18n';
import { ModuleWorkspace } from './ModuleWorkspace';
import type { CSSProperties, TouchEvent } from 'react';

const MODULE_ICONS: Record<string, LucideIcon> = {
  ListTodo,
  FolderKanban,
  NotebookPen,
  Link2,
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

export const MainApp = () => {
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const toggleModule = useUserStore((state) => state.toggleModule);
  const updatePreferences = useUserStore((state) => state.updatePreferences);
  const language = (user?.preferences.language ?? 'en') as Language;
  const t = (text: string) => translate(language, text);
  const now = new Date();
  const locale = language === 'hu' ? 'hu-HU' : 'en-US';
  const today = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now);
  const greeting = t(getGreeting(now.getHours()));
  const [selectedModule, setSelectedModule] = useState<ModuleKey | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [supportsHover, setSupportsHover] = useState(false);
  const [isDesktopLauncher, setIsDesktopLauncher] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [draggedModule, setDraggedModule] = useState<ModuleKey | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const carouselPointerX = useRef<number | null>(null);

  const modules = useMemo(
    () =>
      (user?.preferences.enabledModules ?? [])
        .map((key) => MODULE_REGISTRY[key])
        .filter(Boolean),
    [user?.preferences.enabledModules],
  );
  const activeModuleIndex = modules.length ? carouselIndex % modules.length : 0;
  const visibleModules = isDesktopLauncher
    ? modules.map((module, index) => ({ module, index, offset: index }))
    : modules
    .map((module, index) => {
      let offset = (index - activeModuleIndex + modules.length) % modules.length;
      if (offset > modules.length / 2) offset -= modules.length;
      return { module, index, offset };
    })
    .filter(({ offset }) => Math.abs(offset) <= 2);
  const selectedConfig = selectedModule ? MODULE_REGISTRY[selectedModule] : null;
  const desktopModuleGap = Math.min(
    64,
    Math.max(36, (window.innerHeight - 120) / Math.max(1, modules.length - 1)),
  );

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const desktopMedia = window.matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)');
    const update = () => setSupportsHover(media.matches);
    const updateDesktop = () => setIsDesktopLauncher(desktopMedia.matches);
    update();
    updateDesktop();
    media.addEventListener('change', update);
    desktopMedia.addEventListener('change', updateDesktop);
    return () => {
      media.removeEventListener('change', update);
      desktopMedia.removeEventListener('change', updateDesktop);
    };
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

  const reorderModules = (source: ModuleKey, target: ModuleKey) => {
    if (source === target || !user) return;
    const ordered = [...user.preferences.enabledModules];
    const sourceIndex = ordered.indexOf(source);
    const targetIndex = ordered.indexOf(target);
    if (sourceIndex < 0 || targetIndex < 0) return;
    ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, source);
    updatePreferences({ enabledModules: ordered });
  };

  const selectModule = (module: ModuleKey) => {
    setSelectedModule(module);
    setIsMenuOpen(false);
    const index = modules.findIndex((item) => item.key === module);
    if (index >= 0) setCarouselIndex(index);
  };

  const moveCarousel = (direction: number) => {
    if (modules.length < 2) return;
    setCarouselIndex((index) => (index + direction + modules.length) % modules.length);
  };

  useEffect(() => {
    if (!isMenuOpen || !supportsHover || isDesktopLauncher || modules.length < 2) return;

    let animationFrame = 0;
    let previousTime = 0;
    let progress = 0;
    let previousDirection = 0;
    const centerDeadZone = 42;

    const animateCarousel = (time: number) => {
      if (previousTime) {
        const pointerX = carouselPointerX.current;
        if (pointerX === null) {
          progress = 0;
          previousDirection = 0;
        } else {
          const distanceFromCenter = pointerX - window.innerWidth / 2;
          const direction = Math.abs(distanceFromCenter) <= centerDeadZone
            ? 0
            : Math.sign(distanceFromCenter);

          if (!direction || (previousDirection && direction !== previousDirection)) {
            progress = 0;
          }
          if (direction) {
            const availableDistance = Math.max(1, window.innerWidth / 2 - centerDeadZone);
            const intensity = Math.min(
              1,
              (Math.abs(distanceFromCenter) - centerDeadZone) / availableDistance,
            );
            progress += ((time - previousTime) / 1000) * (1 + intensity);
            if (progress >= 1) {
              const steps = Math.floor(progress);
              setCarouselIndex((index) => (index + direction * steps + modules.length * steps) % modules.length);
              progress -= steps;
            }
          }
          previousDirection = direction;
        }
      }
      previousTime = time;
      animationFrame = window.requestAnimationFrame(animateCarousel);
    };

    animationFrame = window.requestAnimationFrame(animateCarousel);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [isMenuOpen, modules.length, supportsHover, isDesktopLauncher]);

  const handleCarouselTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    const end = event.changedTouches[0];
    if (!start || !end) return;

    const deltaX = end.clientX - start.x;
    if (Math.abs(deltaX) < 35) return;
    moveCarousel(deltaX < 0 ? 1 : -1);
  };

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
            <span>{t('Settings')}</span>
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
          <span className="private-label"><LockIcon /> {t('Synced to your account')}</span>
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
            <p className="eyebrow">{t('YOUR WORKSPACE')}</p>
            <h1>{moduleName(language, selectedConfig.key, selectedConfig.name)}</h1>
            <p className="workspace-copy">{moduleDescription(language, selectedConfig.key, selectedConfig.description)}</p>
            {user && <ModuleWorkspace key={selectedConfig.key} module={selectedConfig.key} user={user} language={language} />}
          </div>
        ) : (
          <div className="dashboard">
            <p className="eyebrow">{today.toUpperCase()}</p>
            <h1>{greeting}, {user?.username.split(' ')[0] || t('there')}<span className="title-period">.</span></h1>
            <p className="dashboard-intro">{t('A little space to make progress on what matters to you.')}</p>

            <div className="dashboard-card">
              <div className="dashboard-card-heading">
                <span className="dashboard-card-icon"><Command size={18} /></span>
                <span className="eyebrow">{t('YOUR SPACE')}</span>
              </div>
              <h2>{t(modules.length ? 'Your tools, all in one place.' : 'Start with a space that feels like yours.')}</h2>
              <p>
                {modules.length
                  ? t('Open your Growise menu to jump into a module. You can update your setup in Settings at any time.')
                  : t('Choose the tools you want to use from Settings. Nothing you don’t need has to be here.')}
              </p>
              <button className="text-action" type="button" onClick={() => setIsSettingsOpen(true)}>
                {t(modules.length ? 'Manage your tools' : 'Choose your tools')}
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
                <span className="eyebrow">{t('YOUR MODULES')}</span>
                <div className="summary-list">
                  {modules.map((module) => {
                    const Icon = MODULE_ICONS[module.icon] ?? LayoutGrid;
                    return (
                      <button
                        key={module.key}
                        type="button"
                        draggable
                        className={draggedModule === module.key ? 'is-dragging' : ''}
                        onDragStart={() => setDraggedModule(module.key)}
                        onDragEnd={() => setDraggedModule(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (draggedModule) reorderModules(draggedModule, module.key);
                          setDraggedModule(null);
                        }}
                        onClick={() => selectModule(module.key)}
                        aria-label={`${t('Open')} ${moduleName(language, module.key, module.name)}. ${t('Drag to reorder.')}`}
                      >
                        <GripVertical size={14} className="summary-drag-handle" aria-hidden="true" />
                        <span className="summary-icon"><Icon size={16} /></span>
                        {moduleName(language, module.key, module.name)}
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

      <nav
        className={`modules-carousel ${isMenuOpen ? 'is-open' : ''} ${isDesktopLauncher ? 'is-desktop' : ''}`}
        aria-label="Module menu"
        onPointerMove={(event) => {
          if (isMenuOpen && supportsHover && !isDesktopLauncher) carouselPointerX.current = event.clientX;
        }}
        onPointerEnter={() => {
          if (supportsHover) setIsMenuOpen(true);
        }}
        onPointerLeave={() => {
          carouselPointerX.current = null;
          if (supportsHover) setIsMenuOpen(false);
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={handleCarouselTouchEnd}
        onKeyDown={(event) => {
          if (isDesktopLauncher) return;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            moveCarousel(event.key === 'ArrowRight' ? 1 : -1);
          }
        }}
      >
        {isMenuOpen && visibleModules.map(({ module, index, offset }) => {
          const Icon = MODULE_ICONS[module.icon] ?? LayoutGrid;
          const distance = Math.abs(offset);
          return (
            <button
              className={`carousel-item ${distance === 0 ? 'is-active' : ''}`}
              key={`carousel-slot-${offset}`}
              type="button"
              aria-current={distance === 0 ? 'true' : undefined}
              aria-label={distance === 0 ? `${t('Open')} ${moduleName(language, module.key, module.name)}` : `${t('Select')} ${moduleName(language, module.key, module.name)}`}
              style={{
                '--carousel-x': `${offset * 88}px`,
                '--carousel-y': `${isDesktopLauncher ? (index - (modules.length - 1) / 2) * desktopModuleGap : offset * 88}px`,
                '--carousel-bottom': `${distance === 0 ? 154 : distance === 1 ? 123 : 84}px`,
                '--carousel-opacity': isDesktopLauncher ? 1 : distance === 0 ? 1 : distance === 1 ? 0.72 : 0.46,
                '--carousel-scale': isDesktopLauncher ? 1 : distance === 0 ? 1 : distance === 1 ? 0.9 : 0.8,
                '--carousel-delay': `${distance * 45}ms`,
              } as CSSProperties}
              onClick={() => {
                if (isDesktopLauncher || offset === 0) {
                  setIsMenuOpen(false);
                  selectModule(module.key);
                } else {
                  setCarouselIndex(index);
                }
              }}
            >
              <span className="carousel-item-icon"><Icon size={distance === 0 ? 25 : 20} strokeWidth={1.8} /></span>
              <span className="carousel-item-label">{moduleName(language, module.key, module.name)}</span>
            </button>
          );
        })}
        <button
          className="carousel-trigger"
          type="button"
          aria-label={isMenuOpen ? 'Close modules' : 'Open modules'}
          aria-expanded={isMenuOpen}
          onMouseEnter={() => {
            if (supportsHover) setIsMenuOpen(true);
          }}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
        </button>
      </nav>
      {isMenuOpen && (
        <button
          className="menu-backdrop is-open"
          type="button"
          aria-label="Close module menu"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <div className="settings-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsSettingsOpen(false);
        }}>
          <section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="settings-header">
              <div>
                <p className="eyebrow">{t('PERSONALIZE')}</p>
                <h2 id="settings-title">{t('Your settings')}</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close settings" onClick={() => setIsSettingsOpen(false)}>
                <X size={19} />
              </button>
            </div>
            <p className="settings-description">{t('Turn tools on or off whenever your needs change.')}</p>
            <div className="appearance-setting">
              <div className="appearance-copy">
                <strong>{t('Appearance')}</strong>
                <span>{t('Choose how Growise looks.')}</span>
              </div>
              <div className="theme-options" role="group" aria-label={t('Appearance')}>
                {([
                  { value: 'light', label: t('Light') },
                  { value: 'dark', label: t('Dark') },
                  { value: 'system', label: t('System') },
                ] as const).map(({ value, label }) => (
                  <button key={value} type="button" className={`theme-option ${user?.preferences.theme === value ? 'is-active' : ''}`} aria-pressed={user?.preferences.theme === value} onClick={() => updatePreferences({ theme: value })}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="appearance-setting">
              <div className="appearance-copy">
                <strong>{t('Language')}</strong>
                <span>{t('Choose the language used throughout Growise.')}</span>
              </div>
              <div className="theme-options" role="group" aria-label={t('Language')}>
                {([{ value: 'en', label: t('English') }, { value: 'hu', label: t('Hungarian') }] as const).map(({ value, label }) => (
                  <button key={value} type="button" className={`theme-option ${language === value ? 'is-active' : ''}`} aria-pressed={language === value} onClick={() => updatePreferences({ language: value })}>
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
                      <strong>{moduleName(language, module.key, module.name)}</strong>
                        <span>{moduleDescription(language, module.key, module.description)}</span>
                    </span>
                    <span className={`toggle-switch ${enabled ? 'enabled' : ''}`} aria-hidden="true">
                      <span />
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="settings-footer">
              <span className="local-note"><LockIcon /> {t('Synchronized with your account')}</span>
              <button className="primary-button" type="button" onClick={() => setIsSettingsOpen(false)}>{t('Done')}</button>
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
