import { useState } from 'react';
import Background from './Background';
import { BackgroundPauseContext } from '../context/BackgroundPauseContext';
import './Layout.css';

export default function Layout({ children }) {
  const [backgroundPaused, setBackgroundPaused] = useState(false);

  return (
    <BackgroundPauseContext.Provider value={setBackgroundPaused}>
      <div className="layout">
        <Background paused={backgroundPaused} />
        <main className="layout__content">{children}</main>
      </div>
    </BackgroundPauseContext.Provider>
  );
}
