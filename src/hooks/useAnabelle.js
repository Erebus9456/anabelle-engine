import { useState, useRef, useCallback, useEffect } from 'react';

export const useAnabelle = () => {
  const [analysis, setAnalysis] = useState({
    energy: 0,
    emotion: 'NEUTRAL',
    rawText: '',
    source: 'STANDBY',
    isSpeaking: false,
    status: 'idle'
  });

  const socketRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);

  // Constants for AI compatibility
  const SAMPLE_RATE = 16000;
  const BUFFER_SIZE = 4096; // ~250ms of audio per packet

  const startEngine = useCallback(async () => {
    // 1. Establish WebSocket Connection
    socketRef.current = new WebSocket("ws://localhost:8000/ws/anabelle");

    socketRef.current.onopen = () => {
      console.log("ANABELLE: Connected to Python AI Backend");
      setAnalysis(prev => ({ ...prev, status: 'connected', source: 'INITIALIZING' }));
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status !== "error") {
          setAnalysis(prev => ({
            ...prev,
            emotion: data.emotion,
            rawText: data.raw_text || prev.rawText,
            source: data.source || 'AI_MODEL'
          }));
        }
      } catch (err) {
        console.error("Payload Error:", err);
      }
    };

    socketRef.current.onclose = () => {
      setAnalysis(prev => ({ ...prev, status: 'disconnected', source: 'OFFLINE' }));
    };

    // 2. Initialize Audio Pipeline
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create AudioContext at 16kHz for SenseVoice
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: SAMPLE_RATE,
      });

      const source = audioCtxRef.current.createMediaStreamSource(stream);
      processorRef.current = audioCtxRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // --- LOCAL REFLEX: Instant Volume Calculation ---
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const currentEnergy = Math.max(0, Math.min(1, rms * 10)); // Normalize 0-1

        // Update local reflexes every frame
        setAnalysis(prev => ({
          ...prev,
          energy: currentEnergy,
          isSpeaking: currentEnergy > 0.02
        }));

        // --- REMOTE COGNITION: Stream to Python AI ---
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          // Send raw float32 buffer directly
          socketRef.current.send(inputData.buffer);
        }
      };

      // Connect nodes
      source.connect(processorRef.current);
      processorRef.current.connect(audioCtxRef.current.destination);

    } catch (err) {
      console.error("Microphone Access Denied:", err);
      setAnalysis(prev => ({ ...prev, status: 'error', source: 'MIC_DENIED' }));
    }
  }, []);

  const stopEngine = useCallback(() => {
    processorRef.current?.disconnect();
    audioCtxRef.current?.close();
    streamRef.current?.getTracks().forEach(track => track.stop());
    socketRef.current?.close();
    setAnalysis({ energy: 0, emotion: 'NEUTRAL', rawText: '', source: 'STANDBY', isSpeaking: false, status: 'idle' });
  }, []);

  return { analysis, startEngine, stopEngine };
};