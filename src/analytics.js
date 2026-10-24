import { getPreferences } from "./consent.js";
const config = JSON.parse(document.querySelector("#config").textContent),
  id = config.measurementId,
  saved = getPreferences();
let choice = saved?.analytics === true ? "granted" : saved?.analytics === false ? "denied" : null,
  loaded = false;
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
  "batch_draw",
  "practice_missed_words",
  "undo_tournament",
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
  "select_discovery",
]);
window.dennyTrack = (event) => {
  if (valid && loaded && choice === "granted" && events.has(event))
    send("event", event, {
      tool: config.kind,
      language: config.lang,
      page_location: location.origin + location.pathname,
    });
};
window.addEventListener("denny-consent-changed", (event) => {
  const previous = choice;
  choice = event.detail.analytics ? "granted" : "denied";
  apply();
  if (loaded && previous === "granted" && choice !== "granted") {
    send("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
});
apply();

document.addEventListener("click",event=>{if(event.target.closest("[data-discovery-link]")) window.dennyTrack("select_discovery");});
