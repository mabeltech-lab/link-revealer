// === Shorteners we try to expand ===
const SHORTENERS = new Set([
  'bit.ly','t.co','tinyurl.com','goo.gl','ow.ly','is.gd','buff.ly',
  'cutt.ly','rebrand.ly','t.ly','s.id','rb.gy','lnkd.in'
]);

let tipEl;
let hoverAnchor = null;
let mouseX = 0, mouseY = 0;
let lastShownFor = null;

/* ---------- Helpers ---------- */
function ensureTip() {
  if (tipEl) return tipEl;
  tipEl = document.createElement('div');
  tipEl.id = 'link-revealer-tip';
  document.documentElement.appendChild(tipEl);

  // Handle clicks inside tooltip (copy buttons)
  tipEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn[data-copy]');
    if (!btn) return;
    const text = btn.getAttribute('data-copy') || '';
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = 'Copy'), 800);
    } catch {
      btn.textContent = 'Copy failed';
      setTimeout(() => (btn.textContent = 'Copy'), 1000);
    }
    e.stopPropagation();
  });

  // Keep visible when moving cursor over the tooltip
  tipEl.addEventListener('mouseenter', () => {
    // do nothing; prevents mouseout handler from hiding
  });
  tipEl.addEventListener('mouseleave', () => {
    if (!hoverAnchor) hideTip();
  });

  return tipEl;
}

function formatUrl(u) {
  try {
    return new URL(u, location.href).href;
  } catch { return u; }
}
function getHost(u) {
  try { return new URL(u, location.href).host; } catch { return ''; }
}
function getRegDomain(host) {
  // basic "registered domain": last two labels (good enough for warning heuristics)
  const parts = (host || '').split('.').filter(Boolean);
  if (parts.length >= 2) return parts.slice(-2).join('.').toLowerCase();
  return host.toLowerCase();
}

/* ---------- Suspicion Heuristics ---------- */
// Light Levenshtein distance
function lev(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  const dp = Array.from({length: a.length+1}, (_,i)=>[i]);
  for (let j=1; j<=b.length; j++) dp[0][j]=j;
  for (let i=1; i<=a.length; i++) {
    for (let j=1; j<=b.length; j++) {
      dp[i][j] = Math.min(
        dp[i-1][j]+1,            // delete
        dp[i][j-1]+1,            // insert
        dp[i-1][j-1] + (a[i-1]===b[j-1]?0:1) // replace
      );
    }
  }
  return dp[a.length][b.length];
}

// quick confusable normalizer (swap common lookalikes)
function normalizeLookalikes(s) {
  const map = {
    '0':'o','1':'l','3':'e','5':'s','7':'t','@':'a','$':'s','!':'i'
  };
  return s.toLowerCase().replace(/[01357@$!]/g, ch => map[ch] || ch);
}

function extractDomainLikeText(anchor) {
  const text = (anchor.textContent || '').trim();
  const m = text.match(/[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0].toLowerCase() : null;
}

function suspiciousNotes(url, anchor) {
  const notes = [];
  try {
    const u = new URL(url, location.href);
    if (!/^https?:$/i.test(u.protocol)) {
      notes.push('Non-web link');
      return notes;
    }
    if (u.hostname.startsWith('xn--')) notes.push('Punycode domain');

    const hrefHost = u.hostname.toLowerCase();
    const hrefReg = getRegDomain(hrefHost);

    // If visible text looks like a different domain
    const textHost = extractDomainLikeText(anchor);
    if (textHost) {
      const textReg = getRegDomain(textHost);
      if (textReg !== hrefReg) {
        // If small distance -> likely lookalike
        const d = lev(normalizeLookalikes(textReg), normalizeLookalikes(hrefReg));
        if (d <= 2) {
          notes.push(`Lookalike domain? Text shows "${textReg}", link goes to "${hrefReg}"`);
        } else {
          notes.push(`Text shows "${textReg}", link goes to "${hrefReg}"`);
        }
      }
    }

    // Extra: if registered domain contains lots of dashes or numbers, flag
    const dashCount = (hrefReg.match(/-/g)||[]).length;
    const numCount = (hrefReg.match(/[0-9]/g)||[]).length;
    if (dashCount >= 2 || numCount >= 3) notes.push('Unusual domain pattern');

  } catch {
    // ignore parse errors
  }
  return notes;
}

/* ---------- Rendering ---------- */
function renderTip({ original, expanded, notes }) {
  const el = ensureTip();
  const hasExpansion = expanded && expanded !== original;

  const originalFmt = formatUrl(original);
  const expandedFmt = hasExpansion ? formatUrl(expanded) : null;

  el.innerHTML = '';

  const row1 = document.createElement('div');
  row1.className = 'row';
  row1.innerHTML = `
    <span class="label">Link:</span>
    <span class="url">${originalFmt}</span>
    <button class="btn" data-copy="${originalFmt}">Copy</button>
  `;
  el.appendChild(row1);

  if (hasExpansion) {
    const row2 = document.createElement('div');
    row2.className = 'row';
    row2.innerHTML = `
      <span class="label">Resolves to:</span>
      <span class="url">${expandedFmt}</span>
      <button class="btn" data-copy="${expandedFmt}">Copy</button>
    `;
    el.appendChild(row2);
  } else {
    const row2 = document.createElement('div');
    row2.className = 'row muted';
    row2.innerHTML = `<span class="label">Resolves to:</span><span class="url">—</span>`;
    el.appendChild(row2);
  }

  if (notes && notes.length) {
    for (const n of notes) {
      const rowN = document.createElement('div');
      rowN.className = 'row';
      rowN.innerHTML = `<span class="warn">⚠ ${n}</span>`;
      el.appendChild(rowN);
    }
  } else {
    const ok = document.createElement('div');
    ok.className = 'row ok';
    ok.textContent = 'No obvious red flags.';
    el.appendChild(ok);
  }

  el.style.left = (mouseX + 16) + 'px';
  el.style.top = (mouseY + 16) + 'px';
  el.style.display = 'block';
}

function hideTip() {
  if (tipEl) tipEl.style.display = 'none';
}

/* ---------- Expansion via background ---------- */
function shouldTryExpand(url) {
  const host = getHost(url).toLowerCase();
  return SHORTENERS.has(host);
}
async function expandUrl(url) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'EXPAND_URL', url }, (resp) => {
      resolve(resp && resp.finalUrl ? resp.finalUrl : null);
    });
  });
}

/* ---------- Event wiring ---------- */
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX; mouseY = e.clientY;
  if (tipEl && tipEl.style.display === 'block') {
    tipEl.style.left = (mouseX + 16) + 'px';
    tipEl.style.top = (mouseY + 16) + 'px';
  }
}, { passive: true });

document.addEventListener('mouseover', async (e) => {
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a) return;
  hoverAnchor = a;

  const href = a.getAttribute('href') || '';
  let url;
  try { url = new URL(href, location.href).href; } catch { return; }
  if (!/^https?:/i.test(url)) return;

  if (lastShownFor === url && tipEl) {
    tipEl.style.display = 'block';
    return;
  }
  lastShownFor = url;

  // Compute suspicion notes immediately
  const notes = suspiciousNotes(url, a);

  // Initial render (before expansion)
  renderTip({ original: url, expanded: null, notes });

  // Try to expand if shortener
  if (shouldTryExpand(url)) {
    const finalUrl = await expandUrl(url);
    if (a !== hoverAnchor) return; // cursor moved elsewhere
    renderTip({ original: url, expanded: finalUrl || null, notes: suspiciousNotes(finalUrl || url, a) });
  }
}, { passive: true });

document.addEventListener('mouseout', (e) => {
  const to = e.relatedTarget;
  // Do not hide if moving into the tooltip itself
  if (tipEl && to && tipEl.contains(to)) return;

  if (hoverAnchor) {
    const stillInside = to && hoverAnchor.contains(to);
    if (!stillInside) {
      hoverAnchor = null;
      hideTip();
    }
  }
}, { passive: true });

window.addEventListener('scroll', hideTip, { passive: true });
