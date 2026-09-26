/**
 * ThreeGalaxyCanvas - Main R3F Canvas wrapper
 * Sets up the Three.js scene with optimized settings
 */

import { Canvas } from "@react-three/fiber";
import { GalaxyBackground } from "./GalaxyBackground";

interface ThreeGalaxyCanvasProps {
  mousePosition: { x: number; y: number };
}

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
        frameloop="always"
        style={{
          background: "radial-gradient(ellipse at center, hsl(270, 60%, 6%) 0%, hsl(265, 70%, 4%) 40%, hsl(260, 80%, 2%) 100%)",
        }}
      >
        <GalaxyBackground mousePosition={mousePosition} starCount={12000} />
      </Canvas>
    </div>
  );
};
