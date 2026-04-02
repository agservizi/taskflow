import React, { useState, useMemo } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonBackButton, IonButton, IonIcon, IonModal,
  IonInput, IonTextarea, IonBadge, IonProgressBar,
  IonRefresher, IonRefresherContent, IonSkeletonText,
  useIonToast, useIonAlert,
} from '@ionic/react';
import {
  addOutline, folderOutline, trashOutline, createOutline,
  checkmarkCircleOutline, archiveOutline, ellipsisVerticalOutline,
} from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { useHistory } from 'react-router-dom';
import './Projects.css';

const PROJECT_COLORS = ['#6366F1', '#EF4444', '#22C55E', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6', '#14B8A6', '#F97316', '#64748B'];
const PROJECT_EMOJIS = ['📁', '🚀', '💼', '🎯', '📱', '🌐', '🎨', '📊', '🔧', '💡', '🏠', '📚', '🎮', '🏋️', '🍳'];

const Projects = () => {
  const { user } = useAuth();
  const { projects, loading, createProject, updateProject, deleteProject, refresh } = useProjects(user?.id);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [emoji, setEmoji] = useState('📁');
  const [editingId, setEditingId] = useState(null);
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  const history = useHistory();

  const activeProjects = useMemo(() => projects.filter(p => p.status === 'active'), [projects]);
  const archivedProjects = useMemo(() => projects.filter(p => p.status !== 'active'), [projects]);

  const handleSave = async () => {
    if (!name.trim()) { present({ message: 'Inserisci un nome', duration: 2000, color: 'warning' }); return; }
    try {
      if (editingId) {
        await updateProject(editingId, { name: name.trim(), description: description.trim(), color, emoji });
        present({ message: 'Progetto aggiornato!', duration: 1500, color: 'success' });
      } else {
        await createProject({ name: name.trim(), description: description.trim(), color, emoji });
        present({ message: 'Progetto creato!', duration: 1500, color: 'success' });
      }
      resetForm();
    } catch {
      present({ message: 'Errore nel salvataggio', duration: 2000, color: 'danger' });
    }
  };

  const handleDelete = (id, projectName) => {
    presentAlert({
      header: 'Elimina Progetto',
      message: `Eliminare "${projectName}"? I task verranno scollegati.`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Elimina', role: 'destructive', handler: async () => {
          await deleteProject(id);
          present({ message: 'Progetto eliminato', duration: 1500, color: 'medium' });
        }},
      ],
    });
  };

  const handleArchive = async (id) => {
    await updateProject(id, { status: 'archived' });
    present({ message: 'Progetto archiviato', duration: 1500, color: 'medium' });
  };

  const resetForm = () => {
    setShowCreate(false);
    setName('');
    setDescription('');
    setColor('#6366F1');
    setEmoji('📁');
    setEditingId(null);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description || '');
    setColor(p.color);
    setEmoji(p.emoji);
    setShowCreate(true);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/tabs/dashboard" /></IonButtons>
          <IonTitle>Progetti</IonTitle>
          <IonButton slot="end" fill="clear" onClick={() => { resetForm(); setShowCreate(true); }}>
            <IonIcon icon={addOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="projects-content">
        <IonRefresher slot="fixed" onIonRefresh={async (e) => { await refresh(); e.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="projects-container">
          {loading ? (
            [1,2,3].map(i => <IonSkeletonText key={i} animated style={{ height: 100, borderRadius: 16, marginBottom: 12 }} />)
          ) : activeProjects.length === 0 ? (
            <div className="empty-projects">
              <IonIcon icon={folderOutline} />
              <h3>Nessun progetto</h3>
              <p>Raggruppa i tuoi task in progetti per organizzarli meglio</p>
              <IonButton shape="round" onClick={() => setShowCreate(true)}>
                <IonIcon icon={addOutline} slot="start" /> Crea Progetto
              </IonButton>
            </div>
          ) : (
            activeProjects.map(project => (
              <div key={project.id} className="project-card" style={{ '--pc': project.color }} onClick={() => history.push(`/project/${project.id}`)}>
                <div className="project-card-header">
                  <span className="project-emoji">{project.emoji}</span>
                  <div className="project-info">
                    <h3>{project.name}</h3>
                    {project.description && <p>{project.description}</p>}
                  </div>
                  <div className="project-actions">
                    <IonButton fill="clear" size="small" onClick={(e) => { e.stopPropagation(); openEdit(project); }}>
                      <IonIcon icon={createOutline} />
                    </IonButton>
                    <IonButton fill="clear" size="small" onClick={(e) => { e.stopPropagation(); handleArchive(project.id); }}>
                      <IonIcon icon={archiveOutline} />
                    </IonButton>
                    <IonButton fill="clear" size="small" color="danger" onClick={(e) => { e.stopPropagation(); handleDelete(project.id, project.name); }}>
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </div>
                </div>
                <div className="project-card-footer">
                  <IonBadge color="medium">{project.status}</IonBadge>
                  <span className="project-date">{new Date(project.created_at).toLocaleDateString('it-IT')}</span>
                </div>
              </div>
            ))
          )}

          {archivedProjects.length > 0 && (
            <>
              <h3 className="section-title">Archiviati</h3>
              {archivedProjects.map(p => (
                <div key={p.id} className="project-card archived" style={{ '--pc': p.color }}>
                  <span className="project-emoji">{p.emoji}</span>
                  <span>{p.name}</span>
                  <IonButton fill="clear" size="small" onClick={() => updateProject(p.id, { status: 'active' })}>
                    Ripristina
                  </IonButton>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Create/Edit Modal */}
        <IonModal isOpen={showCreate} onDidDismiss={resetForm} className="project-modal">
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>{editingId ? 'Modifica Progetto' : 'Nuovo Progetto'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={resetForm}>Annulla</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="form-group">
              <label>Emoji</label>
              <div className="emoji-grid">
                {PROJECT_EMOJIS.map(e => (
                  <button key={e} className={`emoji-btn ${emoji === e ? 'selected' : ''}`} onClick={() => setEmoji(e)}>{e}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Nome</label>
              <IonInput value={name} onIonInput={e => setName(e.detail.value)} placeholder="Nome progetto" className="form-input" />
            </div>
            <div className="form-group">
              <label>Descrizione</label>
              <IonTextarea value={description} onIonInput={e => setDescription(e.detail.value)} placeholder="Descrizione..." rows={3} className="form-input" />
            </div>
            <div className="form-group">
              <label>Colore</label>
              <div className="color-grid">
                {PROJECT_COLORS.map(c => (
                  <button key={c} className={`color-btn ${color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>
            <IonButton expand="block" shape="round" onClick={handleSave} className="save-btn">
              <IonIcon icon={checkmarkCircleOutline} slot="start" />
              {editingId ? 'Salva Modifiche' : 'Crea Progetto'}
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Projects;
