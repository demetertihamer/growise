import { useState } from 'react';
import {
  ArrowRight,
  BookHeart,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  Dumbbell,
  ListTodo,
  NotebookPen,
  Target,
  Timer,
  Wallet,
} from 'lucide-react';
import { useUserStore } from '@/infrastructure/auth/useUserStore';
import { MODULE_REGISTRY } from '@/shared/domain/moduleRegistry';
import type { ModuleKey } from '@/shared/types';

const MODULE_ICONS = {
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

export const OnboardingFlow = () => {
  const user = useUserStore((state) => state.user);
  const updatePreferences = useUserStore((state) => state.updatePreferences);
  const [selected, setSelected] = useState<Set<ModuleKey>>(new Set());

  if (!user) return null;

  const modules = Object.values(MODULE_REGISTRY).sort((a, b) => a.order - b.order);

  const handleToggle = (moduleKey: ModuleKey) => {
    const newSelected = new Set(selected);
    if (newSelected.has(moduleKey)) {
      newSelected.delete(moduleKey);
    } else {
      newSelected.add(moduleKey);
    }
    setSelected(newSelected);
  };

  const handleComplete = () => {
    updatePreferences({
      enabledModules: Array.from(selected),
      onboardingCompleted: true,
    });
  };

  return (
    <main className="onboarding-screen">
      <section className="onboarding-content">
        <div className="onboarding-heading">
          <p className="eyebrow">YOUR WORKSPACE, YOUR WAY</p>
          <h1>What would you like to focus on?</h1>
          <p>Choose the tools you want to start with. You can add or remove any of them later in Settings.</p>
        </div>

        <div className="module-choice-grid">
          {modules.map((module) => (
            <button
              key={module.key}
              type="button"
              aria-pressed={selected.has(module.key)}
              onClick={() => handleToggle(module.key)}
              className={`module-choice ${selected.has(module.key) ? 'is-selected' : ''}`}
            >
              <span className="module-choice-icon">
                {(() => {
                  const Icon = MODULE_ICONS[module.icon];
                  return <Icon size={22} strokeWidth={1.8} />;
                })()}
              </span>
              <span className="module-choice-copy">
                <strong>{module.name}</strong>
                <span>{module.description}</span>
              </span>
              <span className="selection-check">{selected.has(module.key) && <Check size={14} />}</span>
            </button>
          ))}
        </div>

        <div className="onboarding-footer">
          <p>{selected.size} {selected.size === 1 ? 'tool' : 'tools'} selected</p>
          <button type="button" className="primary-button" onClick={handleComplete}>
            Continue <ArrowRight size={17} />
          </button>
        </div>
      </section>
    </main>
  );
};
