
(() => {
  'use strict';

  const API = 'https://nasa-seasonal-effects.mohammedalnajjar2211.workers.dev/api/effects';
  const STYLE_ID = 'nasa-seasonal-style';
  let cleanup = () => {};

  function clearEffects() {
    cleanup();
    cleanup = () => {};
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById('nasa-seasonal-root')?.remove();
  }

  function render(data) {
    clearEffects();
    if (!data || data.active !== true) return;

    const effect = data.effect;
    if (!['halloween', 'blackfriday', 'christmas'].includes(effect)) return;

    const intensity = Math.max(10, Math.min(100, Number(data.intensity) || 35));
    const root = document.createElement('div');
    root.id = 'nasa-seasonal-root';
    root.setAttribute('aria-hidden', 'true');

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #nasa-seasonal-root {
        position: fixed;
        inset: 0;
        z-index: 9998;
        pointer-events: none;
        overflow: hidden;
      }
      .nasa-seasonal-particle {
        position: absolute;
        top: -50px;
        animation: nasa-seasonal-fall linear infinite;
        will-change: transform;
        user-select: none;
      }
      @keyframes nasa-seasonal-fall {
        from { transform: translate3d(0,-40px,0) rotate(0deg); }
        to { transform: translate3d(35px,110vh,0) rotate(360deg); }
      }
      .nasa-seasonal-banner {
        position: fixed;
        bottom: 75px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        max-width: calc(100vw - 30px);
        padding: 10px 20px;
        border-radius: 30px;
        background: linear-gradient(100deg,#082c60,#0877d5);
        color: white;
        text-align: center;
        text-decoration: none;
        font: 600 14px system-ui,sans-serif;
        box-shadow: 0 5px 22px #0004;
      }
      @media (prefers-reduced-motion: reduce) {
        .nasa-seasonal-particle { animation: none; display: none; }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(root);

    const symbols = {
      halloween: ['🎃', '👻', '🦇'],
      christmas: ['❄️', '❅', '✦'],
      blackfriday: ['✦', '✨']
    }[effect];

    const count = window.matchMedia('(max-width: 700px)').matches
      ? Math.round(intensity / 7)
      : Math.round(intensity / 4);

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      particle.className = 'nasa-seasonal-particle';
      particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.fontSize = `${12 + Math.random() * 16}px`;
      particle.style.opacity = String(0.35 + Math.random() * 0.45);
      particle.style.animationDuration = `${9 + Math.random() * 12}s`;
      particle.style.animationDelay = `${-Math.random() * 20}s`;
      fragment.appendChild(particle);
    }

    root.appendChild(fragment);

    if (data.message) {
      const banner = document.createElement('a');
      banner.className = 'nasa-seasonal-banner';
      banner.textContent = String(data.message).slice(0, 120);
      banner.href = typeof data.link === 'string' &&
        /^\/(?!\/)/.test(data.link) ? data.link : '/shop/';
      document.body.appendChild(banner);
      cleanup = () => banner.remove();
    }
  }

  async function refresh() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(API, {
          signal: controller.signal,
          cache: 'no-store'
        });
        if (!response.ok) throw new Error('Seasonal API unavailable');
        render(await response.json());
      } finally {
        clearTimeout(timeout);
      }
    } catch (_) {
      clearEffects();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh, { once: true });
  } else {
    refresh();
  }

  document.addEventListener('astro:page-load', refresh);
  setInterval(refresh, 60000);
})();
