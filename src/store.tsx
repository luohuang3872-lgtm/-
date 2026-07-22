import React, { createContext, useContext, useEffect, useState } from 'react';
import { get, set } from 'idb-keyval';
import { AppState, ID, Page, Hotspot, TextOverlay } from './types';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_STATE: AppState = {
  appName: 'My Mockup App',
  appIcon: '',
  pages: [],
  startPageId: null,
  mode: 'edit',
};

interface StoreContextType {
  state: AppState;
  isLoading: boolean;
  setMode: (mode: 'edit' | 'play') => void;
  setAppName: (name: string) => void;
  setAppIcon: (icon: string) => void;
  setStartPageId: (id: ID) => void;
  addPage: (page: Omit<Page, 'id' | 'hotspots' | 'textOverlays'>) => Page;
  removePage: (id: ID) => void;
  updatePageName: (id: ID, name: string) => void;
  addHotspot: (pageId: ID) => Hotspot;
  updateHotspot: (pageId: ID, hotspotId: ID, updates: Partial<Hotspot>) => void;
  removeHotspot: (pageId: ID, hotspotId: ID) => void;
  addTextOverlay: (pageId: ID) => TextOverlay;
  updateTextOverlay: (pageId: ID, textId: ID, updates: Partial<TextOverlay>) => void;
  removeTextOverlay: (pageId: ID, textId: ID) => void;
  importState: (newState: AppState) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial state
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await get('mockapp-state');
        if (savedState) {
          setState({ ...DEFAULT_STATE, ...savedState, mode: 'edit' }); // Always start in edit mode
        }
      } catch (err) {
        console.error('Failed to load state from idb:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (isLoading) return;
    set('mockapp-state', state).catch((err) => console.error('Failed to save state:', err));
  }, [state, isLoading]);

  const updateState = (updater: (draft: AppState) => AppState) => {
    setState((prev) => updater({ ...prev }));
  };

  const setMode = (mode: 'edit' | 'play') => updateState(s => { s.mode = mode; return s; });
  const setAppName = (name: string) => updateState(s => { s.appName = name; return s; });
  const setAppIcon = (icon: string) => updateState(s => { s.appIcon = icon; return s; });
  const setStartPageId = (id: ID) => updateState(s => { s.startPageId = id; return s; });

  const addPage = (pageData: Omit<Page, 'id' | 'hotspots' | 'textOverlays'>) => {
    const newPage: Page = {
      ...pageData,
      id: uuidv4(),
      hotspots: [],
      textOverlays: [],
    };
    updateState(s => {
      s.pages.push(newPage);
      if (!s.startPageId) s.startPageId = newPage.id;
      return s;
    });
    return newPage;
  };

  const removePage = (id: ID) => {
    updateState(s => {
      s.pages = s.pages.filter(p => p.id !== id);
      if (s.startPageId === id) {
        s.startPageId = s.pages.length > 0 ? s.pages[0].id : null;
      }
      return s;
    });
  };

  const updatePageName = (id: ID, name: string) => {
    updateState(s => {
      const page = s.pages.find(p => p.id === id);
      if (page) page.name = name;
      return s;
    });
  };

  const addHotspot = (pageId: ID) => {
    const newHotspot: Hotspot = {
      id: uuidv4(),
      x: 40, y: 40, w: 20, h: 10,
      targetPageId: null,
    };
    updateState(s => {
      const page = s.pages.find(p => p.id === pageId);
      if (page) page.hotspots.push(newHotspot);
      return s;
    });
    return newHotspot;
  };

  const updateHotspot = (pageId: ID, hotspotId: ID, updates: Partial<Hotspot>) => {
    updateState(s => {
      const page = s.pages.find(p => p.id === pageId);
      if (page) {
        const index = page.hotspots.findIndex(h => h.id === hotspotId);
        if (index !== -1) page.hotspots[index] = { ...page.hotspots[index], ...updates };
      }
      return s;
    });
  };

  const removeHotspot = (pageId: ID, hotspotId: ID) => {
    updateState(s => {
      const page = s.pages.find(p => p.id === pageId);
      if (page) page.hotspots = page.hotspots.filter(h => h.id !== hotspotId);
      return s;
    });
  };

  const addTextOverlay = (pageId: ID) => {
    const newText: TextOverlay = {
      id: uuidv4(),
      x: 30, y: 40, w: 40, h: 5,
      text: 'New Text',
      fontSize: 14,
      color: '#000000',
      bgColor: '#ffffff',
      fontWeight: 'normal',
      textAlign: 'center',
    };
    updateState(s => {
      const page = s.pages.find(p => p.id === pageId);
      if (page) page.textOverlays.push(newText);
      return s;
    });
    return newText;
  };

  const updateTextOverlay = (pageId: ID, textId: ID, updates: Partial<TextOverlay>) => {
    updateState(s => {
      const page = s.pages.find(p => p.id === pageId);
      if (page) {
        const index = page.textOverlays.findIndex(t => t.id === textId);
        if (index !== -1) page.textOverlays[index] = { ...page.textOverlays[index], ...updates };
      }
      return s;
    });
  };

  const removeTextOverlay = (pageId: ID, textId: ID) => {
    updateState(s => {
      const page = s.pages.find(p => p.id === pageId);
      if (page) page.textOverlays = page.textOverlays.filter(t => t.id !== textId);
      return s;
    });
  };

  const importState = (newState: AppState) => {
    setState(newState);
  };

  const value = {
    state,
    isLoading,
    setMode,
    setAppName,
    setAppIcon,
    setStartPageId,
    addPage,
    removePage,
    updatePageName,
    addHotspot,
    updateHotspot,
    removeHotspot,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    importState,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
