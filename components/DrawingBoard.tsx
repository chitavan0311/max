
import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, Trash2, Send, X } from 'lucide-react';

interface DrawingBoardProps {
  onClose: () => void;
  onSend: (dataUrl: string) => void;
}

const DrawingBoard: React.FC<DrawingBoardProps> = ({ onClose, onSend }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#22d3ee');
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
  }, [color]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext('2d')?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineWidth = tool === 'eraser' ? 20 : 3;
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSend(canvas.toDataURL());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Pencil className="w-5 h-5 text-cyan-400" />
            Nano Draw
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="relative bg-white h-[400px]">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full h-full cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
          />
        </div>

        <div className="p-4 flex flex-wrap gap-4 items-center bg-zinc-900/50">
          <div className="flex gap-2">
            <button 
              onClick={() => setTool('pencil')}
              className={`p-2 rounded-lg transition-colors ${tool === 'pencil' ? 'bg-cyan-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-cyan-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
            >
              <Eraser className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-2">
            {['#22d3ee', '#f472b6', '#a78bfa', '#fbbf24', '#4ade80', '#000000'].map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool('pencil'); }}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex-1" />
          
          <button onClick={handleClear} className="p-2 text-zinc-400 hover:text-red-400 transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleSend}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
          >
            <Send className="w-5 h-5" />
            Broadcast
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawingBoard;
