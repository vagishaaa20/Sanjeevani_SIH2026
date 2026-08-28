import { useEffect, useRef } from "react";

/**
 * Animated SVG DNA Double Helix — Canvas-based
 * More realistic rendering with:
 * - True 3D perspective projection (elliptical path per sphere)
 * - Two distinct nucleotide pair colours (A-T cyan, G-C white)
 * - Depth-sorted sphere rendering (painters algorithm)
 * - Major/minor groove distinction via variable rung density
 * - Smooth 3D rotation with perspective foreshortening
 */
export default function DNAHelix({ className = "" }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Nucleotide pair types — 2 colours like real DNA base pairs
    const pairTypes = [
      { c1: "rgba(15,200,230,0.95)", c2: "rgba(93,220,238,0.85)", label: "AT" },  // A-T: cyan
      { c1: "rgba(255,255,255,0.92)", c2: "rgba(200,245,252,0.8)", label: "GC" }, // G-C: white
    ];

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const amplitude = w * 0.3;     // horizontal spread
      const NODES = 20;              // nucleotide pairs along the helix
      const HELIX_TURNS = 2.5;      // number of full 360° turns visible
      const PERSPECTIVE = 0.55;     // vertical foreshortening (0=circle, 1=flat)

      // ── Collect all drawable objects first (for depth-sorting) ──
      const spheres = [];
      const rungs = [];

      for (let i = 0; i <= NODES; i++) {
        const progress = i / NODES;
        const y = h * 0.05 + progress * h * 0.9;
        const angle = t + progress * Math.PI * 2 * HELIX_TURNS;

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        // 3D coords on a cylinder, projected onto 2D
        // strand1: (sin, cos) projected — x ± sin, depth = cos
        const x1 = cx + sinA * amplitude;
        const x2 = cx - sinA * amplitude;

        // Depth: cosA tells us front-vs-back (1=front, -1=back)
        const depth1 = (cosA + 1) / 2;  // 0–1, front=1
        const depth2 = 1 - depth1;

        // Base pair type alternates every ~3 nodes for variety
        const pairIdx = Math.floor(i / 1.5) % 2;
        const pair = pairTypes[pairIdx];

        // Sphere radii with perspective (front spheres bigger)
        const rBase = 5.5;
        const rScale = 3.5;
        const r1 = rBase + depth1 * rScale;
        const r2 = rBase + depth2 * rScale;

        // Strand positions for rung endpoints
        spheres.push({ x: x1, y, r: r1, depth: depth1, isStrand1: true, pair, idx: i });
        spheres.push({ x: x2, y, r: r2, depth: depth2, isStrand1: false, pair, idx: i });

        // Rung: only draw when the rung is mostly horizontal (not going into/out of page)
        // Use cosA close to 0 as indicator the rung is visible
        const rungOpacity = (1 - Math.abs(cosA)) * 0.55 + 0.08;
        rungs.push({ x1, x2, y, opacity: rungOpacity, cosA });
      }

      // ── Draw backbone strands first ──
      const drawStrand = (isStrand1) => {
        ctx.beginPath();
        let first = true;
        for (let i = 0; i <= NODES; i++) {
          const sp = spheres.find(s => s.idx === i && s.isStrand1 === isStrand1);
          if (!sp) continue;
          if (first) { ctx.moveTo(sp.x, sp.y); first = false; }
          else ctx.lineTo(sp.x, sp.y);
        }
        const grad = ctx.createLinearGradient(0, h * 0.05, 0, h * 0.95);
        if (isStrand1) {
          grad.addColorStop(0, "rgba(15,200,230,0.15)");
          grad.addColorStop(0.25, "rgba(15,200,230,0.8)");
          grad.addColorStop(0.75, "rgba(93,220,238,0.8)");
          grad.addColorStop(1, "rgba(15,200,230,0.15)");
        } else {
          grad.addColorStop(0, "rgba(255,255,255,0.1)");
          grad.addColorStop(0.25, "rgba(255,255,255,0.7)");
          grad.addColorStop(0.75, "rgba(200,245,252,0.65)");
          grad.addColorStop(1, "rgba(255,255,255,0.1)");
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      };

      // ── Draw rungs (horizontal base-pair bridges) ──
      rungs.forEach(({ x1, x2, y, opacity, cosA }) => {
        // Draw dumbbell-style rung with two colour halves
        const midX = (x1 + x2) / 2;

        // Half 1 (strand1 side)
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(midX, y);
        ctx.strokeStyle = `rgba(93,220,238,${opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Half 2 (strand2 side)
        ctx.beginPath();
        ctx.moveTo(midX, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = `rgba(200,245,252,${opacity * 0.75})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      drawStrand(true);
      drawStrand(false);

      // ── Depth-sort spheres: back-to-front painter's algorithm ──
      const sorted = [...spheres].sort((a, b) => a.depth - b.depth);

      sorted.forEach(({ x, y, r, depth, isStrand1, pair }) => {
        // Outer glow halo
        const glowR = r + 5;
        const glowAlpha = depth * 0.12;
        const gGlow = ctx.createRadialGradient(x, y, r * 0.6, x, y, glowR);
        gGlow.addColorStop(0, isStrand1
          ? `rgba(15,200,230,${glowAlpha})`
          : `rgba(255,255,255,${glowAlpha * 0.6})`);
        gGlow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(x, y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = gGlow;
        ctx.fill();

        // Sphere body — radial gradient for 3D look
        const hlX = x - r * 0.35;
        const hlY = y - r * 0.35;
        const gSphere = ctx.createRadialGradient(hlX, hlY, r * 0.05, x, y, r);
        if (isStrand1) {
          gSphere.addColorStop(0, "rgba(230,252,255,0.98)");
          gSphere.addColorStop(0.35, pair.c1);
          gSphere.addColorStop(0.75, "rgba(5,120,145,0.85)");
          gSphere.addColorStop(1, "rgba(3,70,90,0.7)");
        } else {
          gSphere.addColorStop(0, "rgba(255,255,255,0.99)");
          gSphere.addColorStop(0.35, pair.c2);
          gSphere.addColorStop(0.75, "rgba(130,210,230,0.8)");
          gSphere.addColorStop(1, "rgba(80,160,180,0.65)");
        }
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = gSphere;
        ctx.fill();

        // Specular highlight (small bright spot upper-left)
        const hlR = r * 0.28;
        const gHl = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR);
        gHl.addColorStop(0, "rgba(255,255,255,0.9)");
        gHl.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(hlX, hlY, hlR, 0, Math.PI * 2);
        ctx.fillStyle = gHl;
        ctx.fill();
      });

      t += 0.013;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      aria-hidden="true"
      role="img"
    />
  );
}
