import { useState, useRef, useCallback } from 'react';

export const useAnabelle = () => {
  const [analysis, setAnalysis] = useState({
    energy: 0,
    emotion: 'NEUTRAL',
    rawText: '',
    source: 'STANDBY',
    isSpeaking: false,
    status: 'idle',
    errorMessage: ''
  });

  const socketRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);

  // --- REAL-TIME TUNING ---
  const SAMPLE_RATE = 16000;
  // 16384 samples = ~1.024 seconds of audio. 
  // This matches our backend's 0.5s rate limit and provides stable AI context.
  const BUFFER_SIZE = 16384; 

  const startEngine = useCallback(async () => {
    setAnalysis(prev => ({ ...prev, status: 'connecting', errorMessage: '' }));

    try {
      socketRef.current = new WebSocket("ws://localhost:8000/ws/anabelle");

      socketRef.current.onopen = () => {
        setAnalysis(prev => ({ ...prev, status: 'active', source: 'AI_CONNECTED' }));
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // When AI sends a result, update the emotion and text
        setAnalysis(prev => ({
          ...prev,
          emotion: data.emotion,
          rawText: data.raw_text || prev.rawText,
          source: data.source || 'AI_MODEL'
        }));
      };

      socketRef.current.onerror = () => {
        setAnalysis(prev => ({ 
          ...prev, 
          status: 'error', 
          errorMessage: 'Backend unreachable. Start Python main.py first.' 
        }));
      };

      // 2. Audio Pipeline
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioCtxRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      
      processorRef.current = audioCtxRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // --- INSTANT REFLEX (Local) ---
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
        const rms = Math.sqrt(sum / inputData.length);
        const currentEnergy = Math.max(0, Math.min(1, rms * 10));

        // Update local bars 60 times a second
        setAnalysis(prev => ({
          ...prev,
          energy: currentEnergy,
          isSpeaking: currentEnergy > 0.02
        }));

        // --- DEFERRED COGNITION (Remote) ---
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(inputData.buffer);
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioCtxRef.current.destination);

    } catch (err) {
      setAnalysis(prev => ({ ...prev, status: 'error', errorMessage: 'Mic initialization failed.' }));
    }
  }, []);

  const stopEngine = useCallback(() => {
    socketRef.current?.close();
    processorRef.current?.disconnect();
    audioCtxRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setAnalysis(prev => ({ ...prev, status: 'idle' }));
  }, []);

  return { analysis, startEngine, stopEngine };
};