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
const assets = {
  tools: { name: "Everyday Tools", wide: ["tools-wide.webp",1500,500], card: ["tools-card.webp",1200,628] },
  games: { name: "Denny Games", wide: ["games-wide.png",970,250], rail: ["games-rail.png",160,600], mobile: ["games-mobile.png",320,100], card: ["games-card.png",300,250] },
  modutt: { name: "MODU TT", wide: ["modutt-wide.svg",1200,300], rail: ["modutt-rail.svg",160,600], mobile: ["modutt-mobile.svg",320,100], card: ["modutt-card.svg",300,250] },
};
export function promotionParts(lang, kind, config) {
  const t = labels[lang];
  const card = (id, shape = "wide") => {
    const d = assets[id], [file,width,height] = d[shape];
    const href = id === "modutt" ? "https://modutt.kr/" : `https://${id}.iamdenny.com/${lang === "es" ? "en" : lang}/`;
    const mobile = shape === "rail" ? `<source media="(max-width: 899px)" srcset="/banners/${d.mobile[0]}" width="${d.mobile[1]}" height="${d.mobile[2]}">` : "";
    return `<a class="official-banner official-${shape}" href="${href}?utm_source=denny-${kind}&amp;utm_medium=banner&amp;utm_campaign=network" target="_blank" rel="noopener noreferrer"><span class="promo-label">${t[0]} · ${d.name}</span><picture>${mobile}<img src="/banners/${file}" width="${width}" height="${height}" alt="${d.name} — ${t[2]}" loading="${shape === "wide" ? "eager" : "lazy"}" decoding="async"></picture></a>`;
  };
  const affiliate = config.coupang?.channelRegistered === true ? `<aside class="affiliate-banner"><span class="promo-label">${t[0]} · ${t[3]}</span><div class="affiliate-inner"><span class="promo-symbol" aria-hidden="true">⌘</span><div><strong>${t[5]}</strong><p>${t[6]}</p></div><a href="https://link.coupang.com/a/hLh0ZMTttc" target="_blank" rel="sponsored nofollow noopener noreferrer">${t[4]} ↗</a></div></aside>` : "";
  const ad = `<aside class="network-ad" aria-label="${t[0]} · Adsterra"><span class="promo-label">${t[0]} · Adsterra</span><div class="ad-surface" data-network-ad><div class="ad-explanation"><strong>Adsterra</strong><p>${t[8]}</p><button class="secondary" data-ads-allow>${t[7]}</button></div></div><button class="quiet" data-ads-off hidden>${t[9]}</button><span class="ad-status" role="status"></span></aside>`;
  return {
    top: `<section class="promo-top" aria-label="${t[1]}">${card("tools")}${card("games")}${card("modutt")}</section>`,
    left: `<aside class="promo-rail promo-left" aria-label="${t[1]}">${card("games", "rail")}</aside>`,
    right: `<aside class="promo-rail promo-right" aria-label="${t[1]}">${card("modutt", "rail")}</aside>`,
    bottom: `<section class="promo-bottom" aria-label="${t[0]}">${ad}<div class="official-bottom-grid">${affiliate}${card("tools", "card")}${card("games", "card")}${card("modutt", "card")}</div></section>`,
    affiliate,
  };
}
