import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSearchbar,
  IonSkeletonText,
  IonButton,
  IonButtons,
  IonModal,
  IonItem,
  IonCheckbox,
  IonBadge,
  useIonToast,
  useIonAlert,
} from '@ionic/react';
import {
  addOutline,
  funnelOutline,
  swapVerticalOutline,
  checkmarkDoneOutline,
  trashOutline,
  downloadOutline,
  closeOutline,
  checkmarkOutline,
  pinOutline,
  pricetagOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { taskService } from '../services/taskService';
import TaskItem from '../components/TaskItem';
import './Tasks.css';

const sortOptions = [
  { value: 'created_desc', label: 'Più recenti' },
  { value: 'created_asc', label: 'Meno recenti' },
  { value: 'due_asc', label: 'Scadenza (vicina)' },
  { value: 'due_desc', label: 'Scadenza (lontana)' },
  { value: 'priority_desc', label: 'Priorità (alta → bassa)' },
  { value: 'priority_asc', label: 'Priorità (bassa → alta)' },
  { value: 'alpha_asc', label: 'A → Z' },
  { value: 'alpha_desc', label: 'Z → A' },
];

const priorityOrder = { high: 3, medium: 2, low: 1 };

const Tasks = () => {
  const { user } = useAuth();
  const { tasks, categories, loading, completeTask, deleteTask, refresh } = useTasks(user?.id);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_desc');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [tags, setTags] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  const history = useHistory();

  useEffect(() => {
    if (user?.id) {
      taskService.getTags(user.id).then(setTags).catch(() => {});
    }
  }, [user?.id]);

  const pinnedTasks = useMemo(() => {
    return tasks.filter(t => t.is_pinned && t.status !== 'completed');
  }, [tasks]);

  const filteredAndSorted = useMemo(() => {
    let result = tasks.filter((task) => {
      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (task.notes || '').toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && task.status !== 'completed') ||
        (filter === 'completed' && task.status === 'completed');
      const matchesCategory =
        !filterCategory || task.category_id === filterCategory;
      const matchesPriority =
        !filterPriority || task.priority === filterPriority;
      const matchesTag =
        !filterTag || (task.task_tags || []).some(tt => (tt.tags?.id || tt.id) === filterTag);
      return matchesSearch && matchesFilter && matchesCategory && matchesPriority && matchesTag;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'created_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'created_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'due_asc':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        case 'due_desc':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(b.due_date) - new Date(a.due_date);
        case 'priority_desc':
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'priority_asc':
          return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
        case 'alpha_asc':
          return a.title.localeCompare(b.title, 'it');
        case 'alpha_desc':
          return b.title.localeCompare(a.title, 'it');
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, search, filter, sortBy, filterCategory, filterPriority, filterTag]);

  const activeFilterCount = [filterCategory, filterPriority, filterTag].filter(Boolean).length;

  const handleComplete = async (id) => {
    try {
      await completeTask(id);
      present({ message: 'Task completato!', duration: 1500, color: 'success' });
    } catch {
      present({ message: 'Errore nel completamento', duration: 2000, color: 'danger' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      present({ message: 'Task eliminato', duration: 1500, color: 'medium' });
    } catch {
      present({ message: 'Errore nell\'eliminazione', duration: 2000, color: 'danger' });
    }
  };

  const handleRefresh = async (event) => {
    await refresh();
    event.detail.complete();
  };

  // Bulk operations
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredAndSorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSorted.map((t) => t.id)));
    }
  };

  const bulkComplete = async () => {
    const count = selectedIds.size;
    for (const id of selectedIds) {
      await completeTask(id);
    }
    setSelectedIds(new Set());
    setBulkMode(false);
    present({ message: `${count} task completati!`, duration: 1500, color: 'success' });
  };

  const bulkDelete = async () => {
    presentAlert({
      header: 'Elimina selezionati',
      message: `Eliminare ${selectedIds.size} task?`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: async () => {
            for (const id of selectedIds) {
              await deleteTask(id);
            }
            setSelectedIds(new Set());
            setBulkMode(false);
            present({ message: 'Task eliminati', duration: 1500, color: 'medium' });
          },
        },
      ],
    });
  };

  // Export CSV
  const exportCSV = () => {
    const header = 'Titolo,Descrizione,Priorità,Stato,Scadenza,Categoria,Creato il\n';
    const rows = filteredAndSorted.map((t) =>
      [
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.priority,
        t.status,
        t.due_date || '',
        t.categories?.name || '',
        t.created_at,
      ].join(',')
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    present({ message: 'CSV esportato!', duration: 1500, color: 'success' });
  };

  const clearFilters = () => {
    setFilterCategory('');
    setFilterPriority('');
    setFilterTag('');
    setShowFilterModal(false);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="tasks-toolbar">
          <IonTitle className="tasks-title">I miei Task</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={exportCSV} className="toolbar-icon-btn">
              <IonIcon icon={downloadOutline} />
            </IonButton>
            <IonButton
              onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
              className="toolbar-icon-btn"
              color={bulkMode ? 'primary' : undefined}
            >
              <IonIcon icon={checkmarkDoneOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar className="tasks-toolbar">
          <IonSearchbar
            value={search}
            onIonInput={(e) => setSearch(e.detail.value)}
            placeholder="Cerca task..."
            className="tasks-searchbar"
            debounce={300}
          />
        </IonToolbar>
        <IonToolbar className="tasks-toolbar segment-toolbar">
          <IonSegment
            value={filter}
            onIonChange={(e) => setFilter(e.detail.value)}
            className="tasks-segment"
          >
            <IonSegmentButton value="all">
              <IonLabel>Tutti</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="active">
              <IonLabel>Attivi</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="completed">
              <IonLabel>Completati</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>

        {/* Filter & Sort Bar */}
        <IonToolbar className="tasks-toolbar filter-bar">
          <div className="filter-bar-inner">
            <IonButton
              fill="outline"
              size="small"
              shape="round"
              className="filter-chip"
              onClick={() => setShowFilterModal(true)}
            >
              <IonIcon icon={funnelOutline} slot="start" />
              Filtri
              {activeFilterCount > 0 && (
                <IonBadge color="primary" className="filter-badge">{activeFilterCount}</IonBadge>
              )}
            </IonButton>
            <IonButton
              fill="outline"
              size="small"
              shape="round"
              className="filter-chip"
              onClick={() => setShowSortModal(true)}
            >
              <IonIcon icon={swapVerticalOutline} slot="start" />
              Ordina
            </IonButton>
            {activeFilterCount > 0 && (
              <IonButton
                fill="clear"
                size="small"
                color="medium"
                onClick={clearFilters}
              >
                <IonIcon icon={closeOutline} slot="start" />
                Reset
              </IonButton>
            )}
            <span className="task-count">{filteredAndSorted.length} task</span>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="tasks-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Bulk Action Bar */}
        {bulkMode && selectedIds.size > 0 && (
          <div className="bulk-bar">
            <IonButton fill="clear" size="small" onClick={selectAll}>
              {selectedIds.size === filteredAndSorted.length ? 'Deseleziona' : 'Seleziona tutti'}
            </IonButton>
            <span className="bulk-count">{selectedIds.size} selezionati</span>
            <IonButton fill="solid" size="small" color="success" onClick={bulkComplete}>
              <IonIcon icon={checkmarkDoneOutline} slot="start" />
              Completa
            </IonButton>
            <IonButton fill="solid" size="small" color="danger" onClick={bulkDelete}>
              <IonIcon icon={trashOutline} slot="start" />
              Elimina
            </IonButton>
          </div>
        )}

        <motion.div className="tasks-container"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Pinned Tasks */}
          {!bulkMode && pinnedTasks.length > 0 && filter !== 'completed' && (
            <div className="pinned-section">
              <h3 className="pinned-title">
                <IonIcon icon={pinOutline} />
                Fissati
              </h3>
              {pinnedTasks.map(task => (
                <TaskItem
                  key={`pin-${task.id}`}
                  task={task}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  onEdit={(t) => history.push(`/tabs/task/${t.id}`)}
                />
              ))}
            </div>
          )}

          {loading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <IonSkeletonText
                key={i}
                animated
                style={{ height: '68px', borderRadius: '12px', margin: '6px 0' }}
              />
            ))
          ) : filteredAndSorted.length === 0 ? (
            <div className="tasks-empty">
              <IonIcon icon={funnelOutline} />
              <p>Nessun task trovato</p>
            </div>
          ) : (
            <IonList className="tasks-list">
              {filteredAndSorted.map((task) => (
                <div key={task.id} className={`task-row ${bulkMode ? 'bulk-mode' : ''}`}>
                  {bulkMode && (
                    <IonCheckbox
                      checked={selectedIds.has(task.id)}
                      onIonChange={() => toggleSelect(task.id)}
                      className="bulk-checkbox"
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <TaskItem
                      task={task}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                      onEdit={(t) => history.push(`/tabs/task/${t.id}`)}
                    />
                  </div>
                </div>
              ))}
            </IonList>
          )}
        </motion.div>

        <IonFab vertical="bottom" horizontal="end" slot="fixed" className="tasks-fab">
          <IonFabButton routerLink="/tabs/create">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        {/* Filter Modal */}
        <IonModal
          isOpen={showFilterModal}
          onDidDismiss={() => setShowFilterModal(false)}
          className="date-modal"
          breakpoints={[0, 0.55]}
          initialBreakpoint={0.55}
          handleBehavior="cycle"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Filtra</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowFilterModal(false)}>Fatto</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="filter-section">
              <h4 className="filter-section-title">Priorità</h4>
              <div className="filter-chips">
                {[
                  { value: '', label: 'Tutte' },
                  { value: 'high', label: '🔴 Alta' },
                  { value: 'medium', label: '🟡 Media' },
                  { value: 'low', label: '🟢 Bassa' },
                ].map((opt) => (
                  <IonButton
                    key={opt.value}
                    fill={filterPriority === opt.value ? 'solid' : 'outline'}
                    size="small"
                    shape="round"
                    className="filter-option-chip"
                    onClick={() => setFilterPriority(opt.value)}
                  >
                    {opt.label}
                  </IonButton>
                ))}
              </div>
            </div>
            <div className="filter-section">
              <h4 className="filter-section-title">Categoria</h4>
              <div className="filter-chips">
                <IonButton
                  fill={!filterCategory ? 'solid' : 'outline'}
                  size="small"
                  shape="round"
                  className="filter-option-chip"
                  onClick={() => setFilterCategory('')}
                >
                  Tutte
                </IonButton>
                {categories.map((cat) => (
                  <IonButton
                    key={cat.id}
                    fill={filterCategory === cat.id ? 'solid' : 'outline'}
                    size="small"
                    shape="round"
                    className="filter-option-chip"
                    onClick={() => setFilterCategory(cat.id)}
                  >
                    <span
                      className="picker-cat-dot"
                      style={{ backgroundColor: cat.color, width: 10, height: 10, marginRight: 6 }}
                    />
                    {cat.name}
                  </IonButton>
                ))}
              </div>
            </div>
            {tags.length > 0 && (
              <div className="filter-section">
                <h4 className="filter-section-title">Tag</h4>
                <div className="filter-chips">
                  <IonButton
                    fill={!filterTag ? 'solid' : 'outline'}
                    size="small"
                    shape="round"
                    className="filter-option-chip"
                    onClick={() => setFilterTag('')}
                  >
                    Tutti
                  </IonButton>
                  {tags.map((tag) => (
                    <IonButton
                      key={tag.id}
                      fill={filterTag === tag.id ? 'solid' : 'outline'}
                      size="small"
                      shape="round"
                      className="filter-option-chip"
                      onClick={() => setFilterTag(tag.id)}
                    >
                      <span
                        className="picker-cat-dot"
                        style={{ backgroundColor: tag.color, width: 10, height: 10, marginRight: 6 }}
                      />
                      {tag.name}
                    </IonButton>
                  ))}
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Sort Modal */}
        <IonModal
          isOpen={showSortModal}
          onDidDismiss={() => setShowSortModal(false)}
          className="date-modal"
          breakpoints={[0, 0.55]}
          initialBreakpoint={0.55}
          handleBehavior="cycle"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Ordina per</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowSortModal(false)}>Fatto</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList className="picker-list">
              {sortOptions.map((opt) => (
                <IonItem
                  key={opt.value}
                  button
                  detail={false}
                  className={`picker-item ${sortBy === opt.value ? 'picker-item-selected' : ''}`}
                  onClick={() => {
                    setSortBy(opt.value);
                    setShowSortModal(false);
                  }}
                >
                  <IonLabel>{opt.label}</IonLabel>
                  {sortBy === opt.value && (
                    <IonIcon icon={checkmarkOutline} slot="end" color="primary" />
                  )}
                </IonItem>
              ))}
            </IonList>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Tasks;
