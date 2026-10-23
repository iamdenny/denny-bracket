import { createHistory } from "./undo-history.js";
import {
  entries,
  shuffle,
  roundRobin,
  elimination,
  advance,
  standings,
  escape,
  csv,
} from "./core.js";
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
  mode = config.preset.mode || "knockout",
  rounds = [];
const undoHistory = createHistory();
const snapshot = () => ({ names: [...names], mode, rounds: structuredClone(rounds) });
function restoreSnapshot(s) {
  names = s.names; mode = s.mode; rounds = s.rounds;
  $("entries").value = names.join("\n");
  $("format").value = mode;
  render();
}
$("entries").value = names.join("\n");
$("format").value = mode;
function create() {
  try {
    const parsed = entries($("entries").value, 64),
      nextMode = $("format").value;
    if (
      new Set(parsed).size !== parsed.length ||
      (nextMode === "league" && parsed.length > 20)
    )
      throw Error();
    undoHistory.push(snapshot());
    names = $("seed").checked ? shuffle(parsed) : parsed;
    mode = nextMode;
    rounds = mode === "league" ? roundRobin(names) : elimination(names);
    render();
    track("create_tournament");
    status(t("generate"));
  } catch {
    status(t("bracketInvalid"));
  }
}
function render() {
  const board = $("board");
  board.classList.toggle("single-round", rounds.length === 1);
  board.innerHTML = rounds
    .map(
      (round, r) =>
        `<section class="round"><h3><span class="round-dot">${String(r + 1).padStart(2, "0")}</span> ${t("round")} ${r + 1}</h3><div class="matches">${round
          .map((m, i) => {
            const bye = m.a === null || m.b === null,
              locked = mode === "knockout" && r < rounds.length - 1;
            return `<form class="match ${bye ? "bye" : ""}" data-round="${r}" data-match="${i}" data-complete="${bye || (m.sa !== null && m.sb !== null)}"><div class="match-top">${String(r + 1).padStart(2, "0")} / ${String(i + 1).padStart(2, "0")}${bye ? ` · ${t("bye")}` : ""}</div>${["a", "b"].map((side, k) => `<label class="player ${m.winner !== null && m.winner === m[side] ? "won" : ""}"><span>${m[side] === null ? t("bye") : escape(names[m[side]])}</span>${bye ? "<b>—</b>" : `<input aria-label="${escape(names[m[side]])} · ${t("round")} ${r + 1} · ${i + 1}" type="number" inputmode="numeric" min="0" max="999" step="1" value="${m[k ? "sb" : "sa"] ?? ""}" ${locked ? "disabled" : ""} required>`}</label>`).join("")}${!bye && !locked ? `<button class="score-save" type="submit">${t("result")}</button>` : ""}</form>`;
          })
          .join("")}</div></section>`,
    )
    .join("");
  for (const form of board.querySelectorAll("form"))
    form.onsubmit = (e) => {
      e.preventDefault();
      const inputs = [...form.querySelectorAll("input")],
        values = inputs.map((x) => Number(x.value));
      if (
        inputs.some((x) => x.value === "") ||
        values.some((x) => !Number.isInteger(x) || x < 0 || x > 999)
      ) {
        status(t("scoreError"));
        return;
      }
      if (mode === "knockout" && values[0] === values[1]) {
        status(t("incomplete"));
        return;
      }
      const r = Number(form.dataset.round),
        i = Number(form.dataset.match),
        m = rounds[r][i];
      undoHistory.push(snapshot());
      [m.sa, m.sb] = values;
      if (mode === "knockout") m.winner = m.sa > m.sb ? m.a : m.b;
      // Preserve unfinished scores in other matches when this match is saved.
      const drafts = [...board.querySelectorAll("form")].filter((x) => x !== form).map((x) => ({
        round: x.dataset.round, match: x.dataset.match,
        values: [...x.querySelectorAll("input")].map((input) => input.value),
      }));
      render();
      for (const draft of drafts) {
        const restored = board.querySelector(`form[data-round="${draft.round}"][data-match="${draft.match}"]`);
        [...restored.querySelectorAll("input")].forEach((input, index) => { input.value = draft.values[index]; });
      }
      const savedForm = board.querySelector(`form[data-round="${r}"][data-match="${i}"]`);
      const focusTarget = savedForm.hidden ? board.querySelector(".match:not([hidden]) input:not(:disabled)") || $("next-round") : savedForm.querySelector("button");
      (focusTarget?.hidden ? $("undo") : focusTarget)?.focus({preventScroll:true});
      status(t("result"));
      track("save_score");
    };
  $("next-round").hidden = mode !== "knockout" || rounds.at(-1).length === 1;
  $("standings-wrap").hidden = mode !== "league";
  $("champion").hidden = true;
  if (mode === "league") {
    $("standings-body").innerHTML = standings(names, rounds)
      .map(
        (r, i) =>
          `<tr><td>${i + 1}</td><th scope="row">${escape(r.name)}</th><td>${r.p}</td><td>${r.w}</td><td>${r.pf - r.pa}</td><td><b>${r.pts}</b></td></tr>`,
      )
      .join("");
  } else {
    const last = rounds.at(-1);
    if (last.length === 1 && last[0].winner !== null) {
      $("champion").hidden = false;
      $("champion-name").textContent = names[last[0].winner];
    }
  }
  $("round-count").textContent =
    mode === "league" ? rounds.length : Math.ceil(Math.log2(names.length));
  $("player-count").textContent = names.length;
  $("undo").disabled = !undoHistory.canUndo;
  $("redo").disabled = !undoHistory.canRedo;
  const playable = rounds.flat().filter((m) => m.a !== null && m.b !== null);
  const completed = playable.filter((m) => m.sa !== null && m.sb !== null).length;
  const total = mode === "knockout" ? names.length - 1 : playable.length;
  $("match-progress").max = Math.max(1, total);
  $("match-progress").value = completed;
  $("match-progress-text").textContent = `${completed} / ${total}`;
  filterMatches();
}
function filterMatches() {
  const pending = $("pending-only").checked;
  for (const match of $("board").querySelectorAll(".match")) match.hidden = pending && match.dataset.complete === "true";
  for (const round of $("board").querySelectorAll(".round")) round.hidden = ![...round.querySelectorAll(".match")].some((match) => !match.hidden);
  $("all-done").hidden = !pending || [...$("board").querySelectorAll(".match")].some((match) => !match.hidden);
}
$("pending-only").onchange = filterMatches;
$("undo").onclick = () => {
  const previous = undoHistory.undo(snapshot());
  if (previous) { restoreSnapshot(previous); ($("undo").disabled ? $("redo") : $("undo")).focus({preventScroll:true}); status(t("undone")); track("undo_tournament"); }
};
$("redo").onclick = () => {
  const next = undoHistory.redo(snapshot());
  if (next) { restoreSnapshot(next); ($("redo").disabled ? $("undo") : $("redo")).focus({preventScroll:true}); status(t("redone")); }
};
$("generate").onclick = create;
$("next-round").onclick = () => {
  try {
    const next = advance(rounds.at(-1));
    undoHistory.push(snapshot());
    rounds.push(next);
    render();
    track("advance_round");
    status(t("nextRound"));
  } catch {
    status(t("incomplete"));
  }
};
function state() {
  return {
    v: 1,
    kind: "bracket",
    names,
    mode,
    scores: rounds.map((r) => r.map((m) => [m.sa, m.sb])),
  };
}
function restore(s) {
  if (rounds.length) undoHistory.push(snapshot());
  names = s.names;
  mode = s.mode;
  rounds = s.rounds;
  $("entries").value = names.join("\n");
  $("format").value = mode;
  render();
}
$("download").onclick = () =>
  download(
    "denny-bracket.csv",
    csv([
      ["Round", "Player A", "Player B", "Score A", "Score B"],
      ...rounds.flatMap((r, i) =>
        r.map((m) => [
          i + 1,
          names[m.a] || t("bye"),
          names[m.b] || t("bye"),
          m.sa ?? "",
          m.sb ?? "",
        ]),
      ),
    ]),
  );
wireStorage(state, restore);
const shared = readShared();
if (shared) restore(shared);
else {
  rounds = mode === "league" ? roundRobin(names) : elimination(names);
  render();
}
