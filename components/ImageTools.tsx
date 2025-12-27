
import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, Video, X, Loader2, Send, Key } from 'lucide-react';
import { gemini } from '../services/geminiService';

interface ImageToolsProps {
  onClose: () => void;
  onSend: (type: 'image' | 'video', content: string) => void;
}

const ImageTools: React.FC<ImageToolsProps> = ({ onClose, onSend }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'edit' | 'animate'>('edit');
  const [status, setStatus] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => setSourceImage(re.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!sourceImage || !prompt) return;

    // MANDATORY check for Veo models
    if (mode === 'animate' && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
      // Assume success and proceed per guidelines
    }

    setIsProcessing(true);
    setStatus(mode === 'edit' ? 'Rewriting pixels...' : 'Generating temporal frames...');
    
    try {
      if (mode === 'edit') {
        const result = await gemini.editImage(sourceImage, prompt);
        if (result) {
          onSend('image', result);
          onClose();
        }
      } else {
        const result = await gemini.generateVideo(sourceImage, prompt);
        if (result) {
          onSend('video', result);
          onClose();
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      }
      setStatus('Neural sync failure. Check credentials.');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex gap-4">
            <button 
              onClick={() => setMode('edit')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'edit' ? 'bg-cyan-600 text-white' : 'text-zinc-500 hover:bg-zinc-800'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI EDIT
            </button>
            <button 
              onClick={() => setMode('animate')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'animate' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:bg-zinc-800'}`}
            >
              <Video className="w-3.5 h-3.5" /> VEO ANIMATE
            </button>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="aspect-video bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl overflow-hidden flex flex-col items-center justify-center relative group">
            {sourceImage ? (
              <img src={sourceImage} className="w-full h-full object-contain" alt="Preview" />
            ) : (
              <label className="flex flex-col items-center cursor-pointer p-8 w-full h-full">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-zinc-800 transition-colors">
                  <ImageIcon className="w-8 h-8 text-zinc-600 group-hover:text-cyan-500 transition-colors" />
                </div>
                <span className="text-zinc-500 text-sm font-medium">Upload Image Reference</span>
                <span className="text-zinc-700 text-[10px] uppercase mt-1 tracking-widest font-bold">PNG / JPG</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            )}
            {sourceImage && !isProcessing && (
              <button 
                onClick={() => setSourceImage(null)}
                className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-full hover:bg-red-500/50 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Neural Instruction</label>
              {mode === 'animate' && (
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[10px] text-zinc-600 hover:text-purple-400 flex items-center gap-1">
                  <Key className="w-2.5 h-2.5" /> Requires Paid Key
                </a>
              )}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isProcessing}
              placeholder={mode === 'edit' ? "e.g., 'Change the sky to neon pink and add flying cars'" : "e.g., 'The camera zooms in slowly while the neon signs flicker'"}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none min-h-[100px] resize-none placeholder:text-zinc-800 disabled:opacity-50"
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={handleProcess}
              disabled={!sourceImage || !prompt || isProcessing}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all ${
                isProcessing 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                : mode === 'edit' ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_10px_20px_-10px_rgba(8,145,178,0.5)]' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_10px_20px_-10px_rgba(147,51,234,0.5)]'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Initialize Transmission
                </>
              )}
            </button>
            
            {status && (
              <p className="text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest animate-pulse">
                {status}
              </p>
            )}
            
            {mode === 'animate' && isProcessing && (
              <p className="text-center text-[9px] text-zinc-600 leading-relaxed max-w-xs mx-auto">
                Temporal sequence generation can take up to 3 minutes. Do not close this interface.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageTools;
