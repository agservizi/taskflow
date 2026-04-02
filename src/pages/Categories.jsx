import React, { useState, useEffect } from 'react';
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
  IonInput,
  IonSpinner,
  useIonToast,
  useIonAlert,
} from '@ionic/react';
import {
  addOutline,
  trashOutline,
  colorPaletteOutline,
} from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import { taskService } from '../services/taskService';
import './Categories.css';

const colorPresets = [
  '#EF4444', '#F59E0B', '#22C55E', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#6366F1', '#06B6D4', '#84CC16', '#A855F7',
];

const Categories = () => {
  const { user } = useAuth();
  const [presetCategories, setPresetCategories] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorPresets[0]);
  const [adding, setAdding] = useState(false);
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();

  useEffect(() => {
    loadCategories();
  }, [user?.id]);

  const loadCategories = async () => {
    try {
      const all = await taskService.getCategories();
      setPresetCategories(all.filter((c) => !c.is_custom));
      if (user?.id) {
        const custom = await taskService.getCustomCategories(user.id);
        setCustomCategories(custom);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      present({ message: 'Inserisci un nome', duration: 2000, color: 'warning' });
      return;
    }
    if (newName.trim().length < 2) {
      present({ message: 'Minimo 2 caratteri', duration: 2000, color: 'warning' });
      return;
    }

    setAdding(true);
    try {
      const cat = await taskService.createCustomCategory(user.id, newName.trim(), selectedColor);
      setCustomCategories((prev) => [...prev, cat]);
      setNewName('');
      present({ message: 'Categoria creata!', duration: 1500, color: 'success' });
    } catch {
      present({ message: 'Errore nella creazione', duration: 2000, color: 'danger' });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (cat) => {
    presentAlert({
      header: 'Elimina Categoria',
      message: `Eliminare "${cat.name}"?`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: async () => {
            try {
              await taskService.deleteCustomCategory(cat.id);
              setCustomCategories((prev) => prev.filter((c) => c.id !== cat.id));
              present({ message: 'Categoria eliminata', duration: 1500, color: 'medium' });
            } catch {
              present({ message: 'Errore', duration: 2000, color: 'danger' });
            }
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="categories-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profile" text="Indietro" />
          </IonButtons>
          <IonTitle>Categorie</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="categories-content">
        <motion.div className="categories-container"
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Preset Categories */}
          <div className="cat-section">
            <h2 className="cat-section-title">Categorie Predefinite</h2>
            <div className="cat-grid">
              {presetCategories.map((cat, i) => (
                <motion.div key={cat.id} className="cat-chip"
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}>
                  <span className="cat-chip-dot" style={{ backgroundColor: cat.color }} />
                  <span className="cat-chip-name">{cat.name}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Custom Categories (Premium) */}
          <div className="cat-section">
            <h2 className="cat-section-title">
              <IonIcon icon={colorPaletteOutline} />
              Categorie Personalizzate
            </h2>

              {/* Add new category */}
              <div className="cat-add-form">
                <div className="cat-add-row">
                  <IonInput
                    value={newName}
                    onIonInput={(e) => setNewName(e.detail.value)}
                    placeholder="Nome categoria..."
                    className="cat-add-input"
                    fill="outline"
                    maxlength={30}
                  />
                  <IonButton
                    shape="round"
                    className="cat-add-btn"
                    onClick={handleAdd}
                    disabled={adding || !newName.trim()}
                  >
                    {adding ? <IonSpinner name="crescent" /> : <IonIcon icon={addOutline} />}
                  </IonButton>
                </div>

                <div className="color-picker">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      className={`color-dot ${selectedColor === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setSelectedColor(c)}
                    />
                  ))}
                </div>
              </div>

              {/* Custom categories list */}
              {loading ? (
                <IonSpinner name="crescent" className="cat-spinner" />
              ) : customCategories.length === 0 ? (
                <div className="cat-empty">
                  <p>Nessuna categoria personalizzata</p>
                </div>
              ) : (
                <div className="cat-custom-list">
                  {customCategories.map((cat, i) => (
                    <motion.div key={cat.id} className="cat-custom-item"
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}>
                      <span className="cat-chip-dot" style={{ backgroundColor: cat.color }} />
                      <span className="cat-custom-name">{cat.name}</span>
                      <IonButton
                        fill="clear"
                        size="small"
                        color="danger"
                        onClick={() => handleDelete(cat)}
                      >
                        <IonIcon icon={trashOutline} />
                      </IonButton>
                    </motion.div>
                  ))}
                </div>
              )}
          </div>
        </motion.div>
      </IonContent>
    </IonPage>
  );
};

export default Categories;
