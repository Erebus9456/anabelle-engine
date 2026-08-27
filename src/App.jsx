import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import { Mic, Activity, Heart, Zap, ShieldCheck, Settings2, RotateCcw, BarChart3 } from 'lucide-react';
import { useAnabelle } from './hooks/useAnabelle';
import { Avatar } from './components/Avatar';

export default function App() {
  // 1. ENGINE CONFIGURATION STATE
  const [settings, setSettings] = useState({
    energyGain: 25,
    energyThreshold: 0.1,
    smoothing: 0.9,
    pitchScale: 6000,
    valenceOffset: 0.2,
    stabilityFrames: 15
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [showTuning, setShowTuning] = useState(false);

  // 2. LOAD EXTERNAL CALIBRATION (If exists)
  useEffect(() => {
    fetch('/config.json')
      .then(res => res.json())
      .then(data => setSettings(prev => ({ ...prev, ...data })))
      .catch(() => console.log("Using internal engine defaults"));
  }, []);

  // 3. INITIALIZE ANABELLE ENGINE
  const { analysis, startEngine } = useAnabelle(settings);

  const handleStart = () => {
    startEngine();
    setIsInitialized(true);
  };

  return (
    <div className="h-screen w-screen bg-black text-white flex overflow-hidden font-sans">
      
      {/* LEFT VIEWPORT: THE REAL-TIME AVATAR */}
      <div className="flex-grow relative bg-gradient-to-b from-[#050505] to-[#0f0f0f]">
        <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Avatar analysis={analysis} />
          <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={10} blur={2} far={4} />
          <Environment preset="night" />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>

        {/* INITIALIZATION OVERLAY */}
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-2xl z-50">
            <div className="text-center space-y-8 p-12 border border-white/5 rounded-3xl bg-white/[0.02]">
              <div className="text-anabelle-cyan animate-pulse flex justify-center">
                <ShieldCheck size={80} strokeWidth={1} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-extralight tracking-[0.3em] text-white/90">ANABELLE</h2>
                <p className="text-[10px] text-anabelle-cyan/50 tracking-[0.5em] uppercase">Affective Intelligence Unit</p>
              </div>
              <button 
                onClick={handleStart}
                className="group relative px-12 py-4 overflow-hidden rounded-full border border-anabelle-cyan/50 transition-all hover:border-anabelle-cyan"
              >
                <div className="absolute inset-0 bg-anabelle-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative text-anabelle-cyan text-xs font-bold tracking-widest">WAKE ENGINE</span>
              </button>
            </div>
          </div>
        )}

        {/* CALIBRATION TOGGLE */}
        <button 
          onClick={() => setShowTuning(!showTuning)}
          className={`absolute top-8 left-8 p-3 rounded-xl border transition-all z-50 ${
            showTuning ? 'bg-anabelle-cyan border-anabelle-cyan text-black' : 'bg-white/5 border-white/10 text-white/40 hover:text-anabelle-cyan'
          }`}
        >
          <Settings2 size={20} />
        </button>
      </div>

      {/* RIGHT PANEL: COMMAND DECK */}
      <div className="w-96 bg-[#080808] border-l border-white/5 p-8 flex flex-col gap-10 shadow-2xl overflow-y-auto custom-scrollbar">
        
        {/* LOGO */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-anabelle-cyan">
              <Zap size={18} fill="currentColor" />
              <h1 className="text-xl font-black tracking-tighter italic">ANABELLE</h1>
            </div>
            <p className="text-[9px] text-white/20 tracking-[0.4em] mt-1 uppercase font-medium">Core v2.0 // Real-Time</p>
          </div>
          <div className={`px-2 py-1 rounded text-[8px] font-bold ${analysis.isSpeaking ? 'bg-anabelle-cyan/20 text-anabelle-cyan' : 'bg-white/5 text-white/20'}`}>
            {analysis.isSpeaking ? 'LIVE_STREAM' : 'STANDBY'}
          </div>
        </div>

        {showTuning ? (
          /* TUNING & CALIBRATION PANEL */
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="flex justify-between items-center text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2"><BarChart3 size={14}/> Engine Tuner</span>
              <button 
                onClick={() => setSettings({energyGain:25, energyThreshold:0.1, smoothing:0.9, pitchScale:6000, valenceOffset:0.2, stabilityFrames:15})}
                className="hover:text-anabelle-cyan transition-colors"
              >
                <RotateCcw size={14}/>
              </button>
            </header>

            <div className="space-y-6">
              <TuningSlider label="Input Sensitivity" value={settings.energyGain} min={5} max={60} step={1} onChange={(v) => setSettings({...settings, energyGain: v})} />
              <TuningSlider label="Noise Gate" value={settings.energyThreshold} min={0.01} max={0.3} step={0.01} onChange={(v) => setSettings({...settings, energyThreshold: v})} />
              <TuningSlider label="Temporal Smoothing" value={settings.smoothing} min={0.7} max={0.98} step={0.01} onChange={(v) => setSettings({...settings, smoothing: v})} />
              <TuningSlider label="Hz Scale (Pitch)" value={settings.pitchScale} min={2000} max={10000} step={100} onChange={(v) => setSettings({...settings, pitchScale: v})} />
              <TuningSlider label="Valence Bias" value={settings.valenceOffset} min={0.05} max={0.4} step={0.01} onChange={(v) => setSettings({...settings, valenceOffset: v})} />
              <TuningSlider label="Hysteresis (Stability)" value={settings.stabilityFrames} min={5} max={40} step={1} onChange={(v) => setSettings({...settings, stabilityFrames: v})} />
            </div>
          </div>
        ) : (
          /* ANALYSIS DASHBOARD */
          <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* ACOUSTIC DNA */}
            <section className="space-y-6">
              <header className="text-white/30 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                <Activity size={14} /> Acoustic DNA
              </header>
              <div className="space-y-4">
                <MetricRow label="Energy (Arousal)" value={analysis.energy} color="bg-anabelle-cyan shadow-[0_0_8px_rgba(0,242,255,0.5)]" />
                <MetricRow label="Prosody (Valence)" value={analysis.pitch} color="bg-anabelle-magenta shadow-[0_0_8px_rgba(255,0,234,0.5)]" />
                <MetricRow label="Vocal Harshness" value={analysis.harshness} color="bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              </div>
            </section>

            {/* AFFECTIVE INFERENCE */}
            <section className="space-y-6">
              <header className="text-white/30 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                <Heart size={14} /> Affective Inference
              </header>
              <div className="relative p-8 rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-1 h-full bg-anabelle-cyan opacity-50" />
                <div className="text-4xl font-black tracking-tighter text-white uppercase drop-shadow-2xl">
                  {analysis.emotion}
                </div>
                <p className="text-[9px] text-white/20 mt-2 tracking-[0.3em] font-mono">Inferred State</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-lg font-mono text-white/80">{(analysis.valence * 100).toFixed(0)}%</div>
                  <div className="text-[8px] text-white/30 uppercase">Positivity</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-lg font-mono text-white/80">{(analysis.arousal * 100).toFixed(0)}%</div>
                  <div className="text-[8px] text-white/30 uppercase">Intensity</div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* FOOTER STATS */}
        <div className="mt-auto pt-8 border-t border-white/5 flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[8px] text-white/20">
            <span>PROCESSED_FRAMES</span>
            <span className="text-white/40">512_SAMPLES</span>
          </div>
    <div className="flex justify-between font-mono text-[8px] text-white/20">
  <span>ENGINE_MODE</span>
  <span className="text-anabelle-cyan">SENSEVOICE_REMOTE_AI</span>
</div>
        </div>
      </div>
    </div>
  );
}

// UI HELPER: METRIC BARS
function MetricRow({ label, value, color }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
        <span className="text-white/40">{label}</span>
        <span className="text-white/80">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

// UI HELPER: TUNING SLIDERS
function TuningSlider({ label, value, min, max, step, onChange }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] uppercase font-mono">
        <span className="text-white/40">{label}</span>
        <span className="text-anabelle-cyan font-bold">{value}</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-anabelle-cyan"
      />
    </div>
  );
}