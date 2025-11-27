import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import PlayerStatus from './components/PlayerStatus';
import StoryDisplay from './components/StoryDisplay';
import ActionInput from './components/ActionInput';
import LoreDisplay from './components/LoreDisplay';
import MiniMap from './components/MiniMap';
import { getInitialScene, getNextScene, generateSceneImage } from './services/geminiService';
import type { GameState, StoryLogEntry, Location } from './types';

// Updated key to invalidate old saves with incompatible types
const SAVE_GAME_KEY = 'geminiAdventureSave_v3'; 

// Simple Toast Component
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-600 border-green-400',
    error: 'bg-red-600 border-red-400',
    info: 'bg-blue-600 border-blue-400'
  };

  return (
    <div className={`fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg border animate-fade-in z-50 flex items-center`}>
      <span>{message}</span>
    </div>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [storyLog, setStoryLog] = useState<StoryLogEntry[]>([]);
  const [visitedLocations, setVisitedLocations] = useState<Record<string, Location>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [saveExists, setSaveExists] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const savedData = localStorage.getItem(SAVE_GAME_KEY);
    setSaveExists(!!savedData);
  }, [isGameStarted]);

  const saveGameToStorage = useCallback((state: GameState, log: StoryLogEntry[], locations: Record<string, Location>) => {
      const saveData = JSON.stringify({ gameState: state, storyLog: log, visitedLocations: locations });
      localStorage.setItem(SAVE_GAME_KEY, saveData);
      setSaveExists(true);
  }, []);

  const handleSaveGame = useCallback(() => {
    if (gameState && storyLog.length > 0) {
      saveGameToStorage(gameState, storyLog, visitedLocations);
      showToast("Game Manually Saved", "success");
    }
  }, [gameState, storyLog, visitedLocations, saveGameToStorage]);

  const handleLoadGame = useCallback(() => {
    const savedData = localStorage.getItem(SAVE_GAME_KEY);
    if (savedData) {
      try {
        const { gameState: savedGameState, storyLog: savedStoryLog, visitedLocations: savedLocs } = JSON.parse(savedData);
        setGameState(savedGameState);
        setStoryLog(savedStoryLog);
        setVisitedLocations(savedLocs || {}); 
        setIsGameStarted(true);
        showToast("Game Loaded Successfully", "success");
      } catch (e) {
        console.error(e);
        showToast("Failed to load save file (Incompatible version)", "error");
      }
    } else {
      showToast("No saved game found", "error");
    }
  }, []);

  // Helper to handle visual updates (images) separately from text updates
  const handleSceneImageUpdate = async (newState: GameState, isNewLocation: boolean) => {
    if (isNewLocation) {
        // Generate image in background
        const imageUrl = await generateSceneImage(newState.sceneDescription);
        if (imageUrl) {
            setGameState(prevState => {
                if (!prevState) return null;
                const updatedState = { ...prevState, sceneImage: imageUrl };
                // Update the last log entry with the image state so it persists
                setStoryLog(prevLog => {
                    const newLog = [...prevLog];
                    if (newLog.length > 0 && newLog[newLog.length - 1].type === 'gemini') {
                        newLog[newLog.length - 1].state = updatedState;
                    }
                    return newLog;
                });
                return updatedState;
            });
        }
    } else {
        // Keep previous image if exists and we are in same location or just interacting
        setGameState(prevState => {
            if (!prevState) return newState;
             if (prevState.sceneImage && !newState.sceneImage && 
                 prevState.location.x === newState.location.x && 
                 prevState.location.y === newState.location.y) {
                 return { ...newState, sceneImage: prevState.sceneImage };
             }
             return newState;
        });
    }
  };

  const handleNewGame = useCallback(() => {
    const confirmNew = isGameStarted ? window.confirm("Are you sure? Unsaved progress will be lost.") : true;
    if (!confirmNew) return;

    setIsLoading(true);
    setIsGameStarted(true);
    setStoryLog([]);
    setGameState(null);
    setVisitedLocations({});
    localStorage.removeItem(SAVE_GAME_KEY);
    setSaveExists(false);

    const startGame = async () => {
      const initialGameState = await getInitialScene();
      
      // Initial Image Generation
      const imageUrl = await generateSceneImage(initialGameState.sceneDescription);
      if (imageUrl) initialGameState.sceneImage = imageUrl;

      setGameState(initialGameState);
      
      const initialLocs = { [`${initialGameState.location.x},${initialGameState.location.y}`]: initialGameState.location };
      setVisitedLocations(initialLocs);

      setStoryLog([{
        id: Date.now(),
        type: 'gemini',
        text: initialGameState.sceneDescription,
        state: initialGameState
      }]);
      setIsLoading(false);
      
      saveGameToStorage(initialGameState, [{
        id: Date.now(),
        type: 'gemini',
        text: initialGameState.sceneDescription,
        state: initialGameState
      }], initialLocs);
    };
    startGame();
  }, [isGameStarted, saveGameToStorage]);

  const handlePlayerAction = useCallback(async (action: string) => {
    if (isLoading || gameState?.isGameOver) return;

    setIsLoading(true);

    const newPlayerEntry: StoryLogEntry = {
      id: Date.now(),
      type: 'player',
      text: action,
    };
    
    const updatedStoryLog = [...storyLog, newPlayerEntry];
    setStoryLog(updatedStoryLog);

    const newGameState = await getNextScene(updatedStoryLog, action);
    
    // Check if location is new
    const locKey = `${newGameState.location.x},${newGameState.location.y}`;
    const isNewLocation = !visitedLocations[locKey];

    // Initial state set (text only first)
    setGameState(newGameState);
    
    // Update Map
    const newLocs = { ...visitedLocations, [locKey]: newGameState.location };
    setVisitedLocations(newLocs);

    const newGeminiEntry: StoryLogEntry = {
      id: Date.now() + 1,
      type: 'gemini',
      text: newGameState.sceneDescription,
      state: newGameState
    };

    const finalStoryLog = [...updatedStoryLog, newGeminiEntry];
    setStoryLog(finalStoryLog);
    setIsLoading(false);
    saveGameToStorage(newGameState, finalStoryLog, newLocs);

    // Trigger image generation asynchronously
    handleSceneImageUpdate(newGameState, isNewLocation);

  }, [isLoading, gameState, storyLog, visitedLocations, saveGameToStorage]);

  return (
    <div className={`h-screen w-screen flex flex-col relative overflow-hidden ${gameState?.visualEffect === 'shake' ? 'animate-shake' : ''} ${gameState?.visualEffect === 'flash_red' ? 'animate-flash-red' : ''} ${gameState?.visualEffect === 'flash_white' ? 'animate-flash-white' : ''}`}>
       {/* Background Grid handled in global CSS */}
       <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900 pointer-events-none z-0"></div>

      <Header 
        onNewGame={handleNewGame} 
        onSaveGame={handleSaveGame}
        onLoadGame={handleLoadGame}
        isGameStarted={isGameStarted}
        saveExists={saveExists}
      />
      <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-hidden z-10">
        {!isGameStarted ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse">
                GEMSTONED ADVENTURES
            </h2>
            <p className="text-lg md:text-xl text-cyan-100/80 mb-8 max-w-2xl font-light tracking-wide leading-relaxed">
              Survive the psychedelic crystalline apocalypse. <br/> 
              Every choice echoes in the code of Veridia.
            </p>
            <div className="flex gap-4">
                <button
                onClick={handleNewGame}
                disabled={isLoading}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-10 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] disabled:opacity-50"
                >
                {isLoading ? 'Initializing...' : 'Begin Journey'}
                </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 flex flex-col gap-4 h-full max-h-full overflow-hidden">
              <StoryDisplay storyLog={storyLog} isLoading={isLoading} />
              <ActionInput onAction={handlePlayerAction} isLoading={isLoading} gameState={gameState} />
            </div>
            <div className="lg:col-span-1 h-full overflow-y-auto custom-scrollbar flex flex-col gap-6">
                {gameState && (
                    <MiniMap 
                        currentLocation={gameState.location} 
                        visitedLocations={visitedLocations} 
                    />
                )}
                <PlayerStatus gameState={gameState} />
                <LoreDisplay lore={gameState?.lore} />
            </div>
          </div>
        )}
      </main>
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default App;