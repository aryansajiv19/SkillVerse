/**
 * GalaxyBackground - React Three Fiber galaxy scene
 * High-performance cosmic background with stars and nebula
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NebulaMaterial } from "./NebulaShader";

interface GalaxyBackgroundProps {
  mousePosition: { x: number; y: number };
  starCount?: number;
}

export const GalaxyBackground = ({ 
  mousePosition, 
  starCount = 8000 
}: GalaxyBackgroundProps) => {
  const nebulaRef = useRef<NebulaMaterial>(null);
  const starsRef = useRef<THREE.Points>(null);
  const galaxyGroupRef = useRef<THREE.Group>(null);

  // Smooth mouse tracking with parallax
  const smoothMouse = useRef({ x: 0, y: 0 });
  const nebulaLayerRef = useRef<THREE.Group>(null);
  const starsLayerRef = useRef<THREE.Group>(null);

  // Create nebula material instance
  const nebulaMaterial = useMemo(() => new NebulaMaterial(), []);

  // Create star geometry with colors (memoized)
  const { starGeometry, starMaterial } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Spherical distribution
      const radius = 20 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi) - 25;
      
      // Micro-stars: subtle purple/blue/white tones
      const choice = Math.random();
      if (choice < 0.6) {
        // Soft purple
        colors[i3] = 0.8 + Math.random() * 0.2;
        colors[i3 + 1] = 0.6 + Math.random() * 0.2;
        colors[i3 + 2] = 1;
      } else if (choice < 0.85) {
        // Soft blue
        colors[i3] = 0.5 + Math.random() * 0.2;
        colors[i3 + 1] = 0.7 + Math.random() * 0.2;
        colors[i3 + 2] = 1;
      } else {
        // White
        colors[i3] = 0.9 + Math.random() * 0.1;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 1;
      }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.015, // Smaller micro-stars
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    
    return { starGeometry: geometry, starMaterial: material };
  }, [starCount]);

  // Animation loop
  useFrame((state, delta) => {
    // Update nebula shader time (slow drift)
    if (nebulaRef.current) {
      nebulaRef.current.uniforms.time.value += delta * 0.2;
    }

    // Smooth mouse interpolation with throttle
    smoothMouse.current.x += (mousePosition.x - 0.5 - smoothMouse.current.x) * 0.02;
    smoothMouse.current.y += (mousePosition.y - 0.5 - smoothMouse.current.y) * 0.02;

    // Parallax layers: nebula shifts most, planet medium, stars least
    if (nebulaLayerRef.current) {
      nebulaLayerRef.current.position.x = smoothMouse.current.x * 3;
      nebulaLayerRef.current.position.y = -smoothMouse.current.y * 3;
      nebulaLayerRef.current.rotation.y += delta * 0.01;
    }

    if (galaxyGroupRef.current) {
      galaxyGroupRef.current.position.x = smoothMouse.current.x * 1.5;
      galaxyGroupRef.current.position.y = -smoothMouse.current.y * 1.5;
    }

    if (starsLayerRef.current) {
      starsLayerRef.current.position.x = smoothMouse.current.x * 0.5;
      starsLayerRef.current.position.y = -smoothMouse.current.y * 0.5;
    }

    // Gentle star twinkle
    if (starsRef.current) {
      const material = starsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      starsRef.current.rotation.y += delta * 0.008;
    }
  });

  return (
    <>
      {/* Nebula layer - moves most with parallax */}
      <group ref={nebulaLayerRef}>
        <mesh>
          <sphereGeometry args={[45, 48, 48]} />
          <primitive ref={nebulaRef} object={nebulaMaterial} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[46, 48, 48]} />
          <meshBasicMaterial
            color="#7c3aed"
            transparent
            opacity={0.1}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Main scene - medium parallax */}
      <group ref={galaxyGroupRef}>
        {/* Ambient cosmic lighting */}
        <ambientLight intensity={0.4} color="#8b5cf6" />
        <pointLight position={[20, 15, 10]} intensity={3} color="#a78bfa" distance={60} />
        <pointLight position={[-15, -10, 5]} intensity={2} color="#6366f1" distance={50} />
        <pointLight position={[0, 20, -20]} intensity={1.5} color="#c084fc" distance={40} />
      </group>

      {/* Star field - minimal parallax */}
      <group ref={starsLayerRef}>
        <points ref={starsRef} geometry={starGeometry} material={starMaterial} />
      </group>
    </>
  );
};
