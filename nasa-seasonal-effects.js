
(() => {
  'use strict';

  const API = 'https://nasa-seasonal-effects.mohammedalnajjar2211.workers.dev/api/effects';
  const ROOT_ID = 'nasa-seasonal-root';
  const STYLE_ID = 'nasa-seasonal-style';
  const BANNER_ID = 'nasa-seasonal-banner';

  const EFFECTS = {
    halloween: {
      items: ['🎃', '🎃', '👻', '🦇', '🕸️', '🕷️', '🌙', '✨'],
      accent: '#f7a34b',
      banner: 'linear-gradient(110deg,#241335,#51224c,#a34d19)',
      border: '#ef994c'
    },
    blackfriday: {
      items: ['BLACK FRIDAY', 'BLACK FRIDAY', 'BLACK FRIDAY', '%', '% OFF', 'SALE', 'DEALS', '✦'],
      accent: '#eac46e',
      banner: 'linear-gradient(110deg,#090909,#302819,#090909)',
      border: '#cba455'
    },
    cybermonday: {
      items: ['CYBER MONDAY', 'CYBER MONDAY', '%', '% OFF', 'FLASH SALE', 'DEALS', '✧', '⚡'],
      accent: '#9dd9ff',
      banner: 'linear-gradient(110deg,#101a4d,#392278,#0c5787)',
      border: '#74c9ff'
    },
    christmas: {
      items: ['❄️', '❄️', '❄️', '❅', '❆', '🎄', '🎄', '🎅', '☃️', '⛄', '🎁', '🔔', '⭐', '✨', '🦌', '🧦'],
      accent: '#f6faff',
      banner: 'linear-gradient(110deg,#084d43,#13735b,#0c4b3d)',
      border: '#e5c57e'
    },
    spring: {
      items: ['🌸', '🌸', '🌺', '🌷', '🌼', '🌿', '🍃', '🦋', '🦋', '🌱', '✨'],
      accent: '#f9b9d3',
      banner: 'linear-gradient(110deg,#315f4c,#588e65,#b15f8d)',
      border: '#f3b8d4'
    },
    ramadan: {
      items: ['🌙', '🌙', '🏮', '⭐', '✨', '✦', '☪️', 'رمضان كريم'],
      accent: '#f2d78e',
      banner: 'linear-gradient(110deg,#0c3040,#13564c,#2b3c63)',
      border: '#dfbe75'
    },
    eidfitr: {
      items: ['🌙', '⭐', '✨', '🎁', '🎉', '💫', '✦', 'عيد مبارك'],
      accent: '#f2d98c',
      banner: 'linear-gradient(110deg,#16584b,#327f63,#755e30)',
      border: '#e9cc80'
    }
  };

  let lastSignature = null;
  let inFlight = false;

  const random = (min, max) => min + Math.random() * (max - min);
  const pick = list => list[Math.floor(Math.random() * list.length)];

  function clearEffects() {
    document.getElementById(ROOT_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(BANNER_ID)?.remove();
    lastSignature = null;
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID} {
        position: fixed;
        inset: 0;
        z-index: 9998;
        overflow: hidden;
        pointer-events: none;
        contain: layout style;
      }

      #${ROOT_ID} .nasa-seasonal-particle {
        position: absolute;
        top: -85px;
        left: 0;
        white-space: nowrap;
        user-select: none;
        pointer-events: none;
        line-height: 1.3;
        animation: nasa-seasonal-fall var(--duration)
          linear var(--delay) infinite;
        will-change: transform;
      }

      #${ROOT_ID} .nasa-seasonal-word {
        font-family: Arial, system-ui, sans-serif;
        font-weight: 900;
        letter-spacing: .06em;
        text-shadow: 0 2px 8px #0007;
      }

      #${ROOT_ID}[data-effect="blackfriday"] .nasa-seasonal-word {
        background: linear-gradient(110deg,#fff0b6,#d9a646,#fff4ce);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent !important;
        filter: drop-shadow(0 1px 2px #0008);
      }

      #${ROOT_ID}[data-effect="cybermonday"] .nasa-seasonal-word {
        color: #a5dfff !important;
        text-shadow: 0 0 8px #3489e9aa,0 0 15px #8954e488;
      }

      #${ROOT_ID}[data-effect="ramadan"] .nasa-seasonal-word,
      #${ROOT_ID}[data-effect="eidfitr"] .nasa-seasonal-word {
        color: #f2d78e !important;
        text-shadow: 0 0 8px #d7a93a88;
      }

      #${ROOT_ID}[data-effect="halloween"] .nasa-seasonal-particle {
        filter: drop-shadow(0 1px 4px #8d4bb055);
      }

      @keyframes nasa-seasonal-fall {
        from {
          transform: translate3d(0,-100px,0)
            rotate(var(--start-angle));
        }
        to {
          transform: translate3d(var(--drift),115vh,0)
            rotate(var(--end-angle));
        }
      }

      #${BANNER_ID} {
        position: fixed;
        bottom: 82px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        box-sizing: border-box;
        max-width: calc(100vw - 28px);
        padding: 11px 22px;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: var(--background);
        color: #fff;
        text-align: center;
        text-decoration: none;
        font: 700 13px/1.45 system-ui,sans-serif;
        box-shadow: 0 8px 25px #0005;
        overflow-wrap: anywhere;
      }

      @media (max-width: 700px) {
        #${BANNER_ID} {
          bottom: 88px;
          font-size: 12px;
          padding: 9px 15px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #${ROOT_ID} .nasa-seasonal-particle {
          display: none;
          animation: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function render(data) {
    const effect = data?.effect;
    const valid = data?.active === true &&
      Object.prototype.hasOwnProperty.call(EFFECTS, effect);

    if (!valid) {
      if (lastSignature !== null) clearEffects();
      return;
    }

    const intensity = Math.max(
      10, Math.min(100, Number(data.intensity) || 35)
    );
    const message = String(data.message || '').slice(0, 120);
    const link = typeof data.link === 'string' &&
      /^\/(?!\/)/.test(data.link) ? data.link : '/shop/';

    const mobile = window.matchMedia('(max-width:700px)').matches;
    const signature = JSON.stringify([
      effect, intensity, message, link, mobile
    ]);

    if (signature === lastSignature &&
        document.getElementById(ROOT_ID)) return;

    clearEffects();
    const config = EFFECTS[effect];
    injectStyles();

    const root = document.createElement('div');
    root.id = ROOT_ID;
    root.dataset.effect = effect;
    root.setAttribute('aria-hidden', 'true');

    const count = Math.min(
      mobile ? 16 : 30,
      Math.max(3, Math.round(intensity / (mobile ? 7 : 4)))
    );

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      const symbol = pick(config.items);
      const word = /[A-Za-z\u0600-\u06FF%]/.test(symbol);

      particle.className = 'nasa-seasonal-particle' +
        (word ? ' nasa-seasonal-word' : '');
      particle.textContent = symbol;
      particle.style.left = `${((i + Math.random()) / count) * 100}%`;
      particle.style.fontSize = `${
        word
          ? random(mobile ? 10 : 12, mobile ? 16 : 21)
          : random(15, mobile ? 25 : 32)
      }px`;
      particle.style.opacity = String(random(.35, .76));
      particle.style.color = config.accent;
      particle.style.setProperty('--duration', `${random(12,24)}s`);
      particle.style.setProperty('--delay', `${-random(0,24)}s`);
      particle.style.setProperty('--drift', `${random(-65,65)}px`);
      particle.style.setProperty('--start-angle', `${random(-15,15)}deg`);
      particle.style.setProperty('--end-angle', `${random(-70,70)}deg`);
      fragment.appendChild(particle);
    }

    root.appendChild(fragment);
    document.body.appendChild(root);

    if (message) {
      const banner = document.createElement('a');
      banner.id = BANNER_ID;
      banner.textContent = message;
      banner.href = link;
      banner.style.setProperty('--background', config.banner);
      banner.style.setProperty('--border', config.border);
      document.body.appendChild(banner);
    }

    lastSignature = signature;
  }

  async function refresh() {
    if (inFlight) return;
    inFlight = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(API, {
        signal: controller.signal,
        cache: 'no-store'
      });

      if (!response.ok) throw new Error('Seasonal API unavailable');
      render(await response.json());
    } catch (_) {
      // Keep existing effects during temporary network errors.
    } finally {
      clearTimeout(timeout);
      inFlight = false;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh, {once:true});
  } else {
    refresh();
  }

  document.addEventListener('astro:page-load', refresh);
  setInterval(refresh, 60000);
})();
