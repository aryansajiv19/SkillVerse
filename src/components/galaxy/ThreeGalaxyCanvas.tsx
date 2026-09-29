/**
 * ThreeGalaxyCanvas - Main R3F Canvas wrapper. Transparent: the page paints the sky gradient
 * underneath, so nothing shifts while three.js loads.
 */

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { GalaxyBackground } from "./GalaxyBackground";
import { useReducedMotion } from "@/components/map/useReducedMotion";
import { cn } from "@/lib/utils";

const useTabHidden = () => {
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  useEffect(() => {
    const onChange = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return hidden;
};

export const ThreeGalaxyCanvas = () => {
  const reduced = useReducedMotion();
  const hidden = useTabHidden();
  const [ready, setReady] = useState(false);

  return (
    <div aria-hidden className={cn("fixed inset-0 -z-10 transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 70 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        // Stop rendering in background tabs; with reduced motion, draw only when something changes.
        frameloop={hidden ? "never" : reduced ? "demand" : "always"}
        onCreated={() => setReady(true)}
      >
        <GalaxyBackground starCount={12000} />
      </Canvas>
    </div>
  );
};
