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
      const iconToUse = state.appIcon || '/icon.png';
      const iconType = iconToUse.startsWith('data:image/jpeg') ? 'image/jpeg' : 
                       iconToUse.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png';

      const manifest = {
        name: state.appName || 'MockApp Player',
        short_name: state.appName || 'MockApp',
        start_url: "/?play=1",
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: iconToUse, sizes: '192x192 512x512', type: iconType, purpose: 'any maskable' }
        ]
      };

      const manifestStr = JSON.stringify(manifest);
      const manifestURL = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(manifestStr)}`;
      
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

