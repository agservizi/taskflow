import React, { useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonPage,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  gridOutline,
  listOutline,
  addCircleOutline,
  personOutline,
} from 'ionicons/icons';

import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';

import SplashScreen from './components/SplashScreen';
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

const AppTabs = () => (
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
      <IonTabButton tab="create" href="/tabs/create">
        <IonIcon icon={addCircleOutline} />
        <IonLabel>Nuovo</IonLabel>
      </IonTabButton>
      <IonTabButton tab="profile" href="/tabs/profile">
        <IonIcon icon={personOutline} />
        <IonLabel>Profilo</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

// Wrapper to pass auth guard to AppTabs
const ProtectedTabs = (props) => <AuthGuard component={AppTabs} {...props} />;
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
          <Route path="/tabs" component={ProtectedTabs} />
          <Route exact path="/">
            <Redirect to="/tabs/dashboard" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
