import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CalendarDays,
  CircleCheck,
  ExternalLink,
  Link2,
  Pause,
  Play,
  Plus,
  Save,
  Trash2,
  Pin,
  PinOff,
} from 'lucide-react';
import type { FormEvent } from 'react';
import {
  EMPTY_FOCUS_TIMER,
  useWorkspaceStore,
  createEntity,
  getLocalDate,
} from '@/infrastructure/workspace/useWorkspaceStore';
import type { ModuleKey, User } from '@/shared/types';
import { translate, type Language } from '@/shared/i18n';

interface ModuleWorkspaceProps {
  module: ModuleKey;
  user: User;
  language: Language;
}

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatMoney = (amountMinor: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amountMinor / 100);

const dateTimeInputValue = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const newId = () => crypto.randomUUID();

export const ModuleWorkspace = ({ module, user, language }: ModuleWorkspaceProps) => {
  const t = (text: string) => translate(language, text);
  const data = useWorkspaceStore((state) => state.dataByUser[user.id]);
  const add = useWorkspaceStore((state) => state.add);
  const update = useWorkspaceStore((state) => state.update);
  const remove = useWorkspaceStore((state) => state.remove);
  const storedFocusTimer = useWorkspaceStore((state) => state.focusTimers[user.id]);
  const focusTimer = useMemo(
    () => ({ ...EMPTY_FOCUS_TIMER, ...(storedFocusTimer ?? {}) }),
    [storedFocusTimer],
  );
  const setFocusTimer = useWorkspaceStore((state) => state.setFocusTimer);
  const userId = user.id;
  const [title, setTitle] = useState('');
  const today = getLocalDate();
  const [date] = useState(today);
  const initialJournalEntry = data?.journalEntries?.find((entry) => entry.date === today);
  const [markdown, setMarkdown] = useState(initialJournalEntry?.markdown ?? '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [goalId, setGoalId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(0);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [weeklyDay, setWeeklyDay] = useState(String(new Date().getDay()));
  const [startAt, setStartAt] = useState(() => dateTimeInputValue(new Date()));
  const [endAt, setEndAt] = useState(() => dateTimeInputValue(new Date(Date.now() + 60 * 60_000)));
  const [eventError, setEventError] = useState('');
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [calendarDate, setCalendarDate] = useState(today);
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [mood, setMood] = useState<'great' | 'good' | 'okay' | 'low' | 'difficult'>(initialJournalEntry?.mood ?? 'okay');
  const [exerciseText, setExerciseText] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [duration, setDuration] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [taskListName, setTaskListName] = useState('');
  const [selectedTaskList, setSelectedTaskList] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [repeatKind, setRepeatKind] = useState<'once' | 'interval' | 'weekly'>('once');
  const [repeatInterval, setRepeatInterval] = useState('1');
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>([]);
  const [focusMinutes, setFocusMinutes] = useState('25');
  const [breakMinutes, setBreakMinutes] = useState('5');
  const [focusNotes, setFocusNotes] = useState('');
  const [focusMode, setFocusMode] = useState<'focus' | 'break'>('focus');
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'classic'>('pomodoro');
  const [categoryRows, setCategoryRows] = useState([{ name: '', percentage: '' }]);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const journalEntries = data?.journalEntries ?? [];
  const existingJournalEntry = journalEntries.find((entry) => entry.date === date);
  const totals = useMemo(() => {
    const result: Record<string, { income: number; expense: number }> = {};
    (data?.transactions ?? []).forEach((transaction) => {
      const total = result[transaction.currency] ??= { income: 0, expense: 0 };
      total[transaction.kind] += transaction.amountMinor;
    });
    return result;
  }, [data?.transactions]);
  const running = Boolean(focusTimer.resumedAt);
  const seconds = Math.max(0, focusTimer.remainingSeconds - (focusTimer.resumedAt && clockNow
    ? Math.floor((clockNow - Date.parse(focusTimer.resumedAt)) / 1000)
    : 0));

  useEffect(() => {
    if (!running) return;
    const updateClock = () => setClockNow(Date.now());
    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  switch (module) {
    case 'tasks': {
      const tasks = data?.tasks ?? [];
      const taskLists = data?.taskLists ?? [];
      const goals = data?.goals ?? [];
      const projects = data?.projects ?? [];
      const renderTask = (task: (typeof tasks)[number]) => <article className={`module-row ${task.status === 'done' ? 'is-complete' : ''}`} key={task.id}>
        <button className="module-check" type="button" aria-label={task.status === 'done' ? 'Mark task incomplete' : 'Complete task'} onClick={() => update(userId, 'tasks', task.id, { status: task.status === 'done' ? 'todo' : 'done' })}>{task.status === 'done' && <Check size={14} />}</button>
        <div className="module-row-copy"><strong>{task.title}</strong><span>{task.schedule?.deadline ? new Date(task.schedule.deadline).toLocaleString() : t('No deadline')} · {t(`${task.priority} priority`)}{task.projectId ? ` · ${projects.find((project) => project.id === task.projectId)?.title ?? t('Project')}` : ''}{task.goalIds[0] ? ` · ${goals.find((goal) => goal.id === task.goalIds[0])?.title ?? t('Goal')}` : ''}</span></div>
        <button className="module-delete" type="button" aria-label={task.pinned ? t('Unpin task') : t('Pin task')} onClick={() => update(userId, 'tasks', task.id, { pinned: !task.pinned })}>{task.pinned ? <PinOff size={16} /> : <Pin size={16} />}</button>
        <button className="module-delete" type="button" aria-label={`${t('Delete')} ${task.title}`} onClick={() => remove(userId, 'tasks', task.id)}><Trash2 size={16} /></button>
      </article>;

      const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        add(userId, 'tasks', createEntity({
          title: title.trim(),
          status: 'todo',
          priority,
          listId: selectedTaskList || undefined,
          pinned: false,
          schedule: repeatKind === 'once' ? (taskDeadline ? { kind: 'once', deadline: new Date(taskDeadline).toISOString() } : undefined) : {
            kind: repeatKind,
            ...(repeatKind === 'interval' ? { intervalDays: Math.max(1, Number(repeatInterval) || 1) } : {}),
            ...(repeatKind === 'weekly' ? { weekdays: repeatWeekdays } : {}),
            ...(taskDeadline ? { deadline: new Date(taskDeadline).toISOString() } : {}),
          },
          goalIds: goalId ? [goalId] : [],
          projectId: projectId || undefined,
          tagIds: [],
        }));
        setTitle('');
        setGoalId('');
        setProjectId('');
        setSelectedTaskList('');
        setTaskDeadline('');
      };
      const addList = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!taskListName.trim()) return;
        add(userId, 'taskLists', createEntity({ name: taskListName.trim() }));
        setTaskListName('');
      };

      return (
        <div className="module-tools">
          <form className="module-form module-form-grid" onSubmit={submit}>
            <label className="module-field module-field-wide"><span>Task list</span><select value={selectedTaskList} onChange={(event) => setSelectedTaskList(event.target.value)}><option value="">Inbox</option>{taskLists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>
            <label className="module-field module-field-wide">
              <span>{t('Task')}</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs doing?" required maxLength={120} />
            </label>
            <label className="module-field"><span>{t('Deadline (optional)')}</span><input type="datetime-local" value={taskDeadline} onChange={(event) => setTaskDeadline(event.target.value)} /></label>
            <label className="module-field"><span>{t('Repeat')}</span><select value={repeatKind} onChange={(event) => setRepeatKind(event.target.value as typeof repeatKind)}><option value="once">{t('Does not repeat')}</option><option value="interval">{t('Repeats at an interval')}</option><option value="weekly">{t('Repeats on selected days')}</option></select></label>
            {repeatKind === 'interval' && <label className="module-field"><span>{t('Repeat interval in days')}</span><input type="number" min="1" value={repeatInterval} onChange={(event) => setRepeatInterval(event.target.value)} /></label>}
            {repeatKind === 'weekly' && <fieldset className="module-field module-field-wide"><legend>{t('Days of the week')}</legend><div className="module-form-actions">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => <label key={day}><input type="checkbox" checked={repeatWeekdays.includes(index)} onChange={() => setRepeatWeekdays((days) => days.includes(index) ? days.filter((value) => value !== index) : [...days, index])} /> {t(day)}</label>)}</div></fieldset>}
            <label className="module-field">
              <span>{t('Priority')}</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </label>
            {goals.some((goal) => goal.status === 'active') && (
              <label className="module-field module-field-wide">
                <span>{t('Linked goal (optional)')}</span>
                <select value={goalId} onChange={(event) => setGoalId(event.target.value)}>
                  <option value="">{t('No linked goal')}</option>
                  {goals.filter((goal) => goal.status === 'active').map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
                </select>
              </label>
            )}
            {projects.some((project) => project.status === 'active') && (
              <label className="module-field module-field-wide">
                <span>{t('Linked project (optional)')}</span>
                <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                  <option value="">{t('No linked project')}</option>
                  {projects.filter((project) => project.status === 'active').map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                </select>
              </label>
            )}
            <button className="module-primary" type="submit"><Plus size={16} /> {t('Add task')}</button>
          </form>
          <form className="module-form module-form-inline" onSubmit={addList}><input value={taskListName} onChange={(event) => setTaskListName(event.target.value)} placeholder={t('New task list name')} /><button className="module-secondary" type="submit"><Plus size={16} /> {t('Add list')}</button></form>
          <div className="task-list-groups">
            {taskLists.length === 0 && tasks.length === 0 && <EmptyState text={t('Add a task list or a task to get started.')} />}
            {taskLists.map((list) => <section className="module-list" key={list.id}><h3 className="module-section-heading">{list.name}</h3>{tasks.filter((task) => task.listId === list.id).map((task) => (
              renderTask(task)
            ))}{!tasks.some((task) => task.listId === list.id) && <EmptyState text={t('This list is empty.')} />}</section>)}
            {tasks.filter((task) => !task.listId).length > 0 && <section className="module-list"><h3 className="module-section-heading">{t('Inbox')}</h3>{tasks.filter((task) => !task.listId).map((task) => (
              renderTask(task)
            ))}</section>}
          </div>
        </div>
      );
    }
    case 'projects': {
      const projects = data?.projects ?? [];
      const goals = data?.goals ?? [];
      const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        add(userId, 'projects', createEntity({
          title: title.trim(),
          description: description.trim() || undefined,
          status: 'active',
          goalIds: goalId ? [goalId] : [],
          targetDate: targetDate || undefined,
        }));
        setTitle('');
        setDescription('');
        setGoalId('');
        setTargetDate('');
      };
      return (
        <div className="module-tools">
          <form className="module-form" onSubmit={submit}>
            <label className="module-field"><span>{t('Project name')}</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What are you building or changing?" required maxLength={120} /></label>
            <label className="module-field"><span>What is this project about?</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add context and define the outcome..." rows={3} /></label>
            {goals.some((goal) => goal.status === 'active') && <label className="module-field"><span>Connected goal (optional)</span><select value={goalId} onChange={(event) => setGoalId(event.target.value)}><option value="">No connected goal</option>{goals.filter((goal) => goal.status === 'active').map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>}
            <label className="module-field"><span>Target date (optional)</span><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
            <button className="module-primary" type="submit"><Plus size={16} /> Add project</button>
          </form>
          <div className="module-list">
            {projects.length === 0 ? <EmptyState text="Projects turn broad goals into a place for focused work." /> : [...projects].sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed')).map((project) => <article className={`module-row module-row-top ${project.status === 'completed' ? 'is-complete' : ''}`} key={project.id}><button className="module-check" type="button" aria-label={project.status === 'completed' ? 'Reopen project' : 'Complete project'} onClick={() => update(userId, 'projects', project.id, { status: project.status === 'completed' ? 'active' : 'completed' })}>{project.status === 'completed' && <Check size={14} />}</button><div className="module-row-copy"><strong>{project.title}</strong>{project.description && <span>{project.description}</span>}<small>{project.goalIds[0] ? `Goal · ${goals.find((goal) => goal.id === project.goalIds[0])?.title ?? 'Goal'}` : 'No connected goal'}{project.targetDate ? ` · Target ${formatDate(project.targetDate)}` : ''}</small></div><button className="module-delete" type="button" aria-label={`Delete ${project.title}`} onClick={() => remove(userId, 'projects', project.id)}><Trash2 size={16} /></button></article>)}
          </div>
        </div>
      );
    }
    case 'notes': {
      const notes = data?.notes ?? [];
      const projects = data?.projects ?? [];

      const reset = () => {
        setEditingId(null);
        setTitle('');
        setMarkdown('');
        setProjectId('');
      };
      const edit = (note: (typeof notes)[number]) => {
        setEditingId(note.id);
        setTitle(note.title);
        setMarkdown(note.markdown);
        setProjectId(note.projectId ?? '');
      };
      const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (editingId) {
          update(userId, 'notes', editingId, { title: title.trim(), markdown, projectId: projectId || undefined });
        } else {
          add(userId, 'notes', createEntity({ title: title.trim(), markdown, projectId: projectId || undefined, tagIds: [] }));
        }
        reset();
      };
      return (
        <div className="module-tools">
          <form className="module-form" onSubmit={submit}>
            <label className="module-field"><span>{t('Title')}</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give this note a name" required maxLength={120} /></label>
            {projects.some((project) => project.status === 'active') && <label className="module-field"><span>Connected project (optional)</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">No connected project</option>{projects.filter((project) => project.status === 'active').map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>}
            <label className="module-field"><span>{t('Your note')}</span><textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} placeholder="Capture an idea, plan, or reminder..." rows={5} required /></label>
            <div className="module-form-actions"><button className="module-primary" type="submit"><Save size={16} /> {editingId ? 'Save changes' : 'Save note'}</button>{editingId && <button className="module-secondary" type="button" onClick={reset}>Cancel</button>}</div>
          </form>
          <div className="module-list">
            {notes.length === 0 ? <EmptyState text="Your saved ideas will appear here." /> : [...notes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((note, index, ordered) => (
              <article className="module-row module-row-top" key={note.id} draggable onDragStart={() => setDraggedNoteId(note.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => {
                if (!draggedNoteId || draggedNoteId === note.id) return;
                const from = ordered.findIndex((item) => item.id === draggedNoteId);
                const reordered = [...ordered];
                const [moved] = reordered.splice(from, 1);
                reordered.splice(index, 0, moved);
                reordered.forEach((item, itemIndex) => update(userId, 'notes', item.id, { order: itemIndex }));
                setDraggedNoteId(null);
              }}>
                <button className="module-row-content-button" type="button" onClick={() => edit(note)}><strong>{note.title}</strong><span>{note.markdown}</span><small>{note.projectId ? `Project · ${projects.find((project) => project.id === note.projectId)?.title ?? 'Project'} · ` : ''}{new Date(note.updatedAt).toLocaleDateString()}</small></button>
                <button className="module-secondary" type="button" onClick={() => { const other = ordered[index - 1]; if (other) { update(userId, 'notes', note.id, { order: index - 1 }); update(userId, 'notes', other.id, { order: index }); } }}>↑</button>
                <button className="module-secondary" type="button" onClick={() => { const other = ordered[index + 1]; if (other) { update(userId, 'notes', note.id, { order: index + 1 }); update(userId, 'notes', other.id, { order: index }); } }}>↓</button>
                <button className="module-delete" type="button" aria-label={`Delete ${note.title}`} onClick={() => { remove(userId, 'notes', note.id); if (editingId === note.id) reset(); }}><Trash2 size={16} /></button>
              </article>
            ))}
          </div>
        </div>
      );
    }
    case 'resources': {
      const resources = data?.resources ?? [];
      const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        add(userId, 'resources', createEntity({ title: title.trim(), url: note.trim(), description: description.trim() || undefined }));
        setTitle('');
        setNote('');
        setDescription('');
      };
      return (
        <div className="module-tools">
          <form className="module-form" onSubmit={submit}>
            <label className="module-field"><span>Name or title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Linear, a useful article, or a tool" required maxLength={120} /></label>
            <label className="module-field"><span>Link</span><input type="url" value={note} onChange={(event) => setNote(event.target.value)} placeholder="https://..." required /></label>
            <label className="module-field"><span>Description (optional)</span><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Why is this useful?" maxLength={160} /></label>
            <button className="module-primary" type="submit"><Plus size={16} /> Save resource</button>
          </form>
          <div className="module-list">
            {resources.length === 0 ? <EmptyState text="Save useful links, tools, and articles so they are easy to find again." /> : [...resources].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((resource) => <article className="module-row" key={resource.id}><span className="module-round-icon"><Link2 size={17} /></span><div className="module-row-copy"><strong>{resource.title}</strong><span>{resource.description || resource.url}</span></div><a className="module-icon-link" href={resource.url} target="_blank" rel="noreferrer" aria-label={`Open ${resource.title}`}><ExternalLink size={16} /></a><button className="module-delete" type="button" aria-label={`Delete ${resource.title}`} onClick={() => remove(userId, 'resources', resource.id)}><Trash2 size={16} /></button></article>)}
          </div>
        </div>
      );
    }
    case 'focus': {
      const sessions = data?.focusSessions ?? [];
      const finish = () => {
        if (focusTimer.startedAt) {
          add(userId, 'focusSessions', createEntity({
            kind: 'focus',
            plannedSeconds: focusTimer.plannedSeconds,
            startedAt: focusTimer.startedAt,
            endedAt: new Date().toISOString(),
            notes: focusNotes.trim() || undefined,
          }));
        }
        setFocusTimer(userId, EMPTY_FOCUS_TIMER);
      };
      return (
        <div className="module-tools">
          <section className="focus-card">
            <label className="module-field"><span>{t('Timer mode')}</span><select value={timerMode} onChange={(event) => setTimerMode(event.target.value as typeof timerMode)}><option value="pomodoro">{t('Pomodoro')}</option><option value="classic">{t('Classic countdown')}</option></select></label>
            <p className="eyebrow">{timerMode === 'pomodoro' ? t('FOCUS TIMER') : t('CLASSIC COUNTDOWN')}</p>
            <div className="focus-clock" role="timer" aria-live="off">{`${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`}</div>
            <div className="focus-progress" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, ((focusTimer.plannedSeconds - seconds) / Math.max(1, focusTimer.plannedSeconds)) * 100))}%` }} /></div>
            <p>{running ? t('One moment at a time.') : timerMode === 'pomodoro' ? t('Focus, then take a restorative break.') : t('Set a duration and count down at your own pace.')}</p>
            <div className="module-form-actions">
              <button className="module-primary" type="button" onClick={() => {
                if (running) {
                  setFocusTimer(userId, { ...focusTimer, elapsedSeconds: focusTimer.plannedSeconds - seconds, remainingSeconds: seconds, resumedAt: null });
                } else {
                  const now = new Date().toISOString();
                  setFocusTimer(userId, {
                    startedAt: focusTimer.startedAt ?? now,
                    resumedAt: now,
                    elapsedSeconds: focusTimer.plannedSeconds - seconds,
                    remainingSeconds: seconds || Number(focusMinutes) * 60,
                    plannedSeconds: focusTimer.plannedSeconds || Number(focusMinutes) * 60,
                    phase: focusMode,
                  });
                }
              }}>
                {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {seconds ? 'Resume' : 'Start focus'}</>}
              </button>
              {(seconds > 0 || running) && <button className="module-secondary" type="button" onClick={finish}>Finish & save</button>}
            </div>
          </section>
          <form className="module-form module-form-grid" onSubmit={(event) => { event.preventDefault(); setFocusTimer(userId, { ...EMPTY_FOCUS_TIMER, plannedSeconds: Number(focusMode === 'focus' ? focusMinutes : breakMinutes) * 60, remainingSeconds: Number(focusMode === 'focus' ? focusMinutes : breakMinutes) * 60, phase: focusMode }); }}>
            <label className="module-field"><span>Focus minutes</span><input type="number" min="1" max="180" value={focusMinutes} onChange={(event) => setFocusMinutes(event.target.value)} /></label>
            <label className="module-field"><span>Break minutes</span><input type="number" min="1" max="60" value={breakMinutes} onChange={(event) => setBreakMinutes(event.target.value)} /></label>
            {timerMode === 'pomodoro' && <label className="module-field"><span>{t('Phase')}</span><select value={focusMode} onChange={(event) => setFocusMode(event.target.value as typeof focusMode)}><option value="focus">{t('Focus')}</option><option value="break">{t('Break')}</option></select></label>}
            <label className="module-field module-field-wide"><span>Session note</span><textarea value={focusNotes} onChange={(event) => setFocusNotes(event.target.value)} placeholder="What are you working on?" rows={2} /></label>
            <button className="module-secondary" type="submit">Set timer</button>
          </form>
          <h3 className="module-section-heading">Recent sessions</h3>
          <div className="module-list">
            {sessions.length === 0 ? <EmptyState text="Completed focus sessions will be recorded here." /> : [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 10).map((session) => (
              <article className="module-row" key={session.id}><span className="module-round-icon"><CircleCheck size={17} /></span><div className="module-row-copy"><strong>{Math.floor(session.plannedSeconds / 60)} min focus</strong><span>{new Date(session.startedAt).toLocaleString()}</span>{session.notes && <small>{session.notes}</small>}</div><button className="module-delete" type="button" aria-label="Delete session" onClick={() => remove(userId, 'focusSessions', session.id)}><Trash2 size={16} /></button></article>
            ))}
          </div>
        </div>
      );
    }
    case 'habits': {
      const habits = data?.habits ?? [];
      const entries = data?.habitEntries ?? [];
      const completedToday = habits.filter((habit) => !habit.archived && entries.some((entry) => entry.habitId === habit.id && entry.date === today && entry.completed)).length;
      const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        add(userId, 'habits', createEntity({ title: title.trim(), schedule: { frequency, ...(frequency === 'weekly' ? { daysOfWeek: [Number(weeklyDay)] } : {}) }, archived: false }));
        setTitle('');
      };
      const toggleToday = (habitId: string) => {
        const existing = entries.find((entry) => entry.habitId === habitId && entry.date === today);
        if (existing) update(userId, 'habitEntries', existing.id, { completed: !existing.completed, value: existing.completed ? 0 : 1 });
        else add(userId, 'habitEntries', createEntity({ habitId, date: today, completed: true, value: 1 }));
      };
      return (
        <div className="module-tools">
          <div className="module-stat"><strong>{completedToday} / {habits.filter((habit) => !habit.archived).length}</strong><span>habits checked off today</span></div>
          <form className="module-form module-form-grid" onSubmit={submit}>
            <label className="module-field module-field-wide"><span>Habit</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Take a short walk" required maxLength={100} /></label>
            <label className="module-field"><span>Repeat</span><select value={frequency} onChange={(event) => setFrequency(event.target.value as typeof frequency)}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
            {frequency === 'weekly' && <label className="module-field"><span>Weekly day</span><select value={weeklyDay} onChange={(event) => setWeeklyDay(event.target.value)}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>}
            <button className="module-primary" type="submit"><Plus size={16} /> Add habit</button>
          </form>
          <div className="module-list">
            {habits.length === 0 ? <EmptyState text="Start with one small habit you want to make easier to keep." /> : habits.filter((habit) => !habit.archived && (habit.schedule.frequency !== 'weekly' || (habit.schedule.daysOfWeek ?? []).includes(new Date().getDay()))).map((habit) => {
              const done = entries.some((entry) => entry.habitId === habit.id && entry.date === today && entry.completed);
              return <article className={`module-row ${done ? 'is-complete' : ''}`} key={habit.id}><button className="module-check" type="button" aria-label={done ? 'Undo today’s check-in' : 'Check off today'} onClick={() => toggleToday(habit.id)}>{done && <Check size={14} />}</button><div className="module-row-copy"><strong>{habit.title}</strong><span>{habit.schedule.frequency} · {done ? 'Done today' : 'Not checked today'}</span></div><button className="module-delete" type="button" aria-label={`Delete ${habit.title}`} onClick={() => { entries.filter((entry) => entry.habitId === habit.id).forEach((entry) => remove(userId, 'habitEntries', entry.id)); remove(userId, 'habits', habit.id); }}><Trash2 size={16} /></button></article>;
            })}
          </div>
        </div>
      );
    }
    case 'calendar': {
      const events = data?.calendarEntries ?? [];
      const calendarCursor = new Date(`${calendarDate}T12:00:00`);
      const monthStart = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
      const monthDays = Array.from({ length: new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 0).getDate() }, (_, index) => new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), index + 1));
      const weekStart = new Date(calendarCursor);
      weekStart.setDate(calendarCursor.getDate() - calendarCursor.getDay());
      const weekDays = Array.from({ length: 7 }, (_, index) => { const day = new Date(weekStart); day.setDate(weekStart.getDate() + index); return day; });
      const visibleEvents = calendarView === 'day'
        ? events.filter((entry) => getLocalDate(new Date(entry.startAt)) === calendarDate)
        : calendarView === 'week'
          ? events.filter((entry) => { const day = new Date(`${calendarDate}T12:00:00`); const start = new Date(day); start.setDate(day.getDate() - day.getDay()); const end = new Date(start); end.setDate(start.getDate() + 7); const eventDay = new Date(entry.startAt); return eventDay >= start && eventDay < end; })
          : events;
      const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const start = new Date(startAt);
        const end = new Date(endAt);
        if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
          setEventError('The end time must be after the start time.');
          return;
        }
        add(userId, 'calendarEntries', createEntity({ title: title.trim(), startAt: start.toISOString(), endAt: end.toISOString() }));
        setTitle('');
        setEventError('');
      };
      return (
        <div className="module-tools">
          <div className="module-form-actions"><button className={calendarView === 'month' ? 'module-primary' : 'module-secondary'} type="button" onClick={() => setCalendarView('month')}>{t('Month')}</button><button className={calendarView === 'week' ? 'module-primary' : 'module-secondary'} type="button" onClick={() => setCalendarView('week')}>{t('Week')}</button><button className={calendarView === 'day' ? 'module-primary' : 'module-secondary'} type="button" onClick={() => setCalendarView('day')}>{t('Day')}</button></div>
          <div className="module-form-actions"><button className="module-secondary" type="button" onClick={() => { const next = new Date(`${calendarDate}T12:00:00`); next.setDate(next.getDate() - 1); setCalendarDate(getLocalDate(next)); }}>Previous day</button><input type="date" value={calendarDate} onChange={(event) => { setCalendarDate(event.target.value); setCalendarView('day'); }} /><button className="module-secondary" type="button" onClick={() => { const next = new Date(`${calendarDate}T12:00:00`); next.setDate(next.getDate() + 1); setCalendarDate(getLocalDate(next)); }}>Next day</button></div>
          <form className="module-form module-form-grid" onSubmit={submit}>
            <label className="module-field module-field-wide"><span>Event</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What is happening?" required maxLength={120} /></label>
            <label className="module-field"><span>Starts</span><input type="datetime-local" value={startAt} onChange={(event) => { setStartAt(event.target.value); setEventError(''); }} required /></label>
            <label className="module-field"><span>Ends</span><input type="datetime-local" value={endAt} onChange={(event) => { setEndAt(event.target.value); setEventError(''); }} required /></label>
            {eventError && <p className="form-error module-field-wide" role="alert">{eventError}</p>}
            <button className="module-primary" type="submit"><Plus size={16} /> Add event</button>
          </form>
          {calendarView === 'month' && <div className="calendar-month-grid"><div className="calendar-month-title">{monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span className="calendar-weekday" key={day}>{t(day)}</span>)}{Array.from({ length: monthStart.getDay() }).map((_, index) => <span className="calendar-empty" key={`empty-${index}`} />)}{monthDays.map((day) => { const dayValue = getLocalDate(day); const dayEvents = events.filter((entry) => getLocalDate(new Date(entry.startAt)) === dayValue); return <button className={`calendar-day ${dayValue === calendarDate ? 'is-selected' : ''}`} type="button" key={dayValue} onClick={() => { setCalendarDate(dayValue); setCalendarView('day'); }}><strong>{day.getDate()}</strong>{dayEvents.slice(0, 2).map((entry) => <small key={entry.id}>{entry.title}</small>)}{dayEvents.length > 2 && <small>+{dayEvents.length - 2}</small>}</button>; })}</div>}
          {calendarView === 'week' && <div className="calendar-week-grid">{weekDays.map((day) => { const dayValue = getLocalDate(day); return <button className="calendar-day" type="button" key={dayValue} onClick={() => { setCalendarDate(dayValue); setCalendarView('day'); }}><strong>{day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</strong>{events.filter((entry) => getLocalDate(new Date(entry.startAt)) === dayValue).map((entry) => <small key={entry.id}>{new Date(entry.startAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {entry.title}</small>)}</button>; })}</div>}
          {calendarView === 'day' && <div className="calendar-day-timeline">{Array.from({ length: 24 }, (_, hour) => <div className="calendar-hour" key={hour}><span>{String(hour).padStart(2, '0')}:00</span><div>{events.filter((entry) => getLocalDate(new Date(entry.startAt)) === calendarDate && new Date(entry.startAt).getHours() === hour).map((entry) => <article key={entry.id}><strong>{entry.title}</strong><small>{new Date(entry.startAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – {new Date(entry.endAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small></article>)}</div></div>)}</div>}
          <h3 className="module-section-heading">Events</h3>
          <div className="module-list">
            {visibleEvents.length === 0 ? <EmptyState text="Add important events to keep your plans in one place." /> : [...visibleEvents].sort((a, b) => a.startAt.localeCompare(b.startAt)).map((entry) => (
              <article className="module-row" key={entry.id}><span className="module-round-icon"><CalendarIcon /></span><div className="module-row-copy"><strong>{entry.title}</strong><span>{new Date(entry.startAt).toLocaleString()} – {new Date(entry.endAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div><button className="module-delete" type="button" aria-label={`Delete ${entry.title}`} onClick={() => remove(userId, 'calendarEntries', entry.id)}><Trash2 size={16} /></button></article>
            ))}
          </div>
        </div>
      );
    }
    case 'finance': {
      const transactions = data?.transactions ?? [];
      const totalsByKind: Record<string, Record<string, number>> = { income: {}, expense: {} };
      transactions.forEach((transaction) => {
        const key = transaction.category || t('Uncategorized');
        totalsByKind[transaction.kind][key] = (totalsByKind[transaction.kind][key] ?? 0) + transaction.amountMinor;
      });
      const categoryTotals = (kindValue: 'income' | 'expense') => {
        const values = totalsByKind[kindValue];
        const total = Object.values(values).reduce((sum, value) => sum + value, 0);
        return Object.entries(values).map(([name, value]) => ({ name, percentage: total ? Math.round((value / total) * 100) : 0 }));
      };
      const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const amountMinor = Math.round(Number(amount) * 100);
        if (!Number.isFinite(amountMinor) || amountMinor <= 0) return;
        add(userId, 'transactions', createEntity({
          kind,
          amountMinor,
          currency,
          occurredAt: new Date().toISOString(),
          category: category.trim() || undefined,
          note: [category.trim(), note.trim()].filter(Boolean).join(' · ') || undefined,
        }));
        setAmount('');
        setCategory('');
        setNote('');
      };
      return (
        <div className="module-tools">
          {Object.entries(totals).length > 0 && <div className="module-stat-grid">{Object.entries(totals).map(([code, values]) => <div className="module-stat" key={code}><strong>{formatMoney(values.income - values.expense, code)}</strong><span>net recorded · {code}</span></div>)}</div>}
          <form className="module-form" onSubmit={(event) => {
            event.preventDefault();
            const categories = [...categoryRows.filter((item) => item.name.trim()).map((item) => ({ name: item.name.trim(), percentage: Number(item.percentage) || 0 })), { name: t('Other'), percentage: Math.max(0, 100 - categoryRows.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0)) }];
            if (!title.trim() || categories.length === 0 || categories.reduce((sum, item) => sum + item.percentage, 0) !== 100) return;
            add(userId, 'financePlans', createEntity({ title: title.trim(), categories, currency, month: today.slice(0, 7) }));
            setTitle(''); setCategoryRows([{ name: '', percentage: '' }]);
          }}>
            <label className="module-field"><span>{t('Plan name')}</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('Monthly spending plan')} /></label>
            <div className="module-field"><span>{t('Categories and percentages')}</span>{categoryRows.map((row, index) => <div className="finance-category-row" key={index}><input value={row.name} onChange={(event) => setCategoryRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder={t('Category name')} /><input type="number" min="0" max="100" value={row.percentage} onChange={(event) => setCategoryRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, percentage: event.target.value } : item))} placeholder="%" />{categoryRows.length > 1 && <button className="module-delete" type="button" onClick={() => setCategoryRows((rows) => rows.filter((_, itemIndex) => itemIndex !== index))}>×</button>}</div>)}<button className="module-secondary" type="button" onClick={() => setCategoryRows((rows) => [...rows, { name: '', percentage: '' }])}><Plus size={15} /> {t('Add category')}</button><p className="module-hint">{t('Other always receives the remaining percentage.')}</p></div>
            <button className="module-secondary" type="submit">{t('Add financial plan')}</button>
          </form>
          {(data?.financePlans ?? []).map((plan) => <div className="module-stat-grid" key={plan.id}><div className="module-stat"><strong>{plan.title}</strong><span>{plan.categories.map((item) => `${item.name} ${item.percentage}%`).join(' · ')}</span></div></div>)}
          {(['income', 'expense'] as const).map((transactionKind) => {
            const distribution = categoryTotals(transactionKind);
            return distribution.length > 0 && <div className="module-stat" key={transactionKind}><strong>{t(transactionKind === 'income' ? 'Actual income distribution' : 'Actual spending distribution')}</strong><span>{distribution.map((item) => `${item.name} ${item.percentage}%`).join(' · ')}</span></div>;
          })}
          <form className="module-form module-form-grid" onSubmit={submit}>
            <label className="module-field"><span>Type</span><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="expense">Expense</option><option value="income">Income</option></select></label>
            <label className="module-field"><span>Amount</span><input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></label>
            <label className="module-field"><span>Currency</span><select value={currency} onChange={(event) => setCurrency(event.target.value)}><option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option><option>AUD</option></select></label>
            <label className="module-field"><span>{t('Category')}</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">{t('Other')}</option>{(data?.financePlans ?? []).flatMap((plan) => plan.categories.map((item) => item.name)).filter((value, index, values) => values.indexOf(value) === index).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="module-field module-field-wide"><span>Note (optional)</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="A little context" maxLength={120} /></label>
            <button className="module-primary" type="submit"><Plus size={16} /> Add transaction</button>
          </form>
          <div className="module-list">
            {transactions.length === 0 ? <EmptyState text="Record income and spending to start seeing the picture." /> : [...transactions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).map((transaction) => (
              <article className="module-row" key={transaction.id}><span className={`module-money-kind ${transaction.kind}`}>{transaction.kind === 'income' ? '+' : '−'}</span><div className="module-row-copy"><strong>{transaction.note || (transaction.kind === 'income' ? 'Income' : 'Expense')}</strong><span>{new Date(transaction.occurredAt).toLocaleDateString()} · {transaction.kind}{transaction.category ? ` · ${transaction.category}` : ''}</span></div><strong className="module-amount">{formatMoney(transaction.amountMinor, transaction.currency)}</strong><button className="module-delete" type="button" aria-label="Delete transaction" onClick={() => remove(userId, 'transactions', transaction.id)}><Trash2 size={16} /></button></article>
            ))}
          </div>
        </div>
      );
    }
    case 'goals': {
      const goals = data?.goals ?? [];
      const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        add(userId, 'goals', createEntity({ title: title.trim(), description: description.trim() || undefined, status: 'active', targetDate: targetDate || undefined }));
        setTitle('');
        setDescription('');
        setTargetDate('');
      };
      return (
        <div className="module-tools">
          <form className="module-form" onSubmit={submit}>
            <label className="module-field"><span>What do you want to achieve?</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Make the goal specific" required maxLength={120} /></label>
            <label className="module-field"><span>Why it matters / details</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add some context or what success looks like..." rows={3} /></label>
            <label className="module-field"><span>Target date (optional)</span><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
            <button className="module-primary" type="submit"><Plus size={16} /> Add goal</button>
          </form>
          <div className="module-list">
            {goals.length === 0 ? <EmptyState text="Give something you care about a name and a next horizon." /> : [...goals].sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed') || (a.targetDate ?? '').localeCompare(b.targetDate ?? '')).map((goal) => (
              <article className={`module-row module-row-top ${goal.status === 'completed' ? 'is-complete' : ''}`} key={goal.id}><button className="module-check" type="button" aria-label={goal.status === 'completed' ? 'Reopen goal' : 'Complete goal'} onClick={() => update(userId, 'goals', goal.id, { status: goal.status === 'completed' ? 'active' : 'completed', completedAt: goal.status === 'completed' ? undefined : new Date().toISOString() })}>{goal.status === 'completed' && <Check size={14} />}</button><div className="module-row-copy"><strong>{goal.title}</strong>{goal.description && <span>{goal.description}</span>}<small>{goal.status === 'completed' ? 'Completed' : goal.targetDate ? `Target · ${formatDate(goal.targetDate)}` : 'No target date'}</small></div><button className="module-delete" type="button" aria-label={`Delete ${goal.title}`} onClick={() => remove(userId, 'goals', goal.id)}><Trash2 size={16} /></button></article>
            ))}
          </div>
        </div>
      );
    }
    case 'dailyJournal': {
      const entries = journalEntries;
      const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (existingJournalEntry) update(userId, 'journalEntries', existingJournalEntry.id, { markdown, mood });
        else add(userId, 'journalEntries', createEntity({ date, markdown, mood, linkedEntities: [] }));
      };
      const moods = ['great', 'good', 'okay', 'low', 'difficult'] as const;
      return (
        <div className="module-tools">
          <form className="module-form" onSubmit={submit}>
            <p className="module-hint">{t('You can add or edit only today’s journal entry. It becomes read-only after 2:00 AM.')}</p>
            <label className="module-field"><span>How did today feel?</span><select value={mood} onChange={(event) => setMood(event.target.value as typeof mood)}>{moods.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
            <label className="module-field"><span>Your reflection</span><textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} placeholder="What stood out today? Write as much or as little as you like..." rows={7} required /></label>
            <button className="module-primary" type="submit"><Save size={16} /> {existingJournalEntry ? 'Update entry' : 'Save entry'}</button>
          </form>
          <h3 className="module-section-heading">Past entries</h3>
          <div className="module-list">
            {entries.length === 0 ? <EmptyState text="Your private reflections stay on this device." /> : [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((entry) => <div className="module-history-button" key={entry.id}><span><strong>{formatDate(entry.date)}</strong><small>{entry.mood}</small></span><span>{entry.markdown}</span></div>)}
          </div>
        </div>
      );
    }
    case 'fitness': {
      const plans = data?.fitnessPlans ?? [];
      const fitnessGoals = data?.fitnessGoals ?? [];
      const sessions = data?.workoutSessions ?? [];
      const submitPlan = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        add(userId, 'fitnessPlans', createEntity({
          title: title.trim(),
          scheduledDays: [],
          exercises: exerciseText.split('\n').map((name) => name.trim()).filter(Boolean).map((name) => ({ id: newId(), name })),
          archived: false,
        }));
        setTitle('');
        setExerciseText('');
      };
      const submitWorkout = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const plan = plans.find((item) => item.id === selectedPlan);
        add(userId, 'workoutSessions', createEntity({
          planId: plan?.id,
          date: getLocalDate(),
          completedAt: new Date().toISOString(),
          durationMinutes: duration ? Number(duration) : undefined,
          exerciseResults: plan?.exercises.map((exercise) => ({ exerciseId: exercise.id, exerciseName: exercise.name })) ?? [],
          notes: workoutNotes.trim() || undefined,
        }));
        setDuration('');
        setWorkoutNotes('');
      };
      return (
        <div className="module-tools">
          <form className="module-form module-form-inline" onSubmit={(event) => { event.preventDefault(); if (!title.trim()) return; add(userId, 'fitnessGoals', createEntity({ title: title.trim(), target: description.trim() || undefined, deadline: targetDate || undefined, completed: false })); setTitle(''); setDescription(''); setTargetDate(''); }}><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Workout goal" required /><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Target (e.g. run 5 km)" /><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /><button className="module-secondary" type="submit">Add goal</button></form>
          {fitnessGoals.length > 0 && <div className="module-list">{fitnessGoals.map((goal) => <article className={`module-row ${goal.completed ? 'is-complete' : ''}`} key={goal.id}><button className="module-check" type="button" onClick={() => update(userId, 'fitnessGoals', goal.id, { completed: !goal.completed })}>{goal.completed && <Check size={14} />}</button><div className="module-row-copy"><strong>{goal.title}</strong><span>{goal.target ?? ''}{goal.deadline ? ` · ${formatDate(goal.deadline)}` : ''}</span></div><button className="module-delete" type="button" onClick={() => remove(userId, 'fitnessGoals', goal.id)}><Trash2 size={16} /></button></article>)}</div>}
          <form className="module-form" onSubmit={submitPlan}>
            <h3 className="module-form-heading">Workout plans</h3>
            <label className="module-field"><span>Plan name</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Full-body strength" required maxLength={100} /></label>
            <label className="module-field"><span>Exercises (one per line)</span><textarea value={exerciseText} onChange={(event) => setExerciseText(event.target.value)} placeholder={'Squats\nPush-ups\nWalking'} rows={3} /></label>
            <button className="module-primary" type="submit"><Plus size={16} /> Save plan</button>
          </form>
          {plans.length > 0 && <div className="module-plan-list">{plans.map((plan) => <article className="module-plan" key={plan.id}><div><strong>{plan.title}</strong><span>{plan.exercises.map((exercise) => exercise.name).join(' · ') || 'No exercises added'}</span></div><button className="module-delete" type="button" aria-label={`Delete ${plan.title}`} onClick={() => remove(userId, 'fitnessPlans', plan.id)}><Trash2 size={16} /></button></article>)}</div>}
          <form className="module-form module-form-grid" onSubmit={submitWorkout}>
            <h3 className="module-form-heading module-field-wide">Log a workout</h3>
            <label className="module-field module-field-wide"><span>Plan</span><select value={selectedPlan} onChange={(event) => setSelectedPlan(event.target.value)}><option value="">Quick workout</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></label>
            <label className="module-field"><span>Duration (minutes)</span><input type="number" min="1" max="1440" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder={selectedPlan ? 'Optional' : 'Required for quick workout'} required={!selectedPlan} /></label>
            <label className="module-field module-field-wide"><span>Notes (optional)</span><textarea value={workoutNotes} onChange={(event) => setWorkoutNotes(event.target.value)} placeholder="How did it go?" rows={2} /></label>
            <button className="module-primary" type="submit"><Check size={16} /> Save workout</button>
          </form>
          <h3 className="module-section-heading">Recent workouts</h3>
          <div className="module-list">
            {sessions.length === 0 ? <EmptyState text="Finished workouts will build a history here." /> : [...sessions].sort((a, b) => b.date.localeCompare(a.date)).map((session) => <article className="module-row module-row-top" key={session.id}><span className="module-round-icon"><Check size={17} /></span><div className="module-row-copy"><strong>{plans.find((plan) => plan.id === session.planId)?.title ?? (session.planId ? 'Plan removed' : 'Quick workout')}</strong><span>{formatDate(session.date)}{session.durationMinutes ? ` · ${session.durationMinutes} min` : ''}</span>{session.notes && <small>{session.notes}</small>}</div><button className="module-delete" type="button" aria-label="Delete workout" onClick={() => remove(userId, 'workoutSessions', session.id)}><Trash2 size={16} /></button></article>)}
          </div>
        </div>
      );
    }
  }
};

const EmptyState = ({ text }: { text: string }) => <p className="module-empty">{text}</p>;

const CalendarIcon = () => <CalendarDays size={17} aria-hidden="true" />;
