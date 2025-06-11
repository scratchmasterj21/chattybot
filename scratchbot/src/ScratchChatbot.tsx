import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Bot, User, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Options } from 'react-markdown';

// --- Scratchblocks Integration ---
import scratchblocks from 'scratchblocks';

// --- Constants ---
const STORAGE_KEY = 'scratchbot_sessions';
const MAX_HISTORY_MESSAGES = 10;
const SESSION_TITLE_MAX_LENGTH = 30;

const SUGGESTION_PROMPTS = [
  // Basic Scratch Concepts (1-25)
  "How do I make a sprite move?",
  "How can I create a simple game?",
  "What are variables in Scratch?",
  "How do I add sound effects?",
  "How do I make my sprite change costumes?",
  "How can I create a drawing program?",
  "What are loops and how do I use them?",
  "How do I detect when sprites touch?",
  "How can I make a quiz game?",
  "How do I use the pen blocks?",
  "How can I make my sprite follow the mouse?",
  "What are custom blocks and how do I make them?",
  "How do I make a sprite bounce off walls?",
  "How do I use the broadcast blocks?",
  "What are lists in Scratch and how do I use them?",
  "How do I create animations with my sprite?",
  "What are clones and how do I use them?",
  "How do I make sprites talk to each other?",
  "How can I use if-then statements?",
  "How do I make random events happen?",
  "How can I use the timer in my project?",
  "How do I make sprites appear and hide?",
  "How can I change sprite size?",
  "How do I use coordinate positions?",
  "How can I make sprites spin or rotate?",

  // Classic Games (26-65)
  "How do I make a Pong game?",
  "How can I make a Flappy Bird clone?",
  "How do I create a Snake game?",
  "How can I make a Pac-Man style game?",
  "How do I create a Tetris-like puzzle game?",
  "How can I make a whack-a-mole game?",
  "How can I make a basketball shooting game?",
  "How do I create a space invaders game?",
  "How can I make a fruit catching game?",
  "How do I create a crossy road game?",
  "How can I make a simple fighting game?",
  "How do I create a cooking game?",
  "How can I make an endless runner?",
  "How do I create a card matching game?",
  "How can I make a word guessing game?",
  "How do I create a treasure hunt game?",
  "How can I make a zombie dodge game?",
  "How do I create a fish feeding game?",
  "How can I make a garden clicking game?",
  "How do I create a simple slot machine?",
  "How can I make a reaction time game?",
  "How do I create a color matching game?",
  "How can I make a typing practice game?",
  "How do I create a breakout game?",
  "How can I make a pinball game?",
  "How do I create a mini golf game?",
  "How can I make a platformer game?",
  "How do I create a racing game?",
  "How can I make a maze game?",
  "How do I create a jumping game?",
  "How can I make a simple RPG battle system?",
  "How do I create a tower defense game?",
  "How can I make a rhythm tapping game?",
  "How do I create a memory sequence game?",
  "How can I make a trivia game?",
  "How do I create a bingo game?",
  "How can I make a tic-tac-toe game?",
  "How do I create a connect four game?",
  "How can I make a rock paper scissors game?",
  "How do I create a dice rolling game?",

  // Interactive Stories & Presentations (66-85)
  "How can I create a story with multiple scenes?",
  "How do I make characters have conversations?",
  "How can I create a choose-your-own adventure?",
  "How do I make animated presentations?",
  "How can I create a virtual tour?",
  "How do I make an interactive timeline?",
  "How can I create a digital book?",
  "How do I make a puppet show?",
  "How can I create a news report simulation?",
  "How do I make an interview simulator?",
  "How can I create a virtual museum?",
  "How do I make a guided story?",
  "How can I create scene transitions?",
  "How do I make characters express emotions?",
  "How can I add narration to my story?",
  "How do I create multiple story endings?",
  "How can I make interactive characters?",
  "How do I create a virtual pet story?",
  "How can I make a fairy tale retelling?",
  "How do I create a science fiction story?",

  // Educational Games & Tools (86-115)
  "How do I create a math quiz game?",
  "How can I make a times table practice?",
  "How do I create a spelling game?",
  "How can I make a geography quiz?",
  "How do I create a science quiz?",
  "How can I make a history timeline game?",
  "How do I create a fraction practice game?",
  "How can I make a counting game for kids?",
  "How do I create an alphabet learning game?",
  "How can I make a shape recognition game?",
  "How do I create a color learning game?",
  "How can I make a pattern matching game?",
  "How do I create a sorting game?",
  "How can I make a size comparison game?",
  "How do I create a matching pairs game?",
  "How can I make a memory training game?",
  "How do I create a logic puzzle game?",
  "How can I make a word building game?",
  "How do I create a rhyming game?",
  "How can I make a phonics game?",
  "How do I create a vocabulary game?",
  "How can I make a grammar practice game?",
  "How do I create a reading comprehension quiz?",
  "How can I make a language learning game?",
  "How do I create a periodic table quiz?",
  "How can I make a solar system model?",
  "How do I create a body parts quiz?",
  "How can I make a food groups game?",
  "How do I create an animal classification game?",
  "How can I make a weather patterns game?",

  // Art & Creativity Tools (116-135)
  "How do I create a drawing program?",
  "How can I make a paint application?",
  "How do I create a pattern maker?",
  "How can I make a digital sketchpad?",
  "How do I create a stamp tool?",
  "How can I make a kaleidoscope?",
  "How do I create a spirograph?",
  "How can I make a pixel art editor?",
  "How do I create a mandala maker?",
  "How can I make a symmetry drawing tool?",
  "How do I create a color palette tool?",
  "How can I make a virtual coloring book?",
  "How do I create a texture maker?",
  "How can I make a shape generator?",
  "How do I create a fractal drawer?",
  "How can I make a graffiti simulator?",
  "How do I create a sand art simulator?",
  "How can I make a fireworks drawer?",
  "How do I create a constellation maker?",
  "How can I make a face maker tool?",

  // Music & Sound Projects (136-150)
  "How do I create a piano keyboard?",
  "How can I make a drum machine?",
  "How do I create a music box?",
  "How can I make a sound mixer?",
  "How do I create a xylophone?",
  "How can I make a guitar simulator?",
  "How do I create a beat maker?",
  "How can I make musical sequences?",
  "How do I create sound effects?",
  "How can I make a DJ mixing board?",
  "How do I create a music memory game?",
  "How can I make singing sprites?",
  "How do I create a rhythm game?",
  "How can I make sound-reactive animations?",
  "How do I create a jukebox?",

  // Animation & Visual Effects (151-180)
  "How do I make a scrolling background?",
  "How can I create simple particle effects?",
  "How do I make sprites fade in and out?",
  "How can I make a sprite follow a path?",
  "How do I create smooth movement?",
  "How can I make sprites cast simple shadows?",
  "How do I create day and night effects?",
  "How can I make simple water animations?",
  "How do I create fire animations?",
  "How can I make sprites glow?",
  "How do I create lightning effects?",
  "How can I make rain animations?",
  "How do I create snow effects?",
  "How can I make sprites leave trails?",
  "How do I create screen shake effects?",
  "How can I make text appear gradually?",
  "How do I create simple explosions?",
  "How can I make bouncing animations?",
  "How do I create morphing effects?",
  "How can I make sprites stretch?",
  "How do I create spinning animations?",
  "How can I make floating effects?",
  "How do I create pulsing animations?",
  "How can I make zoom effects?",
  "How do I create teleport effects?",
  "How can I make slide transitions?",
  "How do I create ripple effects?",
  "How can I make growing animations?",
  "How do I create wave movements?",
  "How can I make falling animations?",

  // Utility & Simple Tools (181-210)
  "How can I make a simple calculator?",
  "How do I create a digital clock?",
  "How can I make a countdown timer?",
  "How do I create a stopwatch?",
  "How can I make a random name picker?",
  "How do I create a password generator?",
  "How can I make a fortune teller?",
  "How do I create a magic 8-ball?",
  "How can I make a dice roller?",
  "How do I create a coin flipper?",
  "How can I make a random quote generator?",
  "How do I create a joke generator?",
  "How can I make a name generator?",
  "How do I create a color picker?",
  "How can I make a mood tracker?",
  "How do I create a simple survey?",
  "How can I make a rating system?",
  "How do I create a voting simulator?",
  "How can I make a temperature converter?",
  "How do I create a tip calculator?",
  "How can I make a grade calculator?",
  "How do I create a BMI calculator?",
  "How can I make a unit converter?",
  "How do I create a simple calendar?",
  "How can I make an alarm simulator?",
  "How do I create a habit tracker?",
  "How can I make a simple to-do list?",
  "How do I create a workout timer?",
  "How can I make a meditation timer?",
  "How do I create a reminder system?",

  // Simulation & Interactive Demos (211-225)
  "How do I create a virtual pet?",
  "How can I make a fish tank simulator?",
  "How do I create a garden growing game?",
  "How can I make a weather simulator?",
  "How do I create a traffic simulation?",
  "How can I make a crowd simulation?",
  "How do I create a bouncing balls demo?",
  "How can I make a gravity simulation?",
  "How do I create a pendulum simulation?",
  "How can I make a solar system model?",
  "How do I create a ecosystem game?",
  "How can I make a life simulation?",
  "How do I create a city builder?",
  "How can I make a farm simulator?",
  "How do I create a restaurant game?",
  "What's next?"
];


// --- Interfaces (Fully Typed) ---
interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

interface StoredSessions {
  sessions: ChatSession[];
  lastUpdated: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface GeminiErrorResponse {
  error?: {
    message: string;
  };
}

// --- Helper Functions ---
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createInitialMessage = (): Message => ({
  id: Date.now(),
  text: "Hi! 🐱 I'm your Scratch helper! Ask me anything!",
  sender: 'bot',
  timestamp: new Date()
});

const truncateTitle = (text: string): string => 
  text.length > SESSION_TITLE_MAX_LENGTH ? `${text.slice(0, SESSION_TITLE_MAX_LENGTH)}...` : text;

// --- Custom Hooks ---
const useLocalStorage = () => {
  const saveToStorage = useCallback((sessions: ChatSession[]) => {
    try {
      if (sessions.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
          sessions, 
          lastUpdated: new Date().toISOString() 
        }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, []);

  const loadFromStorage = useCallback((): ChatSession[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as StoredSessions;
        return data.sessions.map(s => ({
          ...s,
          timestamp: new Date(s.timestamp),
          messages: s.messages.map(m => ({...m, timestamp: new Date(m.timestamp)}))
        }));
      }
    } catch (error) {
      console.error('Failed to parse sessions:', error);
    }
    return [];
  }, []);

  return { saveToStorage, loadFromStorage };
};

// --- Helper Component: Scratchblocks Renderer ---
const ScratchBlockRenderer: React.FC<{ code: string }> = React.memo(({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useMemo(() => `scratch-block-container-${Math.random().toString(36).substr(2, 9)}`, []);

  useEffect(() => {
    if (containerRef.current && code.trim()) {
      try {
        containerRef.current.innerHTML = '';
        const pre = document.createElement('pre');
        const codeEl = document.createElement('code');
        codeEl.className = 'language-scratch';
        codeEl.textContent = code;
        pre.appendChild(codeEl);
        containerRef.current.appendChild(pre);
        
        scratchblocks.renderMatching(`#${uniqueId} .language-scratch`, { 
          style: 'scratch3', 
          scale: 0.85 
        });
      } catch (error) {
        console.error('Failed to render Scratch blocks:', error);
        // Fallback to plain code display
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre class="bg-gray-800 text-white p-3 my-2 rounded-md text-xs font-mono overflow-x-auto"><code>${code}</code></pre>`;
        }
      }
    }
  }, [code, uniqueId]);

  return <div ref={containerRef} id={uniqueId} className="scratch-blocks-wrapper my-2" />;
});

ScratchBlockRenderer.displayName = 'ScratchBlockRenderer';

// --- Main Chatbot Component ---
const ScratchChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { saveToStorage, loadFromStorage } = useLocalStorage();
  const apiKey = useMemo(() => import.meta.env.VITE_GEMINI_API_KEY || '', []);
  // Add to your state variables in ScratchChatbot component
const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);


  // Add this useEffect after your existing useEffects
useEffect(() => {
  if (inputText.trim()) {
    const filtered = SUGGESTION_PROMPTS.filter(suggestion =>
      suggestion.toLowerCase().includes(inputText.toLowerCase())
    ).slice(0, 6); // Limit to 6 suggestions
    setFilteredSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  } else {
    // Show random suggestions when input is empty and focused
    const randomSuggestions = SUGGESTION_PROMPTS
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);
    setFilteredSuggestions(randomSuggestions);
    setShowSuggestions(false); // Don't show by default, only on focus
  }
}, [inputText]);

// Add this callback function
const handleSuggestionClick = useCallback((suggestion: string) => {
  setInputText(suggestion);
  setShowSuggestions(false);
}, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Check API key
  useEffect(() => {
    if (!apiKey) {
      setError('Gemini API key not configured.');
    }
  }, [apiKey]);

  // Load sessions on mount
  useEffect(() => {
    const loadedSessions = loadFromStorage();
    if (loadedSessions.length > 0) {
      const latestSession = loadedSessions
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      setSessions(loadedSessions);
      setCurrentSessionId(latestSession.id);
      setMessages(latestSession.messages);
    } else {
      handleNewChat();
    }
  }, [loadFromStorage]);

  // Save sessions when they change
  useEffect(() => {
    if (sessions.length > 0) {
      saveToStorage(sessions);
    }
  }, [sessions, saveToStorage]);

  const handleNewChat = useCallback(() => {
    const newSessionId = generateId();
    const initialMessage = createInitialMessage();
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat',
      lastMessage: "Let's learn Scratch! ✨",
      timestamp: new Date(),
      messages: [initialMessage]
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setMessages([initialMessage]);
    setInputText('');
    setError('');
  }, []);

  const handleDeleteSession = useCallback((sessionIdToDelete: string) => {
    if (!window.confirm('Delete this conversation forever?')) return;
    
    const remainingSessions = sessions.filter(s => s.id !== sessionIdToDelete);
    setSessions(remainingSessions);
    
    if (currentSessionId === sessionIdToDelete) {
      const nextSession = remainingSessions[0];
      if (nextSession) {
        setCurrentSessionId(nextSession.id);
        setMessages(nextSession.messages);
      } else {
        handleNewChat();
      }
    }
  }, [sessions, currentSessionId, handleNewChat]);

  const handleSessionSwitch = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  }, [sessions]);

  const callGeminiAPI = useCallback(async (userMessage: string): Promise<string> => {
    if (!apiKey) throw new Error('API key not configured.');
    
    const currentActiveSession = sessions.find(s => s.id === currentSessionId);
    const historyMessages = currentActiveSession ? 
      currentActiveSession.messages.slice(-MAX_HISTORY_MESSAGES) : [];
    
    const conversationHistory = historyMessages
      .map(msg => `${msg.sender === 'user' ? 'Student' : 'Assistant'}: ${msg.text}`)
      .join('\n\n');


const systemPrompt = `You are a friendly and encouraging expert on Scratch programming. Your name is the "Scratch Helper" 🐱. Your primary goal is to help users understand Scratch concepts and build projects.

**Formatting Rules:**

1. **Scratch Blocks:** When you show Scratch code, YOU MUST use the special "scratchblocks" syntax inside a Markdown code fence with the language set to "scratch".

2. **Scratchblocks Syntax Rules:**
   - Use \`()\` for round number/text inputs
   - Use \`[]\` for dropdown menus (with \`v\` for dropdown arrow when needed)
   - Use \`<>\` for boolean/condition inputs
   - Use \`::\` to specify block categories (e.g., \`:: motion\`, \`:: looks\`, \`:: sound\`)
   - All C-shaped control blocks MUST end with \`end\` on its own line
   - Use proper spacing and indentation for nested blocks
   - Reporter blocks should use \`()\` when used as inputs

3. **Block Categories - CRITICAL DISTINCTIONS:**
   - \`:: motion\` for movement blocks (move, turn, go to, etc.)
   - \`:: looks\` for appearance blocks (say, show, hide, costume, etc.)
   - \`:: sound\` for audio blocks (play sound, etc.)
   - \`:: events\` for trigger blocks (when green flag clicked, when key pressed, etc.)
   - \`:: control\` for logic and flow blocks (**if/else, forever, repeat, while, wait**)
   - \`:: sensing\` for detection blocks (key pressed?, touching?, mouse down?, etc.)
   - \`:: operators\` for math/logic operations (join, =, <, >, and, or, not, etc.)
   - \`:: variables\` for data blocks (set variable, change variable, etc.)
   - \`:: extensions\` for extension blocks (Translate, Text-to-Speech, etc.)

4. **IMPORTANT CONTROL vs SENSING DISTINCTION:**
   - **Control blocks (:: control):** if, else, forever, repeat, while, wait, stop
   - **Sensing blocks (:: sensing):** key pressed?, touching?, mouse down?, answer, etc.
   - **Common mistake:** if/else blocks are ALWAYS :: control, NOT :: sensing
   - **The condition inside <> gets its own category:** \`if <key [space v] pressed? :: sensing> then :: control\`

5. **Extension Blocks:** For Scratch extensions, use proper syntax:
   - **Translate:** \`translate [Hello!] to [Spanish v] :: extensions\`
   - **Text-to-Speech:** \`speak [Hello] :: extensions\`
   - **Music:** \`play drum [(1) Snare Drum v] for (0.25) beats :: extensions\`
   - **Pen:** \`pen down :: extensions\`
   - **Video Sensing:** \`video [motion v] on [sprite v] :: extensions\`
   - Always use \`:: extensions\` category for extension blocks

6. **Correct Example of a Drawing Script:**
\`\`\`scratch
when green flag clicked :: events
clear :: extensions
pen up :: extensions
go to x: (0) y: (0) :: motion
forever :: control
  if <key [space v] pressed? :: sensing> then :: control
    pen down :: extensions
  else :: control
    pen up :: extensions
  end
  if <key [right arrow v] pressed? :: sensing> then :: control
    turn right (5) degrees :: motion
  end
  if <key [left arrow v] pressed? :: sensing> then :: control
    turn left (5) degrees :: motion
  end
  move (10) steps :: motion
end
\`\`\`

**Behavioral Rules:**
- **Focus:** ONLY answer questions about Scratch. If asked about other programming languages, math, history, etc., politely decline and steer back to Scratch.
- **Tone:** Be cheerful, patient, and use emojis! 🚀✨🎉
- **Clarity:** Explain concepts simply. Assume the user is a beginner.
- **Language:** Avoid complex vocabulary. Use short sentences and fun analogies when possible. 🎈
- **Color Awareness:** If user mentions different block colors (like red sensing blocks), acknowledge they might be using high-contrast mode or custom themes
- **Clean Code:** NEVER include comments, explanations, or descriptive text inside scratchblocks code blocks
- **Complete Scripts:** ALWAYS include hat blocks (when green flag clicked, etc.) to make scripts runnable
- **Extension Support:** Recognize and properly format extension blocks with :: extensions
- **Category Accuracy:** Double-check that control blocks use :: control and sensing blocks use :: sensing

**Your Task:** Based on the previous conversation and the user's new question, provide a helpful response following all the rules above.

---
**Previous conversation:** ${conversationHistory}
---
**Student's question:** ${userMessage}`;


    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { 
              temperature: 0.7, 
              topK: 40, 
              topP: 0.95, 
              maxOutputTokens: 1024 
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ],
          })
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: GeminiErrorResponse = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }, [apiKey, sessions, currentSessionId]);

  const handleSend = useCallback(async (): Promise<void> => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput || !apiKey || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      text: trimmedInput,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setError('');

    // Update session with user message
    setSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === currentSessionId ? {
          ...session,
          title: session.messages.length < 1 ? truncateTitle(trimmedInput) : session.title,
          messages: [...session.messages, userMessage],
          lastMessage: trimmedInput,
          timestamp: new Date()
        } : session
      ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    );

    try {
      const response = await callGeminiAPI(trimmedInput);
      const botResponse: Message = {
        id: Date.now() + 1,
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === currentSessionId ? {
            ...session,
            messages: [...session.messages, botResponse],
            lastMessage: response.slice(0, 50) + (response.length > 50 ? '...' : ''),
            timestamp: new Date()
          } : session
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      const errorResponse: Message = {
        id: Date.now() + 1,
        text: `Sorry, an error occurred: ${errorMessage}`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, apiKey, isTyping, currentSessionId, callGeminiAPI]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const markdownComponents: Options['components'] = useMemo(() => ({
    pre({ node, ...props }) {
      const codeChild = node?.children[0];
      if (codeChild && codeChild.type === 'element' && codeChild.tagName === 'code') {
        const lang = (codeChild.properties as any)?.className?.[0]?.replace('language-', '');
        const codeString = codeChild.children[0]?.type === 'text' ? codeChild.children[0].value : '';
        if (lang === 'scratch' && codeString) {
          return <ScratchBlockRenderer code={codeString} />;
        }
      }
      return (
        <pre className="bg-gray-800 text-white p-3 my-2 rounded-md text-xs font-mono overflow-x-auto" {...props} />
      );
    },
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !match ? (
        <code className="bg-orange-100 text-orange-800 font-mono py-0.5 px-1.5 rounded-md text-xs" {...props}>
          {children}
        </code>
      ) : null;
    },
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-2 ml-4 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 ml-4 space-y-1">{children}</ol>,
  }), []);

  const currentSession = useMemo(() => 
    sessions.find(s => s.id === currentSessionId), 
    [sessions, currentSessionId]
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Session Drawer */}
      <div className="w-64 bg-white border-r overflow-y-auto p-2 space-y-2 flex-shrink-0 flex flex-col">
        <button 
          onClick={handleNewChat} 
          className="w-full px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center justify-center gap-2 mb-2"
        >
          <RotateCcw className="w-4 h-4" /> New Chat
        </button>
        
        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.map(session => (
            <div key={session.id} className="relative group">
              <button 
                onClick={() => handleSessionSwitch(session.id)}
                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  currentSessionId === session.id 
                    ? 'bg-orange-100 text-orange-800 font-semibold' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="font-medium truncate">{session.title}</div>
                <div className={`text-xs truncate ${
                  currentSessionId === session.id ? 'text-orange-700' : 'text-gray-500'
                }`}>
                  {session.lastMessage}
                </div>
              </button>
              <button 
                onClick={() => handleDeleteSession(session.id)} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col h-screen bg-gradient-to-br from-orange-50 to-blue-50">
        <div className="bg-white/80 backdrop-blur-sm border-b p-3 flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-800">
            {currentSession?.title || 'Loading...'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex gap-3 items-start ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender === 'bot' && (
                <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className={`px-4 py-2 rounded-xl text-sm leading-relaxed ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white max-w-lg' 
                  : 'bg-white text-gray-800 shadow-sm border border-gray-200/50 flex-1 max-w-3xl'
              }`}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  components={markdownComponents}
                >
                  {message.text}
                </ReactMarkdown>
                <p className={`text-right text-xs mt-2 ${
                  message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              
              {message.sender === 'user' && (
                <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 items-start justify-start">
              <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200/50">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mx-4 mb-2 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        
<div className="bg-white/80 backdrop-blur-sm border-t p-4">
  <div className="relative">
    {/* Suggestions dropdown */}
    {showSuggestions && filteredSuggestions.length > 0 && (
      <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
        <div className="p-2 border-b bg-gray-50 text-xs font-medium text-gray-600">
          💡 Suggestions
        </div>
        {filteredSuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 hover:text-orange-700 transition-colors border-b last:border-b-0 border-gray-100"
          >
            {suggestion}
          </button>
        ))}
      </div>
    )}
    
    <div className="flex gap-2">
      <input 
        type="text" 
        value={inputText} 
        onChange={(e) => setInputText(e.target.value)} 
        onKeyPress={handleKeyPress}
        onFocus={() => setShowSuggestions(filteredSuggestions.length > 0 || inputText.trim() === '')}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Delay to allow suggestion clicks
        placeholder={apiKey ? "Ask about Scratch..." : "API key not configured"} 
        className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 transition" 
        disabled={isTyping || !apiKey}
        maxLength={1000}
      />
      <button 
        onClick={handleSend} 
        disabled={!inputText.trim() || isTyping || !apiKey} 
        className="p-3 bg-orange-500 text-white rounded-full transition-colors hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed"
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  </div>
</div>
      </div>
    </div>
  );
};

export default ScratchChatbot;
