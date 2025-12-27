
import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Mic, Palette, Smile, MoreVertical, ShieldAlert, Key } from 'lucide-react';
import { Message, User } from './types';
import { generateCodeName } from './utils/names';
import DrawingBoard from './components/DrawingBoard';
import ImageTools from './components/ImageTools';
import VoiceSession from './components/VoiceSession';

declare global {
  /* Define the AIStudio interface to provide type safety for the globally pre-configured window.aistudio object */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showDrawing, setShowDrawing] = useState(false);
  const [showImageTools, setShowImageTools] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [hasKey, setHasKey] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate code name on first visit
    const existing = localStorage.getItem('neon_user');
    if (existing) {
      setCurrentUser(JSON.parse(existing));
    } else {
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        codeName: generateCodeName(),
        avatar: `https://picsum.photos/seed/${Math.random()}/100/100`
      };
      setCurrentUser(newUser);
      localStorage.setItem('neon_user', JSON.stringify(newUser));
    }

    // Check key status using the global aistudio object
    window.aistudio?.hasSelectedApiKey().then(setHasKey);

    // Initial greeting
    setMessages([{
      id: 'welcome',
      sender: 'RELAY-CORE',
      type: 'text',
      content: 'Encrypted channel established. Identity obscured by algorithm. Voice and visual uplinks online.',
      timestamp: Date.now()
    }]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (type: Message['type'] = 'text', content: string = inputText) => {
    if (!content.trim() && type === 'text') return;
    if (!currentUser) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: currentUser.codeName,
      type,
      content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    if (type === 'text') setInputText('');
  };

  const renderMessage = (msg: Message) => {
    const isMe = msg.sender === currentUser?.codeName;
    const isSystem = msg.sender.includes('CORE') || msg.sender.includes('NODE');

    return (
      <div key={msg.id} className={`flex flex-col mb-6 ${isMe ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className={`text-[9px] font-black uppercase tracking-widest ${isSystem ? 'text-cyan-500' : isMe ? 'text-zinc-500' : 'text-purple-400'}`}>
            {msg.sender}
          </span>
          <span className="text-[9px] text-zinc-700 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
        
        <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-lg ${
          isMe ? 'bg-zinc-800 text-zinc-100 rounded-tr-none border border-zinc-700/50' : 
          isSystem ? 'bg-cyan-950/10 border border-cyan-500/20 text-cyan-50 rounded-tl-none italic backdrop-blur-sm' : 
          'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
        }`}>
          {msg.type === 'text' && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
          {msg.type === 'image' && (
            <div className="space-y-2">
               <img src={msg.content} className="rounded-lg w-full max-h-[400px] object-contain bg-black shadow-inner" alt="Relay" />
               <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Image Data Decrypted</p>
            </div>
          )}
          {msg.type === 'drawing' && (
            <div className="bg-white rounded-lg p-1.5 shadow-inner">
              <img src={msg.content} className="w-full h-auto" alt="Drawing" />
            </div>
          )}
          {msg.type === 'video' && (
             <div className="space-y-2">
                <video src={msg.content} controls className="rounded-lg w-full max-h-[400px] bg-black shadow-2xl" />
                <p className="text-[9px] text-purple-500 uppercase font-black tracking-widest">Veo Temporal Stream Active</p>
             </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-zinc-950 font-sans selection:bg-cyan-500/30">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">
              Neon Relay <span className="text-cyan-500">v2.5</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-black">Secure Link Established</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {!hasKey && (
             <button 
              onClick={() => window.aistudio.openSelectKey().then(() => setHasKey(true))}
              className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[9px] font-black text-yellow-500 hover:bg-yellow-500/20 transition-all uppercase"
             >
               <Key className="w-3 h-3" /> Fix Auth
             </button>
           )}
           <div className="hidden sm:flex flex-col items-end">
             <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Code ID</span>
             <span className="text-xs font-mono text-cyan-400 font-bold tracking-tight">{currentUser?.codeName}</span>
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-transparent to-transparent">
        <div className="max-w-3xl mx-auto">
          {messages.map(renderMessage)}
          <div ref={chatEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => setShowDrawing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-zinc-800 transition-all shrink-0"
            >
              <Palette className="w-3.5 h-3.5" /> Sketch
            </button>
            <button 
              onClick={() => setShowImageTools(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-purple-400 hover:border-purple-500/30 hover:bg-zinc-800 transition-all shrink-0"
            >
              <ImageIcon className="w-3.5 h-3.5" /> AI Frame
            </button>
            <button 
              onClick={() => setShowVoice(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-green-400 hover:border-green-500/30 hover:bg-zinc-800 transition-all shrink-0"
            >
              <Mic className="w-3.5 h-3.5" /> Voice Link
            </button>
            <button 
              onClick={() => handleSend('text', '⚡')}
              className="flex items-center justify-center w-10 h-10 bg-zinc-900/50 border border-zinc-800 rounded-xl text-lg hover:border-yellow-500/30 transition-all shrink-0"
            >
              ⚡
            </button>
          </div>

          <div className="flex gap-2 bg-zinc-900/80 rounded-2xl p-2 border border-zinc-800 focus-within:border-cyan-500/50 transition-all backdrop-blur-sm">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Inject Signal To Relay..."
              className="flex-1 bg-transparent border-none focus:outline-none px-4 text-sm text-zinc-200 placeholder:text-zinc-700 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.2em] placeholder:font-black"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              className={`p-3 rounded-xl transition-all ${
                inputText.trim() 
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-500 active:scale-95' 
                  : 'text-zinc-800'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>

      {showDrawing && <DrawingBoard onSend={(data) => handleSend('drawing', data)} onClose={() => setShowDrawing(false)} />}
      {showImageTools && <ImageTools onSend={(type, content) => handleSend(type, content)} onClose={() => setShowImageTools(false)} />}
      {showVoice && <VoiceSession onClose={() => setShowVoice(false)} />}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #27272a; }
      `}</style>
    </div>
  );
};

export default App;
