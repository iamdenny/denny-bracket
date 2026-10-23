const config = JSON.parse(document.querySelector("#config").textContent),
  unit = config.adsterra;
const slot = document.querySelector("[data-network-ad]"),
  off = document.querySelector("[data-ads-off]");
const key = "denny-adsterra-choice-v1";
let choice = null,
  requested = false;
try {
  const v = JSON.parse(localStorage.getItem(key));
  if (v && v.at <= Date.now() && Date.now() - v.at < 180 * 864e5)
    choice = v.choice;
} catch {}
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
    slot.clientWidth < 300
  )
    return;
  requested = true;
  const f = document.createElement("iframe");
  f.width = "300";
  f.height = "250";
  f.title = "Advertisement · Adsterra";
  f.referrerPolicy = "no-referrer";
  f.setAttribute(
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
  f.src =
    "data:text/html;charset=utf-8," +
    encodeURIComponent(
      `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;width:300px;height:250px;overflow:hidden}</style></head><body><script>atOptions=${options};<\/script><script src="https://bauval.org/22/${unit.key}"><\/script></body></html>`,
    );
  slot.replaceChildren(f);
  off.hidden = false;
}
function save(v) {
  choice = v;
  try {
    localStorage.setItem(key, JSON.stringify({ choice: v, at: Date.now() }));
  } catch {}
}
if (slot) {
  const observer = new IntersectionObserver(
    (es) => {
      if (es.some((x) => x.isIntersecting)) load();
    },
    { rootMargin: "100px" },
  );
  observer.observe(slot);
  document.querySelector("[data-ads-allow]").onclick = () => {
    save("granted");
    load();
  };
  off.onclick = () => {
    save("denied");
    slot.querySelector("iframe")?.remove();
    location.reload();
  };
  document.addEventListener("visibilitychange", () => {
    const r = slot.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) load();
  });
}
