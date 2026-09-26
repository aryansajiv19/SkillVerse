import { useEffect, useRef } from "react";

interface ShootingStar {
  id: number;
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
}

export const ShootingStars = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<ShootingStar[]>([]);
  const animationFrameRef = useRef<number>();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    // Create shooting stars
    const createStar = (id: number): ShootingStar => ({
      id,
      x: Math.random() * canvas.width,
      y: -50,
      speed: 3 + Math.random() * 5,
      length: 30 + Math.random() * 80,
      opacity: 0.3 + Math.random() * 0.7,
    });
    
    // Initialize some stars
    for (let i = 0; i < 3; i++) {
      starsRef.current.push(createStar(i));
    }
    
    let lastSpawnTime = Date.now();
    let nextStarId = 3;
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Spawn new stars occasionally
      const now = Date.now();
      if (now - lastSpawnTime > 3000 + Math.random() * 5000) {
        starsRef.current.push(createStar(nextStarId++));
        lastSpawnTime = now;
      }
      
      // Update and draw stars
      starsRef.current = starsRef.current.filter((star) => {
        star.x += star.speed;
        star.y += star.speed * 0.8;
        
        // Remove off-screen stars
        if (star.x > canvas.width + 100 || star.y > canvas.height + 100) {
          return false;
        }
        
        // Draw shooting star
        const gradient = ctx.createLinearGradient(
          star.x,
          star.y,
          star.x - star.length,
          star.y - star.length * 0.8
        );
        gradient.addColorStop(0, `rgba(200, 150, 255, ${star.opacity})`);
        gradient.addColorStop(0.5, `rgba(150, 100, 255, ${star.opacity * 0.5})`);
        gradient.addColorStop(1, "rgba(100, 50, 255, 0)");
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x - star.length, star.y - star.length * 0.8);
        ctx.stroke();
        
        // Draw glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(200, 150, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        return true;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: "screen" }}
    />
  );
};
