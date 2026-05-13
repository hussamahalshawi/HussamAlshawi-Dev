/**
 * ParticleBackground.jsx — Theme-Aware Cyberpunk Network Grid
 * Dark mode: cyan/blue/violet nodes on deep dark background
 * Light mode: soft blue/teal nodes on sky-blue background
 */
import { useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext'; // Read current theme

/* ── Theme-specific configurations ──────────────────────────── */
const THEMES = {
  dark: {
    bg:          'rgba(5,8,16,0.18)',               // Trail fade — deep dark
    scanColor:   'rgba(79,195,247,0.035)',           // Cyan scan line
    mouseGlow:   ['rgba(79,195,247,0.07)', 'rgba(91,141,239,0.03)'],
    cornerColor: 'rgba(79,195,247,0.22)',            // Cyan brackets
    nodeColors: [
      'rgba(79,195,247,',                            // Cyan
      'rgba(91,141,239,',                            // Blue
      'rgba(155,127,234,',                           // Violet
      'rgba(78,204,163,',                            // Green
    ],
    centerDot:   'rgba(255,255,255,0.75)',           // White hot center
  },
  light: {
    bg:          'rgba(207,224,245,0.22)',           // Trail fade — sky blue
    scanColor:   'rgba(79,145,247,0.025)',           // Blue scan line
    mouseGlow:   ['rgba(79,145,247,0.08)', 'rgba(120,180,255,0.04)'],
    cornerColor: 'rgba(79,145,247,0.30)',            // Blue brackets
    nodeColors: [
      'rgba(26,143,199,',                            // Deep cyan
      'rgba(58,111,216,',                            // Deep blue
      'rgba(124,91,212,',                            // Deep violet
      'rgba(26,158,110,',                            // Deep green
    ],
    centerDot:   'rgba(255,255,255,0.90)',           // Bright white center
  },
};

/* ── Particle system config (same for both themes) ──────────── */
const CFG = {
  count:        120,                                 // Node count
  speed:        0.28,                                // Drift speed
  linkDist:     140,                                 // Max edge distance
  mouseRepel:   160,                                 // Repulsion radius
  mouseAttract: 280,                                 // Attraction outer radius
  nodeR:        2.2,                                 // Max node radius
};

/* ── Single particle node ────────────────────────────────────── */
class Node {
  constructor(w, h, colorCount) {
    this.w          = w;
    this.h          = h;
    this.x          = Math.random() * w;
    this.y          = Math.random() * h;
    this.vx         = (Math.random() - 0.5) * CFG.speed;
    this.vy         = (Math.random() - 0.5) * CFG.speed;
    this.r          = Math.random() * CFG.nodeR + 0.8;
    this.ci         = Math.floor(Math.random() * colorCount); // Color index
    this.phase      = Math.random() * Math.PI * 2;
    this.pulseSpeed = 0.015 + Math.random() * 0.02;
  }

  update(mx, my) {
    /* Mouse repulsion / attraction */
    if (mx !== null && my !== null) {
      const dx = this.x - mx, dy = this.y - my;
      const d2 = dx * dx + dy * dy;
      const rr = CFG.mouseRepel  * CFG.mouseRepel;
      const ar = CFG.mouseAttract * CFG.mouseAttract;

      if (d2 < rr && d2 > 0) {
        const d = Math.sqrt(d2);
        const f = (CFG.mouseRepel - d) / CFG.mouseRepel * 0.8;
        this.vx += (dx / d) * f;
        this.vy += (dy / d) * f;
      } else if (d2 < ar && d2 > rr) {
        const d = Math.sqrt(d2);
        const f = ((d - CFG.mouseRepel) / (CFG.mouseAttract - CFG.mouseRepel)) * 0.04;
        this.vx -= (dx / d) * f;
        this.vy -= (dy / d) * f;
      }
    }

    this.vx *= 0.972; this.vy *= 0.972;  // Friction
    this.x  += this.vx; this.y += this.vy;

    /* Wrap edges */
    if (this.x < 0) this.x = this.w;
    if (this.x > this.w) this.x = 0;
    if (this.y < 0) this.y = this.h;
    if (this.y > this.h) this.y = 0;
  }

  draw(ctx, tick, colors, centerDot) {
    const pulse = 0.6 + 0.4 * Math.sin(tick * this.pulseSpeed + this.phase);
    const r     = this.r * (0.85 + 0.35 * pulse);
    const col   = colors[this.ci];

    /* Outer ambient glow */
    const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 5);
    grd.addColorStop(0, col + (0.30 * pulse) + ')');
    grd.addColorStop(1, col + '0)');
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    /* Colored core */
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = col + (0.85 + 0.15 * pulse) + ')';
    ctx.fill();

    /* White center */
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = centerDot;
    ctx.fill();
  }
}

/* ── Main Component ──────────────────────────────────────────── */
export default function ParticleBackground({ opacity = 0.85 }) {
  const { isDark } = useTheme();                               // Read theme from context
  const canvasRef  = useRef(null);
  const stateRef   = useRef({
    nodes: [], mouse: { x: null, y: null }, tick: 0, raf: null
  });

  /* ── Re-init nodes when canvas resizes ── */
  const initNodes = (w, h, colorCount) => {
    stateRef.current.nodes = Array.from(
      { length: CFG.count },
      () => new Node(w, h, colorCount)
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s   = stateRef.current;

    /* Get current theme config */
    const T = isDark ? THEMES.dark : THEMES.light;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes(canvas.width, canvas.height, T.nodeColors.length);
    };

    /* Gradient edge between two nodes */
    const drawEdge = (a, b, dist) => {
      const alpha = 1 - dist / CFG.linkDist;
      const grd   = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grd.addColorStop(0, T.nodeColors[a.ci] + (alpha * 0.65) + ')');
      grd.addColorStop(1, T.nodeColors[b.ci] + (alpha * 0.65) + ')');
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = grd;
      ctx.lineWidth   = alpha * 1.2 + 0.2;
      ctx.stroke();
    };

    /* Mouse ambient glow */
    const drawMouseGlow = () => {
      if (s.mouse.x === null) return;
      const grd = ctx.createRadialGradient(
        s.mouse.x, s.mouse.y, 0,
        s.mouse.x, s.mouse.y, 200
      );
      grd.addColorStop(0,   T.mouseGlow[0]);
      grd.addColorStop(0.5, T.mouseGlow[1]);
      grd.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(s.mouse.x, s.mouse.y, 200, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    };

    /* Moving scan line */
    const drawScanLine = () => {
      const y   = (s.tick * 0.8) % canvas.height;
      const grd = ctx.createLinearGradient(0, y - 30, 0, y + 30);
      grd.addColorStop(0,   'rgba(0,0,0,0)');
      grd.addColorStop(0.5, T.scanColor);
      grd.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, y - 30, canvas.width, 60);
    };

    /* Corner bracket decorations */
    const drawCorners = () => {
      const sz = 32, gap = 24;
      const W  = canvas.width, H = canvas.height;
      ctx.strokeStyle = T.cornerColor;
      ctx.lineWidth   = 1;
      [[gap, gap, 1, 1], [W - gap, gap, -1, 1],
       [gap, H - gap, 1, -1], [W - gap, H - gap, -1, -1]
      ].forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + dy * sz);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + dx * sz, cy);
        ctx.stroke();
      });
    };

    /* Animation loop */
    const render = () => {
      s.tick++;

      /* Theme-aware trail */
      ctx.fillStyle = T.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawScanLine();
      drawMouseGlow();

      s.nodes.forEach(n => n.update(s.mouse.x, s.mouse.y));

      /* Edges */
      for (let i = 0; i < s.nodes.length; i++) {
        for (let j = i + 1; j < s.nodes.length; j++) {
          const dx   = s.nodes[i].x - s.nodes[j].x;
          const dy   = s.nodes[i].y - s.nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CFG.linkDist) drawEdge(s.nodes[i], s.nodes[j], dist);
        }
      }

      /* Nodes */
      s.nodes.forEach(n => n.draw(ctx, s.tick, T.nodeColors, T.centerDot));

      drawCorners();

      s.raf = requestAnimationFrame(render);
    };

    /* Events */
    const onMove  = e => { s.mouse.x = e.clientX; s.mouse.y = e.clientY; };
    const onLeave = () => { s.mouse.x = null;      s.mouse.y = null;      };
    window.addEventListener('resize',     resize);
    window.addEventListener('mousemove',  onMove);
    window.addEventListener('mouseleave', onLeave);

    resize();
    render();

    return () => {
      window.removeEventListener('resize',     resize);
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(s.raf);
    };
  }, [isDark]); // ← Re-run when theme changes

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        width:         '100%',
        height:        '100%',
        zIndex:        0,
        opacity,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}