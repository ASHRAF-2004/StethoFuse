(function () {
  if (window.__sfEntranceInstalled) return;
  window.__sfEntranceInstalled = true;
  var runtime = /* SF_OWL_RUNTIME */ null;
  var home = location.pathname === '/';
  var root = document.documentElement;
  var motion = matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches && !(navigator.connection && navigator.connection.saveData);
  var state = window.__sfOwlBoot = window.__sfOwlBoot || {};
  state.motionExpected = home && motion;
  state.loadedBytes = 0;
  state.totalBytes = runtime ? runtime.bytes : 0;
  state.phase = 'starting';
  var lastPaint = 0, controller, posterChecked = false, longWait, stalled;
  if (home) root.dataset.sfEntrance = 'loading';
  function text(en, ar) { return root.lang === 'ar' ? ar : en; }
  function update(force) {
    if (!home || state.entered) return;
    var now = performance.now(); if (!force && now - lastPaint < 100) return; lastPaint = now;
    var overlay = document.getElementById('sf-entrance'); if (!overlay) return;
    var percent = state.totalBytes ? Math.min(100, Math.floor(state.loadedBytes / state.totalBytes * 100)) : 0;
    overlay.style.setProperty('--sf-progress', percent + '%');
    document.getElementById('sf-entry-percent').textContent = String(percent).padStart(2, '0');
    var progress = document.getElementById('sf-entry-progress');
    progress.setAttribute('aria-label',text('Owl loading','تحميل البومة'));
    if (state.totalBytes) { progress.setAttribute('aria-valuenow', String(percent)); progress.setAttribute('aria-valuetext', text(percent + '% downloaded', 'اكتمل تنزيل ' + percent + '٪')); }
    var label = state.pageFailed ? text('The page could not finish loading.', 'تعذّر إكمال تحميل الصفحة.') : state.error ? text('Your owl could not finish loading.', 'تعذّر إكمال تحميل البومة.') : state.phase === 'decoding' ? text('Bringing your owl to life…', 'نوقظ بومتك…') : state.phase === 'ready' ? text('Ready for a closer listen.', 'كل شيء جاهز لإصغاء أوضح.') : state.skipped ? text('Preparing a still moment…', 'نجهّز البومة دون حركة…') : state.motionExpected ? text('Preparing your owl…', 'نجهّز بومتك…') : text('Preparing your first view…', 'نجهّز إطلالتك الأولى…');
    var status = document.getElementById('sf-entry-status'); if (status.textContent !== label) status.textContent = label;
    var skip = document.getElementById('sf-entry-skip'); skip.disabled = !state.appReady || state.pageFailed;
    document.getElementById('sf-entry-retry').hidden = !state.error && !state.pageStalled;
    if (state.pageFailed) skip.hidden = true; else if (state.error && state.appReady) skip.hidden = false;
  }
  function finish() {
    if (state.entered || !home) return;
    state.entered = true; state.enteredAt = performance.now();
    clearTimeout(longWait); clearTimeout(stalled);
    root.dataset.sfEntrance = 'complete'; root.dataset.experience = 'ready';
    var target = document.getElementById('root'); if (target) target.inert = false;
    var overlay = document.getElementById('sf-entrance'); if (overlay) overlay.remove();
    performance.mark('sf-experience-ready');
    document.dispatchEvent(new CustomEvent('sf-experience-ready', {detail:{motion:!!state.frameReady,skipped:!!state.skipped}}));
  }
  function checkReady() {
    if (!home || !state.appReady || state.pageFailed || state.entered || state.leaving) return;
    if (!(state.motionExpected && !state.skipped ? state.frameReady : state.posterReady)) return;
    state.phase = 'ready'; update(true); state.leaving = true; root.dataset.sfEntrance = 'leaving';
    requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(finish, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240); }); });
  }
  function inspectPoster() {
    if (!home || posterChecked || state.motionExpected && !state.skipped) return;
    var hero = document.querySelector('.studio-site .listening-owl>img'); if (!hero) return;
    posterChecked = true;
    hero.decode().then(function () { state.posterReady = true; state.loadedBytes = state.totalBytes = 1; update(true); checkReady(); },function (error) { state.error = true; state.lastError = String(error); update(true); });
  }
  window.__sfStartOwl = function (descriptor) {
    if (state.promise) return state.promise;
    if (state.skipped) return Promise.reject(new DOMException('Motion skipped', 'AbortError'));
    state.totalBytes = descriptor.bytes; state.phase = 'downloading'; state.downloadStartedAt = performance.now(); controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 120000);
    state.promise = fetch(descriptor.url, {signal:controller.signal,cache:'force-cache',credentials:'omit',referrerPolicy:'no-referrer',priority:'low'}).then(async function (response) {
      if (!response.ok) throw Error('Owl download failed: ' + response.status);
      var reader = response.body.getReader(), chunks = [], total = 0;
      while (true) { var next = await reader.read(); if (next.done) break; total += next.value.byteLength; if (total > descriptor.bytes) { await reader.cancel(); throw Error('Unexpected owl download size'); } chunks.push(next.value); state.loadedBytes = total; update(false); }
      if (total !== descriptor.bytes) throw Error('Incomplete owl download');
      var joined = new Uint8Array(total), offset = 0; chunks.forEach(function (chunk) { joined.set(chunk, offset); offset += chunk.byteLength; });
      state.phase = 'decoding'; state.downloadCompletedAt = performance.now(); update(true); return joined.buffer;
    }).finally(function () { clearTimeout(timeout); });
    state.promise.catch(function (error) { if (!state.skipped) { state.error = true; state.lastError = String(error); update(true); } });
    return state.promise;
  };
  window.__sfOwlDecoding = function (done,total) { state.decodedViews = done; state.totalViews = total; if (!state.entered) { state.phase = 'decoding'; update(false); } };
  window.__sfOwlFrameReady = function (verified) { if (verified !== true) return; state.frameReady = true; state.pixelVerified = true; state.firstFrameAt = performance.now(); performance.mark('sf-owl-first-frame'); checkReady(); };
  window.__sfOwlFailed = function (error) { if (!state.skipped && !state.entered) { state.error = true; state.lastError = String(error); update(true); } };
  window.__sfApplicationFailed = function () { if (state.entered) return; state.pageFailed = state.pageStalled = true; if (controller) controller.abort(); update(true); };
  window.__sfApplicationReady = function () { state.appReady = true; if (!home) { var target = document.getElementById('root'); if (target) target.inert = false; return; } update(true); inspectPoster(); checkReady(); };
  function initialize() {
    if (!home || state.entered || !document.getElementById('sf-entrance')) return;
    update(true); inspectPoster();
    document.getElementById('sf-entry-retry').addEventListener('click',function () { location.reload(); });
    document.getElementById('sf-entry-skip').addEventListener('click',function () {
      state.skipped = true; if (controller) controller.abort(); document.dispatchEvent(new Event('sf-owl-skip')); state.error = false; inspectPoster(); update(true); checkReady();
    });
    longWait = setTimeout(function () { var skip = document.getElementById('sf-entry-skip'); if (skip && !state.entered) { skip.hidden = false; update(true); } },12000);
    stalled = setTimeout(function () { if (!state.appReady && !state.entered) { state.pageStalled = true; update(true); } },20000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',initialize,{once:true}); else initialize();
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',function (event) { if (event.matches && !state.entered) { state.motionExpected = false; inspectPoster(); checkReady(); } });
  if (state.motionExpected && runtime) window.__sfStartOwl(runtime).catch(function () {});
})();
