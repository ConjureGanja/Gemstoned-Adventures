import React, { useRef, useEffect, useState } from 'react';
import type { StoryLogEntry } from '../types';

interface StoryDisplayProps {
  storyLog: StoryLogEntry[];
  isLoading: boolean;
}

const StoryDisplay: React.FC<StoryDisplayProps> = ({ storyLog, isLoading }) => {
    const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [effectClass, setEffectClass] = useState('');
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
        
        if (storyLog.length > 0) {
            const lastEntry = storyLog[storyLog.length - 1];
            
            // Handle Visual Effects
            if (lastEntry.type === 'gemini' && lastEntry.state?.visualEffect) {
                const effect = lastEntry.state.visualEffect;
                let className = '';
                
                switch(effect) {
                    case 'shake': className = 'animate-shake'; break;
                    case 'glitch': className = 'animate-glitch-container'; break;
                    case 'flash_red': className = 'animate-flash-red'; break;
                    case 'flash_white': className = 'animate-flash-white'; break;
                    case 'particles_combat': className = 'animate-pulse-fast'; break; // Simple fallback if not using canvas
                    default: className = '';
                }

                if (className) {
                    setEffectClass(className);
                    const timer = setTimeout(() => setEffectClass(''), 800);
                    return () => clearTimeout(timer);
                }
            }

            // Handle Image Update
            if (lastEntry.type === 'gemini' && lastEntry.state?.sceneImage) {
                setCurrentImage(lastEntry.state.sceneImage);
            }
        }
    }, [storyLog, isLoading]);

  return (
    <div 
        ref={containerRef}
        className={`flex-grow relative bg-black/80 rounded-lg overflow-hidden border border-cyan-400/20 shadow-2xl ${effectClass}`}
    >
      {/* Background Image Layer */}
      {currentImage && (
          <div 
            className="absolute inset-0 z-0 opacity-40 transition-opacity duration-1000"
            style={{ 
                backgroundImage: `url(${currentImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(2px) brightness(0.7)'
            }}
          >
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
          </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10 h-full overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="space-y-6">
            {storyLog.map((entry) => (
            <div key={entry.id}>
                {entry.type === 'player' ? (
                <div className="flex justify-end">
                    <p className="max-w-xl bg-cyan-800/80 backdrop-blur-sm text-cyan-100 p-3 rounded-lg rounded-br-none shadow-md italic border-l-4 border-cyan-500">
                    &gt; {entry.text}
                    </p>
                </div>
                ) : (
                <div className="max-w-full bg-gray-900/80 backdrop-blur-md border border-cyan-900/50 text-gray-200 rounded-lg shadow-md animate-fade-in group hover:border-cyan-700/50 transition-colors">
                    <div className="px-4 py-2 bg-black/40 rounded-t-lg border-b border-cyan-900/50 flex justify-between items-center">
                    <p className="font-orbitron text-sm text-cyan-400 tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
                        SYSTEM LOG
                    </p>
                    {entry.state?.combat?.isInCombat && (
                        <span className="text-xs font-bold text-red-500 px-2 py-0.5 border border-red-500/30 rounded bg-red-900/20 animate-pulse">COMBAT ENGAGED</span>
                    )}
                    </div>
                    
                    {/* Inline Scene Image for specific logs if we wanted to show it in the flow, currently used as bg */}
                    
                    <div className="p-4">
                        {/* Scene Description */}
                        <div className="prose prose-invert prose-p:text-gray-200 mb-4 font-light tracking-wide text-lg shadow-black drop-shadow-md">
                            {entry.state?.sceneDescription.split('\n').map((paragraph, index) => (
                                <p key={index} className="mb-2 last:mb-0 leading-relaxed">{paragraph}</p>
                            ))}
                        </div>
                        
                        {/* Combat Log Section */}
                        {entry.state?.combat?.combatLog && (
                            <div className="mt-3 p-3 bg-red-950/40 border-l-2 border-red-500 rounded-r text-sm text-red-200 italic relative overflow-hidden">
                                <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                                <span className="relative font-bold text-red-400 not-italic mr-2">[COMBAT]</span>
                                <span className="relative">{entry.state.combat.combatLog}</span>
                            </div>
                        )}
                    </div>
                </div>
                )}
            </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && storyLog.length > 0 && storyLog[storyLog.length - 1]?.type === 'player' && (
            <div className="flex justify-start">
                <div className="max-w-full bg-gray-800/70 text-gray-400 p-4 rounded-lg rounded-bl-none shadow-md flex items-center space-x-3 border border-gray-700">
                    <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    </div>
                    <span className="italic font-mono text-sm">Synthesizing reality...</span>
                </div>
            </div>
            )}
            
            {/* Welcome Message */}
            {storyLog.length === 0 && !isLoading && (
                <div className="text-center text-gray-500 italic mt-10">
                    <p className="mb-2">Initialize synchronization...</p>
                    <p className="text-sm">Press "Begin Journey"</p>
                </div>
            )}
            <div ref={endOfMessagesRef} />
        </div>
      </div>
    </div>
  );
};

export default StoryDisplay;