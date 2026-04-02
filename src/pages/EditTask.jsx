import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonInput,
  IonTextarea,
  IonDatetime,
  IonButton,
  IonIcon,
  IonLabel,
  IonSpinner,
  IonList,
  IonItem,
  IonBadge,
  IonToggle,
  useIonToast,
  IonModal,
} from '@ionic/react';
import { saveOutline, calendarOutline, flagOutline, layersOutline, checkmarkOutline, closeOutline, repeatOutline, pinOutline, pricetagOutline, documentTextOutline, addOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { taskService } from '../services/taskService';
import './CreateTask.css';

const priorityOptions = [
  { value: 'low', label: 'Bassa', emoji: '🟢' },
  { value: 'medium', label: 'Media', emoji: '🟡' },
  { value: 'high', label: 'Alta', emoji: '🔴' },
];

const recurrenceOptions = [
  { value: 'none', label: 'Mai', emoji: '' },
  { value: 'daily', label: 'Giornaliero', emoji: '📅' },
  { value: 'weekly', label: 'Settimanale', emoji: '📆' },
  { value: 'monthly', label: 'Mensile', emoji: '🗓️' },
];

const EditTask = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { updateTask, categories } = useTasks(user?.id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [isPinned, setIsPinned] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTask, setLoadingTask] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366F1');
  const [present] = useIonToast();
  const history = useHistory();

  const TAG_COLORS = ['#6366F1', '#EF4444', '#22C55E', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6', '#14B8A6'];

  useEffect(() => {
    const loadTask = async () => {
      try {
        const task = await taskService.getTaskById(id);
        setTitle(task.title || '');
        setDescription(task.description || '');
        setNotes(task.notes || '');
        setPriority(task.priority || 'medium');
        setDueDate(task.due_date || '');
        setCategoryId(task.category_id || '');
        setRecurrence(task.recurrence || 'none');
        setIsPinned(task.is_pinned || false);
        // Load tags
        const taskTags = await taskService.getTaskTags(id);
        setSelectedTagIds(taskTags.map(t => t.id));
      } catch {
        present({ message: 'Task non trovato', duration: 2000, color: 'danger' });
        history.goBack();
      } finally {
        setLoadingTask(false);
      }
    };
    loadTask();
    if (user?.id) {
      taskService.getTags(user.id).then(setTags).catch(() => {});
    }
  }, [id, user?.id]);

  const handleSave = async () => {
    if (!title.trim()) {
      present({ message: 'Il titolo è obbligatorio', duration: 2000, color: 'warning' });
      return;
    }
    if (title.trim().length < 2) {
      present({ message: 'Il titolo deve avere almeno 2 caratteri', duration: 2000, color: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await updateTask(id, {
        title: title.trim(),
        description: description.trim() || null,
        notes: notes.trim() || null,
        priority,
        due_date: dueDate || null,
        category_id: categoryId || null,
        recurrence,
        is_pinned: isPinned,
      });
      await taskService.setTaskTags(id, selectedTagIds);
      present({ message: 'Task aggiornato!', duration: 1500, color: 'success' });
      history.goBack();
    } catch {
      present({ message: 'Errore nell\'aggiornamento', duration: 2000, color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingTask) {
    return (
      <IonPage>
        <IonContent className="create-content">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="create-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/tasks" text="Annulla" />
          </IonButtons>
          <IonTitle>Modifica Task</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={handleSave}
              disabled={loading}
              className="save-btn"
            >
              {loading ? <IonSpinner name="crescent" /> : (
                <>
                  <IonIcon icon={saveOutline} />
                  Salva
                </>
              )}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="create-content">
        <div className="create-container">
          <div className="form-group">
            <IonLabel className="form-label">Titolo *</IonLabel>
            <IonInput
              value={title}
              onIonInput={(e) => setTitle(e.detail.value)}
              placeholder="Es: Preparare presentazione"
              className="form-input"
              fill="outline"
            />
          </div>

          <div className="form-group">
            <IonLabel className="form-label">Descrizione</IonLabel>
            <IonTextarea
              value={description}
              onIonInput={(e) => setDescription(e.detail.value)}
              placeholder="Aggiungi una descrizione..."
              className="form-textarea"
              fill="outline"
              autoGrow
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group form-half">
              <IonLabel className="form-label">Priorità</IonLabel>
              <IonButton
                expand="block"
                fill="outline"
                className="date-picker-btn"
                onClick={() => setShowPriorityPicker(true)}
              >
                <IonIcon icon={flagOutline} slot="start" />
                {priorityOptions.find((p) => p.value === priority)?.emoji}{' '}
                {priorityOptions.find((p) => p.value === priority)?.label}
              </IonButton>
            </div>

            <div className="form-group form-half">
              <IonLabel className="form-label">Categoria</IonLabel>
              <IonButton
                expand="block"
                fill="outline"
                className="date-picker-btn"
                onClick={() => setShowCategoryPicker(true)}
              >
                <IonIcon icon={layersOutline} slot="start" />
                {categoryId
                  ? categories.find((c) => c.id === categoryId)?.name || 'Seleziona'
                  : 'Nessuna'}
              </IonButton>
            </div>
          </div>

          <div className="form-group">
            <IonLabel className="form-label">Scadenza</IonLabel>
            <div style={{ display: 'flex', gap: '8px' }}>
              <IonButton
                expand="block"
                fill="outline"
                className="date-picker-btn"
                onClick={() => setShowDatePicker(true)}
                style={{ flex: 1 }}
              >
                <IonIcon icon={calendarOutline} slot="start" />
                {dueDate
                  ? new Date(dueDate).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Seleziona data'}
              </IonButton>
              {dueDate && (
                <IonButton
                  fill="outline"
                  color="medium"
                  className="date-picker-btn"
                  onClick={() => setDueDate('')}
                  style={{ flex: '0 0 50px' }}
                >
                  <IonIcon icon={closeOutline} />
                </IonButton>
              )}
            </div>
          </div>

          {/* Recurrence Picker */}
          <div className="form-group">
            <IonLabel className="form-label">Ricorrenza</IonLabel>
            <IonButton
              expand="block"
              fill="outline"
              className="date-picker-btn"
              onClick={() => setShowRecurrencePicker(true)}
              disabled={!dueDate}
            >
              <IonIcon icon={repeatOutline} slot="start" />
              {recurrenceOptions.find((r) => r.value === recurrence)?.emoji}{' '}
              {recurrenceOptions.find((r) => r.value === recurrence)?.label || 'Mai'}
            </IonButton>
          </div>

          {/* Notes */}
          <div className="form-group">
            <IonLabel className="form-label">
              <IonIcon icon={documentTextOutline} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Note
            </IonLabel>
            <IonTextarea
              value={notes}
              onIonInput={(e) => setNotes(e.detail.value)}
              placeholder="Appunti, link, dettagli..."
              className="form-textarea"
              fill="outline"
              autoGrow
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <IonLabel className="form-label">
              <IonIcon icon={pricetagOutline} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Tag
            </IonLabel>
            <div className="tags-wrap">
              {selectedTagIds.map(tid => {
                const tag = tags.find(t => t.id === tid);
                return tag ? (
                  <IonBadge key={tid} className="tag-chip" style={{ '--background': tag.color + '20', color: tag.color }}
                    onClick={() => setSelectedTagIds(prev => prev.filter(x => x !== tid))}>
                    {tag.name} ×
                  </IonBadge>
                ) : null;
              })}
              <IonButton fill="outline" size="small" shape="round" onClick={() => setShowTagPicker(true)}>
                <IonIcon icon={addOutline} slot="start" />
                Tag
              </IonButton>
            </div>
          </div>

          {/* Pin Toggle */}
          <div className="form-group form-toggle-row">
            <IonLabel className="form-label">
              <IonIcon icon={pinOutline} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Fissa in alto
            </IonLabel>
            <IonToggle checked={isPinned} onIonChange={e => setIsPinned(e.detail.checked)} />
          </div>

          <IonModal
            isOpen={showDatePicker}
            onDidDismiss={() => setShowDatePicker(false)}
            className="date-modal"
            breakpoints={[0, 0.55, 0.75]}
            initialBreakpoint={0.55}
            handleBehavior="cycle"
          >
            <IonHeader>
              <IonToolbar>
                <IonTitle>Seleziona Data</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setShowDatePicker(false)}>Fatto</IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              <IonDatetime
                value={dueDate || undefined}
                onIonChange={(e) => {
                  setDueDate(e.detail.value);
                  setShowDatePicker(false);
                }}
                presentation="date"
                locale="it-IT"
                className="custom-datetime"
                style={{ margin: '0 auto' }}
              />
            </IonContent>
          </IonModal>

          {/* Priority Picker */}
          <IonModal
            isOpen={showPriorityPicker}
            onDidDismiss={() => setShowPriorityPicker(false)}
            className="date-modal"
            breakpoints={[0, 0.4]}
            initialBreakpoint={0.4}
            handleBehavior="cycle"
          >
            <IonHeader>
              <IonToolbar>
                <IonTitle>Seleziona Priorità</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setShowPriorityPicker(false)}>Fatto</IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <IonList className="picker-list">
                {priorityOptions.map((opt) => (
                  <IonItem
                    key={opt.value}
                    button
                    detail={false}
                    className={`picker-item ${priority === opt.value ? 'picker-item-selected' : ''}`}
                    onClick={() => {
                      setPriority(opt.value);
                      setShowPriorityPicker(false);
                    }}
                  >
                    <span className="picker-emoji">{opt.emoji}</span>
                    <IonLabel>{opt.label}</IonLabel>
                    {priority === opt.value && (
                      <IonIcon icon={checkmarkOutline} slot="end" color="primary" />
                    )}
                  </IonItem>
                ))}
              </IonList>
            </IonContent>
          </IonModal>

          {/* Category Picker */}
          <IonModal
            isOpen={showCategoryPicker}
            onDidDismiss={() => setShowCategoryPicker(false)}
            className="date-modal"
            breakpoints={[0, 0.5]}
            initialBreakpoint={0.5}
            handleBehavior="cycle"
          >
            <IonHeader>
              <IonToolbar>
                <IonTitle>Seleziona Categoria</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setShowCategoryPicker(false)}>Fatto</IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <IonList className="picker-list">
                <IonItem
                  button
                  detail={false}
                  className={`picker-item ${!categoryId ? 'picker-item-selected' : ''}`}
                  onClick={() => {
                    setCategoryId('');
                    setShowCategoryPicker(false);
                  }}
                >
                  <IonLabel>Nessuna</IonLabel>
                  {!categoryId && (
                    <IonIcon icon={checkmarkOutline} slot="end" color="primary" />
                  )}
                </IonItem>
                {categories.map((cat) => (
                  <IonItem
                    key={cat.id}
                    button
                    detail={false}
                    className={`picker-item ${categoryId === cat.id ? 'picker-item-selected' : ''}`}
                    onClick={() => {
                      setCategoryId(cat.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    {cat.color && (
                      <span
                        className="picker-cat-dot"
                        style={{ backgroundColor: cat.color }}
                      />
                    )}
                    <IonLabel>{cat.name}</IonLabel>
                    {categoryId === cat.id && (
                      <IonIcon icon={checkmarkOutline} slot="end" color="primary" />
                    )}
                  </IonItem>
                ))}
              </IonList>
            </IonContent>
          </IonModal>

          {/* Recurrence Picker Modal */}
          <IonModal
            isOpen={showRecurrencePicker}
            onDidDismiss={() => setShowRecurrencePicker(false)}
            className="date-modal"
            breakpoints={[0, 0.4]}
            initialBreakpoint={0.4}
            handleBehavior="cycle"
          >
            <IonHeader>
              <IonToolbar>
                <IonTitle>Ricorrenza</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setShowRecurrencePicker(false)}>Fatto</IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <IonList className="picker-list">
                {recurrenceOptions.map((opt) => (
                  <IonItem
                    key={opt.value}
                    button
                    detail={false}
                    className={`picker-item ${recurrence === opt.value ? 'picker-item-selected' : ''}`}
                    onClick={() => {
                      setRecurrence(opt.value);
                      setShowRecurrencePicker(false);
                    }}
                  >
                    {opt.emoji && <span className="picker-emoji">{opt.emoji}</span>}
                    <IonLabel>{opt.label}</IonLabel>
                    {recurrence === opt.value && (
                      <IonIcon icon={checkmarkOutline} slot="end" color="primary" />
                    )}
                  </IonItem>
                ))}
              </IonList>
            </IonContent>
          </IonModal>

          {/* Tag Picker */}
          <IonModal
            isOpen={showTagPicker}
            onDidDismiss={() => setShowTagPicker(false)}
            className="date-modal"
            breakpoints={[0, 0.55]}
            initialBreakpoint={0.55}
            handleBehavior="cycle"
          >
            <IonHeader>
              <IonToolbar>
                <IonTitle>Tag</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setShowTagPicker(false)}>Fatto</IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              <IonList className="picker-list">
                {tags.map(tag => (
                  <IonItem
                    key={tag.id}
                    button
                    detail={false}
                    className={`picker-item ${selectedTagIds.includes(tag.id) ? 'picker-item-selected' : ''}`}
                    onClick={() => {
                      setSelectedTagIds(prev =>
                        prev.includes(tag.id) ? prev.filter(x => x !== tag.id) : [...prev, tag.id]
                      );
                    }}
                  >
                    <span className="picker-cat-dot" style={{ backgroundColor: tag.color }} />
                    <IonLabel>{tag.name}</IonLabel>
                    {selectedTagIds.includes(tag.id) && (
                      <IonIcon icon={checkmarkOutline} slot="end" color="primary" />
                    )}
                  </IonItem>
                ))}
              </IonList>
              <div className="new-tag-row">
                <IonInput
                  value={newTagName}
                  onIonInput={e => setNewTagName(e.detail.value || '')}
                  placeholder="Nuovo tag..."
                  fill="outline"
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <div className="new-tag-colors">
                  {TAG_COLORS.map(c => (
                    <button key={c} className={`color-pick-sm ${newTagColor === c ? 'color-pick-sm-sel' : ''}`}
                      style={{ backgroundColor: c }} onClick={() => setNewTagColor(c)} />
                  ))}
                </div>
                <IonButton size="small" onClick={async () => {
                  if (!newTagName.trim()) return;
                  const tag = await taskService.createTag(user.id, newTagName.trim(), newTagColor);
                  setTags(prev => [...prev, tag]);
                  setSelectedTagIds(prev => [...prev, tag.id]);
                  setNewTagName('');
                }}>Aggiungi</IonButton>
              </div>
            </IonContent>
          </IonModal>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EditTask;
