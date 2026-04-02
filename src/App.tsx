import React, { useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
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
  homeOutline,
  listOutline,
  addCircleOutline,
  personOutline,
} from 'ionicons/icons';

import { useAuth } from './hooks/useAuth';

import SplashScreen from './components/SplashScreen';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CreateTask from './pages/CreateTask';
import TaskDetail from './pages/TaskDetail';
import Profile from './pages/Profile';
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

const AppTabs: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/tabs/dashboard" component={Dashboard} />
      <Route exact path="/tabs/tasks" component={Tasks} />
      <Route exact path="/tabs/profile" component={Profile} />
      <Route exact path="/tabs/projects" component={Projects} />
      <Route exact path="/tabs/gamification" component={Gamification} />
      <Route exact path="/tabs">
        <Redirect to="/tabs/dashboard" />
      </Route>
    </IonRouterOutlet>
    <IonTabBar slot="bottom">
      <IonTabButton tab="dashboard" href="/tabs/dashboard">
        <IonIcon icon={homeOutline} />
        <IonLabel>Home</IonLabel>
      </IonTabButton>
      <IonTabButton tab="tasks" href="/tabs/tasks">
        <IonIcon icon={listOutline} />
        <IonLabel>Task</IonLabel>
      </IonTabButton>
      <IonTabButton tab="create" href="/create-task">
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

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {!user && !loading ? (
            <>
              <Route path="/login" component={Login} />
              <Route exact path="/">
                <Redirect to="/login" />
              </Route>
              <Redirect to="/login" />
            </>
          ) : (
            <>
              <Route path="/tabs" component={AppTabs} />
              <Route exact path="/create-task" component={CreateTask} />
              <Route exact path="/task/:id" component={TaskDetail} />
              <Route exact path="/">
                <Redirect to="/tabs/dashboard" />
              </Route>
              <Route exact path="/login">
                <Redirect to="/tabs/dashboard" />
              </Route>
            </>
          )}
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
