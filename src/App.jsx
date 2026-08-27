import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import { Activity, Heart, Zap, ShieldCheck, MessageSquare, Terminal, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useAnabelle } from './hooks/useAnabelle';
import { Avatar } from './components/Avatar';

export default function App() {
  const { analysis, startEngine, stopEngine } = useAnabelle();
  const [isInitialized, setIsInitialized] = useState(false);

  const handleStart = () => {
    startEngine();
    setIsInitialized(true);
  };

  const handleRetry = () => {
    stopEngine();
    setTimeout(startEngine, 500);
  };

  return (
    <div className="h-screen w-screen bg-[#050505] text-white flex overflow-hidden font-sans">
      
      {/* LEFT VIEWPORT */}
      <div className="flex-grow relative bg-gradient-to-b from-[#080808] to-[#121212]">
        <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <Avatar analysis={analysis} />
          <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={10} blur={2.2} far={4} />
          <Environment preset="night" />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>

        {/* CONNECTION ERROR OVERLAY */}
        {analysis.status === 'error' && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-fit min-w-[400px] z-[60] animate-in slide-in-from-top duration-500">
            <div className="bg-red-950/40 backdrop-blur-md border border-red-500/50 p-4 rounded-2xl flex items-center justify-between gap-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={20} />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Connection Failure</p>
                  <p className="text-xs text-white/70 font-medium">{analysis.errorMessage}</p>
                </div>
              </div>
              <button 
                onClick={handleRetry}
                className="p-2 hover:bg-red-500/20 rounded-full transition-colors group"
              >
                <RefreshCcw size={16} className="text-red-400 group-active:rotate-180 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* INITIALIZATION OVERLAY */}
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-3xl z-50">
            <div className="text-center space-y-8 p-12 rounded-3xl border border-white/5 bg-white/[0.01]">
              <div className="text-anabelle-cyan flex justify-center mb-4">
                <ShieldCheck size={80} strokeWidth={1} className="animate-pulse" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-extralight tracking-[0.4em] text-white/90">ANABELLE</h1>
                <p className="text-[9px] text-anabelle-cyan/60 tracking-[0.6em] uppercase">Affective Avatar Engine v2.0</p>
              </div>
              <button 
                onClick={handleStart}
                className="px-12 py-4 bg-transparent border border-anabelle-cyan/40 text-anabelle-cyan text-xs font-bold tracking-[0.3em] hover:bg-anabelle-cyan hover:text-black transition-all duration-500 rounded-full"
              >
                INITIALIZE ENGINE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE DASHBOARD */}
      <div className="w-96 bg-[#0a0a0a] border-l border-white/5 p-8 flex flex-col gap-8 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-anabelle-cyan">
              <Zap size={20} fill="currentColor" />
              <h1 className="text-2xl font-black tracking-tighter italic">ANABELLE</h1>
            </div>
            <p className="text-[10px] text-white/20 tracking-[0.3em] uppercase mt-1">Cognitive Control Deck</p>
          </div>
          <div className={`w-2 h-2 rounded-full ${analysis.status === 'active' ? 'bg-anabelle-cyan shadow-[0_0_8px_cyan]' : analysis.status === 'error' ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-white/10'}`} />
        </div>

        <section className="space-y-4">
          <header className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <Activity size={14} /> Voice DNA
          </header>
          <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-4">
            <MetricRow label="Energy / Reflex" value={analysis.energy} color="bg-anabelle-cyan" />
          </div>
        </section>

        <section className="space-y-4">
          <header className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <MessageSquare size={14} /> Cognitive Stream
          </header>
          <div className="bg-black p-4 rounded-xl border border-white/10 min-h-[80px] flex flex-col justify-center relative">
             <p className="text-xs font-mono italic text-anabelle-cyan/80">
               {analysis.isSpeaking ? `"${analysis.rawText}..."` : "> Awaiting vocal input..."}
             </p>
          </div>
        </section>

        <section className="space-y-4">
          <header className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <Heart size={14} /> Inferred Emotion
          </header>
          <div className="relative bg-[#050505] border border-white/10 p-8 rounded-2xl text-center shadow-inner">
            <div className="text-4xl font-black tracking-tight text-white mb-1 uppercase">
              {analysis.emotion}
            </div>
            <div className="text-[8px] text-white/30 uppercase tracking-[0.4em]">Source: {analysis.source}</div>
          </div>
        </section>

        <div className="mt-auto p-4 bg-black rounded-lg border border-white/5 font-mono text-[9px] text-white/20 space-y-1">
          <div className="flex items-center gap-2 text-anabelle-cyan/40">
            <Terminal size={10} /> <span>SYSTEM_LOG</span>
          </div>
          <p>{`> BACKEND_STATUS: ${analysis.status.toUpperCase()}`}</p>
          <p>{`> PACKET_LOSS: 0.0%`}</p>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[9px] uppercase tracking-wider font-bold">
        <span className="text-white/40">{label}</span>
        <span className="text-white/80">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-150 ease-out`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}