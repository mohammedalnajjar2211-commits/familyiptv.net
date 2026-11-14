/* NASA Analytics: opt-in, no tracking before consent. */
(() => {
  'use strict';
  const ENDPOINT = 'https://analytics.nasa-iptv.net/track';
  const CONSENT_KEY = 'nasa-analytics-consent-v1';
  const SESSION_KEY = 'nasa-analytics-session-v1';
  let enabled = false;
  let timer = null;
  let sessionId = null;
  let lastPage = location.pathname;
  const isArabic = () => document.documentElement.dataset.lang === 'ar';
  const strings = () => isArabic() ? {
    title: 'خصوصية الزوار',
    body: 'بموافقتك، نجمع إحصائيات عن الصفحات التي تزورها ومدة الجلسة ونوع الجهاز والمتصفح والدولة. لا نخزن عنوان IP الكامل. يمكنك رفض التتبع أو سحب الموافقة في أي وقت.',
    allow: 'موافقة', deny: 'رفض', settings: 'إعدادات الخصوصية'
  } : {
    title: 'Visitor privacy',
    body: 'With your consent, we collect statistics about visited pages, session duration, device, browser and country. We do not store full IP addresses. You can refuse or withdraw consent at any time.',
    allow: 'Accept', deny: 'Decline', settings: 'Privacy settings'
  };
  const getConsent = () => { try { return localStorage.getItem(CONSENT_KEY); } catch { return null; } };
  const setConsent = value => { try { localStorage.setItem(CONSENT_KEY, value); } catch {} };
  const getSession = () => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (saved && typeof saved.id === 'string' && Date.now() - saved.at < 30 * 60 * 1000) {
        saved.at = Date.now(); sessionStorage.setItem(SESSION_KEY, JSON.stringify(saved)); return saved.id;
      }
    } catch {}
    const id = crypto.randomUUID();
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({id, at: Date.now()})); } catch {}
    return id;
  };
  function send(type) {
    if (!enabled || document.visibilityState === 'hidden') return;
    const page = location.pathname.slice(0, 300);
    const payload = JSON.stringify({type, session_id: sessionId, page, ...(type === 'pageview' ? {referrer: document.referrer.slice(0, 150)} : {})});
    fetch(ENDPOINT, {method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true,
      headers: {'Content-Type': 'application/json'}, body: payload}).catch(() => {});
  }
  function start() {
    if (enabled) return;
    enabled = true; sessionId = getSession(); lastPage = location.pathname;
    send('pageview');
    timer = setInterval(() => { if (enabled) send('heartbeat'); }, 30000);
  }
  function stop() {
    enabled = false;
    if (timer) clearInterval(timer);
    timer = null; sessionId = null;
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  }
  function render() {
    const s = strings();
    document.querySelector('#nasa-privacy-title').textContent = s.title;
    document.querySelector('#nasa-privacy-body').textContent = s.body;
    document.querySelector('#nasa-privacy-accept').textContent = s.allow;
    document.querySelector('#nasa-privacy-decline').textContent = s.deny;
    document.querySelector('#nasa-privacy-settings').textContent = s.settings;
  }
  function showBanner() { render(); document.querySelector('#nasa-privacy-banner').hidden = false; }
  function hideBanner() { document.querySelector('#nasa-privacy-banner').hidden = true; }
  function choose(value) {
    setConsent(value); hideBanner();
    if (value === 'yes') start(); else stop();
  }
  const css = document.createElement('style');
  css.textContent = `
    #nasa-privacy-banner[hidden]{display:none!important}
    #nasa-privacy-banner{position:fixed;bottom:12px;left:12px;right:12px;z-index:99999;max-width:530px;margin:auto;background:#0b1d3d;color:#fff;border:1px solid #4978ae;border-radius:14px;box-shadow:0 12px 35px #0009;padding:18px;font:14px/1.6 system-ui,Arial,sans-serif}
    #nasa-privacy-banner h2{font-size:18px;margin:0 0 8px;color:#fff}
    #nasa-privacy-banner p{margin:0 0 14px;color:#dbe8fa}
    #nasa-privacy-actions{display:flex;gap:9px;flex-wrap:wrap}
    #nasa-privacy-actions button{border:1px solid #80a9da;border-radius:8px;padding:9px 20px;cursor:pointer;font:inherit;background:transparent;color:white}
    #nasa-privacy-accept{background:#2276d1!important;border-color:#2276d1!important}
    #nasa-privacy-settings{border:0;background:transparent;color:inherit;text-decoration:underline;cursor:pointer;font:inherit;padding:0}
    @media(max-width:600px){#nasa-privacy-banner{bottom:76px;max-height:55vh;overflow:auto}}
  `;
  document.head.appendChild(css);
  const banner = document.createElement('section');
  banner.id = 'nasa-privacy-banner'; banner.hidden = true;
  banner.setAttribute('role', 'dialog'); banner.setAttribute('aria-labelledby', 'nasa-privacy-title');
  banner.innerHTML = '<h2 id="nasa-privacy-title"></h2><p id="nasa-privacy-body"></p><div id="nasa-privacy-actions"><button type="button" id="nasa-privacy-accept"></button><button type="button" id="nasa-privacy-decline"></button></div>';
  document.body.appendChild(banner);
  const footer = document.querySelector('.footer .copyright') || document.querySelector('footer') || document.body;
  const settings = document.createElement('button');
  settings.type = 'button'; settings.id = 'nasa-privacy-settings';
  settings.style.marginInlineStart = '12px';
  footer.appendChild(settings);
  document.querySelector('#nasa-privacy-accept').addEventListener('click', () => choose('yes'));
  document.querySelector('#nasa-privacy-decline').addEventListener('click', () => choose('no'));
  settings.addEventListener('click', showBanner);
  document.addEventListener('click', e => {
    if (e.target.closest?.('#lang-toggle,[data-select-lang]')) queueMicrotask(render);
  });
  window.addEventListener('popstate', () => { if (enabled && location.pathname !== lastPage) { lastPage = location.pathname; send('pageview'); } });
  document.addEventListener('visibilitychange', () => { if (enabled && document.visibilityState === 'visible') send('heartbeat'); });
  render();
  const consent = getConsent();
  if (consent === 'yes') start(); else if (consent !== 'no') showBanner();
})();
