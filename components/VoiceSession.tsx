
import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Volume2, X, AlertTriangle } from 'lucide-react';
import { gemini } from '../services/geminiService';

interface VoiceSessionProps {
  onClose: () => void;
}

const VoiceSession: React.FC<VoiceSessionProps> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState('Initiating encrypted uplink...');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
  };

  useEffect(() => {
    let stream: MediaStream;
    let inputCtx: AudioContext;
    let scriptProcessor: ScriptProcessorNode;

    const startSession = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        inputCtx = new AudioContext({ sampleRate: 16000 });

        sessionPromiseRef.current = gemini.connectVoice({
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              // CRITICAL: Always use the promise to send input
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            setStatus('Neural Link Active');
            setIsActive(true);
          },
          onmessage: async (message: any) => {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of sourcesRef.current) {
                try { source.stop(); } catch(e) {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.error('Voice Error', e);
            setStatus('Relay Fault Detected');
          },
          onclose: () => {
            setIsActive(false);
            setStatus('Uplink Terminated');
          }
        });
      } catch (err) {
        console.error(err);
        setStatus('Microphone Access Denied');
      }
    };

    startSession();

    return () => {
      stream?.getTracks().forEach(t => t.stop());
      inputCtx?.close();
      sessionPromiseRef.current?.then(s => s.close());
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl relative">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-cyan-500 animate-pulse' : 'bg-red-500'}`} />
            <h3 className="text-lg font-bold tracking-tight uppercase">Voice Relay</h3>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-16 px-10 gap-8">
          <div className="relative">
            <div className={`absolute inset-0 bg-cyan-500/10 rounded-full blur-3xl transition-all duration-1000 ${isActive ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`} />
            <div className={`w-36 h-36 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative z-10 ${isActive ? 'border-cyan-500/50 scale-105 shadow-[0_0_30px_rgba(6,182,212,0.2)]' : 'border-zinc-800'}`}>
              {isActive ? (
                <div className="flex items-center gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ height: `${20 + i * 10}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              ) : <MicOff className="w-12 h-12 text-zinc-700" />}
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <p className={`text-sm font-bold tracking-widest uppercase transition-colors ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`}>
              {status}
            </p>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-[280px] mx-auto italic">
              "Stay quiet during neural feedback. Connection is unmonitored."
            </p>
          </div>
        </div>

        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800">
           <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
             <Volume2 className="w-3 h-3" /> Output Monitor Active
           </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSession;
