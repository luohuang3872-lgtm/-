import React from 'react';
import { StoreProvider, useStore } from './store';
import Editor from './Editor';
import Player from './Player';

function AppContent() {
  const { state, isLoading } = useStore();

  // Dynamic manifest generation to make it installable like a PWA with custom icon/name
  React.useEffect(() => {
    if (state.appName || state.appIcon) {
      document.title = state.appName || 'MockApp';
      
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      if (state.appIcon) {
        link.href = state.appIcon;
      }

      let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleIcon);
      }
      if (state.appIcon) {
        appleIcon.href = state.appIcon;
      }
    }
  }, [state.appName, state.appIcon]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-900 items-center justify-center text-white">
        Loading MockApp Workspace...
      </div>
    );
  }

  return state.mode === 'play' ? <Player /> : <Editor />;
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

