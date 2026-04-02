import React from 'react';
import {
  IonItem,
  IonLabel,
  IonCheckbox,
  IonIcon,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from '@ionic/react';
import { trashOutline, createOutline, calendarOutline, pinOutline } from 'ionicons/icons';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import './TaskItem.css';

const priorityColors = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#22C55E',
};

const TaskItem = ({ task, onComplete, onDelete, onEdit }) => {
  const isCompleted = task.status === 'completed';

  return (
    <IonItemSliding>
      <IonItemOptions side="start">
        <IonItemOption
          color="success"
          onClick={() => onComplete?.(task.id)}
          className="slide-option"
        >
          Completa
        </IonItemOption>
      </IonItemOptions>

      <IonItem
        className={`task-item ${isCompleted ? 'completed' : ''}`}
        lines="none"
        button
        detail={false}
        onClick={() => onEdit?.(task)}
      >
        <div
          className="task-item-priority-bar"
          style={{ backgroundColor: priorityColors[task.priority] || '#F59E0B' }}
          slot="start"
        />
        <IonCheckbox
          slot="start"
          checked={isCompleted}
          onIonChange={(e) => {
            e.stopPropagation();
            onComplete?.(task.id);
          }}
          className="task-checkbox"
        />
        <IonLabel className="task-item-label">
          <h2 className={isCompleted ? 'line-through' : ''}>
            {task.is_pinned && <IonIcon icon={pinOutline} className="task-item-pin" />}
            {task.title}
          </h2>
          {task.due_date && (
            <p className="task-item-date">
              <IonIcon icon={calendarOutline} />
              {format(new Date(task.due_date), 'd MMM yyyy', { locale: it })}
            </p>
          )}
        </IonLabel>
      </IonItem>

      <IonItemOptions side="end">
        <IonItemOption
          color="danger"
          onClick={() => onDelete?.(task.id)}
          className="slide-option"
        >
          <IonIcon icon={trashOutline} slot="icon-only" />
        </IonItemOption>
        <IonItemOption
          color="primary"
          onClick={() => onEdit?.(task)}
          className="slide-option"
        >
          <IonIcon icon={createOutline} slot="icon-only" />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
};

export default TaskItem;
