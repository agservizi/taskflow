import React, { useState, useEffect, useMemo } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import {
  flameOutline,
  trendingUpOutline,
  pieChartOutline,
  calendarOutline,
  checkmarkCircleOutline,
  timeOutline,
  ribbonOutline,
} from 'ionicons/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import './Analytics.css';

const CHART_COLORS = ['#4F46E5', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const Analytics = () => {
  const { user } = useAuth();
  const { tasks, stats, loading } = useTasks(user?.id);
  const [period, setPeriod] = useState('week');

  // Productivity streak
  const streak = useMemo(() => {
    if (!tasks.length) return 0;
    const completedDates = new Set();
    tasks.forEach((t) => {
      if (t.status === 'completed') {
        const date = (t.completed_at || t.created_at).split('T')[0];
        completedDates.add(date);
      }
    });

    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (completedDates.has(dateStr)) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [tasks]);

  // Best streak
  const bestStreak = useMemo(() => {
    if (!tasks.length) return 0;
    const completedDates = new Set();
    tasks.forEach((t) => {
      if (t.status === 'completed') {
        const date = (t.completed_at || t.created_at).split('T')[0];
        completedDates.add(date);
      }
    });

    const sortedDates = [...completedDates].sort();
    let best = 0;
    let current = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        current++;
      } else {
        best = Math.max(best, current);
        current = 1;
      }
    }
    return Math.max(best, current);
  }, [tasks]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      const name = t.categories?.name || 'Senza categoria';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  // Priority distribution
  const priorityDistribution = useMemo(() => {
    const map = { high: 0, medium: 0, low: 0 };
    tasks.forEach((t) => {
      if (map[t.priority] !== undefined) map[t.priority]++;
    });
    return [
      { name: 'Alta', value: map.high, color: '#EF4444' },
      { name: 'Media', value: map.medium, color: '#F59E0B' },
      { name: 'Bassa', value: map.low, color: '#22C55E' },
    ].filter((d) => d.value > 0);
  }, [tasks]);

  // Daily completion trend (last 14 days)
  const completionTrend = useMemo(() => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 14;
    const now = new Date();
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' });
      const completed = tasks.filter(
        (t) => t.status === 'completed' && (t.completed_at || t.created_at).startsWith(dateStr)
      ).length;
      const created = tasks.filter((t) => t.created_at.startsWith(dateStr)).length;
      trend.push({ name: dayLabel, completati: completed, creati: created });
    }
    return trend;
  }, [tasks, period]);

  // Average tasks per day
  const avgPerDay = useMemo(() => {
    if (!tasks.length) return 0;
    const dates = new Set(tasks.map((t) => t.created_at.split('T')[0]));
    return (tasks.length / dates.size).toFixed(1);
  }, [tasks]);

  // Completion rate
  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  if (loading) {
    return (
      <IonPage>
        <IonContent className="analytics-content">
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40%' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="analytics-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/dashboard" text="Indietro" />
          </IonButtons>
          <IonTitle>Analytics</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="analytics-content">
        <div className="analytics-container">
            {/* Streak Cards */}
            <div className="analytics-streak-row">
              <div className="streak-card">
                <IonIcon icon={flameOutline} className="streak-icon fire" />
                <span className="streak-value">{streak}</span>
                <span className="streak-label">Streak attuale</span>
              </div>
              <div className="streak-card">
                <IonIcon icon={ribbonOutline} className="streak-icon record" />
                <span className="streak-value">{bestStreak}</span>
                <span className="streak-label">Miglior streak</span>
              </div>
              <div className="streak-card">
                <IonIcon icon={trendingUpOutline} className="streak-icon avg" />
                <span className="streak-value">{avgPerDay}</span>
                <span className="streak-label">Media/giorno</span>
              </div>
            </div>

            {/* Completion Rate Ring */}
            <div className="analytics-card rate-card">
              <div className="rate-header">
                <IonIcon icon={checkmarkCircleOutline} />
                <span>Tasso di completamento</span>
              </div>
              <div className="rate-circle">
                <svg viewBox="0 0 100 100" className="rate-svg">
                  <circle cx="50" cy="50" r="42" className="rate-bg-circle" />
                  <circle
                    cx="50" cy="50" r="42"
                    className="rate-fill-circle"
                    style={{
                      strokeDasharray: `${completionRate * 2.64} ${264 - completionRate * 2.64}`,
                    }}
                  />
                </svg>
                <span className="rate-percent">{completionRate}%</span>
              </div>
              <div className="rate-stats">
                <span>{stats.completed} completati su {stats.total}</span>
              </div>
            </div>

            {/* Period Selector */}
            <IonSegment
              value={period}
              onIonChange={(e) => setPeriod(e.detail.value)}
              className="analytics-segment"
            >
              <IonSegmentButton value="week">
                <IonLabel>7 giorni</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="biweek">
                <IonLabel>14 giorni</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="month">
                <IonLabel>30 giorni</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {/* Completion Trend Chart */}
            <div className="analytics-card">
              <h3 className="card-title">
                <IonIcon icon={calendarOutline} />
                Andamento completamento
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="creati" fill="#6366F1" radius={[4, 4, 0, 0]} name="Creati" />
                  <Bar dataKey="completati" fill="#22C55E" radius={[4, 4, 0, 0]} name="Completati" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution */}
            <div className="analytics-card">
              <h3 className="card-title">
                <IonIcon icon={pieChartOutline} />
                Distribuzione Categorie
              </h3>
              {categoryDistribution.length > 0 ? (
                <div className="pie-container">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryDistribution.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend">
                    {categoryDistribution.map((d, i) => (
                      <div key={d.name} className="legend-item">
                        <span
                          className="legend-dot"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="legend-name">{d.name}</span>
                        <span className="legend-value">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="no-data">Nessun dato disponibile</p>
              )}
            </div>

            {/* Priority Distribution */}
            <div className="analytics-card">
              <h3 className="card-title">
                <IonIcon icon={timeOutline} />
                Distribuzione Priorità
              </h3>
              {priorityDistribution.length > 0 ? (
                <div className="priority-bars">
                  {priorityDistribution.map((d) => {
                    const pct = Math.round((d.value / stats.total) * 100);
                    return (
                      <div key={d.name} className="priority-bar-row">
                        <span className="priority-bar-label">{d.name}</span>
                        <div className="priority-bar-track">
                          <div
                            className="priority-bar-fill"
                            style={{ width: `${pct}%`, backgroundColor: d.color }}
                          />
                        </div>
                        <span className="priority-bar-value">{d.value} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-data">Nessun dato disponibile</p>
              )}
            </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Analytics;
