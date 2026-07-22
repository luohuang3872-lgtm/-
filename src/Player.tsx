import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { useLongPress } from 'react-use';
import { Settings } from 'lucide-react';

export default function Player() {
  const { state, setMode } = useStore();
  const [currentPageId, setCurrentPageId] = useState<string | null>(state.startPageId);
  const [showExitHint, setShowExitHint] = useState(true);

  // Hide the hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowExitHint(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const currentPage = state.pages.find(p => p.id === currentPageId);

  // Long press anywhere to exit
  const onLongPress = () => {
    setMode('edit');
  };

  const longPressEvent = useLongPress(onLongPress, {
    isPreventDefault: false,
    delay: 1000,
  });

  if (!currentPage) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center flex-col gap-4">
        <p>No start page configured or page was deleted.</p>
        <button 
          onClick={() => setMode('edit')}
          className="px-4 py-2 bg-blue-600 rounded text-sm"
        >
          Return to Editor
        </button>
      </div>
    );
  }

  const handleHotspotClick = (e: React.MouseEvent, targetPageId: string | null) => {
    e.stopPropagation(); // prevent triggering other clicks if overlapping
    if (targetPageId) {
      setCurrentPageId(targetPageId);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden select-none"
      {...longPressEvent}
      style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
    >
      {/* Container aspect ratio matcher */}
      <div 
        className="relative shadow-2xl bg-black max-w-full max-h-full"
        style={{
          aspectRatio: `${currentPage.imgWidth} / ${currentPage.imgHeight}`,
          height: '100%',
        }}
      >
        <img 
          src={currentPage.imageUrl} 
          alt="App View" 
          className="w-full h-full block pointer-events-none"
        />

        {/* Hotspots */}
        {currentPage.hotspots.map(hs => (
          <div
            key={hs.id}
            onClick={(e) => handleHotspotClick(e, hs.targetPageId)}
            className="absolute cursor-pointer"
            style={{ 
              left: `${hs.x}%`, 
              top: `${hs.y}%`, 
              width: `${hs.w}%`, 
              height: `${hs.h}%`,
              // Add a subtle tap highlight for mobile feel (optional, here it's fully transparent)
              WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.2)'
            }}
          />
        ))}

        {/* Text Overlays */}
        {currentPage.textOverlays.map(txt => (
          <div
            key={txt.id}
            className="absolute flex items-center pointer-events-none"
            style={{ 
              left: `${txt.x}%`, 
              top: `${txt.y}%`, 
              width: `${txt.w}%`, 
              height: `${txt.h}%`,
              backgroundColor: txt.bgColor,
              color: txt.color,
              fontSize: `${txt.fontSize}px`,
              fontWeight: txt.fontWeight,
              justifyContent: txt.textAlign === 'center' ? 'center' : txt.textAlign === 'right' ? 'flex-end' : 'flex-start',
              padding: '0 4px',
              whiteSpace: 'pre-wrap',
              overflow: 'hidden'
            }}
          >
            {txt.text}
          </div>
        ))}
      </div>

      {/* Floating Exit Hint / Button */}
      <div 
        className={`absolute top-4 right-4 z-50 transition-opacity duration-500 flex items-center gap-2 ${
          showExitHint ? 'opacity-100' : 'opacity-0 hover:opacity-100'
        }`}
      >
        <div className="bg-black/60 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
          Long press anywhere to exit
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setMode('edit'); }}
          className="bg-black/60 backdrop-blur p-2 rounded-full text-white hover:bg-black/80 transition-colors"
          title="Exit to Editor"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}
