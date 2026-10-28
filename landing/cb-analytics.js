/* Crazy Button SA — visitor analytics (shared by the homepage and the /shop app).
   Nothing loads until the visitor taps "Accept" (POPIA). Then:
   - Google Analytics 4: visits, traffic sources, product views, bag and checkout funnel
   - Microsoft Clarity (when CLARITY_ID is set): click heatmaps and session replays
   The shop calls window.cbTrack(name, params) for shopping events. */
(function () {
  var GA_ID = 'G-RV6Z3YG0DL';
  var CLARITY_ID = '';            // paste the Clarity project ID here once the account exists
  var KEY = 'cb-consent';
  var w = window, d = document;
  if (w.cbTrack) return;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function sess(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  var on = false;
  function load(src) { var s = d.createElement('script'); s.async = true; s.src = src; d.head.appendChild(s); }
  function start() {
    if (on) return; on = true;
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { w.dataLayer.push(arguments); };
    w.gtag('js', new Date());
    w.gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false, site_area: location.pathname.indexOf('/shop') === 0 ? 'shop' : 'home' });
    load('https://www.googletagmanager.com/gtag/js?id=' + GA_ID);
    if (CLARITY_ID) {
      w.clarity = w.clarity || function () { (w.clarity.q = w.clarity.q || []).push(arguments); };
      load('https://www.clarity.ms/tag/' + CLARITY_ID);
      w.clarity('consent');
    }
  }

  // Public tracker. Events before consent are dropped, never stored.
  w.cbTrack = function (name, params) {
    if (name === 'begin_checkout') sess('cb-checkout', '1');
    if (!on || !w.gtag) return;
    w.gtag('event', name, params || {});
    if (w.clarity && CLARITY_ID) w.clarity('event', name);
  };

  // Abandoned bag: the visitor leaves with items in the bag and never started checkout.
  function abandon() {
    var bag = w.__cbBag;
    if (!on || !bag || !bag.count || sess('cb-checkout') || sess('cb-abandon')) return;
    sess('cb-abandon', '1');
    w.gtag('event', 'cart_abandon', { currency: bag.currency, value: bag.value, items: bag.items, item_count: bag.count, last_page: location.pathname, transport_type: 'beacon' });
    if (w.clarity && CLARITY_ID) w.clarity('set', 'cart_abandoned', 'yes');
  }
  d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') abandon(); });
  w.addEventListener('pagehide', abandon);

  // Homepage: which links, products and calls to action people click, and in which section.
  if (location.pathname.indexOf('/shop') !== 0) {
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a,button');
      if (!a || a.closest('#cb-consent')) return;
      var sec = a.closest('section,header,footer,nav');
      var label = (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      var href = a.getAttribute('href') || '';
      var where = sec ? (sec.id || sec.className.split(' ')[0] || sec.tagName.toLowerCase()) : 'page';
      var m = href.match(/\/shop\/product\/([\w-]+)/);
      if (m) w.cbTrack('select_item', { item_list_name: 'home_' + where, items: [{ item_id: m[1], item_name: label }] });
      else w.cbTrack('select_content', { content_type: 'home_link', item_id: label || href, link_url: href, section: where });
    }, true);
  }

  // ---------- branded consent banner ----------
  var css = '#cb-consent{position:fixed;left:16px;bottom:16px;z-index:9999;max-width:420px;background:#121212;color:#EDE8DF;border:1px solid #2E2C2A;padding:20px 20px 18px;font-family:"Source Sans 3",SourceSans3_400Regular,system-ui,sans-serif;font-size:15px;line-height:1.45;box-shadow:0 18px 50px rgba(0,0,0,.35);transform:translateY(12px);opacity:0;transition:transform .35s ease,opacity .35s ease}'
    + '#cb-consent.in{transform:none;opacity:1}'
    + '#cb-consent .e{font-family:"Space Mono",SpaceMono_700Bold,ui-monospace,monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#F2B33D;margin:0 0 8px}'
    + '#cb-consent p{margin:0 0 14px}#cb-consent a{color:#EDE8DF;text-decoration:underline;text-underline-offset:3px}'
    + '#cb-consent .r{display:flex;gap:10px;flex-wrap:wrap}'
    + '#cb-consent button{min-height:46px;padding:0 20px;font-family:"Space Mono",SpaceMono_700Bold,ui-monospace,monospace;font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;border:1px solid #F2B33D;background:#F2B33D;color:#121212}'
    + '#cb-consent button.g{background:transparent;color:#EDE8DF;border-color:#5E5B57}'
    + '#cb-consent button:focus-visible{outline:3px solid #F2B33D;outline-offset:3px}'
    + '@media (max-width:520px){#cb-consent{left:12px;right:12px;bottom:12px;max-width:none}}'
    + '@media (prefers-reduced-motion:reduce){#cb-consent{transition:none}}';

  function banner() {
    if (d.getElementById('cb-consent')) return;
    var st = d.createElement('style'); st.textContent = css; d.head.appendChild(st);
    var el = d.createElement('div');
    el.id = 'cb-consent'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Cookie choice');
    el.innerHTML = '<div class="e">Your call</div>'
      + '<p>We count visits and clicks to make every drop hit harder. No ads, nothing sold. <a href="/landing/privacy.html">Privacy</a></p>'
      + '<div class="r"><button type="button" data-v="granted">Accept</button><button type="button" class="g" data-v="denied">Decline</button></div>';
    d.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('in'); });
    el.addEventListener('click', function (e) {
      var v = e.target.getAttribute && e.target.getAttribute('data-v');
      if (!v) return;
      store(KEY, v);
      el.remove();
      if (v === 'granted') start();
    });
  }

  // Lets the privacy page reopen the choice.
  w.cbConsent = { open: function () { store(KEY, ''); banner(); }, state: function () { return store(KEY); } };

  function init() { if (store(KEY) === 'granted') start(); else if (store(KEY) !== 'denied') banner(); }
  if (d.body) init(); else d.addEventListener('DOMContentLoaded', init);
})();
