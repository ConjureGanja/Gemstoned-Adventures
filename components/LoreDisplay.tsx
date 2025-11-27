import React from 'react';
import type { LoreEntry } from '../types';
import Tooltip from './Tooltip';

interface LoreDisplayProps {
  lore: LoreEntry[] | undefined;
}

const LoreIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18M5.47 5.47a9 9 0 0113.06 0M5.47 18.53a9 9 0 0113.06 0" />
    </svg>
);

const LoreDisplay: React.FC<LoreDisplayProps> = ({ lore }) => {
  return (
    <div className="bg-gray-800/60 backdrop-blur-md border border-cyan-400/20 rounded-lg p-4 shadow-lg flex-grow overflow-hidden flex flex-col min-h-[200px]">
      <div className="flex items-center text-lg font-orbitron text-gray-200 mb-2 flex-shrink-0">
        <LoreIcon />
        <span>LORE DATABASE</span>
      </div>
      <div className="text-purple-200 overflow-y-auto pr-2 custom-scrollbar flex-grow space-y-2">
        {lore && lore.length > 0 ? (
          lore.map((entry) => (
            <div key={entry.id} className="bg-purple-900/10 p-2 rounded border border-purple-500/20 hover:border-purple-400/50 transition-colors">
                 <Tooltip 
                    title={entry.topic}
                    content={entry.details}
                 >
                    <div className="cursor-help">
                        <h4 className="font-bold text-sm text-purple-300">{entry.topic}</h4>
                        <p className="text-xs text-purple-200/70 line-clamp-2">{entry.summary}</p>
                    </div>
                 </Tooltip>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic text-sm">Secrets of this world remain hidden.</p>
        )}
      </div>
    </div>
  );
};

export default LoreDisplay;
