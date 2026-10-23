document.querySelector("#language")?.addEventListener("change", (e) => {
  location.href = e.target.value + location.hash;
});

const catalogSearch = document.querySelector("#catalog-search");
catalogSearch?.addEventListener("input", () => {
  const query = catalogSearch.value.normalize("NFC").trim().toLocaleLowerCase();
  const cards = [...document.querySelectorAll("#catalog-grid .card")];
  for (const card of cards) card.hidden = !card.textContent.normalize("NFC").toLocaleLowerCase().includes(query);
  document.querySelector("#catalog-count").textContent = `${cards.filter(card => !card.hidden).length} / ${cards.length}`;
});
