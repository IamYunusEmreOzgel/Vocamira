const screens = {
  start: document.querySelector("#start-screen"),
  quiz: document.querySelector("#quiz-screen"),
  result: document.querySelector("#result-screen"),
  error: document.querySelector("#error-screen")
};

const startButton = document.querySelector("#start-button");
const nextButton = document.querySelector("#next-button");
const restartButton = document.querySelector("#restart-button");
const questionCount = document.querySelector("#question-count");
const scoreText = document.querySelector("#score");
const progressBar = document.querySelector("#progress-bar");
const questionWord = document.querySelector("#question-word");
const answerOptions = document.querySelector("#answer-options");
const feedback = document.querySelector("#feedback");
const finalScore = document.querySelector("#final-score");
const resultMessage = document.querySelector("#result-message");

const QUESTION_LIMIT = 10;

let words = [];
let quizWords = [];
let currentQuestionIndex = 0;
let score = 0;
let answerLocked = false;

function showScreen(screenName) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[screenName].classList.add("active");
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

async function loadWords() {
  try {
    const response = await fetch("data/words.json");

    if (!response.ok) {
      throw new Error(`Kelime verileri yüklenemedi: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length < 4) {
      throw new Error("Test oluşturmak için en az dört kelime gerekli.");
    }

    words = data;
  } catch (error) {
    console.error(error);
    showScreen("error");
  }
}

function startQuiz() {
  if (words.length < 4) {
    showScreen("error");
    return;
  }

  quizWords = shuffle(words).slice(0, Math.min(QUESTION_LIMIT, words.length));
  currentQuestionIndex = 0;
  score = 0;
  scoreText.textContent = "Puan: 0";
  showScreen("quiz");
  renderQuestion();
}

function createAnswerChoices(correctWord) {
  const wrongMeanings = shuffle(
    words
      .filter((word) => word.id !== correctWord.id)
      .map((word) => word.meaning)
  ).slice(0, 3);

  return shuffle([correctWord.meaning, ...wrongMeanings]);
}

function renderQuestion() {
  answerLocked = false;
  feedback.textContent = "";
  feedback.className = "feedback";
  nextButton.classList.add("hidden");
  answerOptions.innerHTML = "";

  const currentWord = quizWords[currentQuestionIndex];
  const totalQuestions = quizWords.length;

  questionCount.textContent = `Soru ${currentQuestionIndex + 1} / ${totalQuestions}`;
  progressBar.style.width = `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`;
  questionWord.textContent = currentWord.word;

  createAnswerChoices(currentWord).forEach((meaning) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = meaning;
    button.addEventListener("click", () => checkAnswer(button, meaning, currentWord.meaning));
    answerOptions.appendChild(button);
  });
}

function checkAnswer(selectedButton, selectedMeaning, correctMeaning) {
  if (answerLocked) {
    return;
  }

  answerLocked = true;
  const buttons = [...answerOptions.querySelectorAll(".answer-button")];

  buttons.forEach((button) => {
    button.disabled = true;

    if (button.textContent === correctMeaning) {
      button.classList.add("correct");
    }
  });

  if (selectedMeaning === correctMeaning) {
    score += 1;
    scoreText.textContent = `Puan: ${score}`;
    feedback.textContent = "Doğru cevap!";
    feedback.classList.add("success");
  } else {
    selectedButton.classList.add("wrong");
    feedback.textContent = `Yanlış. Doğru cevap: ${correctMeaning}`;
    feedback.classList.add("error");
  }

  nextButton.textContent =
    currentQuestionIndex === quizWords.length - 1 ? "Sonucu Gör" : "Sonraki Soru";
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

  if (percentage === 100) {
    resultMessage.textContent = "Mükemmel! Tüm soruları doğru bildin.";
  } else if (percentage >= 70) {
    resultMessage.textContent = "Çok iyi gidiyorsun. Bir test daha çöz!";
  } else if (percentage >= 40) {
    resultMessage.textContent = "Güzel başlangıç. Tekrar ettikçe gelişeceksin.";
  } else {
    resultMessage.textContent = "Pes etme. Aynı kelimeleri tekrar deneyelim.";
  }

  showScreen("result");
}

startButton.addEventListener("click", startQuiz);
nextButton.addEventListener("click", goToNextQuestion);
restartButton.addEventListener("click", startQuiz);

loadWords();
