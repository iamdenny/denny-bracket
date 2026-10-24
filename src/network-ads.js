import { getPreferences, savePreferences } from "./consent.js";

const config = JSON.parse(document.querySelector("#config").textContent),
  unit = config.adsterra,
  slot = document.querySelector("[data-network-ad]"),
  off = document.querySelector("[data-ads-off]");
let choice = getPreferences()?.ads === true ? "granted" : "denied",
  requested = false;
const valid =
  unit?.approved === true &&
  /^[a-f0-9]{32}$/.test(unit.key) &&
  location.hostname === config.domain;

function load() {
  if (
    !valid ||
    choice !== "granted" ||
    requested ||
    document.hidden ||
    !slot ||
    slot.clientWidth < 300
  )
    return;
  requested = true;
  const frame = document.createElement("iframe");
  frame.width = "300";
  frame.height = "250";
  frame.title = "Advertisement · Adsterra";
  frame.referrerPolicy = "no-referrer";
  frame.setAttribute(
    "sandbox",
    "allow-scripts allow-popups allow-popups-to-escape-sandbox",
  );
  const options = JSON.stringify({
    key: unit.key,
    format: "iframe",
    height: 250,
    width: 300,
    params: {},
  });
  frame.src =
    "data:text/html;charset=utf-8," +
    encodeURIComponent(
      `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;width:300px;height:250px;overflow:hidden}</style></head><body><script>atOptions=${options};<\/script><script src="https://bauval.org/22/${unit.key}"><\/script></body></html>`,
    );
  slot.replaceChildren(frame);
  if (off) off.hidden = false;
}

if (slot) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) load();
    },
    { rootMargin: "100px" },
  );
  observer.observe(slot);
  off?.addEventListener("click", () => {
    const current = getPreferences();
    savePreferences({ ads: false, analytics: current?.analytics ?? null });
  });
  window.addEventListener("denny-consent-changed", (event) => {
    choice = event.detail.ads ? "granted" : "denied";
    if (choice !== "granted") {
      slot.querySelector("iframe")?.remove();
      requested = false;
      if (off) off.hidden = true;
    } else {
      load();
      if (off) off.hidden = false;
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      const rect = slot.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) load();
    }
  });
}
