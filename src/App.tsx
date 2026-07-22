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

      const defaultIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='50' fill='white'%3EApp%3C/text%3E%3C/svg%3E";
      const iconToUse = state.appIcon || defaultIcon;
      
      const manifest = {
        name: state.appName || 'MockApp',
        short_name: state.appName || 'MockApp',
        start_url: window.location.pathname + window.location.search,
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: iconToUse, sizes: '192x192', type: iconToUse.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png' },
          { src: iconToUse, sizes: '512x512', type: iconToUse.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png' }
        ]
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

