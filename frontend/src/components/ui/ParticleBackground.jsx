/**
 * ParticleBackground.jsx — Interactive Generative Art Background
 * Uses HTML5 Canvas and JavaScript to create a dynamic network of particles.
 * Standard: Clean code, documented math, performance optimized.
 */

import React, { useRef, useEffect } from 'react';

// Configuration for the particle system
const PARTICLE_CONFIG = {
  count: 120,             // Number of particles (adjust for performance)
  velocity: 0.5,         // Base movement speed
  color: 'rgba(200, 255, 87, 0.8)', // Lime green with transparency
  lineColor: 'rgba(200, 255, 87, 0.25)',
  linkDistance: 100,     // Max distance to draw a line between particles
  mouseDist: 250,        // Influence radius of the mouse
};

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: null, y: null });

  /**
   * Particle Class definition
   */
  class Particle {
    constructor(w, h) {
      this.w = w; this.h = h;
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * PARTICLE_CONFIG.velocity;
      this.vy = (Math.random() - 0.5) * PARTICLE_CONFIG.velocity;
      this.radius = Math.random() * 1.5 + 0.5;
    }

    // Standard draw method
    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = PARTICLE_CONFIG.color;
      ctx.fill();
    }

    // Update position and handle mouse attraction
    update(w, h, mouseX, mouseY) {
      // Base movement
      this.x += this.vx;
      this.y += this.vy;

      // Mouse attraction logic
      if (mouseX !== null && mouseY !== null) {
        let dx = this.x - mouseX;
        let dy = this.y - mouseY;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < PARTICLE_CONFIG.mouseDist) {
          // Calculate force vector
          let force = (PARTICLE_CONFIG.mouseDist - dist) / PARTICLE_CONFIG.mouseDist;
          let ax = (dx / dist) * force * 0.4;
          let ay = (dy / dist) * force * 0.4;
          this.vx -= ax;
          this.vy -= ay;
        }
      }

      // Add slight friction to keep things smooth
      this.vx *= 0.98;
      this.vy *= 0.98;

      // Bound checking (wrap around screen)
      if (this.x < 0) this.x = w; else if (this.x > w) this.x = 0;
      if (this.y < 0) this.y = h; else if (this.y > h) this.y = 0;
    }
  }

  // Setup canvas and event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    contextRef.current = ctx;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.current.x = null;
      mouse.current.y = null;
    };

    const initParticles = () => {
      particles.current = [];
      for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
        particles.current.push(new Particle(canvas.width, canvas.height));
      }
    };

    // Initialization
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    handleResize(); // Initial call to set size and particles

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Animation Loop
  useEffect(() => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx) return;

    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const parts = particles.current;
      const m = mouse.current;

      // Update and draw particles
      parts.forEach(p => {
        p.update(canvas.width, canvas.height, m.x, m.y);
        p.draw(ctx);
      });

      // Draw connecting lines (the "Network")
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = PARTICLE_CONFIG.lineColor;
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          let dx = parts[i].x - parts[j].x;
          let dy = parts[i].y - parts[j].y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < PARTICLE_CONFIG.linkDistance) {
            ctx.beginPath();
            ctx.moveTo(parts[i].x, parts[i].y);
            ctx.lineTo(parts[j].x, parts[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />;
}