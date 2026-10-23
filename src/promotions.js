const labels = {
  en: [
    "Advertisement",
    "More from Denny",
    "Open",
    "Coupang Partners",
    "Browse gamepads",
    "A little upgrade for playtime.",
    "As a Coupang Partners affiliate, we receive a commission on qualifying purchases.",
    "Allow Adsterra ads",
    "Adsterra may process cookies, device and connection information. Your tool inputs are not shared.",
    "Turn off ads",
  ],
  ko: [
    "광고",
    "함께 쓰면 더 좋은 서비스",
    "바로 가기",
    "쿠팡 파트너스",
    "게임패드 둘러보기",
    "즐거운 플레이를 위한 작은 업그레이드.",
    "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
    "Adsterra 광고 허용",
    "Adsterra가 쿠키·기기·접속 정보를 처리할 수 있습니다. 도구 입력 내용은 공유하지 않습니다.",
    "광고 끄기",
  ],
  ja: [
    "広告",
    "Dennyのサービス",
    "開く",
    "Coupang Partners",
    "ゲームパッドを見る",
    "プレイをもっと楽しく。",
    "Coupang Partnersとして、リンク経由の対象購入から手数料を受け取ります。",
    "Adsterra広告を許可",
    "AdsterraはCookie・端末・接続情報を処理する場合があります。入力内容は共有しません。",
    "広告をオフ",
  ],
  es: [
    "Publicidad",
    "Más de Denny",
    "Abrir",
    "Coupang Partners",
    "Ver mandos",
    "Una mejora para jugar.",
    "Como afiliados de Coupang Partners, recibimos una comisión por compras elegibles.",
    "Permitir anuncios Adsterra",
    "Adsterra puede procesar cookies y datos del dispositivo y conexión. No compartimos tus entradas.",
    "Desactivar anuncios",
  ],
};
const data = [
  [
    "tools",
    "Everyday Tools",
    "✳",
    [
      "Useful tools, one click away.",
      "생활 속 필요한 도구를 한곳에.",
      "毎日に役立つツール。",
      "Herramientas para cada día.",
    ],
  ],
  [
    "games",
    "Denny Games",
    "✚",
    [
      "Your next play break.",
      "설치 없이, 바로 즐기는 웹게임.",
      "インストール不要のゲーム。",
      "Juega sin instalar nada.",
    ],
  ],
  [
    "modutt",
    "MODU TT",
    "◉",
    [
      "Table tennis, together.",
      "탁구 기록부터 대회까지.",
      "卓球の記録から大会まで。",
      "Tu comunidad de tenis de mesa.",
    ],
  ],
  [
    "print",
    "Denny Print",
    "▧",
    [
      "Create, print, enjoy.",
      "만들고 출력하는 즐거움.",
      "作って印刷しよう。",
      "Crea e imprime.",
    ],
  ],
];
export function promotionParts(lang, kind, config) {
  const index = ["en", "ko", "ja", "es"].indexOf(lang),
    t = labels[lang];
  const card = (id) => {
    const d = data.find((x) => x[0] === id);
    const href =
      id === "modutt"
        ? "https://modutt.kr/"
        : `https://${id}.iamdenny.com/${lang === "es" && ["tools", "games"].includes(id) ? "en" : lang}/`;
    return `<a class="promo-card promo-${id}" href="${href}?utm_source=denny-${kind}&amp;utm_medium=banner&amp;utm_campaign=network" target="_blank" rel="noopener noreferrer"><span class="promo-label">${t[0]} · ${d[1]}</span><span class="promo-symbol" aria-hidden="true">${d[2]}</span><strong>${d[1]}</strong><span>${d[3][index]}</span><span class="promo-cta">${t[2]} ↗</span></a>`;
  };
  const affiliate = config.coupang?.channelRegistered === true ? `<aside class="affiliate-banner"><span class="promo-label">${t[0]} · ${t[3]}</span><div class="affiliate-inner"><span class="promo-symbol" aria-hidden="true">⌘</span><div><strong>${t[5]}</strong><p>${t[6]}</p></div><a href="https://link.coupang.com/a/hLh0ZMTttc" target="_blank" rel="sponsored nofollow noopener noreferrer">${t[4]} ↗</a></div></aside>` : "";
  const ad = `<aside class="network-ad" aria-label="${t[0]} · Adsterra"><span class="promo-label">${t[0]} · Adsterra</span><div class="ad-surface" data-network-ad><div class="ad-explanation"><strong>Adsterra</strong><p>${t[8]}</p><button class="secondary" data-ads-allow>${t[7]}</button></div></div><button class="quiet" data-ads-off hidden>${t[9]}</button><span class="ad-status" role="status"></span></aside>`;
  return {
    top: `<section class="promo-top" aria-label="${t[1]}">${card("tools")}${card("games")}${card("modutt")}</section>`,
    left: `<aside class="promo-rail promo-left" aria-label="${t[1]}">${card("tools")}${card("print")}</aside>`,
    right: `<aside class="promo-rail promo-right" aria-label="${t[1]}">${card("games")}${card("modutt")}</aside>`,
    bottom: `<section class="promo-bottom" aria-label="${t[0]}">${ad}<div>${affiliate}${card("print")}</div></section>`,
    affiliate,
  };
}
