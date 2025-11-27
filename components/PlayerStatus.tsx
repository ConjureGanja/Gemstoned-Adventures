import React from 'react';
import type { GameState } from '../types';
import Tooltip from './Tooltip';

interface PlayerStatusProps {
  gameState: GameState | null;
}

const HealthIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

const InventoryIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
);

const SwordIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);


const PlayerStatus: React.FC<PlayerStatusProps> = ({ gameState }) => {
  if (!gameState) return null;

  const healthPercentage = gameState.playerHealth;
  const healthColor = healthPercentage > 60 ? 'bg-green-500' : healthPercentage > 30 ? 'bg-yellow-500' : 'bg-red-500';

  const isInCombat = gameState.combat?.isInCombat;
  const enemyHealth = gameState.combat?.enemyHealth || 0;
  const enemyMax = gameState.combat?.enemyMaxHealth || 100;
  const enemyHealthPct = (enemyHealth / enemyMax) * 100;

  return (
    <div className={`bg-gray-800/60 backdrop-blur-md border ${isInCombat ? 'border-red-500/50 shadow-red-900/20' : 'border-cyan-400/20'} rounded-lg p-4 shadow-lg transition-colors duration-500`}>
      
      {/* Player Health */}
      <div className="mb-6">
        <div className="flex items-center text-lg font-orbitron text-gray-200 mb-2">
            <HealthIcon />
            <span>STATUS</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden border border-gray-600 mb-1">
          <div
            className={`h-full rounded-full transition-all duration-500 ${healthColor}`}
            style={{ width: `${healthPercentage}%` }}
          ></div>
        </div>
        <p className="text-right text-xs font-bold text-gray-400">{healthPercentage} / 100 HP</p>
      </div>

      {/* Enemy Health (Conditional) */}
      {isInCombat && (
         <div className="mb-6 animate-fade-in bg-red-900/20 p-3 rounded-lg border border-red-500/30">
            <div className="flex items-center justify-between text-lg font-orbitron text-red-200 mb-2">
                <div className="flex items-center">
                    <SwordIcon />
                    <span className="truncate max-w-[150px]">{gameState.combat.enemyName}</span>
                </div>
                <span className="text-sm animate-pulse text-red-400">COMBAT ENGAGED</span>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-4 overflow-hidden border border-red-800/50">
            <div
                className="h-full rounded-full transition-all duration-300 bg-red-600"
                style={{ width: `${enemyHealthPct}%` }}
            ></div>
            </div>
             <p className="text-right text-xs font-bold text-red-300 mt-1">{enemyHealth} / {enemyMax} HP</p>
         </div>
      )}

      {/* Inventory */}
      <div>
        <div className="flex items-center text-lg font-orbitron text-gray-200 mb-2">
            <InventoryIcon />
            <span>INVENTORY</span>
        </div>
        <ul className="space-y-2">
          {gameState.inventory.length > 0 ? (
            gameState.inventory.map((item, index) => (
              <li key={index} className="text-cyan-300 text-sm">
                <Tooltip 
                  title={item.type.toUpperCase()} 
                  content={item.description}
                >
                    <span className="cursor-help hover:text-cyan-100 transition-colors border-b border-dashed border-cyan-700 pb-0.5">
                        {item.name}
                    </span>
                </Tooltip>
              </li>
            ))
          ) : (
            <li className="text-gray-500 italic text-sm">Empty</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default PlayerStatus;
