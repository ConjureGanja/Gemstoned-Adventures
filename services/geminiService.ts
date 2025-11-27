import { GoogleGenAI, Type } from "@google/genai";
import type { GameState, StoryLogEntry } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    sceneDescription: {
      type: Type.STRING,
      description: "A detailed, immersive description of the current scene. Focus on sensory details."
    },
    location: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Short name of current location (e.g. 'Crystal Plaza')." },
        x: { type: Type.INTEGER, description: "X Coordinate. East is +x, West is -x." },
        y: { type: Type.INTEGER, description: "Y Coordinate. North is +y, South is -y." },
        description: { type: Type.STRING, description: "Very brief description for a map tooltip." },
        environment: { 
          type: Type.STRING, 
          enum: ['forest', 'ruins', 'city', 'tech', 'cave', 'plains', 'indoor', 'other'],
          description: "The type of environment for visual representation."
        }
      },
      required: ["name", "x", "y", "description", "environment"]
    },
    inventory: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING, description: "Flavor text for the item." },
          type: { type: Type.STRING, enum: ['weapon', 'armor', 'consumable', 'quest', 'misc'] }
        },
        required: ["name", "description", "type"]
      },
      description: "List of items carried."
    },
    playerHealth: { type: Type.INTEGER },
    combat: {
      type: Type.OBJECT,
      properties: {
        isInCombat: { type: Type.BOOLEAN },
        enemyName: { type: Type.STRING },
        enemyHealth: { type: Type.INTEGER },
        enemyMaxHealth: { type: Type.INTEGER },
        combatLog: { type: Type.STRING }
      },
      required: ["isInCombat", "enemyName", "enemyHealth", "enemyMaxHealth", "combatLog"]
    },
    visualEffect: {
      type: Type.STRING,
      enum: ["none", "shake", "glitch", "flash_red", "flash_white", "particles_combat"]
    },
    suggestedActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactly 3 suggested actions."
    },
    isGameOver: { type: Type.BOOLEAN },
    gameOverMessage: { type: Type.STRING },
    lore: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING, description: "Unique short ID like 'origin_story'" },
                topic: { type: Type.STRING, description: "Title of the lore entry" },
                summary: { type: Type.STRING, description: "Short summary" },
                details: { type: Type.STRING, description: "Full detailed lore text" }
            },
            required: ["id", "topic", "summary", "details"]
        },
        description: "Cumulative knowledge base."
    }
  },
  required: ["sceneDescription", "location", "inventory", "playerHealth", "combat", "visualEffect", "suggestedActions", "isGameOver", "gameOverMessage", "lore"]
};

const WORLD_CODEX = `
This game is set in a persistent, shared world called Veridia.
CORE CONCEPT: Veridia is a post-cataclysmic world where hyper-advanced, crystalline technology ('Gem-Tech') has overgrown nature, creating a psychedelic and dangerous landscape.
KEY FACTIONS:
- The Chromatic Cult: Worshippers of Gem-Tech.
- The Rust-Scrappers: Hardy survivors who salvage old-world tech.
MAJOR LANDMARK: The Singing Spire.
LEGENDARY ITEM: The Prism Key.
RECURRING NPC: The Archivist (glitching android).
`;

const getInitialPrompt = (): string => `
You are a Dungeon Master for a text-based RPG.
WORLD CODEX: ${WORLD_CODEX}

TASK: Generate the first scene. Player wakes up with amnesia in Veridia.
- Coordinates: Start at x=0, y=0.
- Visuals: Use the 'visualEffect' field. Use 'glitch' for the opening.
- Combat: Starts with 'isInCombat': false.
- Health: 100. Inventory: Empty.
- Respond strictly in JSON.
`;

const getNextScenePrompt = (storyLog: StoryLogEntry[], playerAction: string): string => {
  const history = storyLog
    .filter(entry => entry.type === 'gemini')
    .map(entry => `Scene: ${entry.state?.sceneDescription}\nCombat Log: ${entry.state?.combat?.combatLog || 'None'}`)
    .slice(-3)
    .join('\n---\n');

  const lastState = storyLog.filter(e => e.type === 'gemini' && e.state).pop()?.state;
  const health = lastState?.playerHealth ?? 100;
  
  // Fallback for inventory/lore if they are from old save format
  const inventory = Array.isArray(lastState?.inventory) ? lastState?.inventory.map(i => i.name).join(', ') : "";
  const currentLoreCount = Array.isArray(lastState?.lore) ? lastState?.lore.length : 0;
  const combatState = lastState?.combat;
  
  // Coordinate tracking logic prompt
  const currentX = lastState?.location?.x ?? 0;
  const currentY = lastState?.location?.y ?? 0;

  return `
You are a Dungeon Master.
WORLD CODEX: ${WORLD_CODEX}

CURRENT STATUS:
Location: ${lastState?.location?.name} (x:${currentX}, y:${currentY})
Health: ${health}
Inventory Items: [${inventory}]
Lore Entries Known: ${currentLoreCount}
Combat Status: ${combatState?.isInCombat ? `Fighting ${combatState.enemyName} (${combatState.enemyHealth}/${combatState.enemyMaxHealth} HP)` : "Not in combat"}

STORY HISTORY (Last 3 turns):
${history}

PLAYER ACTION: "${playerAction}"

LOGIC & RULES:
1. MAPPING:
   - Track player movement on a grid.
   - If action implies moving North, y = y + 1. South, y = y - 1.
   - If action implies moving East, x = x + 1. West, x = x - 1.
   - If no movement, keep x, y same.
   - Return new coordinates in 'location' object.

2. COMBAT SYSTEM:
   - Manage 'combat' object state. Calculate damage reasonably.
   - If a fight starts or damage is taken, use 'visualEffect': 'shake' or 'flash_red'.
   - If an enemy is defeated, use 'particles_combat'.

3. INVENTORY & LORE:
   - Return the FULL list of inventory and lore (cumulative). 
   - New items/lore should be added to the list. 
   - Inventory items need 'name', 'description', 'type'.
   - Lore needs 'topic', 'summary', 'details'.

Respond strictly in JSON.
`;
};

const generateGameContent = async (prompt: string): Promise<GameState> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.85,
        topP: 0.95,
      },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as GameState;
  } catch (error) {
    console.error("Error generating game content:", error);
    // Return a safe error state
    return {
      sceneDescription: "The connection to the Gem-Tech network has been severed. (API Error)",
      location: { name: "Error Void", x: 0, y: 0, description: "Unknown", environment: "other" },
      inventory: [],
      playerHealth: 0,
      suggestedActions: [],
      isGameOver: true,
      gameOverMessage: "Connection error.",
      lore: [],
      combat: { isInCombat: false, enemyName: "", enemyHealth: 0, enemyMaxHealth: 0, combatLog: "" },
      visualEffect: "glitch"
    };
  }
};

export const generateSceneImage = async (description: string): Promise<string | undefined> => {
  try {
    // Guidelines: Use gemini-2.5-flash-image for general image generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Generate a high quality, cinematic, sci-fi fantasy concept art image for a text RPG location. Atmosphere: Psychedelic, Crystalline, Ancient Tech. Description: ${description}` }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (error) {
    console.error("Error generating scene image:", error);
    return undefined;
  }
};

export const getInitialScene = async (): Promise<GameState> => {
  const prompt = getInitialPrompt();
  return generateGameContent(prompt);
};

export const getNextScene = async (storyLog: StoryLogEntry[], playerAction: string): Promise<GameState> => {
  const prompt = getNextScenePrompt(storyLog, playerAction);
  return generateGameContent(prompt);
};