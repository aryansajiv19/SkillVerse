/**
 * NebulaShader - Custom purple nebula shader material
 * Creates a slow-moving, dreamy cosmic fog effect
 */

import * as THREE from "three";

// Custom nebula shader with purple cosmic colors
export class NebulaMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        time: { value: 0 },
        colorA: { value: new THREE.Color(0.58, 0.2, 0.92) }, // Electric violet
        colorB: { value: new THREE.Color(0.4, 0.6, 0.95) }, // Cosmic blue
        colorC: { value: new THREE.Color(0.2, 0.11, 0.35) }, // Dark space purple
        colorD: { value: new THREE.Color(0.65, 0.3, 0.8) }, // Purple glow
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 colorA;
        uniform vec3 colorB;
        uniform vec3 colorC;
        uniform vec3 colorD;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        // Smooth noise function (no harsh artifacts)
        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          float n = i.x + i.y * 57.0 + 113.0 * i.z;
          return mix(
            mix(
              mix(sin(n + 0.0), sin(n + 1.0), f.x),
              mix(sin(n + 57.0), sin(n + 58.0), f.x),
              f.y
            ),
            mix(
              mix(sin(n + 113.0), sin(n + 114.0), f.x),
              mix(sin(n + 170.0), sin(n + 171.0), f.x),
              f.y
            ),
            f.z
          );
        }
        
        // Fractal Brownian Motion for organic nebula patterns
        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for(int i = 0; i < 4; i++) {
            value += amplitude * noise(p * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
          }
          
          return value;
        }
        
        void main() {
          // Slow-moving coordinates
          vec3 p = vPosition * 0.3 + vec3(time * 0.015, time * 0.01, time * 0.008);
          
          // Layered nebula effect
          float n1 = fbm(p);
          float n2 = fbm(p * 1.5 + vec3(time * 0.02, 0.0, 0.0));
          float n3 = fbm(p * 0.8 + vec3(0.0, time * 0.015, 0.0));
          
          // Combine noise layers
          float nebula = (n1 + n2 * 0.6 + n3 * 0.4) / 2.2;
          
          // Create rich color gradients
          vec3 color = mix(colorC, colorA, nebula);
          color = mix(color, colorB, smoothstep(0.2, 0.8, nebula));
          color = mix(color, colorD, smoothstep(0.5, 1.0, nebula));
          
          // Add glowing center
          float glow = 1.0 - length(vUv - 0.5) * 0.5;
          color += colorD * glow * 0.25;
          
          // Add depth variation
          float depthFactor = smoothstep(-1.0, 1.0, vPosition.z / 40.0);
          color = mix(color * 0.7, color, depthFactor);
          
          // Soft opacity for dreamy effect
          float alpha = nebula * 0.6 + 0.3;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }
}
