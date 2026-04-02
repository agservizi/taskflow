import React, { useState } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonInput,
  IonButton,
  IonIcon,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSpinner,
} from '@ionic/react';
import { addOutline, trashOutline } from 'ionicons/icons';
import './SubtaskList.css';

const SubtaskList = ({ subtasks, onAdd, onToggle, onDelete, loading }) => {
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await onAdd(newTitle.trim());
      setNewTitle('');
    } finally {
      setAdding(false);
    }
  };

  const completedCount = subtasks.filter(s => s.completed).length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="subtask-section">
      <div className="subtask-header">
        <h3 className="subtask-title">Checklist</h3>
        {totalCount > 0 && (
          <span className="subtask-count">{completedCount}/{totalCount}</span>
        )}
      </div>

      {totalCount > 0 && (
        <div className="subtask-progress">
          <div className="subtask-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {loading ? (
        <div className="subtask-loading">
          <IonSpinner name="crescent" color="primary" />
        </div>
      ) : (
        <IonList className="subtask-list">
          {subtasks.map((sub) => (
            <IonItemSliding key={sub.id}>
              <IonItem lines="none" className={`subtask-item ${sub.completed ? 'subtask-completed' : ''}`}>
                <IonCheckbox
                  slot="start"
                  checked={sub.completed}
                  onIonChange={() => onToggle(sub.id, !sub.completed)}
                  className="subtask-checkbox"
                />
                <IonLabel className={sub.completed ? 'line-through' : ''}>
                  {sub.title}
                </IonLabel>
              </IonItem>
              <IonItemOptions side="end">
                <IonItemOption color="danger" onClick={() => onDelete(sub.id)}>
                  <IonIcon icon={trashOutline} slot="icon-only" />
                </IonItemOption>
              </IonItemOptions>
            </IonItemSliding>
          ))}
        </IonList>
      )}

      <div className="subtask-add">
        <IonInput
          value={newTitle}
          onIonInput={(e) => setNewTitle(e.detail.value)}
          placeholder="Aggiungi elemento..."
          className="subtask-input"
          fill="outline"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <IonButton
          fill="solid"
          size="small"
          className="subtask-add-btn"
          onClick={handleAdd}
          disabled={!newTitle.trim() || adding}
        >
          {adding ? <IonSpinner name="crescent" /> : <IonIcon icon={addOutline} />}
        </IonButton>
      </div>
    </div>
  );
};

export default SubtaskList;
