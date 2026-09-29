/**
 * GalaxyBackground - React Three Fiber galaxy scene
 * High-performance cosmic background with stars and nebula
 */

import { useEffect, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NebulaMaterial } from "./NebulaShader";

interface GalaxyBackgroundProps {
  starCount?: number;
}

export const GalaxyBackground = ({ starCount = 8000 }: GalaxyBackgroundProps) => {
  const nebulaRef = useRef<NebulaMaterial>(null);
  const starsRef = useRef<THREE.Points>(null);

  // Pointer position (0..1) for parallax. A ref, not state: it changes every frame.
  const pointer = useRef({ x: 0.5, y: 0.5 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

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
      // Mostly cool white, some pale blue, a few warm gold like mastered stars
      const [r, g, b] = choice < 0.7 ? [0.88, 0.92, 1] : choice < 0.92 ? [0.65, 0.78, 1] : [1, 0.85, 0.6];
      const jitter = 0.9 + Math.random() * 0.1;
      colors[i3] = r * jitter;
      colors[i3 + 1] = g * jitter;
      colors[i3 + 2] = b * jitter;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Round, soft-edged points: without a sprite, near points render as grey squares that read as locked skills.
    const dot = document.createElement("canvas");
    dot.width = dot.height = 32;
    const ctx = dot.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, "#fff");
      g.addColorStop(1, "#000");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 32, 32);
    }

    const material = new THREE.PointsMaterial({
      alphaMap: new THREE.CanvasTexture(dot),
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
  useFrame((state, frameDelta) => {
    // After a paused (hidden) tab resumes, the first delta covers the whole pause.
    const delta = Math.min(frameDelta, 0.1);
    // Update nebula shader time (slow drift)
    if (nebulaRef.current) {
      nebulaRef.current.uniforms.time.value += delta * 0.2;
    }

    // Smooth mouse interpolation with throttle
    smoothMouse.current.x += (pointer.current.x - 0.5 - smoothMouse.current.x) * 0.02;
    smoothMouse.current.y += (pointer.current.y - 0.5 - smoothMouse.current.y) * 0.02;

    // Parallax layers: nebula shifts most, planet medium, stars least
    if (nebulaLayerRef.current) {
      nebulaLayerRef.current.position.x = smoothMouse.current.x * 3;
      nebulaLayerRef.current.position.y = -smoothMouse.current.y * 3;
      nebulaLayerRef.current.rotation.y += delta * 0.01;
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
            color="#1e2a6b"
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>


      {/* Star field - minimal parallax */}
      <group ref={starsLayerRef}>
        <points ref={starsRef} geometry={starGeometry} material={starMaterial} />
      </group>
    </>
  );
};
