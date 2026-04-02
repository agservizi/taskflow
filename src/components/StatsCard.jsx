import React from 'react';
import { IonCard, IonCardContent, IonIcon } from '@ionic/react';
import './StatsCard.css';

const StatsCard = ({ title, value, icon, color, subtitle }) => {
  return (
    <IonCard className="stats-card" style={{ '--card-accent': color }}>
      <IonCardContent className="stats-card-content">
        <div className="stats-card-icon" style={{ backgroundColor: `${color}15`, color }}>
          <IonIcon icon={icon} />
        </div>
        <div className="stats-card-info">
          <span className="stats-card-value">{value}</span>
          <span className="stats-card-title">{title}</span>
          {subtitle && <span className="stats-card-subtitle">{subtitle}</span>}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default StatsCard;
