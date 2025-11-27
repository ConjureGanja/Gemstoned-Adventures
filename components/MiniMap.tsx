import React from 'react';
import type { Location } from '../types';
import Tooltip from './Tooltip';

interface MiniMapProps {
  currentLocation: Location;
  visitedLocations: Record<string, Location>;
}

const CELL_SIZE = 24;
const GRID_RANGE = 3; // How many cells to show in each direction (3 means 7x7 grid)
const VIEWPORT_SIZE = (GRID_RANGE * 2 + 1) * CELL_SIZE;

const MiniMap: React.FC<MiniMapProps> = ({ currentLocation, visitedLocations }) => {
  const gridCells = [];

  for (let dy = GRID_RANGE; dy >= -GRID_RANGE; dy--) {
    for (let dx = -GRID_RANGE; dx <= GRID_RANGE; dx++) {
      const x = currentLocation.x + dx;
      const y = currentLocation.y + dy;
      const key = `${x},${y}`;
      const location = visitedLocations[key];
      const isCurrent = dx === 0 && dy === 0;

      if (location) {
        let bgColor = 'bg-gray-800';
        let borderColor = 'border-gray-700';

        if (isCurrent) {
            bgColor = 'bg-cyan-500';
            borderColor = 'border-cyan-300';
        } else if (location.environment === 'forest') {
            bgColor = 'bg-green-900/50';
            borderColor = 'border-green-700/50';
        } else if (location.environment === 'ruins') {
            bgColor = 'bg-stone-800';
            borderColor = 'border-stone-600';
        } else if (location.environment === 'tech') {
            bgColor = 'bg-purple-900/50';
            borderColor = 'border-purple-600/50';
        }

        gridCells.push(
          <div
            key={key}
            className="absolute transition-all duration-500"
            style={{
              left: (dx + GRID_RANGE) * CELL_SIZE,
              top: (GRID_RANGE - dy) * CELL_SIZE, // Invert Y because screen Y is down
              width: CELL_SIZE - 4, // Gap
              height: CELL_SIZE - 4, // Gap
            }}
          >
             <Tooltip 
                title={location.name}
                content={
                    <span>
                        <span className="block italic text-gray-400 text-[10px] mb-1">({x}, {y})</span>
                        {location.description}
                    </span>
                }
             >
                <div className={`w-full h-full rounded-sm border ${bgColor} ${borderColor} ${isCurrent ? 'animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'hover:bg-gray-700 cursor-help'}`}>
                </div>
             </Tooltip>
          </div>
        );
      } else {
        // Empty placeholder
        gridCells.push(
           <div
            key={`empty-${dx}-${dy}`}
            className="absolute"
            style={{
              left: (dx + GRID_RANGE) * CELL_SIZE,
              top: (GRID_RANGE - dy) * CELL_SIZE,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
            }}
          >
             <div className="w-full h-full rounded-sm bg-gray-900/30 border border-gray-800/30"></div>
          </div>
        );
      }
    }
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-md border border-cyan-400/20 rounded-lg p-4 shadow-lg flex flex-col items-center">
        <div className="flex items-center text-sm font-orbitron text-cyan-400 mb-3 w-full border-b border-cyan-900/50 pb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" />
            </svg>
            SECTOR MAP
            <span className="ml-auto text-xs text-gray-500 font-mono">
                {currentLocation.x}, {currentLocation.y}
            </span>
        </div>
        <div 
            className="relative overflow-hidden bg-black/40 rounded border border-gray-800 shadow-inner"
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
        >
            {gridCells}
        </div>
        <div className="text-center mt-2">
            <p className="text-xs font-bold text-gray-300">{currentLocation.name}</p>
        </div>
    </div>
  );
};

export default MiniMap;
