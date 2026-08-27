import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import { Activity, Heart, Zap, ShieldCheck, Cpu, MessageSquare, Terminal } from 'lucide-react';
import { useAnabelle } from './hooks/useAnabelle';
import { Avatar } from './components/Avatar';

export default function App() {
  const { analysis, startEngine } = useAnabelle();
  const [isInitialized, setIsInitialized] = useState(false);

  const handleStart = () => {
    startEngine();
    setIsInitialized(true);
  };

  return (
    <div className="h-screen w-screen bg-[#050505] text-white flex overflow-hidden font-sans">
      
      {/* LEFT SIDE: THE 3D VIEWPORT */}
      <div className="flex-grow relative bg-gradient-to-b from-[#080808] to-[#121212]">
        <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          <Avatar analysis={analysis} />
          
          <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={10} blur={2.2} far={4} />
          <Environment preset="night" />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>

        {/* STATUS HUD */}
        {isInitialized && (
          <div className="absolute bottom-8 left-8 flex items-center gap-4 animate-pulse">
            <div className={`w-2 h-2 rounded-full ${analysis.isSpeaking ? 'bg-anabelle-cyan shadow-[0_0_10px_#00f2ff]' : 'bg-white/20'}`} />
            <span className="text-[10px] font-mono tracking-[0.3em] text-white/40 uppercase">
              {analysis.isSpeaking ? 'Cognitive Processing Active' : 'System Standby'}
            </span>
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

      {/* RIGHT SIDE: COMMAND PANEL */}
      <div className="w-96 bg-[#0a0a0a] border-l border-white/5 p-8 flex flex-col gap-8 shadow-2xl overflow-y-auto custom-scrollbar">
        
        {/* BRANDING */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-anabelle-cyan">
              <Zap size={20} fill="currentColor" />
              <h1 className="text-2xl font-black tracking-tighter italic">ANABELLE</h1>
            </div>
            <p className="text-[10px] text-white/20 tracking-[0.3em] uppercase mt-1">Cognitive Control Deck</p>
          </div>
        </div>

        {/* METRICS: VOICE REFLEXES */}
        <section className="space-y-4">
          <header className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <Activity size={14} /> Voice DNA (Local)
          </header>
          <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-4">
            <MetricRow label="Energy / Reflex" value={analysis.energy} color="bg-anabelle-cyan" />
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-white/30 uppercase">Status</span>
              <span className={analysis.isSpeaking ? "text-anabelle-cyan" : "text-white/10"}>
                {analysis.isSpeaking ? "SPEAKING" : "SILENT"}
              </span>
            </div>
          </div>
        </section>

        {/* COGNITIVE STREAM: AI TRANSCRIPTION */}
        <section className="space-y-4">
          <header className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <MessageSquare size={14} /> Cognitive Stream (AI)
          </header>
          <div className="bg-black p-4 rounded-xl border border-white/10 min-h-[80px] flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-2 right-3 flex gap-1">
                <div className="w-1 h-1 rounded-full bg-red-500/50" />
                <div className="w-1 h-1 rounded-full bg-yellow-500/50" />
                <div className="w-1 h-1 rounded-full bg-green-500/50" />
             </div>
             <p className="text-xs font-mono italic text-anabelle-cyan/80 leading-relaxed">
               {analysis.isSpeaking ? `"${analysis.rawText}..."` : "> Awaiting vocal input..."}
             </p>
          </div>
        </section>

        {/* AFFECTIVE STATE: AI EMOTION */}
        <section className="space-y-4">
          <header className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <Heart size={14} /> Inferred Emotion
          </header>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-anabelle-cyan to-anabelle-magenta rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <div className="relative bg-[#050505] border border-white/10 p-8 rounded-2xl text-center">
              <div className="text-4xl font-black tracking-tight text-white mb-1 uppercase">
                {analysis.emotion}
              </div>
              <div className="text-[8px] text-white/30 uppercase tracking-[0.4em]">Inference Source: {analysis.source}</div>
            </div>
          </div>
        </section>

        {/* SYSTEM CONSOLE */}
        <div className="mt-auto p-4 bg-black rounded-lg border border-white/5 font-mono text-[9px] text-white/20 space-y-1">
          <div className="flex items-center gap-2 text-anabelle-cyan/40">
            <Terminal size={10} /> <span>SYSTEM_LOG_v2.0.4</span>
          </div>
          <p>{`> BACKEND: WS://LOCALHOST:8000`}</p>
          <p>{`> ENGINE: SENSE_VOICE_SMALL`}</p>
          <p>{`> LATENCY: < 150MS_VAR`}</p>
        </div>
      </div>
    </div>
  );
}

// UI HELPER: METRIC BARS
function MetricRow({ label, value, color }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[9px] uppercase tracking-wider font-bold">
        <span className="text-white/40">{label}</span>
        <span className="text-white/80">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-150 ease-out`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}