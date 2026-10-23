const config = JSON.parse(document.querySelector("#config").textContent),
  id = config.measurementId,
  key = "denny-" + config.kind + "-analytics-v1",
  panel = document.querySelector("#consent");
let choice = null,
  loaded = false;
try {
  const c = JSON.parse(localStorage.getItem(key));
  if (
    c &&
    ["granted", "denied"].includes(c.choice) &&
    c.at <= Date.now() &&
    Date.now() - c.at < 180 * 864e5
  )
    choice = c.choice;
} catch {}
const valid =
  /^G-[A-Z0-9]{6,15}$/.test(id || "") && location.hostname === config.domain;
const send = function () {
  (window.dataLayer ||= []).push(arguments);
};
function apply() {
  if (!valid) return;
  window["ga-disable-" + id] = choice !== "granted";
  if (choice !== "granted" || loaded) return;
  loaded = true;
  send("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  send("consent", "update", { analytics_storage: "granted" });
  send("js", new Date());
  send("config", id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_domain: location.hostname,
    page_location: location.origin + location.pathname,
    page_referrer: document.referrer ? new URL(document.referrer).origin : "",
  });
  send("event", "page_view", {
    page_location: location.origin + location.pathname,
    page_title: document.title,
    page_referrer: document.referrer ? new URL(document.referrer).origin : "",
    language: config.lang,
  });
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + id;
  document.head.append(s);
}
const events = new Set([
  "spin_wheel",
  "create_teams",
  "start_practice",
  "finish_practice",
  "create_tournament",
  "save_score",
  "advance_round",
  "share_snapshot",
  "save_session",
  "export_result",
  "print_result",
  "select_preset",
]);
window.dennyTrack = (event) => {
  if (valid && loaded && choice === "granted" && events.has(event))
    send("event", event, {
      tool: config.kind,
      language: config.lang,
      page_location: location.origin + location.pathname,
    });
};
document.querySelector("#analytics-settings").onclick = () => {
  panel.hidden = false;
  panel.querySelector("button").focus();
};
for (const b of document.querySelectorAll("[data-consent]"))
  b.onclick = () => {
    const wasLoaded = loaded;
    choice = b.dataset.consent;
    try {
      localStorage.setItem(key, JSON.stringify({ choice, at: Date.now() }));
    } catch {}
    panel.hidden = true;
    apply();
    if (wasLoaded && choice === "denied") location.reload();
  };
if (valid && choice === null) panel.hidden = false;
apply();
