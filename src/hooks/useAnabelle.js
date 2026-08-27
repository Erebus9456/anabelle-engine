import { useState, useEffect, useRef } from 'react';

export const useAnabelle = () => {
  const [analysis, setAnalysis] = useState({
    energy: 0,
    pitch: 0,
    harshness: 0,
    valence: 0.5,
    arousal: 0.5,
    emotion: 'NEUTRAL',
    isSpeaking: false,
    status: 'idle'
  });

  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  
  // Storage for the AI's current decision to prevent state overwrites
  const currentAiEmotion = useRef('NEUTRAL');

  const startEngine = async () => {
    socketRef.current = new WebSocket("ws://localhost:8000/ws/anabelle");

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "success") {
        console.log("AI Inference:", data.emotion);
        currentAiEmotion.current = data.emotion;
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // AI standard 16kHz
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Use a smaller buffer for more responsive visual bars (4096 vs 16384)
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // 1. Calculate Visual Energy (Reflexes)
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const visualEnergy = Math.min(rms * 8, 1);

        // 2. Update the UI state
        // We combine the local energy with the last known AI emotion
        setAnalysis(prev => ({
          ...prev,
          energy: visualEnergy,
          emotion: currentAiEmotion.current,
          isSpeaking: visualEnergy > 0.05,
          // Map emotion to visual valence/arousal for the 3D model
          arousal: currentAiEmotion.current === "EXCITED" || currentAiEmotion.current === "ANGRY" ? 0.8 : 0.4,
          valence: currentAiEmotion.current === "EXCITED" || currentAiEmotion.current === "HAPPY" ? 0.8 : 0.3,
          status: 'active'
        }));

        // 3. Stream to AI (Cognition)
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(inputData.buffer);
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      setAnalysis(prev => ({ ...prev, status: 'connected' }));

    } catch (err) {
      setAnalysis(prev => ({ ...prev, status: 'error' }));
    }
  };

  return { analysis, startEngine };
};