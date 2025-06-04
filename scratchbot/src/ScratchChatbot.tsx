import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your Scratch programming assistant powered by Google Gemini. I can help you with Scratch blocks, sprites, sounds, animations, games, and any programming concepts. What would you like to learn about?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
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

    const systemPrompt = `Hi! I'm your friendly Scratch helper! 🐱 

    I'm a specialized Scratch programming assistant, which means I can only help with:
    - Scratch blocks and scripts
    - Sprite actions and costumes
    - Stage and backdrop features
    - Scratch game development
    - Basic programming concepts in Scratch
    
    When I explain Scratch blocks, I'll show them like this:
    
    🔵 Motion Blocks:
    [when green flag clicked ▶️]
    [move (10) steps]
    
    🟣 Looks Blocks:
    [say [Hello!] for (2) seconds]
    [switch costume to (costume1)]
    
    💖 Sound Blocks:
    [play sound (Meow) until done]
    
    💛 Events Blocks:
    [when (space) key pressed]
    
    🟧 Control Blocks:
    [forever]
    [if <touching (mouse-pointer)?> then]
    
    🔍 Sensing Blocks:
    <touching color [#FF0000]?>
    
    💚 Operators Blocks:
    ((2) + (2))
    <(my variable) > (50)>
    
    📦 Variables:
    (my variable)
    [set [my variable] to (0)]
    
    Important: I can only answer questions about Scratch programming. If you ask about other topics, I'll kindly remind you to focus on Scratch-related questions! 🎮
    
    Your Scratch question: ${userMessage}
    
    Instructions for AI:
    1. Only respond to questions about Scratch programming
    2. For non-Scratch questions, reply: "I'm your Scratch helper! I can only answer questions about Scratch programming. Would you like to learn about making games, animations, or other fun projects in Scratch?"
    3. Always use block formatting when showing Scratch code
    4. Keep explanations simple and beginner-friendly
    5. Include emojis matching block colors when showing code examples`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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

    setMessages(prev => [...prev, userMessage]);
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
      
      setMessages(prev => [...prev, botResponse]);
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-100 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b-2 border-orange-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Scratch Programming Helper</h1>
            <p className="text-sm text-gray-600">
              {apiKey ? 'Powered by Google Gemini AI' : 'Configuration needed - contact instructor'}
            </p>
          </div>
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
              className={`px-6 py-4 rounded-xl leading-relaxed text-base ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white max-w-lg'
                  : 'bg-white text-gray-800 shadow-md border flex-1 max-w-4xl'
              }`}
            >
              <div className={`whitespace-pre-line ${message.sender === 'bot' ? 'space-y-3' : ''}`}>
                {message.text}
              </div>
              <p className={`text-xs mt-3 ${
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
  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black placeholder-gray-500"
  disabled={isTyping || !apiKey}
/>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping || !apiKey}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
  );
};

export default ScratchChatbot;