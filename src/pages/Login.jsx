import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  useIonToast,
} from '@ionic/react';
import { logInOutline, personAddOutline, mailOutline } from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const [present] = useIonToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      present({ message: 'Compila tutti i campi', duration: 2000, color: 'warning' });
      return;
    }
    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      present({ message: 'Inserisci un indirizzo email valido', duration: 2000, color: 'warning' });
      return;
    }
    // Validazione password
    if (password.length < 6) {
      present({ message: 'La password deve avere almeno 6 caratteri', duration: 2000, color: 'warning' });
      return;
    }
    if (!isLogin && password.length < 8) {
      present({ message: 'La password deve avere almeno 8 caratteri', duration: 2000, color: 'warning' });
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        present({ message: 'Accesso effettuato!', duration: 1500, color: 'success' });
      } else {
        await signUp(email, password);
        present({
          message: 'Registrazione completata! Controlla la tua email.',
          duration: 3000,
          color: 'success',
        });
      }
    } catch (err) {
      present({ message: err.message, duration: 3000, color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      present({ message: 'Inserisci la tua email', duration: 2000, color: 'warning' });
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      present({
        message: 'Email di reset inviata! Controlla la tua casella.',
        duration: 3000,
        color: 'success',
      });
      setShowReset(false);
    } catch (err) {
      present({ message: err.message, duration: 3000, color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="login-content" fullscreen>
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <img src="/favicon.png" alt="TaskFlow" className="logo-img" />
              <h1>TaskFlow</h1>
            </div>
            <p className="login-subtitle">Organizza. Prioritizza. Completa.</p>
          </div>

          {showReset ? (
            <div className="login-form">
              <h2 className="form-title">Reset Password</h2>
              <p className="form-desc">
                Inserisci la tua email per ricevere il link di reset.
              </p>
              <div className="input-group">
                <IonInput
                  type="email"
                  placeholder="Email"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value)}
                  className="login-input"
                  fill="outline"
                  shape="round"
                />
              </div>
              <IonButton
                expand="block"
                shape="round"
                className="login-button"
                onClick={handleReset}
                disabled={loading}
              >
                {loading ? <IonSpinner name="crescent" /> : (
                  <>
                    <IonIcon icon={mailOutline} slot="start" />
                    Invia Link Reset
                  </>
                )}
              </IonButton>
              <IonButton
                expand="block"
                fill="clear"
                className="toggle-button"
                onClick={() => setShowReset(false)}
              >
                Torna al login
              </IonButton>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit}>
              <h2 className="form-title">{isLogin ? 'Bentornato!' : 'Crea Account'}</h2>
              <p className="form-desc">
                {isLogin
                  ? 'Accedi per gestire i tuoi task'
                  : 'Registrati per iniziare'}
              </p>
              <div className="input-group">
                <IonInput
                  type="email"
                  placeholder="Email"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value)}
                  className="login-input"
                  fill="outline"
                  shape="round"
                />
              </div>
              <div className="input-group">
                <IonInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value)}
                  className="login-input"
                  fill="outline"
                  shape="round"
                />
              </div>

              {isLogin && (
                <IonText
                  className="forgot-password"
                  onClick={() => setShowReset(true)}
                >
                  Password dimenticata?
                </IonText>
              )}

              <IonButton
                expand="block"
                shape="round"
                className="login-button"
                type="submit"
                disabled={loading}
              >
                {loading ? <IonSpinner name="crescent" /> : (
                  <>
                    <IonIcon
                      icon={isLogin ? logInOutline : personAddOutline}
                      slot="start"
                    />
                    {isLogin ? 'Accedi' : 'Registrati'}
                  </>
                )}
              </IonButton>

              <IonButton
                expand="block"
                fill="clear"
                className="toggle-button"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin
                  ? 'Non hai un account? Registrati'
                  : 'Hai già un account? Accedi'}
              </IonButton>
            </form>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
