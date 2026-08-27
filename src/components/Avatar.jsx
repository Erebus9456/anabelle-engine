import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Configuration for each Affective State
const EMOTION_CONFIG = {
  ANGRY: {
    color: '#ff0000',
    tiltX: -0.25,     // Lean forward aggressively
    eyeScale: 0.6,    // Narrowed, intense eyes
    glowIntensity: 2.5,
    vibration: 0.05
  },
  HAPPY: {
    color: '#00ffcc',
    tiltX: 0.1,       // Head back slightly
    eyeScale: 1.3,    // Wide, cheerful eyes
    glowIntensity: 1.2,
    vibration: 0.01
  },
  EXCITED: {
    color: '#ff00ea',
    tiltX: -0.1,
    eyeScale: 1.6,    // Very wide eyes
    glowIntensity: 3.0,
    vibration: 0.08   // High frequency movement
  },
  SAD: {
    color: '#0044ff',
    tiltX: 0.35,      // Head down
    eyeScale: 0.8,
    glowIntensity: 0.5,
    vibration: 0.0
  },
  NEUTRAL: {
    color: '#444444',
    tiltX: 0,
    eyeScale: 1.0,
    glowIntensity: 0.8,
    vibration: 0.005
  }
};

export const Avatar = ({ analysis }) => {
  const headGroup = useRef();
  const mouthRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const pointLightRef = useRef();

  useFrame((state, delta) => {
    if (!headGroup.current) return;

    const t = state.clock.getElapsedTime();
    const currentConfig = EMOTION_CONFIG[analysis.emotion] || EMOTION_CONFIG.NEUTRAL;

    // 1. NATURAL IDLE ANIMATION (The "Breath")
    // Creates a slow sine wave movement so the character feels alive
    const idleY = Math.sin(t * 0.5) * 0.04;
    const idleRotY = Math.sin(t * 0.2) * 0.05;
    headGroup.current.position.y = THREE.MathUtils.lerp(headGroup.current.position.y, idleY, 0.1);
    headGroup.current.rotation.y = THREE.MathUtils.lerp(headGroup.current.rotation.y, idleRotY, 0.05);

    // 2. AFFECTIVE POSTURE (The "Brain" Lerp)
    // Smoothly tilt head based on emotion (X-axis)
    headGroup.current.rotation.x = THREE.MathUtils.lerp(
      headGroup.current.rotation.x, 
      currentConfig.tiltX, 
      0.08
    );

    // Add emotional vibration (jitters more when excited/angry)
    if (currentConfig.vibration > 0) {
      headGroup.current.position.x = Math.sin(t * 30) * currentConfig.vibration * analysis.energy;
    }

    // 3. EYE EXPRESSION
    // Scale eyes based on emotion config + local energy spike
    const targetEyeScale = currentConfig.eyeScale + (analysis.energy * 0.2);
    leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, targetEyeScale, 0.15);
    rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, targetEyeScale, 0.15);

    // 4. REAL-TIME LIP SYNC (The "Reflex")
    // Couples directly to local energy for zero-latency response
    const mouthOpen = 0.05 + (analysis.energy * 2.5);
    mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, mouthOpen, 0.4);
    
    // Wider mouth for high arousal emotions
    const mouthWidth = (analysis.emotion === 'EXCITED' || analysis.emotion === 'ANGRY') ? 1.4 : 1.0;
    mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, mouthWidth, 0.1);

    // 5. MOOD LIGHTING
    // Lerp the light color and intensity
    if (pointLightRef.current) {
      pointLightRef.current.color.lerp(new THREE.Color(currentConfig.color), 0.05);
      pointLightRef.current.intensity = THREE.MathUtils.lerp(
        pointLightRef.current.intensity,
        currentConfig.glowIntensity + (analysis.energy * 2),
        0.1
      );
    }
  });

  return (
    <group ref={headGroup}>
      {/* MAIN HEAD - Wireframe reacts to "Speaking" status */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          color="#080808" 
          roughness={0.1}
          metalness={0.9}
          wireframe={analysis.isSpeaking}
          emissive={analysis.isSpeaking ? "#00f2ff" : "#000"}
          emissiveIntensity={analysis.energy * 0.5}
        />
      </mesh>

      {/* EYES */}
      <group position={[0, 0, 0]}>
        <mesh ref={leftEyeRef} position={[-0.35, 0.3, 0.85]}>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshBasicMaterial color={analysis.isSpeaking ? "#ffffff" : "#444444"} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.35, 0.3, 0.85]}>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshBasicMaterial color={analysis.isSpeaking ? "#ffffff" : "#444444"} />
        </mesh>
      </group>

      {/* MOUTH (LIP-SYNC PLANE) */}
      <mesh ref={mouthRef} position={[0, -0.4, 0.92]}>
        <boxGeometry args={[0.5, 0.1, 0.02]} />
        <meshBasicMaterial color={analysis.emotion === 'ANGRY' ? "#ff0000" : "#ff00ea"} />
      </mesh>

      {/* DYNAMIC POINT LIGHT */}
      <pointLight ref={pointLightRef} position={[0, 0, 1.5]} distance={5} />
    </group>
  );
};