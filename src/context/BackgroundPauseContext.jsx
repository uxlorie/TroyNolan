import { createContext, useContext } from 'react';

export const BackgroundPauseContext = createContext(() => {});

export function useBackgroundPause() {
  return useContext(BackgroundPauseContext);
}
