import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Avatar = ({ analysis }) => {
  const headGroup = useRef();
  const mouthRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const pointLightRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!headGroup.current) return;

    // 1. NATURAL IDLE ANIMATION
    // Subtle breathing and swaying so the avatar never looks "frozen"
    const idleY = Math.sin(t * 0.5) * 0.05;
    const idleRotY = Math.sin(t * 0.2) * 0.1;
    headGroup.current.position.y = THREE.MathUtils.lerp(headGroup.current.position.y, idleY, 0.1);
    headGroup.current.rotation.y = THREE.MathUtils.lerp(headGroup.current.rotation.y, idleRotY, 0.1);

    // 2. HIGH-FREQUENCY LIP SYNC
    // Direct mapping of vocal energy to mouth height with smooth interpolation
    const targetMouthY = 0.05 + (analysis.energy * 2.2);
    mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, targetMouthY, 0.4);
    // Mouth width widens slightly as volume increases
    mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 1 + (analysis.energy * 0.5), 0.2);

    // 3. EMOTIONAL MORPHING
    const arousal = analysis.arousal;
    const valence = analysis.valence;

    // Eye scaling: Wide for excitement/surprise, narrow for anger/sadness
    const targetEyeScale = 0.8 + (arousal * 0.7) - (analysis.emotion === 'SAD' ? 0.3 : 0);
    leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, targetEyeScale, 0.1);
    rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, targetEyeScale, 0.1);

    // Head tilt based on emotion
    let targetRotX = 0;
    let targetRotZ = 0;

    if (analysis.emotion === 'ANGRY') {
      targetRotX = -0.2; // Tilted forward/aggressive
      targetRotZ = Math.sin(t * 20) * 0.02 * analysis.energy; // Aggressive vibration
    } else if (analysis.emotion === 'SAD') {
      targetRotX = 0.3; // Tilted down
    } else if (analysis.emotion === 'EXCITED') {
      targetRotX = -0.1;
      targetRotZ = Math.sin(t * 15) * 0.05; // Happy bounce
    }

    headGroup.current.rotation.x = THREE.MathUtils.lerp(headGroup.current.rotation.x, targetRotX, 0.05);
    headGroup.current.rotation.z = THREE.MathUtils.lerp(headGroup.current.rotation.z, targetRotZ, 0.1);

    // 4. AFFECTIVE GLOW
    // Change the inner light color based on valence (Blue = Negative, Pink/Cyan = Positive)
    if (pointLightRef.current) {
      const glowColor = analysis.emotion === 'ANGRY' ? '#ff0000' : 
                        analysis.emotion === 'HAPPY' ? '#00f2ff' : 
                        analysis.emotion === 'EXCITED' ? '#ff00ea' : '#444444';
      pointLightRef.current.color.lerp(new THREE.Color(glowColor), 0.1);
      pointLightRef.current.intensity = 0.5 + (analysis.energy * 2);
    }
  });

  return (
    <group ref={headGroup}>
      {/* CORE HEAD STRUCTURE */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          color="#0a0a0a" 
          roughness={0.2}
          metalness={0.8}
          wireframe={analysis.isSpeaking}
          emissive={analysis.isSpeaking ? "#00f2ff" : "#000"}
          emissiveIntensity={analysis.energy * 0.5}
        />
      </mesh>

      {/* EYES */}
      <group position={[0, 0, 0]}>
        <mesh ref={leftEyeRef} position={[-0.35, 0.3, 0.85]}>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshBasicMaterial color={analysis.isSpeaking ? "#fff" : "#333"} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.35, 0.3, 0.85]}>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshBasicMaterial color={analysis.isSpeaking ? "#fff" : "#333"} />
        </mesh>
      </group>

      {/* MOUTH */}
      <mesh ref={mouthRef} position={[0, -0.4, 0.9]}>
        <boxGeometry args={[0.5, 0.1, 0.05]} />
        <meshBasicMaterial color={analysis.isSpeaking ? (analysis.emotion === 'ANGRY' ? "#ff0000" : "#ff00ea") : "#111"} />
      </mesh>

      {/* EMOTIONAL ENGINE LIGHT */}
      <pointLight ref={pointLightRef} position={[0, 0, 1.2]} />
    </group>
  );
};