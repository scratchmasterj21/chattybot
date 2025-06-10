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
  // Basic Scratch Concepts (1-20)
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
  "How can I create different difficulty levels?",
  "How do I use sensors to control my project?",

  // Game Development (21-60)
  "How do I make a platformer game?",
  "How can I create a racing game?",
  "How can I make a maze game?",
  "How do I create a jumping character?",
  "How can I make a catching game?",
  "How do I add gravity to my game?",
  "How can I create a point-and-click adventure?",
  "How can I make a memory matching game?",
  "How can I make a simple AI opponent?",
  "How can I create a virtual pet game?",
  "How can I create a tower defense game?",
  "How can I create a rhythm game?",
  "How do I make a health system for my game?",
  "How can I create a side-scrolling shooter?",
  "How do I create a Pong game?",
  "How can I make a Flappy Bird clone?",
  "How do I create a Snake game?",
  "How can I make a Pac-Man style game?",
  "How do I create a Tetris-like puzzle game?",
  "How can I make a whack-a-mole game?",
  "How can I make a basketball shooting game?",
  "How do I create a space invaders game?",
  "How can I make a fruit ninja style game?",
  "How do I create a crossy road game?",
  "How can I make a fighting game?",
  "How do I create a cooking simulation?",
  "How can I make an endless runner?",
  "How do I create a card matching game?",
  "How can I make a word guessing game?",
  "How do I create a treasure hunt game?",
  "How can I make a zombie survival game?",
  "How do I create a fish tank simulator?",
  "How can I make a garden growing game?",
  "How do I create a slot machine game?",
  "How can I make a reaction time tester?",
  "How do I create a color mixing game?",
  "How can I make a typing speed test?",
  "How do I create a breakout/brick breaker game?",
  "How can I make a pinball game?",
  "How do I create a mini golf game?",

  // Creative & Interactive Projects (61-100)
  "How can I create a story with multiple scenes?",
  "How can I create a music player?",
  "How do I use the camera and video blocks?",
  "How can I make an interactive calculator?",
  "How can I make a digital clock?",
  "How do I create a paint application?",
  "How can I make a chatbot in Scratch?",
  "How do I create a random story generator?",
  "How can I make a weather app?",
  "How do I create a piano keyboard?",
  "How can I make a sprite dance to music?",
  "How do I create a password generator?",
  "How can I make a currency converter?",
  "How do I create a fortune teller?",
  "How can I make a magic 8-ball?",
  "How do I create a to-do list app?",
  "How can I make a drum machine?",
  "How do I create a voice recorder?",
  "How can I make a slideshow presentation?",
  "How do I create an alarm clock?",
  "How can I make a stopwatch timer?",
  "How do I create a calendar app?",
  "How can I make a photo gallery?",
  "How do I create a music visualizer?",
  "How can I make a drawing tablet?",
  "How do I create a whiteboard app?",
  "How can I make a screensaver?",
  "How do I create a meditation app?",
  "How can I make a habit tracker?",
  "How do I create a mood tracker?",
  "How can I make a journal app?",
  "How do I create a recipe book?",
  "How can I make a workout timer?",
  "How do I create a language translator?",
  "How can I make a unit converter?",
  "How do I create a tip calculator?",
  "How can I make a grade calculator?",
  "How do I create a BMI calculator?",
  "How can I make a loan calculator?",
  "How do I create a dice roller?",

  // Visual Effects & Animation (101-140)
  "How do I make a scrolling background?",
  "How do I create particle effects?",
  "How do I make realistic physics movements?",
  "How do I make sprites rotate smoothly?",
  "How do I make sprites fade in and out?",
  "How can I make a sprite follow a path?",
  "How do I create smooth camera movement?",
  "How can I make sprites cast shadows?",
  "How do I create day and night cycles?",
  "How can I make realistic water effects?",
  "How do I create fire and explosion effects?",
  "How can I make sprites glow?",
  "How do I create lightning effects?",
  "How can I make rain and snow effects?",
  "How do I create fog or smoke effects?",
  "How can I make sprites leave trails?",
  "How do I create screen shake effects?",
  "How can I make text appear letter by letter?",
  "How do I create popup notifications?",
  "How can I make interactive buttons?",
  "How do I create progress bars?",
  "How can I make loading screens?",
  "How do I create game menus?",
  "How can I make sprites bounce realistically?",
  "How do I create morphing animations?",
  "How can I make sprites stretch and squash?",
  "How do I create wind effects?",
  "How can I make realistic jumping animations?",
  "How do I create spinning wheel animations?",
  "How can I make sprites wobble?",
  "How do I create floating animations?",
  "How can I make sprites pulse or breathe?",
  "How do I create zoom in/out effects?",
  "How can I make sprites teleport with effects?",
  "How do I create slide transitions?",
  "How can I make sprites melt or dissolve?",
  "How do I create ripple effects?",
  "How can I make sprites grow and shrink?",
  "How do I create wave animations?",
  "How can I make realistic falling leaves?",

  // Game Mechanics & Systems (141-180)
  "How can I make high score systems?",
  "How do I save and load game progress?",
  "How do I create achievements and badges?",
  "How can I make sprites respawn?",
  "How do I create checkpoint systems?",
  "How can I make power-ups in games?",
  "How do I create boss battles?",
  "How can I make collectible items?",
  "How do I create inventory systems?",
  "How can I make level progression?",
  "How do I create upgrade systems?",
  "How can I make combo systems?",
  "How do I create multiplayer features?",
  "How can I make turn-based gameplay?",
  "How do I create random level generation?",
  "How can I make energy/stamina systems?",
  "How do I create crafting systems?",
  "How can I make trading systems?",
  "How do I create quest systems?",
  "How can I make dialogue trees?",
  "How do I create character stats?",
  "How can I make skill trees?",
  "How do I create mini-maps?",
  "How can I make fast travel systems?",
  "How do I create shop systems?",
  "How can I make auction systems?",
  "How do I create betting systems?",
  "How can I make tournament brackets?",
  "How do I create leaderboards?",
  "How can I make time limits in games?",
  "How do I create pause menus?",
  "How can I make settings menus?",
  "How do I create tutorial systems?",
  "How can I make hint systems?",
  "How do I create auto-save features?",
  "How can I make replay systems?",
  "How do I create spectator modes?",
  "How can I make practice modes?",
  "How do I create sandbox modes?",
  "How can I make custom level editors?",

  // Advanced & Educational (181-200+)
  "How do I create a science experiment simulator?",
  "How can I make a math problem generator?",
  "How do I create a periodic table app?",
  "How can I make a solar system model?",
  "How do I create a human body explorer?",
  "How can I make a geography quiz?",
  "How do I create a timeline of history?",
  "How can I make a language learning game?",
  "How do I create a spelling bee game?",
  "How can I make a fraction visualizer?",
  "How do I create a geometry drawing tool?",
  "How can I make a physics simulation?",
  "How do I create a chemistry lab simulator?",
  "How can I make a plant growth simulator?",
  "How do I create an ecosystem simulation?",
  "How can I make a city building game?",
  "How do I create a stock market simulator?",
  "How can I make a voting system?",
  "How do I create a survey maker?",
  "How can I make a data visualization tool?",
  "How do I create a family tree maker?",
  "How can I make a budget tracker?",
  "How do I create a meal planner?",
  "How can I make a travel planner?",
  "How do I create a movie database?",
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

const systemPrompt = `You are a friendly and encouraging expert on Scratch programming. Your name is the "Scratch Helper" 🐱.

Your primary goal is to help users understand Scratch concepts and build projects.

**Formatting Rules:**
1.  **Scratch Blocks:** When you show Scratch code, YOU MUST use the special "scratchblocks" syntax inside a Markdown code fence with the language set to "scratch".
    - Use \`()\` for number/text inputs, \`[]\` for dropdowns, and \`<>\` for booleans.
    - All control blocks that create a C-shape — like \`if <>\`, \`repeat ()\`, \`forever\`, and \`forever if <>\` — MUST end with a matching \`end\` on its own line.

2.  **Correct Example of a Script:**
\`\`\`scratch
when green flag clicked
forever
  ask [What's your name?] and wait
  if <(answer) = [purr]> then
    play sound [Meow v] until done
  else
    say (join [Hello, ] (answer))
  end
end
\`\`\`

3.  **Incorrect Example (don't do this):**
\`\`\`scratch
when green flag clicked
forever
  if <(answer) = [yes]> then
    say [Hello!]
\`\`\`
_(Missing \`end\` blocks — this won't parse properly!)_

**Behavioral Rules:**
- **Focus:** ONLY answer questions about Scratch. If asked about Python, math, history, etc., politely decline and steer the conversation back to Scratch.
- **Tone:** Be cheerful, patient, and use emojis! 🚀✨🎉
- **Clarity:** Explain concepts simply. Assume the user is a beginner.
- **Language:** Avoid complex vocabulary. Use short sentences and fun analogies when possible. 🎈

**Your Task:**
Based on the previous conversation and the user's new question, provide a helpful response following all the rules above.

---
**Previous conversation:**
${conversationHistory}
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
