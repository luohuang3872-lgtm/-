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

      const manifest = {
        name: state.appName || 'MockApp',
        short_name: state.appName || 'MockApp',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: state.appIcon ? [
          { src: state.appIcon, sizes: '192x192', type: 'image/png' },
          { src: state.appIcon, sizes: '512x512', type: 'image/png' }
        ] : []
      };

      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const manifestURL = URL.createObjectURL(blob);
      let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = manifestURL;
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

