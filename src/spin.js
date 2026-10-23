import { entries, randomInt, shuffle, groups, escape, csv } from "./core.js";
import {
  config,
  t,
  $,
  status,
  track,
  readShared,
  wireStorage,
  download,
} from "./common.js";
let names = config.names,
  angle = 0,
  busy = false,
  last = null,
  history = [];
const colors = [
  "#ffd35d",
  "#ef6b53",
  "#8e75d5",
  "#83bba1",
  "#f4a5bf",
  "#87bad1",
  "#f5b96b",
  "#acb981",
];
$("entries").value = names.join("\n");
function draw() {
  const canvas = $("wheel"),
    ctx = canvas.getContext("2d"),
    n = names.length;
  ctx.clearRect(0, 0, 800, 800);
  for (let i = 0; i < n; i++) {
    const start = -Math.PI / 2 + (i * Math.PI * 2) / n,
      end = start + (Math.PI * 2) / n;
    ctx.beginPath();
    ctx.moveTo(400, 400);
    ctx.arc(400, 400, 370, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = "#fff9ed";
    ctx.lineWidth = 4;
    ctx.stroke();
    if (n <= 40) {
      ctx.save();
      ctx.translate(400, 400);
      ctx.rotate((start + end) / 2);
      ctx.fillStyle = "#28251f";
      ctx.font = `600 ${n > 20 ? 15 : 24}px system-ui`;
      ctx.textAlign = "right";
      ctx.fillText(
        names[i].length > 17 ? names[i].slice(0, 16) + "…" : names[i],
        330,
        8,
      );
      ctx.restore();
    }
  }
  $("entry-count").textContent = String(n);
}
function update() {
  try {
    names = entries($("entries").value);
    draw();
    last = null;
    $("remove").disabled = true;
    return true;
  } catch {
    status(t("invalid"));
    return false;
  }
}
$("entries").addEventListener("input", () => {
  if (!busy) update();
});
$("shuffle").onclick = () => {
  if (!update()) return;
  names = shuffle(names);
  $("entries").value = names.join("\n");
  draw();
};
function sound() {
  if (!$("sound").checked) return;
  try {
    const C = window.AudioContext || window.webkitAudioContext,
      c = new C(),
      o = c.createOscillator(),
      g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.frequency.setValueAtTime(520, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(1040, c.currentTime + 0.2);
    g.gain.setValueAtTime(0.06, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
    o.start();
    o.stop(c.currentTime + 0.4);
    o.onended = () => c.close();
  } catch {}
}
$("spin").onclick = () => {
  if (busy || !update()) return;
  busy = true;
  for (const id of ["spin", "entries", "shuffle", "teams", "load"])
    $(id).disabled = true;
  const index = randomInt(names.length),
    target = 360 - ((index + 0.5) * 360) / names.length,
    delta = (target - (angle % 360) + 360) % 360;
  angle += 360 * 5 + delta;
  $("wheel").style.transform = `rotate(${angle}deg)`;
  status(t("spinning"));
  track("spin_wheel");
  const ms = matchMedia("(prefers-reduced-motion: reduce)").matches ? 20 : 3600;
  setTimeout(() => {
    busy = false;
    for (const id of ["spin", "entries", "shuffle", "teams", "load"])
      $(id).disabled = false;
    last = index;
    $("winner-name").textContent = names[index];
    $("winner").hidden = false;
    $("remove").disabled = false;
    history.unshift(names[index]);
    history = history.slice(0, 30);
    $("history").innerHTML = history
      .map((x) => `<li>${escape(x)}</li>`)
      .join("");
    status(t("winner") + " " + names[index]);
    sound();
  }, ms);
};
$("remove").onclick = () => {
  if (last === null) return;
  if (names.length <= 2) {
    status(t("invalid"));
    return;
  }
  names.splice(last, 1);
  $("entries").value = names.join("\n");
  last = null;
  $("remove").disabled = true;
  draw();
};
$("teams").onclick = () => {
  if (!update()) return;
  try {
    const teams = groups(shuffle(names), Number($("team-count").value));
    $("team-results").innerHTML = teams
      .map(
        (a, i) =>
          `<section class="team-card"><h3>${t("team")} ${i + 1}</h3><ol>${a.map((n) => `<li>${escape(n)}</li>`).join("")}</ol></section>`,
      )
      .join("");
    track("create_teams");
    status(t("teams"));
  } catch {
    status(t("teamCount") + ": 2–" + names.length);
  }
};
$("download").onclick = () =>
  download("denny-spin.csv", csv([[t("history")], ...history.map((n) => [n])]));
function restore(s) {
  names = s.names;
  $("entries").value = names.join("\n");
  draw();
}
const shared = readShared();
if (shared) restore(shared);
wireStorage(
  () => ({ v: 1, kind: "spin", names: entries($("entries").value) }),
  restore,
);
draw();
