import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonBackButton, IonButton, IonIcon, IonSpinner,
  IonBadge, useIonToast, useIonAlert,
} from '@ionic/react';
import { trashOutline, copyOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { templateService } from '../services/templateService';
import { useTasks } from '../hooks/useTasks';
import './Templates.css';

const priorityLabels = { high: 'Alta', medium: 'Media', low: 'Bassa' };
const priorityColors = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' };

const Templates = () => {
  const { user } = useAuth();
  const { createTask, categories } = useTasks(user?.id);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  const history = useHistory();

  const loadTemplates = async () => {
    if (!user?.id) return;
    try {
      const data = await templateService.getTemplates(user.id);
      setTemplates(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, [user?.id]);

  const handleUse = async (tpl) => {
    try {
      const data = tpl.template_data;
      await createTask({
        title: data.title || tpl.name,
        description: data.description || null,
        priority: data.priority || 'medium',
        status: 'pending',
        due_date: null,
        category_id: data.category_id || null,
        recurrence: data.recurrence || 'none',
        notes: data.notes || null,
        is_pinned: data.is_pinned || false,
      });
      present({ message: 'Task creato dal template!', duration: 1500, color: 'success' });
      history.push('/tabs/tasks');
    } catch {
      present({ message: 'Errore', duration: 2000, color: 'danger' });
    }
  };

  const handleDelete = (id) => {
    presentAlert({
      header: 'Elimina Template',
      message: 'Sei sicuro?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: async () => {
            try {
              await templateService.deleteTemplate(id);
              setTemplates(prev => prev.filter(t => t.id !== id));
              present({ message: 'Template eliminato', duration: 1500, color: 'medium' });
            } catch {
              present({ message: 'Errore', duration: 2000, color: 'danger' });
            }
          },
        },
      ],
    });
  };

  const getCategoryName = (catId) => categories.find(c => c.id === catId)?.name;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="tpl-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profile" text="Indietro" />
          </IonButtons>
          <IonTitle>Template</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="tpl-content">
        <div className="tpl-container">
          {loading ? (
            <div className="tpl-loading"><IonSpinner name="crescent" /></div>
          ) : templates.length === 0 ? (
            <div className="tpl-empty">
              <span className="tpl-empty-emoji">📋</span>
              <p>Nessun template salvato</p>
              <p className="tpl-hint">Crea un task e salvalo come template dalla creazione task</p>
            </div>
          ) : (
            <div className="tpl-list">
              {templates.map(tpl => {
                const d = tpl.template_data || {};
                return (
                  <div key={tpl.id} className="tpl-card">
                    <div className="tpl-card-header">
                      <span className="tpl-name">{tpl.name}</span>
                      <div className="tpl-actions">
                        <IonButton fill="clear" size="small" onClick={() => handleUse(tpl)}>
                          <IonIcon icon={copyOutline} slot="icon-only" />
                        </IonButton>
                        <IonButton fill="clear" size="small" color="danger" onClick={() => handleDelete(tpl.id)}>
                          <IonIcon icon={trashOutline} slot="icon-only" />
                        </IonButton>
                      </div>
                    </div>
                    <div className="tpl-card-meta">
                      {d.priority && (
                        <IonBadge style={{ '--background': priorityColors[d.priority] + '20', color: priorityColors[d.priority] }}>
                          {priorityLabels[d.priority]}
                        </IonBadge>
                      )}
                      {d.category_id && getCategoryName(d.category_id) && (
                        <IonBadge color="medium">{getCategoryName(d.category_id)}</IonBadge>
                      )}
                      {d.recurrence && d.recurrence !== 'none' && (
                        <IonBadge color="tertiary">{d.recurrence}</IonBadge>
                      )}
                    </div>
                    {d.description && <p className="tpl-desc">{d.description}</p>}
                    <IonButton expand="block" size="small" shape="round" onClick={() => handleUse(tpl)} className="tpl-use-btn">
                      Usa Template
                    </IonButton>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Templates;
