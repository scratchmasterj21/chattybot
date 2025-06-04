import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// Add these imports at the top
import { Trash2, RotateCcw } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

// Add these new interfaces
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

const ScratchChatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>(() => {
      const stored = localStorage.getItem('scratchbot_sessions');
      if (stored) {
        const { sessions } = JSON.parse(stored) as StoredSessions;
        const currentSession = sessions[sessions.length - 1];
        if (currentSession) {
          return currentSession.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        }
      }
      // Initial message for new chat
      return [{
        id: 1,
        text: "Hi! 🐱 I'm your Scratch helper! Ask me anything about Scratch programming!",
        sender: 'bot',
        timestamp: new Date()
      }];
    });
    
    // Update the sessions state initialization
    const [sessions, setSessions] = useState<ChatSession[]>(() => {
      const stored = localStorage.getItem('scratchbot_sessions');
      if (stored) {
        const { sessions } = JSON.parse(stored) as StoredSessions;
        // Convert string timestamps back to Date objects
        return sessions.map(session => ({
          ...session,
          timestamp: new Date(session.timestamp),
          messages: session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
      }
      return [];
    });
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return Date.now().toString();
  });

  useEffect(() => {
    const storedData: StoredSessions = {
      sessions,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('scratchbot_sessions', JSON.stringify(storedData));
  }, [sessions]);

  // Add this effect to save messages to localStorage
  // Remove this effect:
  // useEffect(() => {
  //   const storedData: StoredMessages = {
  //     messages,
  //     lastUpdated: new Date().toISOString()
  //   };
  //   localStorage.setItem('scratchbot_messages', JSON.stringify(storedData));
  // }, [messages]);

  // Add these new functions
  const handleNewChat = () => {
    const newSessionId = Date.now().toString();
    const initialMessage: Message = {
      id: Date.now(),
      text: "Hi! 🐱 I'm your Scratch helper! Ask me anything about Scratch programming!",
      sender: 'bot',
      timestamp: new Date()
    };
    
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat',
      lastMessage: initialMessage.text,
      timestamp: new Date(),
      messages: [{ ...initialMessage, sender: 'bot' }]
    };
    
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSessionId);
    setMessages([initialMessage]);
    setInputText('');
    setError('');
  };

  // Add session drawer component
  const SessionDrawer: React.FC = () => (
    <div className="w-64 bg-white border-r overflow-y-auto p-2 space-y-2">
      <button
        onClick={handleNewChat}
        className="w-full px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
      >
        New Chat
      </button>
      <div className="space-y-1">
        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => {
              setCurrentSessionId(session.id);
              setMessages(session.messages);
            }}
            className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
              currentSessionId === session.id
                ? 'bg-orange-100 text-orange-700'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="font-medium truncate">{session.title}</div>
            <div className="text-xs text-gray-500 truncate">{session.lastMessage}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // Update the handleClearMessages function to delete only the current session
  const handleClearMessages = () => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      // Remove current session from sessions array
      setSessions(prevSessions => prevSessions.filter(session => session.id !== currentSessionId));
      
      // If there are other sessions, switch to the most recent one
      // If no sessions left, create a new chat
      const remainingSessions = sessions.filter(session => session.id !== currentSessionId);
      if (remainingSessions.length > 0) {
        const lastSession = remainingSessions[remainingSessions.length - 1];
        setCurrentSessionId(lastSession.id);
        setMessages(lastSession.messages);
      } else {
        handleNewChat();
      }
    }
  };

  useEffect(() => {
    if (sessions.length === 0) {
      handleNewChat();
    }
  }, []);

  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get API key from environment variable
  // In a real deployment, this would be injected during build time
  // For now, you'll need to replace this with your actual API key
  const apiKey: string = import.meta.env.VITE_GEMINI_API_KEY || '';  
  
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check if API key is available
    if (!apiKey) {
      setError('Gemini API key not configured. Please contact your instructor.');
    }
  }, [apiKey]);

  const callGeminiAPI = async (userMessage: string): Promise<string> => {
    if (!apiKey) {
      throw new Error('API key not configured. Please contact your instructor.');
    }
  
    // Get recent conversation history (last 5 messages)
    const recentMessages = messages.slice(-5).map(msg => ({
      role: msg.sender,
      text: msg.text
    }));
  
    const conversationHistory = recentMessages
      .map(msg => `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.text}`)
      .join('\n\n');
  
    
      const systemPrompt = `Hi! I'm your friendly Scratch helper! 🐱

I'm a specialized assistant focused exclusively on Scratch programming. I can help you with:
- Scratch blocks and scripts
- Sprite actions and costumes  
- Stage and backdrop features
- Scratch game development
- Basic programming concepts in Scratch

When I show Scratch blocks, I'll format them like this:

🟦 MOTION BLOCKS:
\`when green flag clicked\`
\`move (10) steps\`
\`turn right (15) degrees\`
\`turn left (15) degrees\`
\`point in direction (90)\`
\`point towards (mouse-pointer)\`
\`go to x: (0) y: (0)\`
\`go to (mouse-pointer)\`
\`glide (1) secs to x: (0) y: (0)\`
\`change x by (10)\`
\`set x to (0)\`
\`change y by (10)\`
\`set y to (0)\`
\`if on edge, bounce\`
\`set rotation style [left-right]\`
\`(x position)\`
\`(y position)\`
\`(direction)\`

🟣 LOOKS BLOCKS:
\`say [Hello!] for (2) seconds\`
\`say [Hello!]\`
\`think [Hmm...] for (2) seconds\`
\`think [Hmm...]\`
\`switch costume to (costume1)\`
\`next costume\`
\`switch backdrop to (backdrop1)\`
\`change [color] effect by (25)\`
\`set [color] effect to (0)\`
\`clear graphic effects\`
\`change size by (10)\`
\`set size to (100)%\`
\`show\`
\`hide\`
\`go to [front] layer\`
\`go [forward] (1) layers\`
\`(costume [number])\`
\`(backdrop [number])\`
\`(size)\`

🟪 SOUND BLOCKS:
\`play sound (Meow) until done\`
\`start sound (Meow)\`
\`stop all sounds\`
\`change [pitch] effect by (10)\`
\`set [pitch] effect to (100)\`
\`clear sound effects\`
\`change volume by (-10)\`
\`set volume to (100)%\`
\`(volume)\`

🟨 EVENT BLOCKS:
\`when green flag clicked\`
\`when [space] key pressed\`
\`when this sprite clicked\`
\`when backdrop switches to [backdrop1]\`
\`when [loudness] > (10)\`
\`when I receive [message1]\`
\`broadcast [message1]\`
\`broadcast [message1] and wait\`

🟧 CONTROL BLOCKS:
\`wait (1) seconds\`
\`repeat (10)\`
\`forever\`
\`if <> then\`
\`if <> then\`
\`else\`
\`wait until <>\`
\`repeat until <>\`
\`stop [all]\`
\`when I start as a clone\`
\`create clone of [myself]\`
\`delete this clone\`

🟢 SENSING BLOCKS:
\`<touching (mouse-pointer)?>\`
\`<touching color [#0000FF]?>\`
\`<color [#FF0000] is touching [#0000FF]?>\`
\`(distance to (mouse-pointer))\`
\`ask [What's your name?] and wait\`
\`(answer)\`
\`<key (space) pressed?>\`
\`<mouse down?>\`
\`(mouse x)\`
\`(mouse y)\`
\`(loudness)\`
\`(timer)\`
\`reset timer\`
\`([x position] of (Sprite1))\`
\`(current [minute])\`
\`(days since 2000)\`
\`(username)\`

🔵 OPERATORS BLOCKS:
\`(()) + (()))\`
\`(()) - (()))\`
\`(()) * (()))\`
\`(()) / (()))\`
\`(pick random (1) to (10))\`
\`<() > ()>\`
\`<() < ()>\`
\`<() = ()>\`
\`<() and ()>\`
\`<() or ()>\`
\`<not <>>\`
\`(join [apple] [banana])\`
\`(letter (1) of [world])\`
\`(length of [world])\`
\`<[apple] contains [a]?>\`
\`(() mod ())\`
\`(round ())\`
\`([abs] of ())\`

🟠 VARIABLES BLOCKS:
\`set [my variable] to (0)\`
\`change [my variable] by (1)\`
\`show variable [my variable]\`
\`hide variable [my variable]\`
\`(my variable)\`

🔴 LIST BLOCKS:
\`add [thing] to [list]\`
\`delete (1) of [list]\`
\`delete all of [list]\`
\`insert [thing] at (1) of [list]\`
\`replace item (1) of [list] with [thing]\`
\`(item (1) of [list])\`
\`(item # of [thing] in [list])\`
\`(length of [list])\`
\`<[list] contains [thing]?>\`
\`show list [list]\`
\`hide list [list]\`

🖌️ PEN BLOCKS (Extension):
\`erase all\`
\`stamp\`
\`pen down\`
\`pen up\`
\`set pen color to [#FF0000]\`
\`change pen color by (10)\`
\`set pen color to (50)\`
\`change pen shade by (10)\`
\`set pen shade to (50)\`
\`change pen size by (1)\`
\`set pen size to (1)\`

🎵 MUSIC BLOCKS (Extension):
\`play note (60) for (0.5) beats\`
\`rest for (0.25) beats\`
\`play drum (1) for (0.25) beats\`
\`set instrument to (1)\`
\`set tempo to (60)\`
\`change tempo by (20)\`
\`(tempo)\`

Important:
- I only answer questions about Scratch programming.
- If you ask about other topics, I'll kindly remind you to keep questions Scratch-related.
- I'll always provide step-by-step instructions for complex projects.
- I'll suggest creative ideas to make projects more fun and engaging.

Please ask your Scratch question clearly and simply.

Previous conversation: ${conversationHistory}
      
Your Scratch question: ${userMessage}

Instructions for AI:
1. Only respond to Scratch programming questions.
2. For non-Scratch questions, reply: "I'm your Scratch helper! I can only answer questions about Scratch programming. Would you like to learn about making games, animations, or other fun projects in Scratch?"
3. Always wrap Scratch blocks in backticks for proper color coding.
4. Keep explanations simple, clear, and beginner-friendly.
5. Use emojis matching block colors for section headers.
6. Provide complete, working examples when possible.
7. Encourage creativity and experimentation.
8. Always end with a motivating message! 🎉
`;
  
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });
  
    if (!response.ok) {
      const errorData: GeminiErrorResponse = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get response from Gemini API');
    }
  
    const data: GeminiResponse = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I couldn\'t generate a response. Please try asking your question differently.';
  };

  const handleSend = async (): Promise<void> => {
    if (!inputText.trim()) return;
    if (!apiKey) {
      setError('API key not configured. Please contact your instructor.');
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    // Update messages and sessions
    setMessages(prev => [...prev, userMessage]);
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === currentSessionId
          ? {
              ...session,
              messages: [...session.messages, userMessage],
              lastMessage: userMessage.text,
              timestamp: new Date()
            }
          : session
      )
    );

    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);
    setError('');

    try {
      const response = await callGeminiAPI(currentInput);
      const botResponse: Message = {
        id: Date.now() + 1,
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };

      // Update both messages and session with bot response
      setMessages(prev => [...prev, botResponse]);
      setSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: [...session.messages, botResponse],
                lastMessage: botResponse.text.slice(0, 100) + '...',
                timestamp: new Date()
              }
            : session
        )
      );
    } catch (err) {
      console.error('Gemini API Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      const errorResponse: Message = {
        id: Date.now() + 1,
        text: `Sorry, I encountered an error: ${errorMessage}\n\nPlease try asking your question again, or contact your instructor if the problem persists.`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string): void => {
    setInputText(suggestion);
  };

  const suggestionQuestions: string[] = [
    'How do I make a sprite move with arrow keys?',
    'What is a forever loop and how do I use it?',
    'How can I make my sprite change costumes?',
    'How do I add sounds to my project?',
    'What are variables and how do I use them?',
    'How do I make a simple game in Scratch?',
    'How do I make my sprite bounce off the edges?',
    'What are if-then blocks and when do I use them?'
  ];

  return (
    <div className="flex h-screen">
      <SessionDrawer />
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-100 to-blue-100">
      <div className="bg-white border-b p-2 flex justify-between items-center">
        <h2 className="text-sm font-medium text-gray-700">Scratch Helper</h2>
        <div className="flex gap-2">
          <button
            onClick={handleNewChat}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Start New Chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearMessages}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Current Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'bot' && (
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-6 h-6 text-white" />
              </div>
            )}
            

            <div
  className={`px-3 py-2 rounded-xl leading-relaxed text-xs ${
    message.sender === 'user'
      ? 'bg-blue-500 text-white max-w-lg'
      : 'bg-white text-gray-800 shadow-md border flex-1 max-w-3xl'
  }`}

>
  <div className={message.sender === 'bot' ? 'markdown-body' : ''}>
    {message.sender === 'bot' ? (
      // Enhanced ReactMarkdown component with Scratch block detection
// Comprehensive ReactMarkdown component with complete Scratch block detection
// Enhanced ReactMarkdown with improved block formatting
// Enhanced ReactMarkdown with improved block formatting
// Updated React component with proper block stacking
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    code({ inline, className, children, ...props }: React.HTMLAttributes<HTMLElement> & { inline?: boolean; className?: string; children?: React.ReactNode }) {
      const codeText = String(children).toLowerCase().trim();
      
      // Enhanced block detection function - checks specific patterns before general ones
      const detectBlockType = (text: string): string | null => {
        // Remove common punctuation and numbers for better detection
        const cleanText: string = text.replace(/[()[\]<>]/g, ' ').replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
        
        // Events blocks - most specific patterns first
        if (text.includes('when green flag clicked')) return 'events';
        if (text.includes('when') && (text.includes('key pressed') || text.includes('clicked') || text.includes('backdrop switches'))) return 'events';
        if (text.includes('broadcast') || text.includes('receive')) return 'events';
        
        // Motion blocks - CHECK THESE BEFORE CONTROL BLOCKS!
        if (text.includes('move') && text.includes('steps')) return 'motion';
        if (text.includes('turn') && (text.includes('degrees') || text.includes('right') || text.includes('left'))) return 'motion';
        if (text.includes('go to') || text.includes('glide') || text.includes('point')) return 'motion';
        if (text.includes('change x') || text.includes('change y') || text.includes('set x') || text.includes('set y')) return 'motion';
        if (text.includes('x position') || text.includes('y position') || text.includes('direction')) return 'motion';
        
        // FIXED: Check for specific motion blocks that contain "if" before general control detection
        if (text.includes('if on edge') && text.includes('bounce')) return 'motion';
        if (text.includes('bounce') && !text.includes('when')) return 'motion';
        
        // Control structures - now checked AFTER motion-specific patterns
        if (text.includes('forever') || text.includes('repeat') || text.includes('repeat until')) return 'control';
        if (cleanText.includes('if ') && !text.includes('bounce')) return 'control';
        if (text.includes('else') || text.includes('wait')) return 'control';
        if (text.includes('stop') && (text.includes('all') || text.includes('script'))) return 'control';
        if (text.includes('end')) return 'control';
        
        // Looks blocks
        if ((text.includes('say') || text.includes('think')) && (text.includes('for') || text.includes('seconds'))) return 'looks';
        if (text.includes('show') || text.includes('hide')) return 'looks';
        if (text.includes('switch costume') || text.includes('next costume') || text.includes('costume')) return 'looks';
        if (text.includes('switch backdrop') || text.includes('next backdrop') || text.includes('backdrop')) return 'looks';  
        if (text.includes('change size') || text.includes('set size') || text.includes('change effect') || text.includes('set effect')) return 'looks';
        
        // Sound blocks
        if (text.includes('play sound') || text.includes('start sound') || (text.includes('stop') && text.includes('sound'))) return 'sound';
        if (text.includes('change volume') || text.includes('set volume') || text.includes('volume')) return 'sound';
        
        // Sensing blocks
        if (text.includes('touching') || text.includes('distance') || text.includes('ask') || text.includes('answer')) return 'sensing';
        if (text.includes('key pressed') && !text.includes('when')) return 'sensing';
        if (text.includes('mouse') || text.includes('loudness') || text.includes('timer')) return 'sensing';
        
        // Variables and lists - be more specific
        if ((text.includes('set') && text.includes('to')) && !text.includes('effect') && !text.includes('volume') && !text.includes('go to')) return 'variables';
        if (text.includes('change') && text.includes('by')) return 'variables';
        if (text.includes('add to list') || (text.includes('delete') && text.includes('list')) || text.includes('item of')) return 'variables';
        
        // Operators (check for mathematical symbols and logical operators)
        if (text.match(/[\+\-\*\/]/) && !text.includes('change') && !text.includes('turn')) return 'operators';
        if ((text.includes('=') || text.includes('<') || text.includes('>')) && !text.includes('repeat until') && !text.includes('if ')) return 'operators';
        if (text.includes(' and ') || text.includes(' or ') || text.includes('not ')) return 'operators';
        if (text.includes('join') || text.includes('letter') || text.includes('length') || text.includes('contains')) return 'operators';
        if (text.includes('random') || text.includes('round') || text.includes('mod')) return 'operators';
        
        return null;
      };

      // Block color mapping
      interface BlockColors {
        bg: string;
        border: string;
        text: string;
      }

      interface BlockTypeColors {
        motion: BlockColors;
        looks: BlockColors;
        sound: BlockColors;
        events: BlockColors;
        control: BlockColors;
        sensing: BlockColors;
        operators: BlockColors;
        variables: BlockColors;
        default: BlockColors;
        [key: string]: BlockColors;
      }

      const getBlockColor = (blockType: string | null): BlockColors => {
        const colors: BlockTypeColors = {
          motion: { bg: '#4C97FF', border: '#3373CC', text: 'white' },
          looks: { bg: '#9966FF', border: '#774DCB', text: 'white' },
          sound: { bg: '#CF63CF', border: '#BD42BD', text: 'white' },
          events: { bg: '#FFD500', border: '#E6BF00', text: '#5A5A5A' },
          control: { bg: '#FFAB19', border: '#E6941A', text: 'white' },
          sensing: { bg: '#5CB1D6', border: '#4A90A4', text: 'white' },
          operators: { bg: '#59C059', border: '#389438', text: 'white' },
          variables: { bg: '#FF8C1A', border: '#E6771A', text: 'white' },
          default: { bg: '#E5E5E5', border: '#CCC', text: '#333' }
        };
        return colors[blockType || 'default'];
      };

      const blockType = detectBlockType(codeText);
      const colors = getBlockColor(blockType);
      
      // For inline code, create individual blocks
      if (inline) {
        return (
          <code 
            className="scratch-block"
            data-type={blockType}
            title={blockType ? `${blockType.charAt(0).toUpperCase() + blockType.slice(1)} Block` : 'Scratch Block'}
            style={{ 
              backgroundColor: colors.bg,
              borderColor: colors.border,
              color: colors.text,
              fontFamily: 'Courier New, monospace',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.85em',
              fontWeight: '600',
              display: 'block',
              margin: '4px 0',
              maxWidth: 'fit-content',
              border: '2px solid',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              clear: 'both'
            }}
            {...props}
          >
            {children}
          </code>
        );
      }
      
      // For code blocks, treat each line as a separate block
      return (
        <div className="script-container" style={{ 
          backgroundColor: '#f8f9fa',
          border: '2px dashed #dee2e6',
          borderRadius: '12px',
          padding: '16px',
          margin: '20px 0',
          position: 'relative'
        }}>
          {String(children).split('\n').filter(line => line.trim()).map((line, index) => {
            // Clean the line and detect its individual block type
            const cleanLine = line.trim();
            const lineBlockType = detectBlockType(cleanLine.toLowerCase());
            const lineColors = getBlockColor(lineBlockType);
            
            // Add indentation for nested blocks
            const indentLevel = (line.match(/^\s*/)?.[0]?.length || 0) / 2;
            const marginLeft = indentLevel * 20;
            
            return (
              <code
                key={index}
                className="scratch-block"
                data-type={lineBlockType}
                title={lineBlockType ? `${lineBlockType.charAt(0).toUpperCase() + lineBlockType.slice(1)} Block` : 'Scratch Block'}
                style={{ 
                  backgroundColor: lineColors.bg,
                  borderColor: lineColors.border,
                  color: lineColors.text,
                  fontFamily: 'Courier New, monospace',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85em',
                  fontWeight: '600',
                  display: 'block',
                  margin: '4px 0',
                  marginLeft: `${marginLeft}px`,
                  maxWidth: 'fit-content',
                  border: '2px solid',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  clear: 'both'
                }}
              >
                {cleanLine}
              </code>
            );
          })}
        </div>
      );
    },
    p({ children }) {
      return <p className="mb-3 text-sm leading-relaxed">{children}</p>;
    },
    li({ children }) {
      return <li className="mb-2 text-sm">{children}</li>;
    },
    h3({ children }) {
      return <h3 className="text-lg font-semibold mb-2 mt-4">{children}</h3>;
    },
    // Add a wrapper for script sections
    blockquote({ children }) {
      return (
        <div className="script-container bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 my-4 relative">
          {children}
        </div>
      );
    }
  }}
>
  {message.text}
</ReactMarkdown>
    ) : (
      message.text
    )}
  </div>
  <p className={`message-timestamp ${
  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
}`}>
  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
</p>
</div>

            {message.sender === 'user' && (
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-4 justify-start">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="bg-white text-gray-800 shadow-md border px-6 py-4 rounded-xl">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
        <input
  type="text"
  value={inputText}
  onChange={(e) => setInputText(e.target.value)}
  onKeyPress={handleKeyPress}
  placeholder={apiKey ? "Ask me anything about Scratch programming..." : "API key not configured - contact instructor"}
  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black placeholder-gray-500"
  disabled={isTyping || !apiKey}
/>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping || !apiKey}
            className="px-2 py-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors disabled:opacity-50 border border-orange-200"
            >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {apiKey && messages.length <= 2 && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-2">Quick questions to get started:</p>
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {suggestionQuestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isTyping}
                  className="px-3 py-1.5 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors disabled:opacity-50 border border-orange-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {!apiKey && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            This chatbot requires an API key to function. Please contact your instructor.
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default ScratchChatbot;