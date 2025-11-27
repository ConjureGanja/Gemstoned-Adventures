
import React, { useState } from 'react';
import type { GameState } from '../types';

interface ActionInputProps {
  onAction: (action: string) => void;
  isLoading: boolean;
  gameState: GameState | null;
}

const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-300"></div>
  </div>
);

const ActionInput: React.FC<ActionInputProps> = ({ onAction, isLoading, gameState }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onAction(inputValue.trim());
      setInputValue('');
    }
  };

  const handleSuggestionClick = (action: string) => {
    if (!isLoading) {
      onAction(action);
    }
  };
  
  const isGameOver = gameState?.isGameOver ?? false;

  return (
    <div className="p-4 bg-gray-800/60 backdrop-blur-md border-t border-cyan-400/20 rounded-b-lg">
      {isGameOver ? (
        <div className="text-center p-4">
            <h3 className="text-2xl font-bold text-red-400 font-orbitron">GAME OVER</h3>
            <p className="text-gray-300 mt-2">{gameState?.gameOverMessage}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {gameState?.suggestedActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(action)}
                disabled={isLoading}
                className="bg-gray-700 text-cyan-200 hover:bg-cyan-700 hover:text-white font-semibold py-2 px-4 border border-cyan-700 rounded-full shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {action}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What do you do next?"
                disabled={isLoading}
                className="w-full bg-gray-900 border-2 border-cyan-500 rounded-full py-3 pl-5 pr-28 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:opacity-50"
              />
              {isLoading && <LoadingSpinner />}
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="absolute inset-y-0 right-0 m-1.5 bg-cyan-600 text-white font-bold rounded-full px-6 transition-all duration-300 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ActionInput;