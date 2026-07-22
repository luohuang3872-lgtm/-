export type ID = string;

export interface Hotspot {
  id: ID;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  w: number; // percentage (0-100)
  h: number; // percentage (0-100)
  targetPageId: ID | null;
}

export interface TextOverlay {
  id: ID;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  w: number; // percentage (0-100)
  h: number; // percentage (0-100)
  text: string;
  fontSize: number; // in px
  color: string;
  bgColor: string;
  fontWeight: 'normal' | 'bold' | '500' | '600';
  textAlign: 'left' | 'center' | 'right';
}

export interface Page {
  id: ID;
  name: string;
  imageUrl: string;
  imgWidth: number;
  imgHeight: number;
  hotspots: Hotspot[];
  textOverlays: TextOverlay[];
}

export interface AppState {
  appName: string;
  appIcon: string;
  pages: Page[];
  startPageId: ID | null;
  mode: 'edit' | 'play';
}
