import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  title?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, title, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
     if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX + (rect.width / 2)
      });
    }
  }

  const handleMouseEnter = () => {
    updatePosition();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };
  
  // Update position on scroll to keep tooltip attached if the user scrolls while hovering
  useEffect(() => {
    if (isVisible) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  const tooltipContent = (
    <div 
      className="fixed z-[9999] w-72 pointer-events-none"
      style={{ 
        top: position.top, 
        left: position.left,
        transform: 'translate(-50%, -100%) translateY(-10px)' // Center and move up
      }}
    >
        <div className="bg-gray-900/95 border border-cyan-500/50 rounded-lg shadow-[0_0_15px_rgba(8,145,178,0.3)] p-3 animate-fade-in backdrop-blur-sm relative text-left">
            {title && (
                <div className="font-orbitron text-cyan-300 text-sm font-bold mb-1 border-b border-cyan-500/30 pb-1">
                {title}
                </div>
            )}
            <div className="text-xs text-gray-300 leading-relaxed break-words">
                {content}
            </div>
            
            {/* Arrow pointing down */}
            <div className="absolute left-1/2 bottom-[-6px] w-3 h-3 bg-gray-900/95 border-b border-r border-cyan-500/50 transform rotate-45 -translate-x-1/2"></div>
        </div>
    </div>
  );

  return (
    <>
      <div 
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {isVisible && createPortal(tooltipContent, document.body)}
    </>
  );
};

export default Tooltip;