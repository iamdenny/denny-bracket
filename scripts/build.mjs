import { versionStyles } from "./version-styles.mjs";
import { discovery, related } from "./discovery.mjs";
import { expandedPresets } from "./catalog.mjs";
import { promotionParts } from "../src/promotions.js";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { sites, presets } from "../src/content.js";
import { langs, languageNames, translator } from "../src/i18n.js";
import { escape as e } from "../src/core.js";
const config = JSON.parse(fs.readFileSync("site.json", "utf8")),
  kind = config.kind,
  site = sites[kind],
  origin = "https://" + site.domain,
  out = "dist";
presets[kind].push(...expandedPresets[kind]);
fs.mkdirSync(out, { recursive: true });
for (const file of fs.readdirSync("src"))
  if (/\.(js|css)$/.test(file))
    fs.copyFileSync("src/" + file, out + "/" + file);
const json = (x) => JSON.stringify(x).replaceAll("<", "\\u003c"),
  urls = [];
const local = (lang, p = "") => "/" + lang + "/" + p;
const L = (values, lang) => values[langs.indexOf(lang)];
const write = (p, text) => {
  const dest = path.join(out, p);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, text);
};
function defaults(lang, p = {}) {
  const index = langs.indexOf(lang);
  return (
    p.list?.[index] ||
    Array.from(
      { length: p.count || 8 },
      (_, i) =>
        `${{ en: "Player", ko: "참가자", ja: "参加者", es: "Participante" }[lang]} ${i + 1}`,
    )
  );
}
function app(lang, p) {
  const t = translator(lang),
    actions = `<div class="actions"><button class="secondary" id="save">${t("save")}</button><button class="secondary" id="load">${t("load")}</button><button class="secondary" id="share">${t(kind === "type" ? "challenge" : "share")}</button><button class="secondary" id="download">${t("download")}</button>${kind !== "type" ? `<button class="secondary" id="print">${t("print")}</button>` : ""}</div><p class="share-note">${t("shareNote")}</p><label for="share-fallback" class="small" hidden>${t("copyError")}</label><input id="share-fallback" readonly aria-label="${t("copyError")}" hidden><p id="status" class="status"></p>`;
  let body = "";
  if (kind === "spin")
    body = `<div class="workspace"><div class="stage"><div class="wheel-wrap"><canvas id="wheel" width="800" height="800" role="img" aria-label="${t("spin")}">${t("names")}</canvas><span class="wheel-hub" aria-hidden="true">✳</span></div><button id="spin" class="spin-button">${t("spin")} ↗</button><div id="winner" class="result-box" hidden><span class="small">${t("winner")}</span><strong id="winner-name"></strong><button class="secondary" id="remove" disabled>${t("remove")}</button></div></div><div class="editor"><div><div class="row between"><label for="entries">${t("names")}</label><span class="pill" id="entry-count">8</span></div><textarea id="entries" spellcheck="false" maxlength="6100">${defaults(lang, p).map(e).join("\n")}</textarea></div><button class="secondary" id="dedupe">${t("dedupe")}</button><div class="row between"><button class="secondary" id="shuffle">${t("shuffle")}</button><label for="sound"><input type="checkbox" id="sound">${t("sound")}</label></div><p class="small">${t("equal")}</p><div class="control-card"><label for="winner-count">${t("winnerCount")}</label><div class="row"><input id="winner-count" type="number" min="1" max="100" value="3"><button class="secondary" id="batch">${t("batch")}</button></div><p class="small">${t("uniqueHint")}</p></div><div class="row between"><label for="team-count">${t("teamCount")}</label><input id="team-count" type="number" min="2" max="100" value="2"></div><button class="secondary" id="teams">${t("teams")}</button><div><h3 class="small">${t("history")}</h3><ul class="history" id="history"><li>${t("empty")}</li></ul></div></div></div>`;
  if (kind === "type")
    body = `<div class="type-work"><div class="metrics"><div class="metric"><b id="wpm">0</b><span>${t("wpm")}</span></div><div class="metric"><b id="accuracy">100%</b><span>${t("accuracy")}</span></div><div class="metric"><b id="time">60s</b><span>${t("time")}</span></div><div class="duration-control"><label for="duration">${t("seconds")}</label><select id="duration"><option value="30">30s</option><option value="60" selected>60s</option><option value="120">120s</option></select></div></div><div class="practice-tools"><div class="passage-progress"><label for="passage-progress">${t("progress")} <span id="progress-text">0%</span></label><progress id="passage-progress" value="0" max="100"></progress></div><div><label for="text-size">${t("fontSize")}</label><select id="text-size"><option value="standard">${t("normal")}</option><option value="large">${t("large")}</option><option value="extra">${t("extraLarge")}</option></select></div></div><label id="passage-label">${t("passage")}</label><div id="passage" class="passage" role="region" aria-labelledby="passage-label" tabindex="0"></div><label for="typing">${t("typeHere")}</label><textarea id="typing" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" aria-describedby="type-hint"></textarea><div class="row between"><p class="small" id="type-hint">${t("typeHint")}</p><div class="row"><button class="secondary" id="reset">↻ ${t("reset")}</button><button id="finish" disabled>${t("finish")}</button></div></div><div class="result-box" id="result" hidden><h2>${t("complete")}</h2><strong id="result-stats"></strong><p class="small">${t("weak")}</p><p id="weak"></p><button id="retry-words" disabled>${t("retryWords")}</button><p class="small">${t("retryHint")}</p></div><button id="original-passage" class="secondary" hidden>${t("original")}</button><div class="records"><div class="record"><span>${t("best")}</span><b id="best">—</b></div><div class="record"><span>${t("streak")}</span><b id="streak">0</b></div></div><details ${p.custom ? "open" : ""}><summary>${t("custom")}</summary><label for="custom-text" class="small">${t("passage")} · 10–8000</label><textarea id="custom-text" maxlength="8000"></textarea><button id="apply">${t("apply")}</button></details><details><summary>${t("history")}</summary><ul class="history" id="history"></ul></details><p class="small">${t("method")}</p></div>`;
  if (kind === "bracket")
    body = `<div class="tournament-controls"><div><label for="entries">${t("participants")}</label><textarea id="entries" spellcheck="false" maxlength="3904">${defaults(lang, p).map(e).join("\n")}</textarea></div><div class="tournament-settings"><div><label for="format">${t("format")}</label><select id="format"><option value="knockout">${t("knockout")}</option><option value="league">${t("league")}</option></select></div><label class="row" for="seed"><input type="checkbox" id="seed">${t("seed")}</label><button id="generate">${t("generate")} ↗</button><div class="stats-inline"><span><b id="player-count">${p.count || 8}</b> ${t("participants").split(" ·")[0]}</span><span><b id="round-count">3</b> ${t("round")}</span></div></div></div><div class="tournament-toolbar"><div class="row"><button id="undo" class="secondary" disabled>↶ ${t("undo")}</button><button id="redo" class="secondary" disabled>↷ ${t("redo")}</button><label class="toggle" for="pending-only"><input type="checkbox" id="pending-only">${t("pending")}</label></div><p class="small">${t("undoHint")}</p><label for="match-progress">${t("matchProgress")} <span id="match-progress-text"></span></label><progress id="match-progress" max="1" value="0"></progress></div><p id="all-done" class="notice" hidden>${t("allDone")}</p><div id="board" class="board" role="region" aria-label="${t("format")}" tabindex="0"></div><div class="row" style="padding:0 24px 24px"><button id="next-round">${t("nextRound")} →</button></div><div class="champion" id="champion" hidden><span>${t("champion")}</span><strong id="champion-name"></strong></div><div id="standings-wrap" style="padding:24px" hidden><div class="table-wrap"><table><caption>${t("standings")}</caption><thead><tr><th scope="col">#</th><th scope="col">${t("team")}</th><th scope="col">${t("played")}</th><th scope="col">${t("wins")}</th><th scope="col">${t("diff")}</th><th scope="col">${t("points")}</th></tr></thead><tbody id="standings-body"></tbody></table></div><p class="small">${t("leagueRules")}</p></div><p class="small" style="padding:0 24px">${t("locked")}</p>`;
  return `<section class="app" id="tool" tabindex="-1" aria-label="${site.name}"><div class="app-top"><h2>${p.title ? e(L(p.title, lang)) : site.name}</h2><div class="row"><span class="pill">${t("local")}</span><button id="focus-mode" class="secondary" aria-pressed="false">${t("focus")}</button></div></div><div class="workspace-intro"><span>${t("workspaceHint")}</span><p id="tool-feedback" role="status"></p></div>${body}${kind === "spin" ? `<section id="batch-results" class="result-panel" hidden><h3>${t("batchTitle")}</h3><ol id="batch-list" class="winner-grid"></ol><button id="export-draw" class="secondary">${t("exportDraw")}</button></section><section id="teams-panel" class="result-panel" hidden><div class="row between"><h3>${t("teams")}</h3><button id="export-teams" class="secondary">${t("exportTeams")}</button></div><div id="team-results" class="team-grid"></div></section>` : ""}<div class="app-bottom">${actions}</div></section>`;
}
function cards(lang, full = false, current = null) {
  const t = translator(lang), items = full ? presets[kind] : current ? related(presets[kind], current, 8) : presets[kind].slice(0, 8);
  const search = {en:"Search activities",ko:"콘텐츠 검색",ja:"コンテンツを検索",es:"Buscar actividades"}[lang];
  const more = {en:"Browse all activities",ko:"전체 콘텐츠 보기",ja:"すべてを見る",es:"Ver todas las actividades"}[lang];
  return `<section class="subsection"><div class="section-title"><h2>${t("pick")}</h2><span>${presets[kind].length}</span></div>${full ? `<label for="catalog-search">${search}</label><input type="search" id="catalog-search" class="catalog-search" autocomplete="off" aria-controls="catalog-grid"><p id="catalog-count" class="small" role="status">${items.length} / ${items.length}</p>` : ""}<div class="cards" ${full ? 'id="catalog-grid"' : ""}>${items.map((p, i) => `<a class="card" href="${local(lang, "tools/" + p.slug + "/")}"><span class="card-icon" aria-hidden="true">${["✳", "↗", "◷", "⌘", "⤢", "≋", "↻", "＋"][i % 8]}</span><h3>${e(L(p.title, lang))}</h3><p>${e(L(p.desc, lang))}</p></a>`).join("")}</div>${full ? "" : `<p><a class="button secondary" href="${local(lang,"explore/")}">${more} (${presets[kind].length}) →</a></p>`}</section>`;
}
function presetNotes(lang, p) {
  if (!p.guide) return "";
  const vocabulary = p.vocabulary || p.list;
  const label = {en:"Inside this activity",ko:"이 콘텐츠 활용하기",ja:"このコンテンツの使い方",es:"Cómo aprovechar esta actividad"}[lang];
  return `<article class="article"><h2>${label}</h2><p>${e(L(p.guide,lang))}</p>${vocabulary ? `<ul class="vocabulary-list">${L(vocabulary,lang).map(word=>`<li>${e(word)}</li>`).join("")}</ul>` : ""}</article>`;
}
function how(lang) {
  const t = translator(lang);
  return `<section class="subsection" id="how"><div class="section-title"><h2>${t("steps")}</h2></div><div class="how">${site.steps.map((x, i) => `<section><span class="how-number">0${i + 1}</span><h3>${e(L(x, lang))}</h3><p>${e(L(site.stepBody[i], lang))}</p></section>`).join("")}</div></section>`;
}
const privacy = [
  [
    "Your inputs stay in this browser. Saving a session or typing records uses local storage on this device. Clearing browser data removes those records. Sharing creates a URL containing your list, practice text or scores; anyone who receives that URL can read them. Do not share private information.",
    "입력한 내용은 이 브라우저에서 처리합니다. 세션과 타자 기록은 이 기기의 로컬 저장소에 저장하며 브라우저 데이터를 지우면 삭제됩니다. 공유 링크에는 목록·연습 문장·점수가 포함되므로 링크를 받은 사람은 내용을 볼 수 있습니다. 개인정보는 공유하지 마세요.",
    "入力内容はこのブラウザーで処理します。セッションや記録は端末のローカルストレージに保存され、ブラウザーデータの削除で消えます。共有URLにはリスト・文章・スコアが含まれ、受信者は閲覧できます。個人情報は共有しないでください。",
    "Los datos se procesan en tu navegador. Las sesiones y marcas usan almacenamiento local y se borran al limpiar los datos del navegador. Los enlaces incluyen listas, textos o resultados; quien los reciba puede leerlos. No compartas información privada.",
  ],
  [
    "Google Analytics loads only after you allow analytics. We send clean page paths, language and a fixed list of feature events, never entered names, passages, scores or URL fragments. Advertising storage, personalized advertising and Google Signals are disabled. You can change your choice using Analytics settings. Hosting providers may process connection logs to deliver the website.",
    "Google Analytics는 분석을 허용한 뒤에만 로드됩니다. 페이지 경로·언어·정해진 기능 이벤트만 보내며 입력한 이름·문장·점수·URL 조각은 보내지 않습니다. 광고 저장소·맞춤형 광고·Google Signals는 꺼져 있습니다. 분석 설정에서 선택을 바꿀 수 있습니다. 호스팅 업체는 사이트 제공을 위해 접속 기록을 처리할 수 있습니다.",
    "Google Analyticsは許可後にのみ読み込みます。ページのパス・言語・定義済み機能イベントのみを送り、名前・文章・スコア・URLフラグメントは送信しません。広告ストレージ・広告のパーソナライズ・Google Signalsは無効です。設定から選択を変更できます。ホスティング事業者は配信のため接続ログを処理する場合があります。",
    "Google Analytics solo se carga con permiso. Enviamos rutas, idioma y eventos predefinidos, nunca nombres, textos, puntuaciones ni fragmentos de URL. El almacenamiento publicitario, la personalización y Google Signals están desactivados. Puedes cambiar tu elección en los ajustes. El alojamiento puede procesar registros de conexión.",
  ],
  [
    "Contact the operator, Denny Lim, at hi.iamdenny@gmail.com. Adsterra advertising loads after advertising permission and may process cookies, device and connection information. Use the ad panel to withdraw permission. Coupang links are affiliate advertisements; we receive a commission on eligible purchases. Other banners promote our services. Tool inputs are not sent to advertising providers.",
    "운영자 Denny Lim에게 hi.iamdenny@gmail.com으로 문의할 수 있습니다. Adsterra 광고는 광고 허용 후 로드되며 쿠키·기기·접속 정보를 처리할 수 있습니다. 광고 영역에서 허용을 철회할 수 있습니다. 쿠팡 링크는 구매 시 수수료를 받는 제휴 광고이며 다른 배너는 운영 서비스 홍보입니다. 도구 입력 내용은 광고 업체에 보내지 않습니다.",
    "運営者Denny Limへのお問い合わせはhi.iamdenny@gmail.comまで。Adsterra広告は許可後に読み込まれ、Cookie・端末・接続情報を処理する場合があります。広告欄で許可を撤回できます。Coupangリンクは購入時に手数料を受け取る広告です。他のバナーは運営サービスの宣伝です。入力内容は送信しません。",
    "Contacta con Denny Lim en hi.iamdenny@gmail.com. Los anuncios Adsterra se cargan con permiso y pueden procesar cookies y datos del dispositivo y conexión. Puedes retirar el permiso en el anuncio. Los enlaces Coupang generan comisiones por compras elegibles. Los demás banners promocionan nuestros servicios. No enviamos tus entradas.",
  ],
];
const homeSearchTitles = {
  "spin": {
    "en": "Free Random Name Picker & Team Generator",
    "ko": "무료 이름 추첨 룰렛·팀 나누기",
    "ja": "無料ルーレット抽選・チーム分け",
    "es": "Ruleta de nombres y generador de equipos gratis"
  },
  "type": {
    "en": "Free Typing Test & Typing Practice",
    "ko": "무료 타자 연습·타자 속도 테스트",
    "ja": "無料タイピング練習・速度テスト",
    "es": "Test de velocidad y práctica de mecanografía gratis"
  },
  "bracket": {
    "en": "Free Tournament Bracket & Round-Robin Generator",
    "ko": "무료 토너먼트 대진표·리그 일정표 만들기",
    "ja": "無料トーナメント表・総当たり対戦表作成",
    "es": "Generador de cuadros de torneo y ligas gratis"
  }
};
function page(lang, p, title, desc, body, preset = null, noindex = false) {
  const searchTitle = p ? title : homeSearchTitles[kind][lang];
  const t = translator(lang),
    url = origin + local(lang, p),
    graph = [
      {
        "@type": "WebSite",
        "@id": origin + "/#website",
        name: site.name,
        url: origin + "/en/",
        inLanguage: langs,
      },
      {
        "@type": "Organization",
        "@id": origin + "/#organization",
        name: "Denny Tools",
        url: "https://tools.iamdenny.com",
        email: "hi.iamdenny@gmail.com",
      },
      {
        "@type": "WebPage",
        "@id": url + "#page",
        url,
        name: searchTitle,
        description: desc,
        inLanguage: lang,
        isPartOf: { "@id": origin + "/#website" },
        dateModified: "2026-10-23",
        author: { "@type": "Person", name: "Denny Lim" },
      },
    ];
  if (preset)
    graph.push({
      "@type": "WebApplication",
      name: searchTitle,
      url,
      description: desc,
      applicationCategory:
        kind === "type" ? "EducationalApplication" : "UtilitiesApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      inLanguage: lang,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    });
  if (p)
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: site.name,
          item: origin + local(lang),
        },
        { "@type": "ListItem", position: 2, name: searchTitle, item: url },
      ],
    });
  const promos = promotionParts(lang, kind, config);
  const bodyText = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(searchTitle)} | ${site.name}</title><meta name="description" content="${e(desc)}"><meta name="robots" content="${noindex ? "noindex" : "index,follow,max-image-preview:large"}"><link rel="canonical" href="${url}">${langs.map((l) => `<link rel="alternate" hreflang="${l}" href="${origin + local(l, p)}">`).join("")}<link rel="alternate" hreflang="x-default" href="${origin + local("en", p)}"><meta property="og:title" content="${e(searchTitle)} | ${site.name}"><meta property="og:description" content="${e(desc)}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta property="og:image" content="${origin}/social.png"><meta name="twitter:title" content="${e(searchTitle)} | ${site.name}"><meta name="twitter:description" content="${e(desc)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${origin}/social.png"><meta name="theme-color" content="${kind === "spin" ? "#754bce" : kind === "type" ? "#226b58" : "#3652c7"}"><meta name="google-adsense-account" content="ca-pub-3539037484563455">${config.naverVerification ? `<meta name="naver-site-verification" content="${e(config.naverVerification)}">` : ""}${config.bingVerification ? `<meta name="msvalidate.01" content="${e(config.bingVerification)}">` : ""}<link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/promotions.css"><link rel="stylesheet" href="/workspace.css"><script type="application/ld+json">${json({ "@context": "https://schema.org", "@graph": graph })}</script></head><body class="${kind}"><a class="skip" href="#main">${t("skip")}</a><header class="topbar"><a class="brand" href="${local(lang)}"><span class="brand-mark" aria-hidden="true">${{ spin: "✳", type: "t", bracket: "↗" }[kind]}</span>denny ${kind}<span style="color:var(--accent)">.</span></a><nav aria-label="${t("explore")}"><a href="${local(lang, "explore/")}">${t("explore")}</a><a href="${local(lang, "guide/")}">${t("guide")}</a><label for="language" hidden>Language</label><select id="language" class="locale" aria-label="Language">${langs.map((l) => `<option value="${local(l, p)}" ${l === lang ? "selected" : ""}>${languageNames[l]}</option>`).join("")}</select></nav></header>${preset ? `<div class="tool-shortcut"><a href="#tool">${{en:"Jump to the tool",ko:"도구 바로 사용하기",ja:"ツールを使う",es:"Ir a la herramienta"}[lang]} ↓</a></div>` : ""}${promos.top}<div class="banner-layout">${promos.left}<main class="banner-main" id="main" tabindex="-1"><section class="hero"><div><p class="eyebrow">${e(L(site.tag, lang))}</p><h1>${e(title)}</h1></div><div class="intro"><p>${e(desc)}</p><span class="badge">${t("free")}</span></div></section><div class="container">${promos.affiliate}${preset ? `<noscript><p class="notice">${t("nojs")}</p></noscript>` : ""}${body}</div></main>${promos.right}</div>${promos.bottom}<footer class="site-footer"><span>© 2026 ${site.name} · Denny Lim</span><nav aria-label="Footer"><a href="${local(lang, "about/")}">${t("about")}</a><a href="${local(lang, "privacy/")}">${t("privacy")}</a><button class="quiet" id="analytics-settings">${t("settings")}</button><a href="https://github.com/iamdenny/denny-${kind}">${t("source")} ↗</a></nav></footer><section id="consent" class="consent" aria-label="${t("settings")}" hidden><p>${t("consent")}</p><div class="actions"><button class="secondary" data-consent="denied">${t("decline")}</button><button data-consent="granted">${t("allow")}</button></div></section><script id="config" type="application/json">${json({ ...config, domain: site.domain, lang, preset: preset || {}, names: defaults(lang, preset || {}) })}</script><script type="module" src="/site.js"></script><script type="module" src="/workspace.js"></script><script type="module" src="/analytics.js"></script><script type="module" src="/network-ads.js"></script>${preset ? `<script type="module" src="/${kind}.js"></script>` : ""}</body></html>`;
  write(lang + "/" + (p ? p : "") + "index.html", bodyText);
  if (!noindex) urls.push(url);
  return bodyText;
}
for (const lang of langs) {
  const t = translator(lang);
  page(
    lang,
    "",
    L(site.title, lang),
    L(site.description, lang),
    app(lang, {}) + discovery(kind,lang,presets[kind],p=>local(lang,"tools/"+p.slug+"/")) + cards(lang) + how(lang),
    {},
  );
  page(
    lang,
    "explore/",
    t("explore"),
    L(site.description, lang),
    cards(lang, true) + how(lang),
  );
  page(
    lang,
    "guide/",
    t("guide"),
    L(site.description, lang),
    how(lang) +
      `<article class="article"><h2>${t("faq")}</h2><p>${t("localBody")}</p><p>${t("shareNote")}</p><p>${t(kind === "spin" ? "equal" : kind === "type" ? "method" : "leagueRules")}</p><p>${t("updated")}: 2026-10-23 · Denny Lim</p></article>`,
  );
  page(
    lang,
    "privacy/",
    t("privacy"),
    L(privacy[0], lang).split(". ")[0],
    `<article class="article">${privacy.map((p) => `<p>${e(L(p, lang))}</p>`).join("")}<a class="tiny-link" href="https://policies.google.com/privacy">Google Privacy</a></article>`,
  );
  page(
    lang,
    "about/",
    t("about"),
    t("localBody"),
    `<article class="article"><h2>${site.name}</h2><p>${e(L(site.description, lang))}</p><p>${t("localBody")}</p><p>Denny Lim · <a href="mailto:hi.iamdenny@gmail.com">hi.iamdenny@gmail.com</a></p><p><a class="tiny-link" href="https://github.com/iamdenny/denny-${kind}/issues">${t("source")} / Issues</a></p><p>${t("updated")}: 2026-10-23</p></article>`,
  );
  for (const p of presets[kind])
    page(
      lang,
      "tools/" + p.slug + "/",
      L(p.title, lang),
      L(p.desc, lang) + " " + L(site.description, lang),
      app(lang, p) + presetNotes(lang, p) + how(lang) + cards(lang, false, p),
      p,
    );
}
write("index.html", fs.readFileSync(out + "/en/index.html", "utf8"));
write(
  "404.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | ${site.name}</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/promotions.css"><link rel="stylesheet" href="/workspace.css"></head><body class="${kind}"><main class="container article"><h1>Page not found</h1><p>This address is no longer available.</p><a class="button" href="/en/">Back to ${site.name}</a></main></body></html>`,
);
write("CNAME", site.domain + "\n");
write(".nojekyll", "");
write(
  "robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
);
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u}</loc><lastmod>2026-10-23</lastmod></url>`).join("")}</urlset>`,
);
write(
  "llms.txt",
  `# ${site.name}\n\n${site.description[0]}\n\n## Languages\n${langs.map((l) => `- [${languageNames[l]}](${origin + local(l)})`).join("\n")}\n\n## Tools\n${presets[kind].map((p) => `- [${p.title[0]}](${origin}/en/tools/${p.slug}/): ${p.desc[0]}`).join("\n")}\n\n## Method and privacy\n- [How it works](${origin}/en/guide/)\n- [Privacy](${origin}/en/privacy/)\n\nOwner: Denny Lim. Inputs run in the browser. Shared links are snapshots, not live collaboration. This navigation file does not promise AI citations.\n`,
);
write(
  "ads.txt",
  "google.com, pub-3539037484563455, DIRECT, f08c47fec0942fa0\n",
);
write(
  "favicon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${kind === "spin" ? "#754bce" : kind === "type" ? "#226b58" : "#3652c7"}"/><text x="32" y="46" fill="white" font-size="48" font-family="sans-serif" text-anchor="middle">${kind === "spin" ? "✳" : kind === "type" ? "t" : "↗"}</text></svg>`,
);
if (fs.existsSync("public")) fs.cpSync("public", out, { recursive: true });
let commit = process.env.GITHUB_SHA || "local";
try {
  commit = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {}
write(
  "release.json",
  json({
    site: site.name,
    commit,
    pages: urls.length,
    activities: presets[kind].length,
    builtAt: new Date().toISOString(),
  }),
);
write("site-manifest.json", json({ urls, activities: presets[kind].map(p => p.slug) }));
console.log(`${site.name}: ${urls.length} localized pages built`);

const indexNowKey = fs.readFileSync("indexnow-key.txt", "utf8").trim();
if (!/^[a-f0-9]{32}$/.test(indexNowKey)) throw Error("Invalid IndexNow key");
write(indexNowKey + ".txt", indexNowKey);

versionStyles("dist");
