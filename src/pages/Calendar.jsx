import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonBackButton, IonButton, IonIcon, IonBadge,
} from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline, calendarOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import './Calendar.css';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

const Calendar = () => {
  const { user } = useAuth();
  const { tasks } = useTasks(user?.id);
  const history = useHistory();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1; // Monday-first

    const days = [];
    // Previous month padding
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // Next month padding
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
    }
    return days;
  }, [year, month]);

  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!t.due_date) return;
      const key = t.due_date.substring(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const todayStr = new Date().toISOString().substring(0, 10);
  const selectedStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : null;

  const selectedTasks = selectedStr ? (tasksByDate[selectedStr] || []) : [];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  const dateKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="cal-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/dashboard" text="Indietro" />
          </IonButtons>
          <IonTitle>Calendario</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={goToday} size="small">Oggi</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="cal-content">
        <motion.div className="cal-container"
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Month Nav */}
          <div className="cal-month-nav">
            <IonButton fill="clear" onClick={prevMonth}>
              <IonIcon icon={chevronBackOutline} slot="icon-only" />
            </IonButton>
            <h2 className="cal-month-title">{MONTHS[month]} {year}</h2>
            <IonButton fill="clear" onClick={nextMonth}>
              <IonIcon icon={chevronForwardOutline} slot="icon-only" />
            </IonButton>
          </div>

          {/* Weekday Headers */}
          <div className="cal-weekdays">
            {WEEKDAYS.map(d => <span key={d} className="cal-weekday">{d}</span>)}
          </div>

          {/* Days Grid */}
          <div className="cal-grid">
            {calendarDays.map(({ date, isCurrentMonth }, i) => {
              const key = dateKey(date);
              const isToday = key === todayStr;
              const isSelected = key === selectedStr;
              const count = tasksByDate[key]?.length || 0;
              return (
                <button
                  key={i}
                  className={`cal-day ${!isCurrentMonth ? 'cal-day-outside' : ''} ${isToday ? 'cal-day-today' : ''} ${isSelected ? 'cal-day-selected' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="cal-day-num">{date.getDate()}</span>
                  {count > 0 && (
                    <div className="cal-day-dots">
                      {count <= 3 ? (
                        Array.from({ length: count }).map((_, j) => (
                          <span key={j} className="cal-dot" />
                        ))
                      ) : (
                        <span className="cal-dot-count">{count}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Date Tasks */}
          {selectedDate && (
            <div className="cal-task-section">
              <h3 className="cal-section-title">
                <IonIcon icon={calendarOutline} />
                {selectedDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              {selectedTasks.length === 0 ? (
                <p className="cal-empty">Nessun task per questa data</p>
              ) : (
                <div className="cal-task-list">
                  {selectedTasks.map((t, i) => (
                    <motion.div
                      key={t.id}
                      className={`cal-task-item ${t.status === 'completed' ? 'cal-task-done' : ''}`}
                      onClick={() => history.push(`/tabs/task/${t.id}`)}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div
                        className="cal-task-priority"
                        style={{ backgroundColor: t.priority === 'high' ? '#EF4444' : t.priority === 'medium' ? '#F59E0B' : '#22C55E' }}
                      />
                      <div className="cal-task-info">
                        <span className="cal-task-title">{t.title}</span>
                        {t.categories && (
                          <IonBadge style={{ '--background': t.categories.color + '20', color: t.categories.color, fontSize: '11px' }}>
                            {t.categories.name}
                          </IonBadge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </IonContent>
    </IonPage>
  );
};

export default Calendar;
