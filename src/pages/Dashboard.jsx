import React, { useState, useMemo } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonIcon,
  IonButton,
  IonBadge,
  IonProgressBar,
} from '@ionic/react';
import {
  todayOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  layersOutline,
  addOutline,
  cloudDownloadOutline,
  calendarOutline,
  timerOutline,
  flameOutline,
  trendingUpOutline,
  arrowForwardOutline,
  flagOutline,
  sparklesOutline,
  rocketOutline,
  leafOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { isPast } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { useProfile } from '../hooks/useProfile';
import { useHabits } from '../hooks/useHabits';
import { useFocusTimer } from '../hooks/useFocusTimer';
import TaskCard from '../components/TaskCard';
import FocusTimer from '../components/FocusTimer';
import './Dashboard.css';

const PRIORITY_COLORS = ['#22C55E', '#F59E0B', '#EF4444'];

const Dashboard = () => {
  const { user } = useAuth();
  const { tasks, stats, weeklyStats, loading, refresh } = useTasks(user?.id);
  const { updateAvailable, remoteVersion, downloadAndInstall } = useAppUpdate();
  const { displayName, avatarEmoji } = useProfile(user?.id);
  const { habits, todayLogs, streaks, todayCountFor } = useHabits(user?.id);
  const focusTimer = useFocusTimer(user?.id);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const history = useHistory();

  const todayStr = new Date().toISOString().split('T')[0];

  const todayTasks = useMemo(() =>
    tasks.filter(t => t.due_date?.startsWith(todayStr) && t.status !== 'completed'),
    [tasks, todayStr]
  );

  const overdueTasks = useMemo(() =>
    tasks.filter(t => t.status !== 'completed' && t.due_date && t.due_date < todayStr),
    [tasks, todayStr]
  );

  const pinnedTasks = useMemo(() =>
    tasks.filter(t => t.is_pinned && t.status !== 'completed'),
    [tasks]
  );

  // Completion rate
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // Priority distribution for donut
  const priorityData = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'completed');
    return [
      { name: 'Bassa', value: active.filter(t => t.priority === 'low').length },
      { name: 'Media', value: active.filter(t => t.priority === 'medium').length },
      { name: 'Alta', value: active.filter(t => t.priority === 'high').length },
    ].filter(d => d.value > 0);
  }, [tasks]);

  // Habits completion ratio today
  const habitsCompleted = useMemo(() => {
    if (!habits.length) return { done: 0, total: 0 };
    let done = 0;
    habits.forEach(h => {
      if (todayCountFor(h.id) >= (h.target_per_day || 1)) done++;
    });
    return { done, total: habits.length };
  }, [habits, todayLogs]);

  // Best streak
  const bestStreak = useMemo(() => {
    const vals = Object.values(streaks);
    return vals.length ? Math.max(...vals) : 0;
  }, [streaks]);

  const handleRefresh = async (event) => {
    await refresh();
    event.detail.complete();
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  const productivityIcon = () => {
    if (completionRate >= 80) return rocketOutline;
    if (completionRate >= 50) return sparklesOutline;
    return leafOutline;
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="dashboard-toolbar">
          <IonTitle className="dashboard-title">
            <div className="title-content">
              <span className="greeting">{greeting()}</span>
              <span className="user-name">{displayName || user?.email?.split('@')[0]}</span>
            </div>
          </IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            className="add-btn-header"
            routerLink="/tabs/create"
          >
            <IonIcon icon={addOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="dashboard-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="dashboard-container">
          {/* Update Banner */}
          {updateAvailable && (
            <div className="dashboard-update-banner" onClick={downloadAndInstall}>
              <IonIcon icon={cloudDownloadOutline} />
              <span>Aggiornamento v{remoteVersion?.versionName} disponibile — Tocca per aggiornare</span>
            </div>
          )}

          {/* ===== HERO CARD – Panoramica rapida ===== */}
          <div className="dash-hero">
            <div className="dash-hero-left">
              <div className="dash-hero-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" className="hero-ring-bg" />
                  <circle cx="50" cy="50" r="42"
                    className="hero-ring-fill"
                    style={{ strokeDasharray: `${completionRate * 2.639} 263.9`, strokeDashoffset: 65.97 }}
                  />
                </svg>
                <span className="hero-ring-pct">{completionRate}%</span>
              </div>
              <span className="hero-ring-label">Completamento</span>
            </div>
            <div className="dash-hero-right">
              <div className="hero-stat">
                <IonIcon icon={todayOutline} style={{ color: '#4F46E5' }} />
                <div>
                  <strong>{loading ? '-' : stats.today}</strong>
                  <span>Oggi</span>
                </div>
              </div>
              <div className="hero-stat">
                <IonIcon icon={checkmarkCircleOutline} style={{ color: '#22C55E' }} />
                <div>
                  <strong>{loading ? '-' : stats.completed}</strong>
                  <span>Completati</span>
                </div>
              </div>
              <div className="hero-stat">
                <IonIcon icon={alertCircleOutline} style={{ color: '#EF4444' }} />
                <div>
                  <strong>{loading ? '-' : stats.overdue}</strong>
                  <span>In ritardo</span>
                </div>
              </div>
              <div className="hero-stat">
                <IonIcon icon={layersOutline} style={{ color: '#F59E0B' }} />
                <div>
                  <strong>{loading ? '-' : stats.total}</strong>
                  <span>Totali</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== QUICK ACTIONS ===== */}
          <div className="dash-quick-actions">
            <button className="quick-action" onClick={() => history.push('/tabs/create')}>
              <div className="qa-icon" style={{ background: 'rgba(79,70,229,0.12)', color: '#4F46E5' }}>
                <IonIcon icon={addOutline} />
              </div>
              <span>Nuovo</span>
            </button>
            <button className="quick-action" onClick={() => history.push('/tabs/calendar')}>
              <div className="qa-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
                <IonIcon icon={calendarOutline} />
              </div>
              <span>Calendario</span>
            </button>
            <button className="quick-action" onClick={() => history.push('/tabs/habits')}>
              <div className="qa-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                <IonIcon icon={flameOutline} />
              </div>
              <span>Abitudini</span>
            </button>
            <button className="quick-action" onClick={() => { focusTimer.start(null, '', 1500); setShowFocusTimer(true); }}>
              <div className="qa-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                <IonIcon icon={timerOutline} />
              </div>
              <span>Focus Timer</span>
            </button>
          </div>

          {/* ===== CHARTS ROW – Area + Donut ===== */}
          <div className="dash-charts-row">
            {/* Area Chart – Produttività settimanale */}
            <div className="dash-chart-card dash-chart-main">
              <h3 className="dash-card-title">
                <IonIcon icon={trendingUpOutline} />
                Settimana
              </h3>
              {loading ? (
                <IonSkeletonText animated style={{ height: '140px', borderRadius: '12px' }} />
              ) : (
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={weeklyStats} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="gradCreati" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradCompletati" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px', border: 'none', fontSize: 13,
                        background: 'var(--app-surface-1, #1a1a2e)', color: 'var(--ion-text-color)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                      }}
                    />
                    <Area type="monotone" dataKey="creati" stroke="#6366F1" strokeWidth={2.5} fill="url(#gradCreati)" name="Creati" dot={{ r: 3, fill: '#6366F1' }} />
                    <Area type="monotone" dataKey="completati" stroke="#22C55E" strokeWidth={2.5} fill="url(#gradCompletati)" name="Completati" dot={{ r: 3, fill: '#22C55E' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Donut – Priorità */}
            <div className="dash-chart-card dash-chart-side">
              <h3 className="dash-card-title">
                <IonIcon icon={flagOutline} />
                Priorità
              </h3>
              {priorityData.length === 0 ? (
                <div className="dash-donut-empty">
                  <span>—</span>
                </div>
              ) : (
                <div className="dash-donut-wrap">
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie data={priorityData} cx="50%" cy="50%" innerRadius={28} outerRadius={44}
                        dataKey="value" stroke="none" paddingAngle={3}>
                        {priorityData.map((_, i) => (
                          <Cell key={i} fill={PRIORITY_COLORS[i % PRIORITY_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-legend">
                    {priorityData.map((d, i) => (
                      <span key={d.name} className="donut-legend-item">
                        <span className="donut-dot" style={{ background: PRIORITY_COLORS[i] }} />
                        {d.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===== HABITS WIDGET ===== */}
          {habits.length > 0 && (
            <div className="dash-widget" onClick={() => history.push('/tabs/habits')}>
              <div className="dash-widget-header">
                <h3 className="dash-card-title">
                  <IonIcon icon={flameOutline} />
                  Abitudini Oggi
                </h3>
                <IonBadge color={habitsCompleted.done === habitsCompleted.total ? 'success' : 'medium'}>
                  {habitsCompleted.done}/{habitsCompleted.total}
                </IonBadge>
              </div>
              <IonProgressBar
                value={habitsCompleted.total > 0 ? habitsCompleted.done / habitsCompleted.total : 0}
                className="dash-habits-bar"
                color={habitsCompleted.done === habitsCompleted.total ? 'success' : 'primary'}
              />
              <div className="dash-habits-grid">
                {habits.slice(0, 6).map(h => {
                  const done = todayCountFor(h.id) >= (h.target_per_day || 1);
                  return (
                    <div key={h.id} className={`dash-habit-pill ${done ? 'done' : ''}`} style={{ '--hc': h.color }}>
                      <span className="dash-habit-emoji">{h.emoji}</span>
                      <span className="dash-habit-name">{h.name}</span>
                      {done && <IonIcon icon={checkmarkCircleOutline} className="dash-habit-check" />}
                    </div>
                  );
                })}
              </div>
              {bestStreak > 0 && (
                <div className="dash-streak-line">
                  <IonIcon icon={flameOutline} /> Streak migliore: <strong>{bestStreak} giorni</strong>
                </div>
              )}
            </div>
          )}

          {/* ===== FOCUS TIMER WIDGET ===== */}
          <div className="dash-widget dash-focus-widget" onClick={() => { if (!focusTimer.isRunning) { focusTimer.start(null, '', 1500); setShowFocusTimer(true); } else { setShowFocusTimer(true); } }}>
            <div className="dash-widget-header">
              <h3 className="dash-card-title">
                <IonIcon icon={timerOutline} />
                Focus Timer
              </h3>
              <IonBadge color="danger">{focusTimer.stats.todayCount} oggi</IonBadge>
            </div>
            <div className="dash-focus-stats">
              <div className="focus-stat-item">
                <strong>{focusTimer.stats.total}</strong>
                <span>Sessioni totali</span>
              </div>
              <div className="focus-stat-item">
                <strong>{focusTimer.stats.totalMinutes}m</strong>
                <span>Focus totale</span>
              </div>
              <div className="focus-stat-item">
                <strong>{focusTimer.stats.todayCount}</strong>
                <span>Oggi</span>
              </div>
            </div>
          </div>

          {/* ===== OVERDUE ALERT ===== */}
          {overdueTasks.length > 0 && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3 className="dash-card-title dash-title-danger">
                  <IonIcon icon={alertCircleOutline} />
                  In Ritardo ({overdueTasks.length})
                </h3>
                <IonButton fill="clear" size="small" routerLink="/tabs/tasks" className="see-all-btn">
                  Vedi <IonIcon icon={arrowForwardOutline} />
                </IonButton>
              </div>
              {overdueTasks.slice(0, 3).map(task => (
                <TaskCard key={task.id} task={task} onClick={() => history.push(`/tabs/task/${task.id}`)} />
              ))}
            </div>
          )}

          {/* ===== PINNED TASKS ===== */}
          {pinnedTasks.length > 0 && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3 className="dash-card-title">
                  📌 Fissati
                </h3>
              </div>
              {pinnedTasks.slice(0, 3).map(task => (
                <TaskCard key={task.id} task={task} onClick={() => history.push(`/tabs/task/${task.id}`)} />
              ))}
            </div>
          )}

          {/* ===== TODAY TASKS ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-card-title">
                <IonIcon icon={todayOutline} />
                Task di Oggi
              </h3>
              <IonButton fill="clear" size="small" routerLink="/tabs/tasks" className="see-all-btn">
                Tutti <IonIcon icon={arrowForwardOutline} />
              </IonButton>
            </div>
            {loading ? (
              [1, 2, 3].map(i => (
                <IonSkeletonText key={i} animated style={{ height: '76px', borderRadius: '14px', margin: '6px 0' }} />
              ))
            ) : todayTasks.length === 0 ? (
              <div className="empty-state">
                <IonIcon icon={checkmarkCircleOutline} />
                <p>Nessun task per oggi!</p>
                <IonButton size="small" shape="round" routerLink="/tabs/create">Crea Task</IonButton>
              </div>
            ) : (
              todayTasks.slice(0, 5).map(task => (
                <TaskCard key={task.id} task={task} onClick={() => history.push(`/tabs/task/${task.id}`)} />
              ))
            )}
          </div>

          {/* ===== PRODUCTIVITY FOOTER ===== */}
          <div className="dash-productivity-footer">
            <IonIcon icon={productivityIcon()} />
            <span>
              {completionRate >= 80 ? 'Produttività eccezionale!' :
               completionRate >= 50 ? 'Buon lavoro, continua così!' :
               'Inizia a completare i tuoi task!'}
            </span>
          </div>
        </div>

        {showFocusTimer && (
          <FocusTimer focusTimer={focusTimer} onClose={() => setShowFocusTimer(false)} />
        )}
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
