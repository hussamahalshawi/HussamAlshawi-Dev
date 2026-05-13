/**
 * ParticleBackground.jsx — Dense Cyberpunk Network Grid
 * Multi-color glowing nodes with gradient edges, scan line,
 * mouse repulsion/attraction, and corner bracket decorations.
 */
import { useRef, useEffect } from 'react';

/* ── Configuration ───────────────────────────────────────────── */
const CFG = {
  count:        120,                           // Node count — denser than before
  speed:        0.28,                          // Base drift speed
  linkDist:     140,                           // Max distance to draw edge
  mouseRepel:   160,                           // Repulsion radius
  mouseAttract: 280,                           // Attraction band outer radius
  nodeR:        2.2,                           // Max node radius
  colors: [                                    // Four cyberpunk accent colors
    'rgba(79,195,247,',                        // Cyan
    'rgba(91,141,239,',                        // Blue
    'rgba(155,127,234,',                       // Violet
    'rgba(78,204,163,',                        // Green
  ],
};

/* ── Single particle node ────────────────────────────────────── */
class Node {
  constructor(w, h) {
    this.reset(w, h);
  }

  /* Initialize or reset all properties */
  reset(w, h) {
    this.x          = Math.random() * w;                        // X position
    this.y          = Math.random() * h;                        // Y position
    this.vx         = (Math.random() - 0.5) * CFG.speed;       // X velocity
    this.vy         = (Math.random() - 0.5) * CFG.speed;       // Y velocity
    this.r          = Math.random() * CFG.nodeR + 0.8;         // Node radius
    this.ci         = Math.floor(Math.random() * CFG.colors.length); // Color index
    this.phase      = Math.random() * Math.PI * 2;              // Pulse offset
    this.pulseSpeed = 0.015 + Math.random() * 0.02;            // Individual pulse rate
  }

  /* Update position with mouse repulsion/attraction physics */
  update(w, h, mx, my) {
    if (mx !== null && my !== null) {
      const dx = this.x - mx;                                   // Delta X from mouse
      const dy = this.y - my;                                   // Delta Y from mouse
      const d2 = dx * dx + dy * dy;                            // Distance squared
      const repR2 = CFG.mouseRepel  * CFG.mouseRepel;          // Repel radius squared
      const attR2 = CFG.mouseAttract * CFG.mouseAttract;       // Attract radius squared

      if (d2 < repR2 && d2 > 0) {
        /* Inside repulsion zone — push away */
        const d = Math.sqrt(d2);
        const f = (CFG.mouseRepel - d) / CFG.mouseRepel * 0.8;
        this.vx += (dx / d) * f;
        this.vy += (dy / d) * f;
      } else if (d2 < attR2 && d2 > repR2) {
        /* Between repulsion and attraction zones — pull gently */
        const d = Math.sqrt(d2);
        const f = ((d - CFG.mouseRepel) / (CFG.mouseAttract - CFG.mouseRepel)) * 0.04;
        this.vx -= (dx / d) * f;
        this.vy -= (dy / d) * f;
      }
    }

    this.vx *= 0.972;                                           // Friction X
    this.vy *= 0.972;                                           // Friction Y
    this.x  += this.vx;                                        // Move X
    this.y  += this.vy;                                        // Move Y

    /* Wrap around screen edges */
    if (this.x < 0) this.x = w;
    if (this.x > w) this.x = 0;
    if (this.y < 0) this.y = h;
    if (this.y > h) this.y = 0;
  }

  /* Draw node with pulsing glow layers */
  draw(ctx, tick) {
    const pulse = 0.6 + 0.4 * Math.sin(tick * this.pulseSpeed + this.phase); // 0.6–1.0
    const r     = this.r * (0.85 + 0.35 * pulse);             // Pulsing radius

    /* Outer ambient glow */
    const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 5);
    grd.addColorStop(0, CFG.colors[this.ci] + (0.25 * pulse) + ')');
    grd.addColorStop(1, CFG.colors[this.ci] + '0)');
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    /* Bright colored core */
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = CFG.colors[this.ci] + (0.85 + 0.15 * pulse) + ')';
    ctx.fill();

    /* White-hot center dot */
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fill();
  }
}

/* ── Main Component ──────────────────────────────────────────── */
export default function ParticleBackground({ opacity = 0.85 }) {
  const canvasRef = useRef(null);                              // Canvas element ref
  const stateRef  = useRef({                                   // Mutable state ref
    nodes: [], mouse: { x: null, y: null }, tick: 0, raf: null
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s   = stateRef.current;

    /* Resize canvas to fill parent */
    const resize = () => {
      canvas.width  = window.innerWidth;                       // Full viewport width
      canvas.height = window.innerHeight;                      // Full viewport height
      s.nodes = Array.from(
        { length: CFG.count },
        () => new Node(canvas.width, canvas.height)            // Re-spawn all nodes
      );
    };

    /* Draw gradient edge between two nodes */
    const drawEdge = (a, b, dist) => {
      const alpha = 1 - dist / CFG.linkDist;                  // Fade by distance
      const grd   = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grd.addColorStop(0, CFG.colors[a.ci] + (alpha * 0.7) + ')');
      grd.addColorStop(1, CFG.colors[b.ci] + (alpha * 0.7) + ')');
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = grd;
      ctx.lineWidth   = alpha * 1.2 + 0.2;                    // Thicker when close
      ctx.stroke();
    };

    /* Draw ambient mouse glow */
    const drawMouseGlow = () => {
      if (s.mouse.x === null) return;
      const grd = ctx.createRadialGradient(
        s.mouse.x, s.mouse.y, 0,
        s.mouse.x, s.mouse.y, 200
      );
      grd.addColorStop(0,   'rgba(79,195,247,0.07)');
      grd.addColorStop(0.5, 'rgba(91,141,239,0.03)');
      grd.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(s.mouse.x, s.mouse.y, 200, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    };

    /* Draw moving horizontal scan line */
    const drawScanLine = () => {
      const y   = (s.tick * 0.8) % canvas.height;             // Moves downward
      const grd = ctx.createLinearGradient(0, y - 30, 0, y + 30);
      grd.addColorStop(0,   'rgba(79,195,247,0)');
      grd.addColorStop(0.5, 'rgba(79,195,247,0.035)');
      grd.addColorStop(1,   'rgba(79,195,247,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, y - 30, canvas.width, 60);              // Full-width scan band
    };

    /* Draw corner bracket decorations */
    const drawCorners = () => {
      const sz = 32, gap = 24;
      ctx.strokeStyle = 'rgba(79,195,247,0.22)';
      ctx.lineWidth   = 1;
      const W = canvas.width, H = canvas.height;
      const corners = [[gap, gap], [W - gap, gap], [gap, H - gap], [W - gap, H - gap]];
      const dirs    = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
      corners.forEach(([cx, cy], i) => {
        const [dx, dy] = dirs[i];
        ctx.beginPath();
        ctx.moveTo(cx,        cy + dy * sz); // Vertical arm
        ctx.lineTo(cx,        cy);            // Corner
        ctx.lineTo(cx + dx * sz, cy);        // Horizontal arm
        ctx.stroke();
      });
    };

    /* Main animation loop */
    const render = () => {
      s.tick++;

      /* Trail effect — semi-transparent fill instead of full clear */
      ctx.fillStyle = 'rgba(5,8,16,0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawScanLine();
      drawMouseGlow();

      /* Update all nodes */
      s.nodes.forEach(n => n.update(canvas.width, canvas.height, s.mouse.x, s.mouse.y));

      /* Draw all edges */
      for (let i = 0; i < s.nodes.length; i++) {
        for (let j = i + 1; j < s.nodes.length; j++) {
          const dx   = s.nodes[i].x - s.nodes[j].x;
          const dy   = s.nodes[i].y - s.nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CFG.linkDist) drawEdge(s.nodes[i], s.nodes[j], dist);
        }
      }

      /* Draw all nodes on top of edges */
      s.nodes.forEach(n => n.draw(ctx, s.tick));

      drawCorners();

      s.raf = requestAnimationFrame(render);                   // Schedule next frame
    };

    /* Event listeners */
    const onMove  = (e) => { s.mouse.x = e.clientX; s.mouse.y = e.clientY; };
    const onLeave = () =>  { s.mouse.x = null;       s.mouse.y = null;      };
    window.addEventListener('resize',    resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    resize();  // Initial setup
    render();  // Start loop

    /* Cleanup on unmount */
    return () => {
      window.removeEventListener('resize',    resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(s.raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',                // Pinned to viewport
        inset:         0,                      // Cover all edges
        width:         '100%',
        height:        '100%',
        zIndex:        0,                      // Behind everything
        opacity,                               // Adjustable from parent
        pointerEvents: 'none',                 // Never intercept clicks
      }}
      aria-hidden="true"
    />
  );
}