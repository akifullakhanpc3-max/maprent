import React, { useState, useEffect, useRef } from 'react';
import './MapCursor.css';

/**
 * Premium Map Cursor Component
 * Provides high-performance JS-driven cursor animations including scaling,
 * glowing, and drag states that standard CSS cursors cannot achieve.
 */
const MapCursor = () => {
  const cursorRef = useRef(null);
  const [state, setState] = useState('default'); // 'default', 'active', 'pointer'
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    const moveCursor = () => {
      // Smooth interpolation for "premium" feel
      cursorX += (mouseX - cursorX) * 0.25;
      cursorY += (mouseY - cursorY) * 0.25;
      
      if (cursor) {
        // Offset by [12, 10] to align the index finger tip with the hotspot
        cursor.style.transform = `translate3d(${cursorX - 12}px, ${cursorY - 10}px, 0)`;
      }
      requestAnimationFrame(moveCursor);
    };

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Check if we are over the map
      const target = e.target;
      const isOverMap = target.closest('.leaflet-container');
      const isOverInteractive = target.closest('a, button, .leaflet-interactive, [role="button"], .discovery-pill, .action-btn, .zoom-btn, .premium-sidebar-card');

      setIsVisible(!!isOverMap);
      setState(isOverInteractive ? 'pointer' : 'default');
    };

    const onMouseDown = () => setState('active');
    const onMouseUp = (e) => {
      const isOverInteractive = e.target.closest('a, button, .leaflet-interactive, [role="button"]');
      setState(isOverInteractive ? 'pointer' : 'default');
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    
    const animationFrame = requestAnimationFrame(moveCursor);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      ref={cursorRef} 
      className={`custom-map-cursor state-${state}`}
    >
      <div className="cursor-inner">
        {/* The SVG Hand */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {state === 'active' ? (
            /* Grabbing / Closed Hand */
            <path d="M11 20c-1 0-2.5-.5-3.5-1.5L5.5 16s-.5-.5-.5-1c0-1 1-1 1-1s.5 0 1 .5l2.5 2.5V8a1.5 1.5 0 0 1 3 0v4h.5a1.5 1.5 0 0 1 3 0v0a1.5 1.5 0 0 1 3 0v0a1.5 1.5 0 0 1 3 0v6c0 2-2 4-4 4h-5z" fill="#0F172A" stroke="white" strokeWidth="1.5" />
          ) : state === 'pointer' ? (
            /* Pointer (Index Finger) */
            <path d="M12 22v-3.5L10.5 17a6 6 0 01-1.5-3.5V10a2 2 0 114 0v10M12 2V6a2 2 0 104 0v11M16 8a2 2 0 104 0v7.5l-2.5 3c-.5.5-1.5 1-2.5 1h-6.5z" fill="#0F172A" stroke="white" strokeWidth="1.5" />
          ) : (
            /* Default / Open Hand */
            <path d="M10 22v-3.5L8.5 17a6 6 0 01-1.5-3.5V10a2 2 0 014 0v5h1V5a2 2 0 014 0v10h1v-4a2 2 0 014 0v7.5l-2.5 3c-.5.5-1.5 1-2.5 1h-6.5z" fill="#0F172A" stroke="white" strokeWidth="1.5" />
          )}
        </svg>
      </div>
    </div>
  );
};

export default MapCursor;
