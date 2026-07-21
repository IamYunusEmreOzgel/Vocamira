const studyArea = document.querySelector("#study-area");
const studyError = document.querySelector("#study-error");
const studySessionStatus = document.querySelector("#study-session-status");
const levelSelect = document.querySelector("#level-select");
const cardCount = document.querySelector("#card-count");
const wordLevel = document.querySelector("#word-level");
const wordCategory = document.querySelector("#word-category");
const studyWord = document.querySelector("#study-word");
const studyDefinition = document.querySelector("#study-definition");
const studyExampleList = document.querySelector("#study-example-list");
const wordDetails = document.querySelector("#word-details");
const revealButton = document.querySelector("#reveal-button");
const previousButton = document.querySelector("#previous-button");
const nextButton = document.querySelector("#next-study-button");
const shuffleButton = document.querySelector("#shuffle-button");

const MANIFEST_FILE = "../data/manifest.json";
const SESSION_SIZE = 10;

let allWords = [];
let visibleWords = [];
let seenWordIds = new Set();
let currentIndex = 0;
let detailsVisible = false;
let currentUser = null;

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function createHighlightedSentence(sentence) {
  const paragraph = document.createElement("p");
  const [beforeAnswer, afterAnswer = ""] = sentence.text.split("_____");
  const highlightedAnswer = document.createElement("mark");

  highlightedAnswer.textContent = sentence.answer;
  paragraph.append(beforeAnswer, highlightedAnswer, afterAnswer);
  return paragraph;
}

function renderExamples(word) {
  studyExampleList.replaceChildren();

  if (!Array.isArray(word.sentences) || word.sentences.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "No example sentences are available.";
    studyExampleList.appendChild(emptyMessage);
    return;
  }

  word.sentences.forEach((sentence) => {
    studyExampleList.appendChild(createHighlightedSentence(sentence));
  });
}

function hideDetails() {
  detailsVisible = false;
  wordDetails.classList.add("hidden");
  wordDetails.setAttribute("aria-hidden", "true");
  revealButton.textContent = "Show definition";
}

async function markWordAsSeen(wordId) {
  if (!currentUser || seenWordIds.has(Number(wordId))) {
    return;
  }

  seenWordIds.add(Number(wordId));

  const { error } = await window.supabaseClient
    .from("user_word_progress")
    .upsert(
      {
        user_id: currentUser.id,
        word_id: Number(wordId),
        status: "learning"
      },
      {
        onConflict: "user_id,word_id",
        ignoreDuplicates: true
      }
    );

  if (error) {
    seenWordIds.delete(Number(wordId));
    console.error("Word view could not be saved:", error);
  }
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
  renderExamples(word);
  previousButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === visibleWords.length - 1;
  hideDetails();
  markWordAsSeen(word.id);
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

function createDailySession() {
  const selectedLevel = levelSelect.value;
  const levelWords = selectedLevel === "all"
    ? [...allWords]
    : allWords.filter((word) => word.level === selectedLevel);

  const unseenWords = shuffle(
    levelWords.filter((word) => !seenWordIds.has(Number(word.id)))
  );
  const previouslySeenWords = shuffle(
    levelWords.filter((word) => seenWordIds.has(Number(word.id)))
  );

  const newWords = unseenWords.slice(0, SESSION_SIZE);
  const remainingSlots = SESSION_SIZE - newWords.length;
  const reviewWords = remainingSlots > 0
    ? previouslySeenWords.slice(0, remainingSlots)
    : [];

  visibleWords = [...newWords, ...reviewWords];
  currentIndex = 0;

  if (currentUser) {
    studySessionStatus.textContent = newWords.length === visibleWords.length
      ? `${newWords.length} new words selected for this session.`
      : `${newWords.length} new words and ${reviewWords.length} review words selected.`;
  } else {
    studySessionStatus.textContent = "Sign in to save which words you have already studied.";
  }

  renderCard();
}

function toggleDetails() {
  detailsVisible = !detailsVisible;
  wordDetails.classList.toggle("hidden", !detailsVisible);
  wordDetails.setAttribute("aria-hidden", String(!detailsVisible));
  revealButton.textContent = detailsVisible ? "Hide definition" : "Show definition";
}

async function loadCurrentUserProgress() {
  if (!window.supabaseClient) {
    return;
  }

  const {
    data: { user },
    error: userError
  } = await window.supabaseClient.auth.getUser();

  if (userError) {
    console.error("User session could not be loaded:", userError);
    return;
  }

  currentUser = user;

  if (!currentUser) {
    return;
  }

  const { data, error } = await window.supabaseClient
    .from("user_word_progress")
    .select("word_id")
    .eq("user_id", currentUser.id);

  if (error) {
    console.error("Word progress could not be loaded:", error);
    return;
  }

  seenWordIds = new Set((data || []).map((row) => Number(row.word_id)));
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
    populateLevels();
    await loadCurrentUserProgress();
    createDailySession();
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

levelSelect.addEventListener("change", createDailySession);

loadWords();