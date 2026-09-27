/**
 * ThreeGalaxyCanvas - Main R3F Canvas wrapper
 * Sets up the Three.js scene with optimized settings
 */

import { Canvas } from "@react-three/fiber";
import { GalaxyBackground } from "./GalaxyBackground";

interface ThreeGalaxyCanvasProps {
  mousePosition: { x: number; y: number };
}

const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const ThreeGalaxyCanvas = ({ mousePosition }: ThreeGalaxyCanvasProps) => {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 70 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        frameloop={reducedMotion ? "demand" : "always"}
        style={{
          background: "radial-gradient(ellipse at 50% 40%, hsl(232, 55%, 13%) 0%, hsl(232, 60%, 8%) 45%, hsl(235, 70%, 4%) 100%)",
        }}
      >
        <GalaxyBackground mousePosition={mousePosition} starCount={12000} />
      </Canvas>
    </div>
  );
};
