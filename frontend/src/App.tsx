import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './App.css';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Annotation {
  id: string;
  labelId: string;
  points: { x: number; y: number }[];
  type: 'select' | 'auto' | 'rectangle' | 'polygon' | 'brush' | 'cube' | 'pan' | 'zoom-in' | 'zoom-out';
}

function App() {
  const [selectedTool, setSelectedTool] = useState<'select' | 'auto' | 'rectangle' | 'polygon' | 'brush' | 'cube' | 'pan' | 'zoom-in' | 'zoom-out'>('select');
  const [currentLabel, setCurrentLabel] = useState<string>('1');
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(['X-ray', 'Fracture', 'Hand', 'field 2', 'Tree', 'Lettuce']);
  const [newTag, setNewTag] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const labels: Label[] = useMemo(() => [
    { id: '1', name: 'Person', color: '#8B5CF6' },
    { id: '2', name: 'Motorcycle', color: '#10B981' },
    { id: '3', name: 'Car', color: '#10B981' },
    { id: '4', name: 'Handbag', color: '#8B5CF6' },
    { id: '5', name: 'Manhole', color: '#EF4444' },
    { id: '6', name: 'Street crossing', color: '#3B82F6' },
    { id: '7', name: 'Road arrow', color: '#EF4444' },
    { id: '8', name: 'License Plate', color: '#EF4444' },
    { id: '9', name: 'Umbrella', color: '#8B5CF6' },
    { id: '10', name: 'Helmet', color: '#8B5CF6' }
  ], []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (selectedTool === 'select') {
      // Show selected annotation overlay for demo
      setSelectedAnnotation('demo');
      return;
    }

    if (selectedTool === 'pan' || selectedTool === 'auto' || 
        selectedTool === 'cube' || selectedTool === 'zoom-in' || selectedTool === 'zoom-out') return;

    if (selectedTool === 'polygon' || selectedTool === 'rectangle' || selectedTool === 'brush') {
      if (!isDrawing) {
        setIsDrawing(true);
        setCurrentPoints([{ x, y }]);
      } else {
        setCurrentPoints(prev => [...prev, { x, y }]);
      }
    }
  };

  const handleCanvasDoubleClick = () => {
    if ((selectedTool === 'polygon' || selectedTool === 'rectangle') && isDrawing) {
      finishPolygon();
    }
  };

  const finishPolygon = () => {
    if (currentPoints.length > 2) {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        labelId: currentLabel,
        points: [...currentPoints],
        type: selectedTool as 'polygon' | 'rectangle' | 'brush'
      };
      setAnnotations(prev => [...prev, newAnnotation]);
    }
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'pan' && e.buttons === 1) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x / zoom, pan.y / zoom);

    // Draw existing annotations
    annotations.forEach(annotation => {
      const label = labels.find(l => l.id === annotation.labelId);
      if (!label) return;

      ctx.strokeStyle = label.color;
      ctx.fillStyle = label.color + '40';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (annotation.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        annotation.points.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        if (annotation.type === 'polygon') {
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();
      }
    });

    // Draw current drawing
    if (isDrawing && currentPoints.length > 0) {
      const label = labels.find(l => l.id === currentLabel);
      if (label) {
        ctx.strokeStyle = label.color;
        ctx.fillStyle = label.color + '40';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        currentPoints.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        if (selectedTool === 'polygon') {
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [annotations, currentPoints, isDrawing, zoom, pan, currentLabel, selectedTool, labels]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  return (
    <div className="app">
      {/* Top Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="logo">
            <div className="logo-icon">CC</div>
            <span className="logo-text">Clear Cam</span>
          </div>
          <div className="dropdown">
            <select value={currentLabel} onChange={(e) => setCurrentLabel(e.target.value)}>
              {labels.map(label => (
                <option key={label.id} value={label.id}>{label.name}</option>
              ))}
            </select>
          </div>
          <div className="dropdown">
            <select>
              <option>Generalized</option>
              <option>Specific</option>
            </select>
          </div>
        </div>
        <div className="toolbar-center">
          <div className="pagination">107/107</div>
          <div className="timestamp">13:13</div>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-btn">↶</button>
          <button className="toolbar-btn">↷</button>
          <button className="toolbar-btn">🗑️</button>
        </div>
      </div>

      <div className="main-content">
        {/* Left Sidebar - Tools */}
        <div className="left-sidebar">
          <div 
            className={`tool-icon-btn ${selectedTool === 'select' ? 'active' : ''}`}
            onClick={() => setSelectedTool('select')}
          >
            <div className="tool-icon">↖</div>
          </div>
          <div 
            className={`tool-icon-btn ${selectedTool === 'auto' ? 'active' : ''}`}
            onClick={() => setSelectedTool('auto')}
          >
            <div className="tool-icon">🪄</div>
          </div>
          <div 
            className={`tool-icon-btn ${selectedTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => setSelectedTool('rectangle')}
          >
            <div className="tool-icon">⬜</div>
          </div>
          <div 
            className={`tool-icon-btn ${selectedTool === 'polygon' ? 'active' : ''}`}
            onClick={() => setSelectedTool('polygon')}
          >
            <div className="tool-icon">⬟</div>
          </div>
          <div 
            className={`tool-icon-btn ${selectedTool === 'brush' ? 'active' : ''}`}
            onClick={() => setSelectedTool('brush')}
          >
            <div className="tool-icon">🖌️</div>
          </div>
          <div 
            className={`tool-icon-btn ${selectedTool === 'cube' ? 'active' : ''}`}
            onClick={() => setSelectedTool('cube')}
          >
            <div className="tool-icon">🧊</div>
          </div>
          <div 
            className={`tool-icon-btn ${selectedTool === 'pan' ? 'active' : ''}`}
            onClick={() => setSelectedTool('pan')}
          >
            <div className="tool-icon">✋</div>
          </div>
          <div 
            className="tool-icon-btn"
            onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
          >
            <div className="tool-icon">🔍+</div>
          </div>
          <div 
            className="tool-icon-btn"
            onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))}
          >
            <div className="tool-icon">🔍-</div>
          </div>
          <div className="zoom-level">{Math.round(zoom * 100)}%</div>
        </div>

        {/* Canvas Area */}
        <div className="canvas-container" ref={containerRef}>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="canvas"
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
            onMouseMove={handleMouseMove}
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              cursor: selectedTool === 'pan' ? 'grab' : 'crosshair'
            }}
          />
          
          {/* Selected Annotation Overlay */}
          {selectedAnnotation && (
            <div className="selected-annotation-overlay">
              <div className="annotation-toolbar">
                <button className="annotation-btn">↖</button>
                <button className="annotation-btn">#</button>
                <button className="annotation-btn">👤</button>
                <span className="annotation-label">Person</span>
                <span className="annotation-label">Handbag</span>
              </div>
              <div className="annotation-actions">
                <button 
                  className="action-btn"
                  onClick={() => setSelectedAnnotation(null)}
                >
                  CLEAR
                </button>
                <button className="action-btn">RERUN</button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="right-sidebar">
          <div className="sidebar-section">
            <h3>ANNOTATIONS</h3>
            <div className="annotations-list">
              {labels.map(label => {
                const count = annotations.filter(a => a.labelId === label.id).length;
                return (
                  <div key={label.id} className="annotation-type-item">
                    <div 
                      className="annotation-type-color" 
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="annotation-type-name">{label.name}</span>
                    {count > 0 && <span className="annotation-count">{count}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>TAGS</h3>
            <div className="tags-section">
              <input 
                type="text" 
                placeholder="Type in a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="tag-input"
              />
              <p className="tag-hint">Select a tag or create one</p>
              <div className="tags-list">
                {tags.map(tag => (
                  <div key={tag} className="tag-item">
                    {tag}
                  </div>
                ))}
              </div>
              <button 
                className="create-tag-btn"
                onClick={() => {
                  if (newTag.trim() && !tags.includes(newTag.trim())) {
                    setTags(prev => [...prev, newTag.trim()]);
                    setNewTag('');
                  }
                }}
              >
                Create Tag
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
