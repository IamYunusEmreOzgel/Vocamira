const sentenceGroups = document.querySelector("#sentence-groups");
const sentenceCount = document.querySelector("#sentence-count");
const sentenceSearch = document.querySelector("#sentence-search");
const levelFilter = document.querySelector("#level-filter");
const grammarFilter = document.querySelector("#grammar-filter");
const categoryFilter = document.querySelector("#category-filter");
const clearFiltersButton = document.querySelector("#clear-filters");
const emptyState = document.querySelector("#sentence-empty");
const errorState = document.querySelector("#sentence-error");

let sentences = [];

const formatLabel = (value) => value
  .split("-")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const populateFilter = (select, values) => {
  [...new Set(values)]
    .sort((a, b) => a.localeCompare(b))
    .forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = formatLabel(value);
      select.append(option);
    });
};

const getFilteredSentences = () => {
  const query = sentenceSearch.value.trim().toLocaleLowerCase("en");

  return sentences.filter((sentence) => {
    const searchableText = [
      sentence.english,
      sentence.pattern,
      sentence.similarExample,
      sentence.level,
      sentence.grammar,
      sentence.category,
      ...(sentence.keywords || [])
    ].join(" ").toLocaleLowerCase("en");

    const matchesSearch = !query || searchableText.includes(query);
    const matchesLevel = levelFilter.value === "all" || sentence.level === levelFilter.value;
    const matchesGrammar = grammarFilter.value === "all" || sentence.grammar === grammarFilter.value;
    const matchesCategory = categoryFilter.value === "all" || sentence.category === categoryFilter.value;

    return matchesSearch && matchesLevel && matchesGrammar && matchesCategory;
  });
};

const createSentenceCard = (sentence) => `
  <article class="sentence-card">
    <div class="sentence-meta">
      <span class="level-tag">${escapeHtml(sentence.level)}</span>
      <span>${escapeHtml(formatLabel(sentence.category))}</span>
    </div>
    <p class="english-sentence">${escapeHtml(sentence.english)}</p>
    <div class="sentence-details">
      <div class="sentence-detail">
        <span class="detail-label">Pattern</span>
        <p>${escapeHtml(sentence.pattern)}</p>
      </div>
      <div class="sentence-detail similar-example">
        <span class="detail-label">Similar Example</span>
        <p>${escapeHtml(sentence.similarExample)}</p>
      </div>
    </div>
  </article>
`;

const renderSentences = () => {
  const filteredSentences = getFilteredSentences();
  const groupedSentences = filteredSentences.reduce((groups, sentence) => {
    if (!groups[sentence.grammar]) groups[sentence.grammar] = [];
    groups[sentence.grammar].push(sentence);
    return groups;
  }, {});

  sentenceGroups.innerHTML = Object.entries(groupedSentences)
    .sort(([grammarA], [grammarB]) => grammarA.localeCompare(grammarB))
    .map(([grammar, group]) => `
      <section class="sentence-group" aria-labelledby="group-${escapeHtml(grammar)}">
        <div class="group-heading">
          <h2 id="group-${escapeHtml(grammar)}">${escapeHtml(formatLabel(grammar))}</h2>
          <span>${group.length} ${group.length === 1 ? "sentence" : "sentences"}</span>
        </div>
        <div class="sentence-list">
          ${group.map(createSentenceCard).join("")}
        </div>
      </section>
    `)
    .join("");

  sentenceCount.textContent = `${filteredSentences.length} of ${sentences.length} sentences shown`;
  emptyState.classList.toggle("hidden", filteredSentences.length !== 0);
};

const resetFilters = () => {
  sentenceSearch.value = "";
  levelFilter.value = "all";
  grammarFilter.value = "all";
  categoryFilter.value = "all";
  renderSentences();
};

[sentenceSearch, levelFilter, grammarFilter, categoryFilter].forEach((control) => {
  control.addEventListener(control === sentenceSearch ? "input" : "change", renderSentences);
});

clearFiltersButton.addEventListener("click", resetFilters);

fetch("../data/sentences.json")
  .then((response) => {
    if (!response.ok) throw new Error(`Sentence data request failed: ${response.status}`);
    return response.json();
  })
  .then((data) => {
    sentences = Array.isArray(data) ? data : [];
    populateFilter(levelFilter, sentences.map((sentence) => sentence.level));
    populateFilter(grammarFilter, sentences.map((sentence) => sentence.grammar));
    populateFilter(categoryFilter, sentences.map((sentence) => sentence.category));
    renderSentences();
  })
  .catch((error) => {
    console.error(error);
    sentenceGroups.innerHTML = "";
    sentenceCount.textContent = "Sentence data unavailable";
    errorState.classList.remove("hidden");
  });