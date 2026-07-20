const studyArea = document.querySelector("#study-area");
const studyError = document.querySelector("#study-error");
const levelSelect = document.querySelector("#level-select");
const cardCount = document.querySelector("#card-count");
const wordLevel = document.querySelector("#word-level");
const wordCategory = document.querySelector("#word-category");
const studyWord = document.querySelector("#study-word");
const studyDefinition = document.querySelector("#study-definition");
const studyExample = document.querySelector("#study-example");
const wordDetails = document.querySelector("#word-details");
const revealButton = document.querySelector("#reveal-button");
const previousButton = document.querySelector("#previous-button");
const nextButton = document.querySelector("#next-study-button");
const shuffleButton = document.querySelector("#shuffle-button");

const MANIFEST_FILE = "../data/manifest.json";

let allWords = [];
let visibleWords = [];
let currentIndex = 0;
let detailsVisible = false;

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function buildExample(word) {
  if (!Array.isArray(word.sentences) || word.sentences.length === 0) {
    return "No example sentence is available.";
  }

  const randomSentence = word.sentences[Math.floor(Math.random() * word.sentences.length)];
  return randomSentence.text.replace("_____", randomSentence.answer);
}

function hideDetails() {
  detailsVisible = false;
  wordDetails.classList.add("hidden");
  wordDetails.setAttribute("aria-hidden", "true");
  revealButton.textContent = "Show definition";
}

function renderCard() {
  if (visibleWords.length === 0) {
    studyArea.classList.add("hidden");
    studyError.classList.remove("hidden");
    return;
  }

  const word = visibleWords[currentIndex];
  studyArea.classList.remove("hidden");
  studyError.classList.add("hidden");
  cardCount.textContent = `Word ${currentIndex + 1} of ${visibleWords.length}`;
  wordLevel.textContent = word.level;
  wordCategory.textContent = word.category;
  studyWord.textContent = word.word;
  studyDefinition.textContent = word.definition;
  studyExample.textContent = buildExample(word);
  previousButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === visibleWords.length - 1;
  hideDetails();
}

function populateLevels() {
  const levels = [...new Set(allWords.map((word) => word.level))].sort();

  levels.forEach((level) => {
    const option = document.createElement("option");
    option.value = level;
    option.textContent = level;
    levelSelect.appendChild(option);
  });
}

function applyLevelFilter() {
  const selectedLevel = levelSelect.value;
  visibleWords = selectedLevel === "all"
    ? [...allWords]
    : allWords.filter((word) => word.level === selectedLevel);
  currentIndex = 0;
  renderCard();
}

function toggleDetails() {
  detailsVisible = !detailsVisible;
  wordDetails.classList.toggle("hidden", !detailsVisible);
  wordDetails.setAttribute("aria-hidden", String(!detailsVisible));
  revealButton.textContent = detailsVisible ? "Hide definition" : "Show definition";
}

async function loadWords() {
  try {
    const manifestResponse = await fetch(MANIFEST_FILE);

    if (!manifestResponse.ok) {
      throw new Error(`Vocabulary manifest could not be loaded: ${manifestResponse.status}`);
    }

    const manifest = await manifestResponse.json();
    const vocabularyFiles = Object.values(manifest.levels)
      .filter((level) => level.wordCount > 0)
      .map((level) => `../data/${level.file}`);

    const responses = await Promise.all(vocabularyFiles.map((file) => fetch(file)));
    const failedResponse = responses.find((response) => !response.ok);

    if (failedResponse) {
      throw new Error(`Vocabulary data could not be loaded: ${failedResponse.status}`);
    }

    const vocabularyParts = await Promise.all(responses.map((response) => response.json()));
    const data = vocabularyParts.flat();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No vocabulary data is available.");
    }

    allWords = data;
    visibleWords = [...allWords];
    populateLevels();
    renderCard();
  } catch (error) {
    console.error(error);
    studyArea.classList.add("hidden");
    studyError.classList.remove("hidden");
  }
}

revealButton.addEventListener("click", toggleDetails);

previousButton.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex -= 1;
    renderCard();
  }
});

nextButton.addEventListener("click", () => {
  if (currentIndex < visibleWords.length - 1) {
    currentIndex += 1;
    renderCard();
  }
});

shuffleButton.addEventListener("click", () => {
  visibleWords = shuffle(visibleWords);
  currentIndex = 0;
  renderCard();
});

levelSelect.addEventListener("change", applyLevelFilter);

loadWords();