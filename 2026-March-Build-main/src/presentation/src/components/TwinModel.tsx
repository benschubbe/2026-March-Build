import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface TwinProps {
  glucose: number;
  resilience: number;
}

const TwinModel: React.FC<TwinProps> = ({ glucose, resilience }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  const pulseSpeed = 1 + (glucose - 100) / 100;
  const distortion = 0.8 - (resilience / 100.0) * 0.5;
  const baseColor = useMemo(() => {
    if (glucose > 180) return new THREE.Color("#ff4d4d");
    if (glucose > 140) return new THREE.Color("#ff9f43");
    if (glucose < 70) return new THREE.Color("#54a0ff");
    return new THREE.Color("#00d2d3");
  }, [glucose]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.15;
      meshRef.current.rotation.z = time * 0.1;
      const s = 1 + Math.sin(time * pulseSpeed * 2) * 0.05;
      meshRef.current.scale.set(s, s, s);
    }
    if (coreRef.current) {
      coreRef.current.rotation.x = -time * 0.3;
      coreRef.current.rotation.y = time * 0.5;
    }
  });

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Outer Biological Membrane */}
        <Sphere ref={meshRef} args={[1.2, 128, 128]}>
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={1.5}
            chromaticAberration={0.06}
            anisotropy={0.1}
            distortion={distortion}
            distortionScale={0.5}
            temporalDistortion={0.1}
            color={baseColor}
            attenuationDistance={0.5}
            attenuationColor={baseColor}
          />
        </Sphere>

        {/* Inner Core (Metabolic Engine) */}
        <Sphere ref={coreRef} args={[0.6, 64, 64]}>
          <MeshDistortMaterial
            color={baseColor}
            speed={pulseSpeed * 2}
            distort={0.4}
            radius={1}
            emissive={baseColor}
            emissiveIntensity={2}
          />
        </Sphere>
      </Float>
      
      {/* Dynamic Lighting for the Twin */}
      <pointLight position={[2, 2, 2]} intensity={1.5} color={baseColor} />
      <pointLight position={[-2, -2, -2]} intensity={1} color="#ffffff" />
    </group>
  );
};

export default TwinModel;
