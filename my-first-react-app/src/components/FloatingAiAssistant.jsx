import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api.js';

export default function FloatingAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hi! I am your AI Career Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll logic: triggers when messages change or loading state toggles
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await api.chatWithAi(input);
      setMessages(prev => [...prev, { role: 'ai', content: reply || "I'm sorry, I couldn't generate a response." }]);
    } catch (error) {
      console.error("Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      { role: 'ai', content: 'Hi! I am your AI Career Assistant. How can I help you today?' }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans no-invert">
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95 ${
          isOpen ? 'bg-gray-100 text-gray-600 rotate-90' : 'bg-brand-blue text-white hover:bg-button-hover shadow-brand-blue/30'
        }`}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.464 15.05a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0z" /></svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-classy-fade flex flex-col">
          <div className="p-4 bg-brand-blue text-white font-black flex justify-between items-center shrink-0">
            <span className="tracking-tight uppercase text-xs">AI Career Coach</span>
            <div className="flex items-center gap-3">
               <button 
                 onClick={handleClearChat}
                 className="text-[10px] font-bold bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-all active:scale-95"
                 title="Clear conversation"
               >
                 Clear
               </button>
               <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>
          
          <div className="flex-1 max-h-[400px] min-h-[300px] overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-brand-blue text-white rounded-tr-none' 
                    : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none flex gap-1 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex gap-2 shrink-0">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-blue outline-none transition-all placeholder:text-gray-400"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 flex items-center justify-center bg-brand-blue text-white rounded-xl hover:bg-button-hover disabled:opacity-40 transition-all active:scale-95 shadow-lg shadow-brand-blue/20"
            >
              <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}