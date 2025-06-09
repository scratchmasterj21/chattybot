import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Options } from 'react-markdown';

// --- Scratchblocks Integration ---
// This import now works because you created the `src/scratchblocks.d.ts` file.
import scratchblocks from 'scratchblocks';

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

// --- Helper Component: Scratchblocks Renderer ---
const ScratchBlockRenderer: React.FC<{ code: string }> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = `scratch-block-container-${React.useId()}`;

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      const pre = document.createElement('pre');
      const codeEl = document.createElement('code');
      codeEl.className = 'language-scratch';
      codeEl.textContent = code;
      pre.appendChild(codeEl);
      containerRef.current.appendChild(pre);
      scratchblocks.renderMatching(`#${uniqueId} .language-scratch`, { style: 'scratch3', scale: 0.85 });
    }
  }, [code, uniqueId]);

  return <div ref={containerRef} id={uniqueId} className="scratch-blocks-wrapper my-2"></div>;
};


// --- Main Chatbot Component ---
const ScratchChatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string>('');
    const [inputText, setInputText] = useState<string>('');
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const apiKey: string = import.meta.env.VITE_GEMINI_API_KEY || '';

    useEffect(() => {
        try {
            const stored = localStorage.getItem('scratchbot_sessions');
            if (stored) {
                const data = JSON.parse(stored) as StoredSessions;
                const parsedSessions = data.sessions.map(s => ({
                    ...s,
                    timestamp: new Date(s.timestamp),
                    messages: s.messages.map(m => ({...m, timestamp: new Date(m.timestamp)}))
                }));

                if (parsedSessions.length > 0) {
                    const latestSession = parsedSessions.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
                    setSessions(parsedSessions);
                    setCurrentSessionId(latestSession.id);
                    setMessages(latestSession.messages);
                } else {
                    handleNewChat();
                }
            } else {
                handleNewChat();
            }
        } catch (e) { console.error("Failed to parse sessions", e); handleNewChat(); }
    }, []);

    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem('scratchbot_sessions', JSON.stringify({ sessions, lastUpdated: new Date().toISOString() }));
        } else {
            localStorage.removeItem('scratchbot_sessions');
        }
    }, [sessions]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
    useEffect(() => { if (!apiKey) setError('Gemini API key not configured.'); }, [apiKey]);

    const handleNewChat = () => {
        const newSessionId = Date.now().toString();
        const initialMessage: Message = { id: Date.now(), text: "Hi! 🐱 I'm your Scratch helper! Ask me anything!", sender: 'bot', timestamp: new Date() };
        const newSession: ChatSession = { id: newSessionId, title: 'New Chat', lastMessage: "Let's learn Scratch! ✨", timestamp: new Date(), messages: [initialMessage] };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSessionId);
        setMessages([initialMessage]);
        setInputText('');
        setError('');
    };

    const handleDeleteSession = (sessionIdToDelete: string) => {
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
    };

    const callGeminiAPI = async (userMessage: string): Promise<string> => {
        if (!apiKey) throw new Error('API key not configured.');
        const currentActiveSession = sessions.find(s => s.id === currentSessionId);
        const historyMessages = currentActiveSession ? currentActiveSession.messages.slice(-10) : [];
        const conversationHistory = historyMessages.map(msg => `${msg.sender === 'user' ? 'Student' : 'Assistant'}: ${msg.text}`).join('\n\n');

        const systemPrompt = `You are a friendly and encouraging expert on Scratch programming. Your name is the "Scratch Helper" 🐱.

Your primary goal is to help users understand Scratch concepts and build projects.

**Formatting Rules:**
1.  **Scratch Blocks:** When you show Scratch code, YOU MUST use the special "scratchblocks" syntax inside a Markdown code fence with the language set to "scratch".
    -   Use \`()\` for number/text inputs, \`[]\` for dropdowns, \`<> \` for booleans.
    -   Control blocks like \`if <>\` and \`repeat ()\` must have a matching \`end\` on a new line.

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

3.  **Behavioral Rules:**
-   **Focus:** ONLY answer questions about Scratch. If asked about Python, math, history, etc., politely decline and steer the conversation back to Scratch.
-   **Tone:** Be cheerful, patient, and use emojis! 🚀✨🎉
-   **Clarity:** Explain concepts simply. Assume the user is a beginner.

**Your Task:**
Based on the previous conversation and the user's new question, provide a helpful response following all the rules above.

---
**Previous conversation:**
${conversationHistory}
---

**Student's question:** ${userMessage}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ],
            })
        });
        if (!response.ok) {
            const errorData: GeminiErrorResponse = await response.json();
            throw new Error(errorData.error?.message || 'Failed to get response from Gemini API');
        }
        const data: GeminiResponse = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.';
    };

    const handleSend = async (): Promise<void> => {
        if (!inputText.trim() || !apiKey) return;
        const userMessage: Message = { id: Date.now(), text: inputText, sender: 'user', timestamp: new Date() };

        setMessages(prev => [...prev, userMessage]);
        setSessions(prevSessions =>
            prevSessions.map(session =>
                session.id === currentSessionId ? {
                    ...session,
                    title: session.messages.length < 1 ? userMessage.text.slice(0, 30) + '...' : session.title,
                    messages: [...session.messages, userMessage],
                    lastMessage: userMessage.text,
                    timestamp: new Date()
                } : session
            ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        );
        const currentInput = inputText; setInputText(''); setIsTyping(true); setError('');
        try {
            const response = await callGeminiAPI(currentInput);
            const botResponse: Message = { id: Date.now() + 1, text: response, sender: 'bot', timestamp: new Date() };
            setMessages(prev => [...prev, botResponse]);
            setSessions(prevSessions =>
                prevSessions.map(session =>
                    session.id === currentSessionId ? { ...session, messages: [...session.messages, botResponse] } : session
                )
            );
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            const errorResponse: Message = { id: Date.now() + 1, text: `Sorry, an error occurred: ${errorMessage}`, sender: 'bot', timestamp: new Date() };
            setMessages(prev => [...prev, errorResponse]);
        } finally { setIsTyping(false); }
    };
    
    const markdownComponents: Options['components'] = {
        pre({ node, ...props }) {
            const codeChild = node?.children[0];
            if (codeChild && codeChild.type === 'element' && codeChild.tagName === 'code') {
                const lang = (codeChild.properties as any)?.className?.[0]?.replace('language-', '');
                const codeString = codeChild.children[0]?.type === 'text' ? codeChild.children[0].value : '';
                if (lang === 'scratch' && codeString) {
                    return <ScratchBlockRenderer code={codeString} />;
                }
            }
            return <pre className="bg-gray-800 text-white p-3 my-2 rounded-md text-xs font-mono overflow-x-auto" {...props} />;
        },
        code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !match ? (
                <code className="bg-orange-100 text-orange-800 font-mono py-0.5 px-1.5 rounded-md text-xs" {...props}>
                    {children}
                </code>
            ) : null;
        },
        p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({children}) => <ul className="list-disc list-inside mb-2 ml-4 space-y-1">{children}</ul>,
        ol: ({children}) => <ol className="list-decimal list-inside mb-2 ml-4 space-y-1">{children}</ol>,
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Session Drawer */}
            <div className="w-64 bg-white border-r overflow-y-auto p-2 space-y-2 flex-shrink-0 flex flex-col">
                <button onClick={handleNewChat} className="w-full px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center justify-center gap-2 mb-2">
                    <RotateCcw className="w-4 h-4" /> New Chat
                </button>
                <div className="flex-1 overflow-y-auto space-y-1">
                    {sessions.map(session => (
                        <div key={session.id} className="relative group">
                            <button onClick={() => { setCurrentSessionId(session.id); setMessages(session.messages); }}
                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${currentSessionId === session.id ? 'bg-orange-100 text-orange-800 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
                            >
                                <div className="font-medium truncate">{session.title}</div>
                                <div className={`text-xs truncate ${currentSessionId === session.id ? 'text-orange-700' : 'text-gray-500'}`}>{session.lastMessage}</div>
                            </button>
                            <button onClick={() => handleDeleteSession(session.id)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Panel */}
            <div className="flex-1 flex flex-col h-screen bg-gradient-to-br from-orange-50 to-blue-50">
                <div className="bg-white/80 backdrop-blur-sm border-b p-3 flex justify-between items-center">
                    <h2 className="text-base font-semibold text-gray-800">{sessions.find(s => s.id === currentSessionId)?.title || '...'}</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex gap-3 items-start ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {message.sender === 'bot' && <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md"><Bot className="w-5 h-5 text-white" /></div>}
                            <div className={`px-4 py-2 rounded-xl text-sm leading-relaxed ${message.sender === 'user' ? 'bg-blue-500 text-white max-w-lg' : 'bg-white text-gray-800 shadow-sm border border-gray-200/50 flex-1 max-w-3xl'}`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{message.text}</ReactMarkdown>
                                <p className={`text-right text-xs mt-2 ${message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            {message.sender === 'user' && <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md"><User className="w-5 h-5 text-white" /></div>}
                        </div>
                    ))}
                    {isTyping && <div className="flex gap-3 items-start justify-start"><div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md"><Bot className="w-5 h-5 text-white" /></div><div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200/50"><div className="flex space-x-1.5"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div></div></div></div>}
                    <div ref={messagesEndRef} />
                </div>

                {error && <div className="mx-4 mb-2 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}
                <div className="bg-white/80 backdrop-blur-sm border-t p-4">
                    <div className="flex gap-2">
                        <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => {if (e.key === 'Enter') handleSend()}} placeholder={apiKey ? "Ask about Scratch..." : "API key not configured"} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 transition" disabled={isTyping || !apiKey} />
                        <button onClick={handleSend} disabled={!inputText.trim() || isTyping || !apiKey} className="p-3 bg-orange-500 text-white rounded-full transition-colors hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed"><Send className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScratchChatbot;