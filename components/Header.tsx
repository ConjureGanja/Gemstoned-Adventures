import React from 'react';

interface HeaderProps {
  onNewGame: () => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
  isGameStarted: boolean;
  saveExists: boolean;
}

const Header: React.FC<HeaderProps> = ({ onNewGame, onSaveGame, onLoadGame, isGameStarted, saveExists }) => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-cyan-400/30 p-4 sticky top-0 z-10 flex justify-between items-center shadow-lg shadow-cyan-500/10">
      <h1 className="text-2xl md:text-3xl font-bold text-cyan-300 font-orbitron tracking-widest glitch-text">
        GEMINI ADVENTURE
      </h1>
      <div className="flex items-center space-x-2">
        <button
          onClick={onLoadGame}
          disabled={!saveExists}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          Load Game
        </button>
        {isGameStarted && (
          <>
            <button
              onClick={onSaveGame}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105"
            >
              Save Game
            </button>
            <button
              onClick={onNewGame}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105"
            >
              New Game
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;