export const escape = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function randomInt(n, source = crypto) {
  if (!Number.isInteger(n) || n < 1 || n > 4294967296) throw Error("range");
  const a = new Uint32Array(1),
    limit = Math.floor(4294967296 / n) * n;
  do {
    source.getRandomValues(a);
  } while (a[0] >= limit);
  return a[0] % n;
}
export function shuffle(items, rand = randomInt) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function entries(text, max = 100) {
  const a = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (a.length < 2 || a.length > max || a.some((x) => x.length > 60))
    throw Error("entries");
  return a;
}
export function groups(items, n) {
  if (!Number.isInteger(n) || n < 2 || n > items.length) throw Error("groups");
  const out = Array.from({ length: n }, () => []);
  items.forEach((v, i) => out[i % n].push(v));
  return out;
}
export function roundRobin(names) {
  const a = names.map((name, id) => ({ name, id }));
  if (a.length % 2) a.push(null);
  const rounds = [];
  for (let r = 0; r < a.length - 1; r++) {
    const matches = [];
    for (let i = 0; i < a.length / 2; i++) {
      const x = a[i],
        y = a[a.length - 1 - i];
      if (x && y) matches.push({ a: x.id, b: y.id, sa: null, sb: null });
    }
    rounds.push(matches);
    a.splice(1, 0, a.pop());
  }
  return rounds;
}
export function elimination(names) {
  let size = 2;
  while (size < names.length) size *= 2;
  let seeds = [1, 2];
  while (seeds.length < size) {
    const sum = seeds.length * 2 + 1;
    seeds = seeds.flatMap((x) => [x, sum - x]);
  }
  const matches = [];
  for (let i = 0; i < size; i += 2) {
    const a = seeds[i] <= names.length ? seeds[i] - 1 : null,
      b = seeds[i + 1] <= names.length ? seeds[i + 1] - 1 : null;
    matches.push({
      a,
      b,
      sa: null,
      sb: null,
      winner: a === null ? b : b === null ? a : null,
    });
  }
  return [matches];
}
export function advance(round) {
  if (round.some((m) => m.winner === null)) throw Error("incomplete");
  const winners = round.map((m) => m.winner),
    out = [];
  for (let i = 0; i < winners.length; i += 2)
    out.push({
      a: winners[i],
      b: winners[i + 1],
      sa: null,
      sb: null,
      winner: null,
    });
  return out;
}
export function standings(names, rounds) {
  const rows = names.map((name, id) => ({
    name,
    id,
    p: 0,
    w: 0,
    d: 0,
    l: 0,
    pf: 0,
    pa: 0,
    pts: 0,
  }));
  for (const m of rounds.flat()) {
    if (!Number.isInteger(m.sa) || !Number.isInteger(m.sb)) continue;
    const a = rows[m.a],
      b = rows[m.b];
    if (!a || !b) continue;
    a.p++;
    b.p++;
    a.pf += m.sa;
    a.pa += m.sb;
    b.pf += m.sb;
    b.pa += m.sa;
    if (m.sa > m.sb) {
      a.w++;
      a.pts += 3;
      b.l++;
    } else if (m.sa < m.sb) {
      b.w++;
      b.pts += 3;
      a.l++;
    } else {
      a.d++;
      b.d++;
      a.pts++;
      b.pts++;
    }
  }
  return rows.sort(
    (a, b) =>
      b.pts - a.pts ||
      b.pf - b.pa - (a.pf - a.pa) ||
      b.pf - a.pf ||
      a.id - b.id,
  );
}
export function scoreTyping(target, input, seconds) {
  const a = Array.from(target.normalize("NFC")),
    b = Array.from(input.normalize("NFC"));
  let correct = 0;
  for (let i = 0; i < b.length; i++) if (a[i] === b[i]) correct++;
  return {
    correct,
    total: b.length,
    wpm: seconds > 0 ? Math.round(correct / 5 / (seconds / 60)) : 0,
    cpm: seconds > 0 ? Math.round(correct / (seconds / 60)) : 0,
    accuracy: b.length ? Math.round((correct / b.length) * 100) : 100,
  };
}
export function encodeState(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return btoa(Array.from(bytes, (x) => String.fromCharCode(x)).join(""))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
export function decodeState(hash) {
  if (hash.length > 24000) throw Error("size");
  const s = hash.replace(/^#s=/, "").replaceAll("-", "+").replaceAll("_", "/");
  return JSON.parse(
    new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))),
  );
}
export function safeState(kind, s) {
  if (!s || s.v !== 1 || s.kind !== kind) throw Error("state");
  if (kind === "type") {
    if (
      ![30, 60, 120].includes(s.seconds) ||
      typeof s.text !== "string" ||
      s.text.length < 10 ||
      s.text.length > 8000
    )
      throw Error("state");
    return { v: 1, kind, text: s.text, seconds: s.seconds };
  }
  if (
    !Array.isArray(s.names) ||
    s.names.length < 2 ||
    s.names.length > (kind === "bracket" ? 64 : 100) ||
    s.names.some((x) => typeof x !== "string" || !x.trim() || x.length > 60)
  )
    throw Error("state");
  const out = { v: 1, kind, names: s.names };
  if (kind === "bracket") {
    if (
      !["knockout", "league"].includes(s.mode) ||
      new Set(s.names).size !== s.names.length ||
      (s.mode === "league" && s.names.length > 20)
    )
      throw Error("state");
    out.mode = s.mode;
    out.rounds =
      s.mode === "league" ? roundRobin(s.names) : elimination(s.names);
    if (s.scores) {
      if (!Array.isArray(s.scores) || s.scores.length > 63)
        throw Error("state");
      for (let r = 0; r < s.scores.length; r++) {
        const matches = out.rounds[r];
        if (!matches) throw Error("state");
        if (
          !Array.isArray(s.scores[r]) ||
          s.scores[r].length !== matches.length
        )
          throw Error("state");
        for (let i = 0; i < matches.length; i++) {
          const [a, b] = s.scores[r][i] || [];
          if (a === null && b === null) continue;
          if (
            !Number.isInteger(a) ||
            !Number.isInteger(b) ||
            a < 0 ||
            b < 0 ||
            a > 999 ||
            b > 999
          )
            throw Error("state");
          const m = matches[i];
          if (m.a === null || m.b === null) throw Error("state");
          if (s.mode === "knockout" && a === b) throw Error("state");
          m.sa = a;
          m.sb = b;
          if (s.mode === "knockout") m.winner = a > b ? m.a : m.b;
        }
        if (s.mode === "knockout" && r < s.scores.length - 1)
          out.rounds.push(advance(matches));
      }
    }
  }
  return out;
}
export function csv(rows) {
  return (
    "\ufeff" +
    rows
      .map((row) =>
        row
          .map(
            (v) =>
              '"' +
              String(v)
                .replace(/^[=+@-]/, "'$&")
                .replaceAll('"', '""') +
              '"',
          )
          .join(","),
      )
      .join("\r\n")
  );
}
