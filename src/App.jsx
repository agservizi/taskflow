import React, { useState, useRef, useCallback } from 'react';
import { Redirect, Route, useHistory } from 'react-router-dom';
import {
  IonApp,
  IonPage,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonActionSheet,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  gridOutline,
  listOutline,
  addCircleOutline,
  personOutline,
  checkmarkCircleOutline,
  folderOutline,
  leafOutline,
  documentTextOutline,
  closeOutline,
} from 'ionicons/icons';

import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import useDesktop from './hooks/useDesktop';

import SplashScreen from './components/SplashScreen';
import DesktopLayout from './components/DesktopLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CreateTask from './pages/CreateTask';
import EditTask from './pages/EditTask';
import TaskDetail from './pages/TaskDetail';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Categories from './pages/Categories';
import Calendar from './pages/Calendar';
import Habits from './pages/Habits';
import Templates from './pages/Templates';
import Projects from './pages/Projects';
import Gamification from './pages/Gamification';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact({
  mode: 'ios',
  swipeBackEnabled: true,
});

// Guard component: redirects to login if not authenticated
const AuthGuard = ({ component: Component, ...rest }) => {
  const { user, loading } = useAuth();
  if (loading) return <IonPage />;
  if (!user) return <Redirect to="/login" />;
  return <Component {...rest} />;
};

// Guard component: redirects to dashboard if already authenticated
const GuestGuard = ({ component: Component, ...rest }) => {
  const { user, loading } = useAuth();
  if (loading) return <IonPage />;
  if (user) return <Redirect to="/tabs/dashboard" />;
  return <Component {...rest} />;
};

const AppTabs = () => {
  const history = useHistory();
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const longPressTimer = useRef(null);
  const didLongPress = useRef(false);

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setShowQuickCreate(true);
    }, 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleCreateClick = useCallback((e) => {
    if (didLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/tabs/dashboard" component={Dashboard} />
      <Route exact path="/tabs/tasks" component={Tasks} />
      <Route exact path="/tabs/profile" component={Profile} />
      <Route exact path="/tabs/create" component={CreateTask} />
      <Route exact path="/tabs/edit/:id" component={EditTask} />
      <Route exact path="/tabs/task/:id" component={TaskDetail} />
      <Route exact path="/tabs/analytics" component={Analytics} />
      <Route exact path="/tabs/categories" component={Categories} />
      <Route exact path="/tabs/calendar" component={Calendar} />
      <Route exact path="/tabs/habits" component={Habits} />
      <Route exact path="/tabs/templates" component={Templates} />
      <Route exact path="/tabs/projects" component={Projects} />
      <Route exact path="/tabs/gamification" component={Gamification} />
      <Route exact path="/tabs">
        <Redirect to="/tabs/dashboard" />
      </Route>
    </IonRouterOutlet>
    <IonTabBar slot="bottom">
      <IonTabButton tab="dashboard" href="/tabs/dashboard">
        <IonIcon icon={gridOutline} />
        <IonLabel>Dashboard</IonLabel>
      </IonTabButton>
      <IonTabButton tab="tasks" href="/tabs/tasks">
        <IonIcon icon={listOutline} />
        <IonLabel>Task</IonLabel>
      </IonTabButton>
      <IonTabButton tab="create" href="/tabs/create"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleCreateClick}
      >
        <IonIcon icon={addCircleOutline} />
        <IonLabel>Nuovo</IonLabel>
      </IonTabButton>
      <IonTabButton tab="profile" href="/tabs/profile">
        <IonIcon icon={personOutline} />
        <IonLabel>Profilo</IonLabel>
      </IonTabButton>
    </IonTabBar>

    <IonActionSheet
      isOpen={showQuickCreate}
      onDidDismiss={() => setShowQuickCreate(false)}
      header="Crea Nuovo"
      buttons={[
        { text: 'Nuovo Task', icon: checkmarkCircleOutline, handler: () => history.push('/tabs/create') },
        { text: 'Nuovo Progetto', icon: folderOutline, handler: () => history.push('/tabs/projects') },
        { text: 'Nuova Abitudine', icon: leafOutline, handler: () => history.push('/tabs/habits') },
        { text: 'Da Template', icon: documentTextOutline, handler: () => history.push('/tabs/templates') },
        { text: 'Annulla', icon: closeOutline, role: 'cancel' },
      ]}
    />
  </IonTabs>
  );
};

// Desktop layout – IonRouterOutlet with animated={false} to prevent page stacking
const DesktopApp = () => (
  <DesktopLayout>
    <IonRouterOutlet animated={false}>
      <Route exact path="/tabs/dashboard" component={Dashboard} />
      <Route exact path="/tabs/tasks" component={Tasks} />
      <Route exact path="/tabs/profile" component={Profile} />
      <Route exact path="/tabs/create" component={CreateTask} />
      <Route exact path="/tabs/edit/:id" component={EditTask} />
      <Route exact path="/tabs/task/:id" component={TaskDetail} />
      <Route exact path="/tabs/analytics" component={Analytics} />
      <Route exact path="/tabs/categories" component={Categories} />
      <Route exact path="/tabs/calendar" component={Calendar} />
      <Route exact path="/tabs/habits" component={Habits} />
      <Route exact path="/tabs/templates" component={Templates} />
      <Route exact path="/tabs/projects" component={Projects} />
      <Route exact path="/tabs/gamification" component={Gamification} />
      <Route exact path="/tabs">
        <Redirect to="/tabs/dashboard" />
      </Route>
    </IonRouterOutlet>
  </DesktopLayout>
);

// Switches between mobile tabs and desktop sidebar layout
const LayoutSwitcher = () => {
  const isDesktop = useDesktop();
  return isDesktop ? <DesktopApp /> : <AppTabs />;
};

// Wrappers with auth guards
const ProtectedContent = (props) => <AuthGuard component={LayoutSwitcher} {...props} />;
const GuestLogin = (props) => <GuestGuard component={Login} {...props} />;

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  useTheme(); // Applica tema salvato all'avvio

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/login" component={GuestLogin} />
          <Route path="/tabs" component={ProtectedContent} />
          <Route exact path="/">
            <Redirect to="/tabs/dashboard" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
