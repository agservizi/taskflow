import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonActionSheet,
  useIonToast,
  useIonAlert,
} from '@ionic/react';
import {
  createOutline,
  trashOutline,
  checkmarkCircleOutline,
  calendarOutline,
  flagOutline,
  timeOutline,
  ellipsisHorizontal,
  repeatOutline,
  pinOutline,
  pricetagOutline,
  documentTextOutline,
  timerOutline,
} from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { taskService } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { useFocusTimer } from '../hooks/useFocusTimer';
import SubtaskList from '../components/SubtaskList';
import FocusTimer from '../components/FocusTimer';
import MarkdownRenderer from '../components/MarkdownRenderer';
import './TaskDetail.css';

const priorityConfig = {
  high: { label: 'Alta', color: '#EF4444', bg: '#FEE2E2' },
  medium: { label: 'Media', color: '#F59E0B', bg: '#FEF3C7' },
  low: { label: 'Bassa', color: '#22C55E', bg: '#DCFCE7' },
};

const statusConfig = {
  pending: { label: 'In attesa', color: '#F59E0B' },
  in_progress: { label: 'In corso', color: '#4F46E5' },
  completed: { label: 'Completato', color: '#22C55E' },
};

const TaskDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { completeTask, deleteTask, updateTask } = useTasks(user?.id);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [subtasksLoading, setSubtasksLoading] = useState(true);
  const [taskTags, setTaskTags] = useState([]);
  const focusTimer = useFocusTimer(user?.id);
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  const history = useHistory();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await taskService.getTaskById(id);
        setTask(data);
        taskService.getTaskTags(id).then(setTaskTags).catch(() => {});
      } catch {
        present({ message: 'Task non trovato', duration: 2000, color: 'danger' });
        history.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const loadSubtasks = useCallback(async () => {
    try {
      const data = await taskService.getSubtasks(id);
      setSubtasks(data);
    } catch {
      // subtasks table might not exist yet
      setSubtasks([]);
    } finally {
      setSubtasksLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSubtasks();
  }, [loadSubtasks]);

  const handleAddSubtask = async (title) => {
    const sub = await taskService.addSubtask(id, title);
    setSubtasks((prev) => [...prev, sub]);
  };

  const handleToggleSubtask = async (subId, completed) => {
    await taskService.toggleSubtask(subId, completed);
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, completed } : s))
    );
  };

  const handleDeleteSubtask = async (subId) => {
    await taskService.deleteSubtask(subId);
    setSubtasks((prev) => prev.filter((s) => s.id !== subId));
  };

  const handleComplete = async () => {
    try {
      await completeTask(id);
      setTask((prev) => ({ ...prev, status: 'completed' }));
      present({ message: 'Task completato!', duration: 1500, color: 'success' });
    } catch {
      present({ message: 'Errore', duration: 2000, color: 'danger' });
    }
  };

  const handleDelete = async () => {
    presentAlert({
      header: 'Elimina Task',
      message: 'Sei sicuro di voler eliminare questo task?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: async () => {
            try {
              await deleteTask(id);
              present({ message: 'Task eliminato', duration: 1500, color: 'medium' });
              history.goBack();
            } catch {
              present({ message: 'Errore', duration: 2000, color: 'danger' });
            }
          },
        },
      ],
    });
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTask(id, { status: newStatus });
      setTask((prev) => ({ ...prev, status: newStatus }));
      present({ message: 'Stato aggiornato', duration: 1500, color: 'success' });
    } catch {
      present({ message: 'Errore', duration: 2000, color: 'danger' });
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="detail-content">
          <div className="detail-loading">
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!task) return null;

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.pending;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="detail-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/tasks" text="Indietro" />
          </IonButtons>
          <IonTitle>Dettaglio Task</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push(`/tabs/edit/${id}`)}>
              <IonIcon icon={createOutline} />
            </IonButton>
            <IonButton onClick={() => setShowActions(true)}>
              <IonIcon icon={ellipsisHorizontal} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="detail-content">
        <motion.div className="detail-container"
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Status & Priority */}
          <motion.div className="detail-badges"
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
            <IonBadge
              className="detail-badge"
              style={{ '--background': status.color + '18', color: status.color }}
            >
              {status.label}
            </IonBadge>
            <IonBadge
              className="detail-badge"
              style={{ '--background': priority.bg, color: priority.color }}
            >
              <IonIcon icon={flagOutline} />
              {priority.label}
            </IonBadge>
            {task.recurrence && task.recurrence !== 'none' && (
              <IonBadge
                className="detail-badge"
                style={{ '--background': '#EEF2FF', color: '#6366F1' }}
              >
                <IonIcon icon={repeatOutline} />
                {task.recurrence === 'daily' ? 'Giornaliero' : task.recurrence === 'weekly' ? 'Settimanale' : 'Mensile'}
              </IonBadge>
            )}
            {task.is_pinned && (
              <IonBadge
                className="detail-badge"
                style={{ '--background': '#FEF3C720', color: '#F59E0B' }}
              >
                <IonIcon icon={pinOutline} />
                Fissato
              </IonBadge>
            )}
          </motion.div>

          {/* Title */}
          <motion.h1 className="detail-title"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
            {task.title}
          </motion.h1>

          {/* Description */}
          {task.description && (
            <div className="detail-section">
              <p className="detail-description">{task.description}</p>
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div className="detail-section detail-notes">
              <h3 className="detail-section-title">
                <IonIcon icon={documentTextOutline} />
                Note
              </h3>
              <p className="detail-notes-text"><MarkdownRenderer content={task.notes} /></p>
            </div>
          )}

          {/* Tags */}
          {taskTags.length > 0 && (
            <div className="detail-section detail-tags">
              <h3 className="detail-section-title">
                <IonIcon icon={pricetagOutline} />
                Tag
              </h3>
              <div className="detail-tags-wrap">
                {taskTags.map(tag => (
                  <IonBadge key={tag.id} className="detail-tag-badge"
                    style={{ '--background': (tag.color || '#6366F1') + '20', color: tag.color || '#6366F1' }}>
                    {tag.name}
                  </IonBadge>
                ))}
              </div>
            </div>
          )}

          {/* Info Cards */}
          <motion.div className="detail-info-grid"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
            {task.due_date && (
              <div className="detail-info-card">
                <IonIcon icon={calendarOutline} style={{ color: '#4F46E5' }} />
                <div>
                  <span className="info-label">Scadenza</span>
                  <span className="info-value">
                    {format(new Date(task.due_date), 'd MMMM yyyy', { locale: it })}
                  </span>
                </div>
              </div>
            )}
            <div className="detail-info-card">
              <IonIcon icon={timeOutline} style={{ color: '#6366F1' }} />
              <div>
                <span className="info-label">Creato il</span>
                <span className="info-value">
                  {format(new Date(task.created_at), 'd MMM yyyy, HH:mm', { locale: it })}
                </span>
              </div>
            </div>
            {task.categories && (
              <div className="detail-info-card">
                <div
                  className="cat-dot"
                  style={{ backgroundColor: task.categories.color }}
                />
                <div>
                  <span className="info-label">Categoria</span>
                  <span className="info-value">{task.categories.name}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Subtasks / Checklist */}
          <SubtaskList
            subtasks={subtasks}
            loading={subtasksLoading}
            onAdd={handleAddSubtask}
            onToggle={handleToggleSubtask}
            onDelete={handleDeleteSubtask}
          />

          {/* Actions */}
          <motion.div className="detail-actions"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            {task.status !== 'completed' && (
              <>
                <IonButton
                  expand="block"
                  shape="round"
                  color="danger"
                  fill="outline"
                  className="focus-timer-btn"
                  onClick={() => focusTimer.start(id, task.title, 1500)}
                >
                  <IonIcon icon={timerOutline} slot="start" />
                  Focus Timer
                </IonButton>
                <IonButton
                  expand="block"
                  shape="round"
                  className="complete-btn"
                  onClick={handleComplete}
                >
                  <IonIcon icon={checkmarkCircleOutline} slot="start" />
                  Completa Task
                </IonButton>
              </>
            )}
            <IonButton
              expand="block"
              shape="round"
              fill="outline"
              color="danger"
              className="delete-btn"
              onClick={handleDelete}
            >
              <IonIcon icon={trashOutline} slot="start" />
              Elimina
            </IonButton>
          </motion.div>
        </motion.div>

        <IonActionSheet
          isOpen={showActions}
          onDidDismiss={() => setShowActions(false)}
          header="Cambia Stato"
          buttons={[
            {
              text: 'In attesa',
              handler: () => handleStatusChange('pending'),
            },
            {
              text: 'In corso',
              handler: () => handleStatusChange('in_progress'),
            },
            {
              text: 'Completato',
              handler: () => handleStatusChange('completed'),
            },
            {
              text: 'Annulla',
              role: 'cancel',
            },
          ]}
        />

        <FocusTimer focusTimer={focusTimer} />
      </IonContent>
    </IonPage>
  );
};

export default TaskDetail;
