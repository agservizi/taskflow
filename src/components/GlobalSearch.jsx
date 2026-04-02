import React, { useState, useMemo } from 'react';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonList, IonItem, IonLabel, IonIcon, IonBadge, IonButtons, IonButton
} from '@ionic/react';
import { closeOutline, checkmarkCircle, ellipseOutline, pinOutline } from 'ionicons/icons';
import './GlobalSearch.css';

const priorityLabels = { high: 'Alta', medium: 'Media', low: 'Bassa' };
const priorityColors = { high: 'danger', medium: 'warning', low: 'success' };

const GlobalSearch = ({ isOpen, onClose, tasks = [], onSelect }) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return tasks.filter(t =>
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.notes?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [query, tasks]);

  const handleSelect = (task) => {
    setQuery('');
    onSelect?.(task);
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="global-search-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cerca Task</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={query}
            onIonInput={(e) => setQuery(e.detail.value || '')}
            placeholder="Cerca per titolo, descrizione, note..."
            debounce={150}
            autoFocus
            className="search-bar"
          />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {query.length >= 2 && results.length === 0 && (
          <div className="search-empty">
            <p>Nessun risultato per "{query}"</p>
          </div>
        )}
        <IonList lines="none" className="search-results">
          {results.map(task => (
            <IonItem key={task.id} button onClick={() => handleSelect(task)} className="search-result-item">
              <IonIcon
                icon={task.is_completed ? checkmarkCircle : ellipseOutline}
                slot="start"
                color={task.is_completed ? 'success' : 'medium'}
              />
              <IonLabel>
                <h2 className={task.is_completed ? 'completed-text' : ''}>
                  {task.is_pinned && <IonIcon icon={pinOutline} className="pin-inline" />}
                  {task.title}
                </h2>
                {task.category && <p>{task.category}</p>}
              </IonLabel>
              {task.priority && (
                <IonBadge color={priorityColors[task.priority]} slot="end">
                  {priorityLabels[task.priority]}
                </IonBadge>
              )}
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default GlobalSearch;
