
# Link Revealer

Reveal hidden URLs, expand short links, and get alerts for suspicious domains — all before you click.  
Link Revealer helps you browse safely by showing you where a link really goes *before* you click it.

---

## ✨ Features
- 🔎 **Reveal actual URLs** – see the true destination behind any hyperlink
- 🔗 **Expand short links** – works with bit.ly, t.co, tinyurl, rebrand.ly, and more
- ⚠️ **Suspicious domain alerts** – warns if a link looks like phishing, uses punycode, or mimics trusted domains
- 📋 **One-click Copy** – copy the original link or final destination straight from the tooltip
- 🌙 **Dark mode friendly** – clean design that adapts to your theme

---

## ❓ Why Link Revealer?
Cybercriminals often disguise malicious sites behind shortened or look-alike URLs.  
Link Revealer helps you spot those tricks instantly, keeping your browsing safer and giving you confidence before clicking.

---

## 🔒 Privacy
- No tracking, no analytics, no data collection  
- All checks run locally in your browser  
- Short-link expansions are fetched directly from the link’s server to reveal the final destination; no data is sent to us  

See our [Privacy Policy](https://your-vercel-domain.vercel.app/privacy.html).

---

## 🛠 Permissions
- `host_permissions: <all_urls>` – required to read link targets and expand shortened URLs  
- `storage` – reserved for extension settings (none stored by default)

---

## 📦 Install (Developer Mode)
1. Download or clone this repository  
2. Go to `chrome://extensions` in Chrome  
3. Enable **Developer Mode**  
4. Click **Load unpacked** and select the `link-revealer` folder
