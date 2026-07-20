const screens = {
  start: document.querySelector("#start-screen"),
  quiz: document.querySelector("#quiz-screen"),
  result: document.querySelector("#result-screen"),
  error: document.querySelector("#error-screen")
};

const startButton = document.querySelector("#start-button");
const nextButton = document.querySelector("#next-button");
const restartButton = document.querySelector("#restart-button");
const changeSettingsButton = document.querySelector("#change-settings-button");
const questionCount = document.querySelector("#question-count");
const scoreText = document.querySelector("#score");
const progressBar = document.querySelector("#progress-bar");
const questionLabel = document.querySelector("#question-label");
const questionPrompt = document.querySelector("#question-prompt");
const answerOptions = document.querySelector("#answer-options");
const feedback = document.querySelector("#feedback");
const finalScore = document.querySelector("#final-score");
const resultMessage = document.querySelector("#result-message");
const questionLimitSelect = document.querySelector("#question-limit");
const categorySelect = document.querySelector("#category-select");
const availableCount = document.querySelector("#available-count");
const setupMessage = document.querySelector("#setup-message");
const difficultyInputs = [...document.querySelectorAll('input[name="difficulty"]')];
const gameModeInputs = [...document.querySelectorAll('input[name="game-mode"]')];

const MANIFEST_FILE = "../data/manifest.json";
const LEVEL_GROUPS = {
  beginner: ["A1", "A2"],
  intermediate: ["B1", "B2"],
  mixed: []
};

let words = [];
let activeWordPool = [];
let quizWords = [];
let currentQuestionIndex = 0;
let score = 0;
let answerLocked = false;
let activeGameMode = "definition";
let currentCorrectAnswer = "";

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function getSelectedDifficulty() {
  return difficultyInputs.find((input) => input.checked)?.value || "mixed";
}

function getSelectedGameMode() {
  return gameModeInputs.find((input) => input.checked)?.value || "definition";
}

function getFilteredWords() {
  const difficulty = getSelectedDifficulty();
  const category = categorySelect.value;
  const levels = LEVEL_GROUPS[difficulty];

  return words.filter((word) => {
    const matchesLevel = difficulty === "mixed" || levels.includes(word.level);
    const matchesCategory = category === "all" || word.category === category;
    return matchesLevel && matchesCategory;
  });
}

function updateSetupSummary() {
  if (!words.length) {
    return;
  }

  const filteredWords = getFilteredWords();
  const requestedQuestions = Number(questionLimitSelect.value);

  availableCount.textContent = `${filteredWords.length} words`;

  if (filteredWords.length < 4) {
    setupMessage.textContent = "Choose another difficulty or category. At least four words are required.";
    startButton.disabled = true;
    return;
  }

  startButton.disabled = false;
  setupMessage.textContent = requestedQuestions > filteredWords.length
    ? `This selection supports ${filteredWords.length} questions. The quiz length will be adjusted automatically.`
    : "";
}

function populateCategories() {
  const categories = [...new Set(words.map((word) => word.category))].sort();

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    categorySelect.appendChild(option);
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createBlankSentence(sentence) {
  if (sentence.text.includes("_____")) {
    return sentence.text;
  }

  const answerPattern = new RegExp(`\\b${escapeRegExp(sentence.answer)}\\b`, "i");
  return sentence.text.replace(answerPattern, "_____");
}

function getRandomSentence(word) {
  if (!Array.isArray(word.sentences) || word.sentences.length === 0) {
    return null;
  }

  return word.sentences[Math.floor(Math.random() * word.sentences.length)];
}

async function loadWords() {
  try {
    const manifestResponse = await fetch(MANIFEST_FILE);

    if (!manifestResponse.ok) {
      throw new Error(`Vocabulary manifest could not be loaded: ${manifestResponse.status}`);
    }

    const manifest = await manifestResponse.json();
    const files = Object.values(manifest.levels)
      .filter((level) => level.wordCount > 0)
      .map((level) => `../data/${level.file}`);

    const responses = await Promise.all(files.map((file) => fetch(file)));
    const failedResponse = responses.find((response) => !response.ok);

    if (failedResponse) {
      throw new Error(`Vocabulary data could not be loaded: ${failedResponse.status}`);
    }

    const vocabularyParts = await Promise.all(responses.map((response) => response.json()));
    const data = vocabularyParts.flat();

    if (!Array.isArray(data) || data.length < 4) {
      throw new Error("At least four words are required to create a quiz.");
    }

    words = data;
    populateCategories();
    startButton.textContent = "Start Game";
    updateSetupSummary();
  } catch (error) {
    console.error(error);
    showScreen("error");
  }
}

function startQuiz() {
  activeWordPool = getFilteredWords();

  if (activeWordPool.length < 4) {
    updateSetupSummary();
    return;
  }

  const questionLimit = Math.min(Number(questionLimitSelect.value), activeWordPool.length);

  activeGameMode = getSelectedGameMode();
  quizWords = shuffle(activeWordPool).slice(0, questionLimit);
  currentQuestionIndex = 0;
  score = 0;
  scoreText.textContent = "Score: 0";
  progressBar.style.width = "0%";

  showScreen("quiz");
  renderQuestion();
}

function createDefinitionChoices(correctWord) {
  const wrongDefinitions = shuffle(words.filter((word) => word.id !== correctWord.id))
    .map((word) => word.definition)
    .filter((definition, index, list) => list.indexOf(definition) === index)
    .slice(0, 3);

  return shuffle([correctWord.definition, ...wrongDefinitions]);
}

function createWordChoices(correctWord, correctAnswer) {
  const sameLevelWords = words.filter((word) => {
    return word.id !== correctWord.id && word.level === correctWord.level;
  });

  const fallbackWords = words.filter((word) => word.id !== correctWord.id);
  const source = sameLevelWords.length >= 3 ? sameLevelWords : fallbackWords;

  const wrongWords = shuffle(source)
    .map((word) => word.word)
    .filter((word, index, list) => {
      return word.toLowerCase() !== correctAnswer.toLowerCase() && list.indexOf(word) === index;
    })
    .slice(0, 3);

  return shuffle([correctAnswer, ...wrongWords]);
}

function renderDefinitionQuestion(currentWord) {
  questionLabel.textContent = "Which definition best matches this word?";
  questionPrompt.textContent = currentWord.word;
  questionPrompt.classList.remove("sentence-prompt");
  currentCorrectAnswer = currentWord.definition;

  createDefinitionChoices(currentWord).forEach((definition) => {
    createAnswerButton(definition);
  });
}

function renderFillBlankQuestion(currentWord) {
  const sentence = getRandomSentence(currentWord);

  if (!sentence) {
    renderDefinitionQuestion(currentWord);
    return;
  }

  questionLabel.textContent = "Choose the correct word to complete the sentence.";
  questionPrompt.textContent = createBlankSentence(sentence);
  questionPrompt.classList.add("sentence-prompt");
  currentCorrectAnswer = sentence.answer;

  createWordChoices(currentWord, sentence.answer).forEach((word) => {
    createAnswerButton(word);
  });
}

function createAnswerButton(answer) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "answer-button";
  button.textContent = answer;
  button.addEventListener("click", () => checkAnswer(button, answer));
  answerOptions.appendChild(button);
}

function renderQuestion() {
  answerLocked = false;
  feedback.textContent = "";
  feedback.className = "feedback";
  nextButton.classList.add("hidden");
  answerOptions.innerHTML = "";

  const currentWord = quizWords[currentQuestionIndex];
  const totalQuestions = quizWords.length;

  questionCount.textContent = `Question ${currentQuestionIndex + 1} / ${totalQuestions}`;
  progressBar.style.width = `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`;

  if (activeGameMode === "fill-blank") {
    renderFillBlankQuestion(currentWord);
  } else {
    renderDefinitionQuestion(currentWord);
  }
}

function checkAnswer(selectedButton, selectedAnswer) {
  if (answerLocked) {
    return;
  }

  answerLocked = true;

  [...answerOptions.querySelectorAll(".answer-button")].forEach((button) => {
    button.disabled = true;

    if (button.textContent === currentCorrectAnswer) {
      button.classList.add("correct");
    }
  });

  if (selectedAnswer === currentCorrectAnswer) {
    score += 1;
    scoreText.textContent = `Score: ${score}`;
    feedback.textContent = "Correct.";
    feedback.classList.add("success");
  } else {
    selectedButton.classList.add("wrong");
    feedback.textContent = `Incorrect. The correct answer is: ${currentCorrectAnswer}`;
    feedback.classList.add("error");
  }

  nextButton.textContent = currentQuestionIndex === quizWords.length - 1
    ? "View Result"
    : "Next Question";
  nextButton.classList.remove("hidden");
}

function goToNextQuestion() {
  currentQuestionIndex += 1;

  if (currentQuestionIndex >= quizWords.length) {
    showResult();
    return;
  }

  renderQuestion();
}

function showResult() {
  const totalQuestions = quizWords.length;
  const percentage = Math.round((score / totalQuestions) * 100);

  finalScore.textContent = `${score} / ${totalQuestions}`;
  resultMessage.textContent = percentage === 100
    ? "Excellent. You answered every question correctly."
    : percentage >= 70
      ? "Good work. Try another quiz to keep improving."
      : percentage >= 40
        ? "A solid start. Review the words and try again."
        : "Keep practising. Repetition will make these words easier.";

  showScreen("result");
}

function returnToSettings() {
  showScreen("start");
  updateSetupSummary();
}

startButton.addEventListener("click", startQuiz);
nextButton.addEventListener("click", goToNextQuestion);
restartButton.addEventListener("click", startQuiz);
changeSettingsButton.addEventListener("click", returnToSettings);
questionLimitSelect.addEventListener("change", updateSetupSummary);
categorySelect.addEventListener("change", updateSetupSummary);
difficultyInputs.forEach((input) => input.addEventListener("change", updateSetupSummary));
gameModeInputs.forEach((input) => input.addEventListener("change", updateSetupSummary));

loadWords();