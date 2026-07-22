import React, { useState, useRef, useEffect } from 'react';
import { useStore } from './store';
import { Page, Hotspot, TextOverlay, ID } from './types';
import { 
  Play, Plus, Image as ImageIcon, Trash2, Edit3, 
  Settings, Type, MousePointer, X, Download, Upload 
} from 'lucide-react';

export default function Editor() {
  const { 
    state, setMode, addPage, removePage, updatePageName, 
    addHotspot, removeHotspot, updateHotspot,
    addTextOverlay, removeTextOverlay, updateTextOverlay,
    setAppName, setAppIcon, importState
  } = useStore();

  const [activePageId, setActivePageId] = useState<ID | null>(state.pages[0]?.id || null);
  const [selectedElementId, setSelectedElementId] = useState<ID | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<'hotspot' | 'text' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${state.appName || 'mockapp'}-project.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedState = JSON.parse(event.target?.result as string);
        if (importedState && importedState.pages) {
          importState(importedState);
        }
      } catch (err) {
        alert("Invalid project file");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Auto-select first page if none selected
  useEffect(() => {
    if (!activePageId && state.pages.length > 0) {
      setActivePageId(state.pages[0].id);
    } else if (activePageId && !state.pages.find(p => p.id === activePageId)) {
      setActivePageId(state.pages.length > 0 ? state.pages[0].id : null);
    }
  }, [state.pages, activePageId]);

  const activePage = state.pages.find(p => p.id === activePageId);

  // --- Image Upload Helpers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newPage = addPage({
          name: file.name.split('.')[0] || 'New Page',
          imageUrl: url,
          imgWidth: img.width,
          imgHeight: img.height,
        });
        setActivePageId(newPage.id);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAppIcon(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // --- Dragging Logic ---
  const [drag, setDrag] = useState<{
    id: ID;
    type: 'hotspot' | 'text';
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    initW: number;
    initH: number;
  } | null>(null);

  const onPointerDown = (
    e: React.PointerEvent, id: ID, type: 'hotspot' | 'text', mode: 'move' | 'resize', 
    el: Hotspot | TextOverlay
  ) => {
    e.stopPropagation();
    setSelectedElementId(id);
    setSelectedElementType(type);
    
    // Ensure standard left click or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    setDrag({
      id, type, mode,
      startX: e.clientX,
      startY: e.clientY,
      initX: el.x,
      initY: el.y,
      initW: el.w,
      initH: el.h,
    });
  };

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!drag || !containerRef.current || !activePage) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - drag.startX) / rect.width) * 100;
      const dy = ((e.clientY - drag.startY) / rect.height) * 100;

      let newX = drag.initX;
      let newY = drag.initY;
      let newW = drag.initW;
      let newH = drag.initH;

      if (drag.mode === 'move') {
        newX = Math.max(0, Math.min(100 - newW, drag.initX + dx));
        newY = Math.max(0, Math.min(100 - newH, drag.initY + dy));
      } else if (drag.mode === 'resize') {
        newW = Math.max(1, Math.min(100 - newX, drag.initW + dx));
        newH = Math.max(1, Math.min(100 - newY, drag.initH + dy));
      }

      if (drag.type === 'hotspot') {
        updateHotspot(activePage.id, drag.id, { x: newX, y: newY, w: newW, h: newH });
      } else {
        updateTextOverlay(activePage.id, drag.id, { x: newX, y: newY, w: newW, h: newH });
      }
    };

    const onPointerUp = () => setDrag(null);

    if (drag) {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [drag, activePage, updateHotspot, updateTextOverlay]);

  // --- Property Rendering ---
  const renderProperties = () => {
    if (!activePage) return <div className="p-4 text-sm text-gray-400">No page selected</div>;
    
    if (selectedElementType === 'hotspot' && selectedElementId) {
      const hotspot = activePage.hotspots.find(h => h.id === selectedElementId);
      if (!hotspot) return null;

      return (
        <div className="p-4 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <MousePointer size={16} /> Hotspot Properties
          </h3>
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">Target Page (Click to Navigate)</label>
            <select
              value={hotspot.targetPageId || ''}
              onChange={(e) => updateHotspot(activePage.id, hotspot.id, { targetPageId: e.target.value || null })}
              className="w-full bg-slate-800 text-white text-sm rounded border border-slate-700 p-2 outline-none focus:border-blue-500"
            >
              <option value="">None (No action)</option>
              {state.pages.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => { removeHotspot(activePage.id, hotspot.id); setSelectedElementId(null); }}
            className="w-full py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 rounded text-sm transition-colors"
          >
            Delete Hotspot
          </button>
        </div>
      );
    }

    if (selectedElementType === 'text' && selectedElementId) {
      const text = activePage.textOverlays.find(t => t.id === selectedElementId);
      if (!text) return null;

      return (
        <div className="p-4 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Type size={16} /> Text Properties
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">Text Content</label>
              <textarea
                value={text.text}
                onChange={(e) => updateTextOverlay(activePage.id, text.id, { text: e.target.value })}
                className="w-full bg-slate-800 text-white text-sm rounded border border-slate-700 p-2 outline-none focus:border-blue-500 min-h-[60px]"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-medium mb-1 block">Font Size</label>
                <input
                  type="number"
                  value={text.fontSize}
                  onChange={(e) => updateTextOverlay(activePage.id, text.id, { fontSize: Number(e.target.value) })}
                  className="w-full bg-slate-800 text-white text-sm rounded border border-slate-700 p-2 outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-medium mb-1 block">Align</label>
                <select
                  value={text.textAlign}
                  onChange={(e) => updateTextOverlay(activePage.id, text.id, { textAlign: e.target.value as any })}
                  className="w-full bg-slate-800 text-white text-sm rounded border border-slate-700 p-2 outline-none focus:border-blue-500"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-medium mb-1 block">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={text.color}
                    onChange={(e) => updateTextOverlay(activePage.id, text.id, { color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={text.color}
                    onChange={(e) => updateTextOverlay(activePage.id, text.id, { color: e.target.value })}
                    className="flex-1 bg-slate-800 text-white text-sm rounded border border-slate-700 px-2 py-1 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={text.bgColor}
                  onChange={(e) => updateTextOverlay(activePage.id, text.id, { bgColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <input 
                  type="text" 
                  value={text.bgColor}
                  onChange={(e) => updateTextOverlay(activePage.id, text.id, { bgColor: e.target.value })}
                  className="flex-1 bg-slate-800 text-white text-sm rounded border border-slate-700 px-2 py-1 outline-none"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Use a solid background to cover original text on the screenshot.</p>
            </div>
            
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">Font Weight</label>
              <select
                value={text.fontWeight}
                onChange={(e) => updateTextOverlay(activePage.id, text.id, { fontWeight: e.target.value as any })}
                className="w-full bg-slate-800 text-white text-sm rounded border border-slate-700 p-2 outline-none focus:border-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="500">Medium</option>
                <option value="600">Semi Bold</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>
          
          <button 
            onClick={() => { removeTextOverlay(activePage.id, text.id); setSelectedElementId(null); }}
            className="w-full py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 rounded text-sm transition-colors mt-4 block"
          >
            Delete Text
          </button>
        </div>
      );
    }

    return (
      <div className="p-4 text-sm text-gray-400 text-center mt-10">
        Select a hotspot or text overlay on the canvas to edit its properties.
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR - Pages */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h1 className="font-bold text-white mb-4 flex items-center gap-2">
            <Settings size={18} /> Prototyper
          </h1>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">App Name</label>
              <input 
                type="text" 
                value={state.appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full bg-slate-900 text-white text-sm rounded border border-slate-700 px-2 py-1.5 outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500 transition-colors shrink-0"
                onClick={() => iconInputRef.current?.click()}
                title="Change App Icon"
              >
                {state.appIcon ? (
                  <img src={state.appIcon} alt="Icon" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={16} className="text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <button 
                  onClick={() => setMode('play')}
                  disabled={state.pages.length === 0}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Play size={16} /> Play Prototype
                </button>
              </div>
              <input type="file" ref={iconInputRef} onChange={handleIconUpload} accept="image/*" className="hidden" />
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-slate-800/50 mt-3">
              <button 
                onClick={handleExport}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                title="Save Project File"
              >
                <Download size={12} /> Export
              </button>
              <button 
                onClick={() => importInputRef.current?.click()}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                title="Load Project File"
              >
                <Upload size={12} /> Import
              </button>
              <input type="file" ref={importInputRef} onChange={handleImport} accept=".json" className="hidden" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pages</h2>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-400 hover:text-blue-300 p-1"
              title="Add Page (Upload Screenshot)"
            >
              <Plus size={16} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>

          {state.pages.length === 0 && (
            <div className="text-center p-4 border border-dashed border-slate-700 rounded-lg text-sm text-gray-500 mt-4">
              Click + to upload your first screenshot.
            </div>
          )}

          {state.pages.map(page => (
            <div 
              key={page.id} 
              className={`group flex items-center gap-3 p-2 rounded cursor-pointer border ${
                activePageId === page.id 
                  ? 'bg-blue-900/20 border-blue-500/50' 
                  : 'bg-slate-900 border-transparent hover:border-slate-700'
              }`}
              onClick={() => {
                setActivePageId(page.id);
                setSelectedElementId(null);
              }}
            >
              <div className="w-8 h-12 bg-black rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
                <img src={page.imageUrl} alt={page.name} className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <input 
                  type="text" 
                  value={page.name}
                  onChange={(e) => updatePageName(page.id, e.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none border-b border-transparent focus:border-slate-600 truncate"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER - Canvas */}
      <div className="flex-1 flex flex-col bg-slate-900 relative">
        {/* Toolbar */}
        <div className="h-14 border-b border-slate-800 flex items-center justify-center gap-2 px-4 shrink-0 bg-slate-900/80 backdrop-blur z-10">
          <button 
            disabled={!activePage}
            onClick={() => {
              if (activePage) {
                const hs = addHotspot(activePage.id);
                setSelectedElementId(hs.id);
                setSelectedElementType('hotspot');
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded disabled:opacity-50 transition-colors"
          >
            <MousePointer size={16} /> Add Hotspot
          </button>
          <button 
            disabled={!activePage}
            onClick={() => {
              if (activePage) {
                const txt = addTextOverlay(activePage.id);
                setSelectedElementId(txt.id);
                setSelectedElementType('text');
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded disabled:opacity-50 transition-colors"
          >
            <Type size={16} /> Add Text Replacement
          </button>
        </div>

        {/* Canvas Area */}
        <div 
          className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CgkJPGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMzMzMiLz4KCTwvc3ZnPg==')]"
          onClick={() => setSelectedElementId(null)}
        >
          {activePage ? (
            <div 
              ref={containerRef}
              className="relative shadow-2xl bg-black border border-slate-800 select-none"
              style={{
                aspectRatio: `${activePage.imgWidth} / ${activePage.imgHeight}`,
                maxHeight: '100%',
                maxWidth: '100%',
                height: '100%', // Maximize within the flex container's constraints
              }}
            >
              <img 
                src={activePage.imageUrl} 
                alt="Canvas" 
                className="w-full h-full block pointer-events-none"
              />
              
              {/* Render Hotspots */}
              {activePage.hotspots.map(hs => {
                const isSelected = selectedElementId === hs.id && selectedElementType === 'hotspot';
                return (
                  <div
                    key={hs.id}
                    className={`absolute border-2 flex items-center justify-center cursor-move ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500/20 z-20' 
                        : 'border-blue-400/50 bg-blue-400/10 hover:bg-blue-400/20 z-10'
                    }`}
                    style={{ left: `${hs.x}%`, top: `${hs.y}%`, width: `${hs.w}%`, height: `${hs.h}%` }}
                    onPointerDown={(e) => onPointerDown(e, hs.id, 'hotspot', 'move', hs)}
                  >
                    {isSelected && (
                      <div 
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize"
                        onPointerDown={(e) => onPointerDown(e, hs.id, 'hotspot', 'resize', hs)}
                      />
                    )}
                    {hs.targetPageId && !isSelected && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] px-1 rounded opacity-50">
                        Linked
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Render Text Overlays */}
              {activePage.textOverlays.map(txt => {
                const isSelected = selectedElementId === txt.id && selectedElementType === 'text';
                return (
                  <div
                    key={txt.id}
                    className={`absolute flex items-center cursor-move ${
                      isSelected ? 'ring-2 ring-blue-500 z-20' : 'hover:ring-1 hover:ring-white/50 z-10'
                    }`}
                    style={{ 
                      left: `${txt.x}%`, top: `${txt.y}%`, width: `${txt.w}%`, height: `${txt.h}%`,
                      backgroundColor: txt.bgColor,
                      color: txt.color,
                      fontSize: `${txt.fontSize}px`,
                      fontWeight: txt.fontWeight,
                      justifyContent: txt.textAlign === 'center' ? 'center' : txt.textAlign === 'right' ? 'flex-end' : 'flex-start',
                      padding: '0 4px'
                    }}
                    onPointerDown={(e) => onPointerDown(e, txt.id, 'text', 'move', txt)}
                  >
                    <span className="truncate w-full block" style={{ textAlign: txt.textAlign }}>{txt.text}</span>
                    
                    {isSelected && (
                      <div 
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize z-30"
                        onPointerDown={(e) => onPointerDown(e, txt.id, 'text', 'resize', txt)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500">Create a page to begin editing</div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR - Properties */}
      <div className="w-64 bg-slate-950 border-l border-slate-800 flex flex-col overflow-y-auto">
        {renderProperties()}
      </div>

    </div>
  );
}
