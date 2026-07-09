/*
 * <appmap-live-trace> — a self-running, framework-free animated AppMap trace.
 *
 * A request flows through an application's call graph: nodes light up as they
 * become active, glowing particles travel the call edges, and edges stay lit
 * with AppMap's signature pink -> purple -> blue gradient as the trace
 * completes, then the whole thing fades and loops.
 *
 * Drop-in usage (no build step, no dependencies):
 *
 *   <script src="appmap-live-trace.js"></script>
 *   <appmap-live-trace></appmap-live-trace>
 *
 * Attributes (all optional):
 *   scenario   "web" (default) | "background" | "navie"
 *   speed      playback multiplier, e.g. "1.5" (default "1")
 *   static     present -> render the completed trace without animating
 *
 * Honors prefers-reduced-motion: when the user prefers reduced motion the
 * trace renders in its completed state and does not animate.
 */
(function () {
  'use strict';

  // --- AppMap brand palette (from packages/components/src/scss/_variables.scss)
  const C = {
    bg0: '#010306',
    bg1: '#0a0418',
    bg2: '#150733',
    pink: '#ff07aa',
    royal: '#9c2fba',
    blue: '#4362b1',
    brightblue: '#3794ff',
    teal: '#6fddd6',
    success: '#3bf804',
    textDim: '#808b98',
    textBright: '#e1e2e2',
    // call-value colors, used to tint node kinds
    http: '#3794ff',
    controller: '#ae81ff',
    service: '#ff07aa',
    db: '#fd971f',
    cache: '#66d9ef',
    view: '#a6e22e',
  };

  // Gradient stops used along the lit call edges (pink -> purple -> blue).
  const EDGE_STOPS = [C.pink, C.royal, C.blue];

  // --- Scenario definitions ------------------------------------------------
  // Nodes are placed on a normalized 0..1 canvas; the renderer scales them.
  // Each span is one call: { from, to, at, dur } in abstract time units.
  const SCENARIOS = {
    web: {
      caption: 'GET /orders/142',
      nodes: [
        { id: 'http', label: 'HTTP', sub: 'GET /orders/142', kind: 'http', x: 0.08, y: 0.5 },
        { id: 'ctrl', label: 'OrdersController', sub: '#show', kind: 'controller', x: 0.32, y: 0.28 },
        { id: 'auth', label: 'Authn', sub: 'current_user', kind: 'service', x: 0.32, y: 0.74 },
        { id: 'model', label: 'Order', sub: '.find', kind: 'service', x: 0.58, y: 0.32 },
        { id: 'cache', label: 'Redis', sub: 'GET order:142', kind: 'cache', x: 0.58, y: 0.72 },
        { id: 'db', label: 'PostgreSQL', sub: 'SELECT … WHERE id=$1', kind: 'db', x: 0.82, y: 0.48 },
        { id: 'view', label: 'render', sub: 'order.json', kind: 'view', x: 0.82, y: 0.86 },
      ],
      spans: [
        { from: 'http', to: 'ctrl', at: 0, dur: 8 },
        { from: 'ctrl', to: 'auth', at: 8, dur: 7 },
        { from: 'ctrl', to: 'model', at: 16, dur: 6 },
        { from: 'model', to: 'cache', at: 22, dur: 6 },
        { from: 'model', to: 'db', at: 30, dur: 12 },
        { from: 'ctrl', to: 'view', at: 44, dur: 8 },
      ],
    },
    background: {
      caption: 'Sidekiq · ChargeInvoiceJob',
      nodes: [
        { id: 'job', label: 'Worker', sub: 'ChargeInvoiceJob', kind: 'http', x: 0.08, y: 0.5 },
        { id: 'svc', label: 'Billing', sub: '.charge', kind: 'controller', x: 0.32, y: 0.5 },
        { id: 'inv', label: 'Invoice', sub: '.lock!', kind: 'service', x: 0.55, y: 0.26 },
        { id: 'pay', label: 'Stripe', sub: 'POST /charges', kind: 'cache', x: 0.55, y: 0.74 },
        { id: 'db', label: 'PostgreSQL', sub: 'UPDATE invoices', kind: 'db', x: 0.82, y: 0.4 },
        { id: 'mail', label: 'Mailer', sub: 'receipt.deliver', kind: 'view', x: 0.82, y: 0.82 },
      ],
      spans: [
        { from: 'job', to: 'svc', at: 0, dur: 7 },
        { from: 'svc', to: 'inv', at: 7, dur: 6 },
        { from: 'inv', to: 'db', at: 13, dur: 9 },
        { from: 'svc', to: 'pay', at: 24, dur: 14 },
        { from: 'svc', to: 'mail', at: 40, dur: 8 },
      ],
    },
    navie: {
      caption: 'Navie · explain this trace',
      nodes: [
        { id: 'q', label: 'Navie', sub: 'why is /orders slow?', kind: 'service', x: 0.08, y: 0.5 },
        { id: 'idx', label: 'AppMap', sub: 'index', kind: 'controller', x: 0.34, y: 0.3 },
        { id: 'trace', label: 'Trace', sub: 'OrdersController#index', kind: 'http', x: 0.34, y: 0.72 },
        { id: 'sql', label: 'SQL', sub: 'N+1: 142 queries', kind: 'db', x: 0.62, y: 0.5 },
        { id: 'ans', label: 'Answer', sub: 'add includes(:line_items)', kind: 'view', x: 0.88, y: 0.5 },
      ],
      spans: [
        { from: 'q', to: 'idx', at: 0, dur: 7 },
        { from: 'idx', to: 'trace', at: 7, dur: 6 },
        { from: 'trace', to: 'sql', at: 13, dur: 10 },
        { from: 'sql', to: 'ans', at: 25, dur: 9 },
        { from: 'q', to: 'ans', at: 25, dur: 9 },
      ],
    },
  };

  // --- Small math helpers --------------------------------------------------
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mixHex(a, b, t) {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    return `rgb(${Math.round(lerp(ca[0], cb[0], t))},${Math.round(lerp(ca[1], cb[1], t))},${Math.round(
      lerp(ca[2], cb[2], t)
    )})`;
  }
  // Sample the 3-stop pink->purple->blue gradient at u in 0..1.
  function gradAt(u) {
    u = clamp(u, 0, 1);
    if (u < 0.5) return mixHex(EDGE_STOPS[0], EDGE_STOPS[1], u / 0.5);
    return mixHex(EDGE_STOPS[1], EDGE_STOPS[2], (u - 0.5) / 0.5);
  }
  function withAlpha(rgb, a) {
    // rgb is "rgb(r,g,b)" -> "rgba(r,g,b,a)"
    return rgb.replace('rgb(', 'rgba(').replace(')', `,${a})`);
  }

  // --- The custom element --------------------------------------------------
  class AppMapLiveTrace extends HTMLElement {
    connectedCallback() {
      if (this._mounted) return;
      this._mounted = true;

      this.canvas = document.createElement('canvas');
      this.canvas.style.display = 'block';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.style.display = this.style.display || 'block';
      this.style.position = 'relative';
      this.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');

      const name = this.getAttribute('scenario') || 'web';
      this.scenario = SCENARIOS[name] || SCENARIOS.web;
      this.speed = parseFloat(this.getAttribute('speed') || '1') || 1;

      const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.staticMode = this.hasAttribute('static') || reduced;

      // Total trace duration in abstract units (+ trailing hold before loop).
      this.traceEnd = this.scenario.spans.reduce((m, s) => Math.max(m, s.at + s.dur), 0);
      this.loopLen = this.traceEnd + 22; // hold lit, then fade & restart
      this.t0 = null;

      this._onResize = () => this._resize();
      window.addEventListener('resize', this._onResize);
      this._resize();

      if (this.staticMode) {
        this._draw(this.traceEnd + 6); // fully-lit frame
      } else {
        this._raf = requestAnimationFrame((ts) => this._frame(ts));
      }

      // Pause when scrolled out of view to save cycles.
      if ('IntersectionObserver' in window) {
        this._io = new IntersectionObserver((entries) => {
          this._visible = entries[0].isIntersecting;
          if (this._visible && !this.staticMode && !this._raf) {
            this._raf = requestAnimationFrame((ts) => this._frame(ts));
          }
        });
        this._io.observe(this);
      } else {
        this._visible = true;
      }
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = null;
      if (this._io) this._io.disconnect();
      this._mounted = false;
    }

    _resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = this.getBoundingClientRect();
      const w = Math.max(320, rect.width || 800);
      const h = Math.max(220, rect.height || 420);
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.W = w;
      this.H = h;
      if (this.staticMode) this._draw(this.traceEnd + 6);
    }

    _frame(ts) {
      this._raf = null;
      if (this.t0 == null) this.t0 = ts;
      const elapsed = ((ts - this.t0) / 1000) * 12 * this.speed; // 12 abstract units / sec
      const t = elapsed % this.loopLen;
      this._draw(t);
      if (this._visible !== false) {
        this._raf = requestAnimationFrame((next) => this._frame(next));
      }
    }

    // Map normalized node coords into a padded drawing rect.
    _pt(n) {
      const padX = this.W * 0.06 + 60;
      const padY = this.H * 0.12 + 30;
      return {
        x: lerp(padX, this.W - padX, n.x),
        y: lerp(padY, this.H - padY, n.y),
      };
    }

    _draw(t) {
      const ctx = this.ctx;
      const { W, H } = this;
      const nodes = this.scenario.nodes;
      const spans = this.scenario.spans;
      const byId = (id) => nodes.find((n) => n.id === id);

      // Global fade: the trace holds lit, then fades out over the last 8 units.
      const fadeStart = this.loopLen - 8;
      const globalAlpha = t > fadeStart ? 1 - (t - fadeStart) / 8 : 1;

      // Background: deep radial wash.
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, C.bg0);
      bg.addColorStop(0.55, C.bg1);
      bg.addColorStop(1, C.bg2);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      this._drawGrid(ctx, W, H);

      // --- Edges -----------------------------------------------------------
      let gi = 0;
      const nSpans = spans.length;
      for (const s of spans) {
        const a = this._pt(byId(s.from));
        const b = this._pt(byId(s.to));
        const u0 = nSpans > 1 ? gi / (nSpans - 1) : 0; // position along brand gradient
        gi++;
        const lit = clamp((t - s.at) / s.dur, 0, 1); // 0..1 how much of edge is lit
        this._drawEdge(ctx, a, b, gradAt(u0), lit, globalAlpha);

        // Traveling particle while the span is active.
        const active = t >= s.at && t <= s.at + s.dur;
        if (active && !this.staticMode) {
          const p = easeInOut(clamp((t - s.at) / s.dur, 0, 1));
          this._drawParticle(ctx, a, b, p, gradAt(u0), globalAlpha);
        }
      }

      // --- Nodes -----------------------------------------------------------
      for (const n of nodes) {
        const p = this._pt(n);
        // A node is "hot" while any span touching it is active; cools after.
        let activity = 0;
        let everLit = 0;
        for (const s of spans) {
          if (s.from === n.id || s.to === n.id) {
            if (t >= s.at) everLit = 1;
            const local = (t - s.at) / s.dur;
            if (local >= -0.15 && local <= 1.2) {
              activity = Math.max(activity, 1 - Math.abs(clamp(local, 0, 1) - 0.5) * 1.4);
            }
            // keep a warm glow for a moment after completion
            if (local > 1 && local < 2.4) activity = Math.max(activity, (2.4 - local) / 1.4 * 0.5);
          }
        }
        this._drawNode(ctx, n, p, clamp(activity, 0, 1), everLit, globalAlpha);
      }

      // --- Caption ---------------------------------------------------------
      this._drawCaption(ctx, W, H, globalAlpha);
    }

    _drawGrid(ctx, W, H) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = 'rgba(120,139,152,0.06)';
      ctx.lineWidth = 1;
      const step = 44;
      for (let x = 0; x <= W; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // A curved edge; the lit portion is drawn over a faint baseline.
    _edgePath(ctx, a, b) {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      // bow the curve perpendicular to the segment for an organic feel
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const bow = Math.min(60, len * 0.18);
      const cx = mx + nx * bow;
      const cy = my + ny * bow;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(cx, cy, b.x, b.y);
      return { cx, cy };
    }

    _drawEdge(ctx, a, b, color, lit, ga) {
      ctx.save();
      // faint baseline
      this._edgePath(ctx, a, b);
      ctx.strokeStyle = withAlpha('rgb(120,139,152)', 0.18 * ga);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (lit > 0) {
        // approximate partial draw by clipping with a dash that reveals `lit`
        const { cx, cy } = this._edgePath(ctx, a, b);
        // estimate curve length for dash reveal
        const approx =
          Math.hypot(cx - a.x, cy - a.y) + Math.hypot(b.x - cx, b.y - cy);
        ctx.setLineDash([approx, approx]);
        ctx.lineDashOffset = approx * (1 - lit);
        ctx.strokeStyle = withAlpha(color, 0.9 * ga);
        ctx.shadowColor = withAlpha(color, 0.8 * ga);
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    _drawParticle(ctx, a, b, p, color, ga) {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const bow = Math.min(60, len * 0.18);
      const cx = mx + nx * bow;
      const cy = my + ny * bow;
      // quadratic bezier position at p
      const q = 1 - p;
      const x = q * q * a.x + 2 * q * p * cx + p * p * b.x;
      const y = q * q * a.y + 2 * q * p * cy + p * p * b.y;
      ctx.save();
      const r = 4.5;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      glow.addColorStop(0, withAlpha(color, 0.9 * ga));
      glow.addColorStop(1, withAlpha(color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = withAlpha('rgb(255,255,255)', 0.95 * ga);
      ctx.beginPath();
      ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    _drawNode(ctx, n, p, activity, everLit, ga) {
      const kindColor = C[n.kind] || C.brightblue;
      const baseR = 6;
      ctx.save();

      // outer glow when active
      if (activity > 0.02) {
        const gr = 14 + activity * 26;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gr);
        glow.addColorStop(0, withAlpha(`rgb(${hexToRgb(kindColor).join(',')})`, 0.55 * activity * ga));
        glow.addColorStop(1, withAlpha(`rgb(${hexToRgb(kindColor).join(',')})`, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, gr, 0, Math.PI * 2);
        ctx.fill();
      }

      // node core
      const r = baseR + activity * 3.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      const litT = everLit ? 1 : 0.35;
      ctx.fillStyle = withAlpha(`rgb(${hexToRgb(kindColor).join(',')})`, (0.35 + 0.55 * litT) * ga);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = withAlpha(
        `rgb(${hexToRgb(kindColor).join(',')})`,
        (0.5 + 0.5 * activity) * ga
      );
      ctx.stroke();

      // label
      const dim = everLit ? C.textBright : C.textDim;
      ctx.globalAlpha = (everLit ? 0.95 : 0.5) * ga;
      ctx.font =
        '600 13px ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
      ctx.fillStyle = dim;
      ctx.textBaseline = 'middle';
      // place label to the right unless near right edge
      const right = p.x < this.W * 0.7;
      ctx.textAlign = right ? 'left' : 'right';
      const lx = right ? p.x + r + 8 : p.x - r - 8;
      ctx.fillText(n.label, lx, p.y - 7);
      ctx.globalAlpha = (everLit ? 0.6 : 0.32) * ga;
      ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      ctx.fillStyle = C.textDim;
      ctx.fillText(n.sub, lx, p.y + 8);
      ctx.restore();
    }

    _drawCaption(ctx, W, H, ga) {
      ctx.save();
      ctx.globalAlpha = 0.85 * ga;
      // a small "live" pill in the top-left
      ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const x = 18;
      const y = 22;
      ctx.fillStyle = withAlpha('rgb(59,248,4)', 0.9 * ga);
      ctx.beginPath();
      ctx.arc(x + 4, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.textBright;
      ctx.fillText('AppMap · live trace', x + 16, y);
      ctx.textAlign = 'right';
      ctx.globalAlpha = 0.6 * ga;
      ctx.fillStyle = C.textDim;
      ctx.fillText(this.scenario.caption, W - 18, y);
      ctx.restore();
    }
  }

  if (!customElements.get('appmap-live-trace')) {
    customElements.define('appmap-live-trace', AppMapLiveTrace);
  }
})();
