import { t, $ } from "./common.js";
const button = $("focus-mode");
function focusMode(enabled) {
  document.body.classList.toggle("focus-mode", enabled);
  button.setAttribute("aria-pressed", String(enabled));
  button.textContent = t(enabled ? "focusOff" : "focus");
  $("tool").scrollIntoView({ block: "start", behavior: "instant" });
}
button?.addEventListener("click", () => focusMode(button.getAttribute("aria-pressed") !== "true"));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !event.isComposing && button?.getAttribute("aria-pressed") === "true") {
    focusMode(false);
    button.focus({ preventScroll: true });
  }
});
