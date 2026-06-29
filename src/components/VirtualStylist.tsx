import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Compass, 
  Shirt, 
  Flame,
  ArrowRight,
  Info
} from 'lucide-react';
import { Product, ChatMessage } from '../types';

interface VirtualStylistProps {
  products: Product[];
  currentUser: any;
  onNavigate: (view: string, params?: any) => void;
  selectedProductId?: string;
}

export default function VirtualStylist({
  products,
  currentUser,
  onNavigate,
  selectedProductId
}: VirtualStylistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: `Hello! I am AuraStyle's digital Haute Couture Fashion Consultant. 
      
      I can analyze our premium collection, curate complete outfit lookbooks, or give you personalized style advice based on the season or occasion. 
      
      How can I style your wardrobe today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [season, setSeason] = useState('Summer');
  const [occasion, setOccasion] = useState('Casual');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    if (!textToSend) setInputText('');

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          selectedProductId,
          currentSeason: season,
          currentOccasion: occasion
        })
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.error) {
        setMessages(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            role: 'assistant',
            content: `I encountered an issue while retrieving your personalized styling selections. Please try again shortly.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            role: 'assistant',
            content: data.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'assistant',
          content: 'Oops! I had a temporary system connection hiccup. Let\'s try styling again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const starterPrompts = [
    { text: 'Suggest an outfit with the Oversized Hoodie', icon: Shirt },
    { text: 'What accessories go well with Tailored Trousers?', icon: Sparkles },
    { text: 'Help me dress for a formal winter dinner', icon: Flame },
    { text: 'Draft a casual luxury streetwear outfit lookbook', icon: Compass }
  ];

  return (
    <>
      {/* Floating launcher trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0d0d0d] border border-white/15 shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 hover:border-white/30"
        title="Consult AuraStyle Virtual AI Stylist"
        id="stylist-launcher-btn"
      >
        <Sparkles className="h-6 w-6 text-white animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/75 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[8px] font-bold text-black items-center justify-center">AI</span>
        </span>
      </button>

      {/* Slide-out styling panel */}
      {isOpen && (
        <div 
          className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-white/5 bg-[#050505]/95 backdrop-blur-xl shadow-2xl transition-all duration-300 flex flex-col"
          id="stylist-drawer"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4.5 bg-neutral-950/80">
            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Bot className="h-5 w-5 text-white/80" />
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-widest font-semibold text-white flex items-center space-x-1.5">
                  <span>AuraStyle Assistant</span>
                  <span className="rounded-full bg-emerald-500/5 px-2 py-0.5 text-[8px] font-bold text-emerald-400 border border-emerald-500/20">STYLING COUTURE</span>
                </h3>
                <p className="text-[10px] text-white/40 tracking-wider font-light">Bespoke Fashion Advisory</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition-colors"
              id="stylist-close-btn"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Context selectors (Season & Occasion) */}
          <div className="grid grid-cols-2 gap-2 p-3.5 bg-neutral-950/40 border-b border-white/5 text-xs">
            <div>
              <label className="block text-[9px] font-medium text-white/30 uppercase tracking-wider mb-1">Target Season</label>
              <select 
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full rounded bg-white/5 border border-white/10 p-1.5 text-white focus:outline-none focus:border-white/30 text-[11px] font-light"
              >
                <option value="Summer" className="bg-[#050505]">Summer Vacation</option>
                <option value="Winter" className="bg-[#050505]">Winter Layering</option>
                <option value="Spring" className="bg-[#050505]">Spring Palette</option>
                <option value="Autumn" className="bg-[#050505]">Autumn Overcoats</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-medium text-white/30 uppercase tracking-wider mb-1">Target Occasion</label>
              <select 
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full rounded bg-white/5 border border-white/10 p-1.5 text-white focus:outline-none focus:border-white/30 text-[11px] font-light"
              >
                <option value="Casual" className="bg-[#050505]">Casual Streetwear</option>
                <option value="Formal" className="bg-[#050505]">Formal Ceremony</option>
                <option value="Gym/Active" className="bg-[#050505]">Gym & Athletic</option>
                <option value="Resort" className="bg-[#050505]">Resort Travel</option>
              </select>
            </div>
          </div>

          {/* Messages container */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex space-x-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border shrink-0 ${msg.role === 'user' ? 'bg-white/10 border-white/20 text-white' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-white text-black font-normal' : 'bg-white/[0.02] text-white/80 border border-white/5 font-light'}`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex space-x-3 max-w-[85%]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center space-x-1.5 rounded-2xl bg-white/[0.02] px-4.5 py-3 border border-white/5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Catalog Quick Suggest links */}
          <div className="px-5 py-2.5 border-t border-white/5 bg-neutral-950 text-xs">
            <span className="text-[9px] text-white/30 uppercase tracking-[0.18em] block mb-2 font-medium">Matched Items in Catalog</span>
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {products.slice(0, 4).map((p) => (
                <div 
                  key={p.id}
                  onClick={() => {
                    onNavigate('product-detail', { id: p.id });
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-1.5 rounded-full border border-white/5 bg-white/5 px-3 py-1 cursor-pointer hover:border-white/20 hover:bg-white/10 transition-all shrink-0"
                >
                  <Shirt className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-light max-w-[100px] truncate text-white/80">{p.name}</span>
                  <ArrowRight className="h-3 w-3 text-white/40" />
                </div>
              ))}
            </div>
          </div>

          {/* Starter Quick Actions */}
          {messages.length === 1 && (
            <div className="px-5 py-3 bg-neutral-950/60 border-t border-white/5 grid grid-cols-2 gap-2 text-left">
              {starterPrompts.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.text)}
                    className="flex flex-col items-start rounded-xl border border-white/5 bg-white/[0.01] p-2.5 hover:border-white/20 hover:bg-white/[0.03] text-left transition-colors text-[10px] text-white/60 font-light"
                    id={`starter-prompt-${idx}`}
                  >
                    <Icon className="h-3.5 w-3.5 text-emerald-400 mb-1.5" />
                    <span className="line-clamp-2 leading-tight">{p.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Input form */}
          <div className="border-t border-white/5 p-4.5 bg-neutral-950/80">
            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Ask your digital styling advisor..."
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-xs font-light text-white placeholder-white/20 focus:outline-none focus:border-white/20"
                id="stylist-input"
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black transition-all hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
                id="stylist-send-btn"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] text-white/30 mt-2 pl-1.5 font-light">
              <Info className="h-3 w-3" />
              <span>Ask "Complete a winter lookbook" to test catalog suggestions.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
