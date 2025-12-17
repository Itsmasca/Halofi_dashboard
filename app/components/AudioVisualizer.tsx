'use client';

import React, { useRef, useEffect } from 'react';
import { useVoiceAgent } from '../contexts/VoiceAgentContext';

export function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { sphereState } = useVoiceAgent();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (sphereState === 'listening') {
        // Pulsing circle for listening
        const time = Date.now() / 1000;
        const radius = 50 + Math.sin(time * 3) * 10;

        ctx.beginPath();
        ctx.arc(100, 100, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 239, 125, 0.3)';
        ctx.fill();
      } else if (sphereState === 'speaking') {
        // Animated bars for speaking
        const bars = 8;
        const barWidth = 4;
        const spacing = 20;
        const time = Date.now() / 100;

        for (let i = 0; i < bars; i++) {
          const height = 20 + Math.sin(time + i) * 15;
          const x = 100 - (bars * spacing) / 2 + i * spacing;
          const y = 100 - height / 2;

          ctx.fillStyle = 'rgba(245, 87, 108, 0.5)';
          ctx.fillRect(x, y, barWidth, height);
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [sphereState]);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full pointer-events-none">
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="w-full h-full"
      />
    </div>
  );
}
