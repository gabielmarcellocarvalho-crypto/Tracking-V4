/**
 * ─── V4 TRACK — snippet de rastreamento ──────────────────────────────────────
 * Instalação (antes do </head> do site do cliente):
 *
 *   <script src="https://SEU-DOMINIO.vercel.app/v4track.js"
 *           data-cliente="ID_DO_CLIENTE"
 *           data-key="TRACKING_KEY" defer></script>
 *
 * O snippet:
 *  - cria o cookie próprio _v4id (13 meses) — identidade além das janelas de atribuição
 *  - captura utm_* da URL e persiste na sessão
 *  - captura gclid / wbraid / gbraid (Google) e fbclid → formato fbc (Meta)
 *  - lê cookies _fbp/_fbc (Meta) e _ga (GA4 client_id)
 *  - dispara page_view automático (inclui SPAs — pushState)
 *  - expõe window.v4track(tipo, dados) para eventos manuais:
 *      v4track('lead',  { email:'x@y.com', telefone:'11999999999', nome:'Fulano' })
 *      v4track('compra',{ email:'x@y.com', valor:189.90, produto:'Plano Anual' })
 */
(function () {
  'use strict';

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    for (var i = s.length - 1; i >= 0; i--) if (s[i].src && s[i].src.indexOf('v4track') !== -1) return s[i];
    return null;
  })();
  if (!script) return;

  var CLIENTE = script.getAttribute('data-cliente');
  var KEY = script.getAttribute('data-key') || '';
  var ENDPOINT = script.getAttribute('data-endpoint') ||
    (script.src.replace(/\/v4track\.js.*$/, '') + '/api/track');
  if (!CLIENTE) return;

  // ── Cookies ────────────────────────────────────────────────────────────────
  function getCookie(nome) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + nome + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function setCookie(nome, valor, dias) {
    var d = new Date();
    d.setTime(d.getTime() + dias * 864e5);
    document.cookie = nome + '=' + encodeURIComponent(valor) +
      '; expires=' + d.toUTCString() + '; path=/; SameSite=Lax' +
      (location.protocol === 'https:' ? '; Secure' : '');
  }

  // ── Identidade própria (_v4id — 13 meses) ──────────────────────────────────
  var v4id = getCookie('_v4id');
  if (!v4id) {
    v4id = 'v4.' + Date.now().toString(36) + '.' + Math.random().toString(36).slice(2, 12);
  }
  setCookie('_v4id', v4id, 395); // renova a validade a cada visita

  // ── Parâmetros da URL (utm_*, click ids) ───────────────────────────────────
  function paramsDaUrl() {
    var p = {};
    try {
      var q = new URLSearchParams(location.search);
      q.forEach(function (v, k) { p[k.toLowerCase()] = v; });
    } catch (e) { /* URLSearchParams indisponível */ }
    return p;
  }
  var urlParams = paramsDaUrl();

  // UTMs persistem na sessão (o usuário navega e a origem não se perde)
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var utm = {};
  var temUtmNaUrl = UTM_KEYS.some(function (k) { return urlParams[k]; });
  if (temUtmNaUrl) {
    UTM_KEYS.forEach(function (k) { if (urlParams[k]) utm[k.replace('utm_', '')] = urlParams[k]; });
    try { sessionStorage.setItem('_v4utm', JSON.stringify(utm)); } catch (e) {}
  } else {
    try { utm = JSON.parse(sessionStorage.getItem('_v4utm') || '{}'); } catch (e) { utm = {}; }
  }

  // Click IDs — persistem em cookie próprio (Meta 7d / Google 90d)
  function persistirClickId(nome, valor, dias) {
    if (valor) { setCookie(nome, valor, dias); return valor; }
    return getCookie(nome);
  }
  var gclid  = persistirClickId('_v4gclid',  urlParams.gclid,  90);
  var wbraid = persistirClickId('_v4wbraid', urlParams.wbraid, 90);
  var gbraid = persistirClickId('_v4gbraid', urlParams.gbraid, 90);

  // fbclid → formato fbc oficial: fb.1.<timestamp>.<fbclid>
  var fbc = getCookie('_fbc');
  if (!fbc && urlParams.fbclid) {
    fbc = 'fb.1.' + Date.now() + '.' + urlParams.fbclid;
    setCookie('_fbc', fbc, 7);
  }
  var fbp = getCookie('_fbp');

  // GA4 client_id: cookie _ga = GA1.1.111111111.2222222222 → 111111111.2222222222
  var gaClientId = null;
  var ga = getCookie('_ga');
  if (ga) {
    var partes = ga.split('.');
    if (partes.length >= 4) gaClientId = partes[2] + '.' + partes[3];
  }

  // ── Envio ──────────────────────────────────────────────────────────────────
  function enviar(tipo, dados) {
    dados = dados || {};
    var payload = {
      clienteId: CLIENTE,
      key: KEY,
      tipo: tipo,
      url: location.href,
      pagina: location.pathname,
      titulo: document.title,
      referrer: document.referrer || undefined,
      utm: Object.keys(utm).length ? utm : undefined,
      ids: {
        v4id: v4id,
        fbp: fbp || undefined,
        fbc: fbc || undefined,
        gclid: gclid || undefined,
        wbraid: wbraid || undefined,
        gbraid: gbraid || undefined,
        gaClientId: gaClientId || undefined,
      },
      dados: (dados.email || dados.telefone || dados.nome)
        ? { email: dados.email, telefone: dados.telefone, nome: dados.nome }
        : undefined,
      valor: typeof dados.valor === 'number' ? dados.valor : undefined,
      produto: dados.produto,
      userAgent: navigator.userAgent,
      ts: Date.now(),
    };

    var corpo = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([corpo], { type: 'application/json' }));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', ENDPOINT, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(corpo);
    }
  }

  // ── API pública ────────────────────────────────────────────────────────────
  window.v4track = enviar;

  // page_view automático
  enviar('page_view');

  // SPAs: dispara page_view em navegação client-side
  var pushState = history.pushState;
  history.pushState = function () {
    pushState.apply(history, arguments);
    setTimeout(function () { enviar('page_view'); }, 50);
  };
  window.addEventListener('popstate', function () {
    setTimeout(function () { enviar('page_view'); }, 50);
  });
})();
