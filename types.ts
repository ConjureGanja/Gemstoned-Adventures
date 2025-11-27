export interface CombatState {
  isInCombat: boolean;
  enemyName: string;
  enemyHealth: number;
  enemyMaxHealth: number;
  combatLog: string;
}

export interface InventoryItem {
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest' | 'misc';
}

export interface LoreEntry {
  id: string; // Unique ID for the key
  topic: string;
  summary: string;
  details: string;
}

export interface Location {
  name: string;
  x: number;
  y: number;
  description: string;
  environment: 'forest' | 'ruins' | 'city' | 'tech' | 'cave' | 'plains' | 'indoor' | 'other';
}

export interface GameState {
  sceneDescription: string;
  location: Location;
  inventory: InventoryItem[];
  playerHealth: number;
  suggestedActions: string[];
  isGameOver: boolean;
  gameOverMessage: string;
  lore: LoreEntry[];
  combat: CombatState;
  visualEffect: 'none' | 'shake' | 'glitch' | 'flash_red' | 'flash_white' | 'particles_combat';
  sceneImage?: string; // Base64 data URI or URL
}

export interface StoryLogEntry {
  id: number;
  type: 'player' | 'gemini';
  text: string;
  state?: GameState;
}