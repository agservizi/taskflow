import React from 'react';
import { IonCard, IonCardContent, IonBadge, IonIcon } from '@ionic/react';
import { calendarOutline, flagOutline, repeatOutline, pinOutline } from 'ionicons/icons';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { it } from 'date-fns/locale';
import './TaskCard.css';

const priorityConfig = {
  high: { label: 'Alta', color: '#EF4444', bg: '#FEE2E2' },
  medium: { label: 'Media', color: '#F59E0B', bg: '#FEF3C7' },
  low: { label: 'Bassa', color: '#22C55E', bg: '#DCFCE7' },
};

const TaskCard = ({ task, onClick }) => {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isCompleted = task.status === 'completed';
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isToday(date)) return 'Oggi';
    if (isTomorrow(date)) return 'Domani';
    return format(date, 'd MMM', { locale: it });
  };

  return (
    <IonCard
      className={`task-card ${isCompleted ? 'task-completed' : ''} ${isOverdue ? 'task-overdue' : ''}`}
      onClick={() => onClick?.(task)}
      button
    >
      <IonCardContent className="task-card-content">
        <div className="task-card-left">
          <div
            className="task-priority-dot"
            style={{ backgroundColor: priority.color }}
          />
        </div>
        <div className="task-card-center">
          <div className="task-card-title-row">
            {task.is_pinned && (
              <IonIcon icon={pinOutline} className="task-pin-icon" />
            )}
            <h3 className="task-card-title">{task.title}</h3>
          </div>
          {task.description && (
            <p className="task-card-desc">{task.description}</p>
          )}
          <div className="task-card-meta">
            {task.due_date && (
              <span className={`task-card-date ${isOverdue ? 'overdue' : ''}`}>
                <IonIcon icon={calendarOutline} />
                {formatDate(task.due_date)}
              </span>
            )}
            {task.categories && (
              <IonBadge
                className="task-card-category"
                style={{
                  '--background': task.categories.color + '20',
                  color: task.categories.color,
                }}
              >
                {task.categories.name}
              </IonBadge>
            )}
            {task.recurrence && task.recurrence !== 'none' && (
              <span className="task-card-recurrence">
                <IonIcon icon={repeatOutline} />
              </span>
            )}
            {task.task_tags && task.task_tags.length > 0 && task.task_tags.map(tt => {
              const tag = tt.tags || tt;
              return tag?.name ? (
                <IonBadge key={tag.id} className="task-card-tag"
                  style={{ '--background': (tag.color || '#6366F1') + '20', color: tag.color || '#6366F1' }}>
                  {tag.name}
                </IonBadge>
              ) : null;
            })}
          </div>
        </div>
        <div className="task-card-right">
          <IonBadge
            className="task-priority-badge"
            style={{ '--background': priority.bg, color: priority.color }}
          >
            <IonIcon icon={flagOutline} />
            {priority.label}
          </IonBadge>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default TaskCard;
