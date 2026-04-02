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
import { saveOutline, calendarOutline, flagOutline, layersOutline, checkmarkOutline, repeatOutline, pinOutline, pricetagOutline, documentTextOutline, bookmarkOutline, addOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { taskService } from '../services/taskService';
import { templateService } from '../services/templateService';
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

const CreateTask = () => {
  const { user } = useAuth();
  const { createTask, categories, tasks } = useTasks(user?.id);
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366F1');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [present] = useIonToast();
  const history = useHistory();

  const TAG_COLORS = ['#6366F1', '#EF4444', '#22C55E', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6', '#14B8A6'];

  useEffect(() => {
    if (user?.id) {
      taskService.getTags(user.id).then(setTags).catch(() => {});
    }
  }, [user?.id]);

  const handleSave = async () => {
    if (!title.trim()) {
      present({ message: 'Inserisci un titolo', duration: 2000, color: 'warning' });
      return;
    }
    if (title.trim().length < 2) {
      present({ message: 'Il titolo deve avere almeno 2 caratteri', duration: 2000, color: 'warning' });
      return;
    }
    if (title.trim().length > 200) {
      present({ message: 'Il titolo non può superare 200 caratteri', duration: 2000, color: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const newTask = await createTask({
        title: title.trim(),
        description: description.trim() || null,
        notes: notes.trim() || null,
        priority,
        status: 'pending',
        due_date: dueDate || null,
        category_id: categoryId || null,
        recurrence,
        is_pinned: isPinned,
      });
      // Set tags
      if (selectedTagIds.length > 0 && newTask?.id) {
        await taskService.setTaskTags(newTask.id, selectedTagIds);
      }
      // Save as template
      if (saveAsTemplate && templateName.trim()) {
        await templateService.createTemplate(user.id, templateName.trim(), {
          title: title.trim(),
          description: description.trim() || null,
          notes: notes.trim() || null,
          priority,
          category_id: categoryId || null,
          recurrence,
          is_pinned: isPinned,
        });
      }
      present({ message: 'Task creato!', duration: 1500, color: 'success' });
      history.goBack();
    } catch (err) {
      present({ message: 'Errore nella creazione', duration: 2000, color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="create-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/tasks" text="Indietro" />
          </IonButtons>
          <IonTitle>Nuovo Task</IonTitle>
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
                  : 'Seleziona'}
              </IonButton>
            </div>
          </div>

          <div className="form-group">
            <IonLabel className="form-label">Scadenza</IonLabel>
            <IonButton
              expand="block"
              fill="outline"
              className="date-picker-btn"
              onClick={() => setShowDatePicker(true)}
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

          {/* Save as Template */}
          <div className="form-group form-toggle-row">
            <IonLabel className="form-label">
              <IonIcon icon={bookmarkOutline} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Salva come template
            </IonLabel>
            <IonToggle checked={saveAsTemplate} onIonChange={e => setSaveAsTemplate(e.detail.checked)} />
          </div>
          {saveAsTemplate && (
            <div className="form-group">
              <IonInput
                value={templateName}
                onIonInput={(e) => setTemplateName(e.detail.value)}
                placeholder="Nome template..."
                className="form-input"
                fill="outline"
              />
            </div>
          )}

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

          {/* Recurrence Picker */}
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

export default CreateTask;
