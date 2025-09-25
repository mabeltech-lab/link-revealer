// Follows up to 5 redirects by reading Location headers with redirect: 'manual'
async function followRedirectChain(startUrl, maxHops = 5) {
  let current = startUrl;
  for (let i = 0; i < maxHops; i++) {
    try {
      const resp = await fetch(current, { method: 'HEAD', redirect: 'manual' });
      // If no redirect, we're done
      if (resp.type === 'opaqueredirect') {
        // Some hosts obscure headers; try GET as fallback
      } else if (resp.status >= 300 && resp.status < 400) {
        const loc = resp.headers.get('location');
        if (!loc) return current;
        const next = new URL(loc, current).href;
        if (next === current) return current;
        current = next;
        continue;
      } else {
        return current;
      }

      // Fallback: some CDNs require GET to expose Location
      const resp2 = await fetch(current, { method: 'GET', redirect: 'manual' });
      if (resp2.status >= 300 && resp2.status < 400) {
        const loc2 = resp2.headers.get('location');
        if (!loc2) return current;
        const next2 = new URL(loc2, current).href;
        if (next2 === current) return current;
        current = next2;
        continue;
      } else {
        return current;
      }
    } catch (e) {
      return startUrl; // network issue; give up
    }
  }
  return current;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg && msg.type === 'EXPAND_URL' && typeof msg.url === 'string') {
      const finalUrl = await followRedirectChain(msg.url);
      sendResponse({ finalUrl });
    }
  })();
  // Keep the message channel open for async
  return true;
});
