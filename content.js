(() => {
  if (window.__xCheatersLoaded) return;
  window.__xCheatersLoaded = true;

  let running = false;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rnd = (a, b) => Math.floor(a + Math.random() * (b - a));

  function say(text) {
    console.log('[X Cheaters]', text);
    try { chrome.runtime.sendMessage({ type: 'log', text }); } catch (e) {}
  }
  function stat(text) {
    try { chrome.runtime.sendMessage({ type: 'stat', text }); } catch (e) {}
  }

  // ---------- number parsing (supports Persian/Arabic digits, K/M/B, هزار/میلیون) ----------
  function normalizeDigits(s) {
    return s
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/٫/g, '.')
      .replace(/[٬,،]/g, '');
  }
  function parseCount(text) {
    const t = normalizeDigits(text || '').trim();
    const m = t.match(/([\d.]+)\s*(K|M|B|هزار|میلیون|میلیارد)?/i);
    if (!m) return null;
    let v = parseFloat(m[1]);
    if (isNaN(v)) return null;
    const unit = (m[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'هزار') v *= 1e3;
    else if (unit === 'm' || unit === 'میلیون') v *= 1e6;
    else if (unit === 'b' || unit === 'میلیارد') v *= 1e9;
    return Math.round(v);
  }

  // ---------- helpers ----------
  function getHandle(cell) {
    const links = cell.querySelectorAll('a[href^="/"]');
    for (const a of links) {
      const h = a.getAttribute('href');
      if (/^\/[A-Za-z0-9_]{1,15}$/.test(h)) return h.slice(1).toLowerCase();
    }
    return null;
  }

  function fireHover(el, type) {
    const opts = { bubbles: true, cancelable: true, view: window };
    if (type === 'in') {
      ['pointerover', 'pointerenter', 'mouseover', 'mouseenter', 'mousemove'].forEach(n =>
        el.dispatchEvent(new MouseEvent(n, opts)));
    } else {
      ['pointerout', 'pointerleave', 'mouseout', 'mouseleave'].forEach(n =>
        el.dispatchEvent(new MouseEvent(n, opts)));
    }
  }

  // Returns { followers: number|null, verified: boolean }
  async function readProfileInfo(cell, handle) {
    const target =
      cell.querySelector('[data-testid^="UserAvatar-Container"]') ||
      cell.querySelector(`a[href="/${handle}"]`);
    if (!target) return { followers: null, verified: false };

    fireHover(target, 'in');
    let info = { followers: null, verified: false };

    for (let i = 0; i < 20; i++) { // up to ~4s
      await sleep(200);
      const cards = document.querySelectorAll('[data-testid="HoverCard"]');
      for (const card of cards) {
        const link = card.querySelector('a[href$="/followers"], a[href$="/verified_followers"]');
        if (!link) continue;
        if (!link.getAttribute('href').toLowerCase().includes('/' + handle + '/')) continue;
        const followers = parseCount(link.textContent);
        const verified = !!card.querySelector('[data-testid="icon-verified"]');
        info = { followers, verified };
        break;
      }
      if (info.followers !== null) break;
    }

    fireHover(target, 'out');
    await sleep(300);
    return info;
  }

  async function doUnfollow(cell) {
    const btn = cell.querySelector('[data-testid$="-unfollow"]');
    if (!btn) return false;
    btn.click();
    for (let i = 0; i < 15; i++) {
      await sleep(200);
      const confirm = document.querySelector('[data-testid="confirmationSheetConfirm"]');
      if (confirm) { confirm.click(); await sleep(400); return true; }
    }
    return false;
  }

  // ---------- main ----------
  async function run(settings) {
    if (running) { say('⚠️ از قبل در حال اجراست.'); return; }
    if (!/\/following\/?$/.test(location.pathname)) {
      say('❌ باید توی صفحه‌ی Following خودت باشی (x.com/username/following).');
      return;
    }

    running = true;
    const whitelist = new Set(
      (settings.whitelist || '').split(/[,\s]+/).map(s => s.replace('@', '').toLowerCase()).filter(Boolean)
    );
    const seen = new Set();
    let unfollowed = 0, checked = 0, idleScrolls = 0;

    say('▶️ شروع شد...');

    while (running && unfollowed < settings.maxUnfollows && idleScrolls < 6) {
      const cells = [...document.querySelectorAll('[data-testid="UserCell"]')];
      let progressed = false;

      for (const cell of cells) {
        if (!running || unfollowed >= settings.maxUnfollows) break;

        const handle = getHandle(cell);
        if (!handle || seen.has(handle)) continue;
        seen.add(handle);
        progressed = true;
        checked++;

        // already follows me back
        if (cell.querySelector('[data-testid="userFollowIndicator"]')) continue;
        // no unfollow button (e.g. already unfollowed / pending)
        if (!cell.querySelector('[data-testid$="-unfollow"]')) continue;

        if (whitelist.has(handle)) { say(`⏭ @${handle} در لیست سفید است`); continue; }

        // verified badge on the cell itself
        if (cell.querySelector('[data-testid="icon-verified"]')) {
          say(`⏭ @${handle} وریفای شده`); continue;
        }

        cell.scrollIntoView({ block: 'center' });
        await sleep(400);

        const info = await readProfileInfo(cell, handle);
        if (info.verified) { say(`⏭ @${handle} وریفای شده`); continue; }
        if (info.followers === null) { say(`⏭ @${handle} تعداد فالوئر خونده نشد (برای احتیاط رد شد)`); continue; }
        if (info.followers > settings.maxFollowers) {
          say(`⏭ @${handle} فالوئر زیاد (${info.followers})`); continue;
        }

        const ok = await doUnfollow(cell);
        if (ok) {
          unfollowed++;
          say(`✅ آنفالو شد: @${handle} (${info.followers} فالوئر)`);
          stat(`آنفالو: ${unfollowed}/${settings.maxUnfollows} | بررسی‌شده: ${checked}`);
          await sleep(rnd(settings.minDelay * 1000, settings.maxDelay * 1000));
        } else {
          say(`⚠️ آنفالو @${handle} ناموفق بود`);
        }
      }

      if (!running) break;
      idleScrolls = progressed ? 0 : idleScrolls + 1;
      window.scrollBy(0, window.innerHeight * 0.9);
      await sleep(1500);
    }

    running = false;
    stat(`تمام شد. آنفالو: ${unfollowed} | بررسی‌شده: ${checked}`);
    say(`🏁 پایان. ${unfollowed} نفر آنفالو شدند.`);
  }

  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'start') run(msg.settings);
    if (msg.type === 'stop') { running = false; say('⏹ متوقف شد.'); }
  });
})();
