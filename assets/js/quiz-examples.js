const quizExamplePanel = document.querySelector("#quiz-example-panel");
const quizExampleList = document.querySelector("#quiz-example-list");
const quizQuestionPrompt = document.querySelector("#question-prompt");
const quizAnswerOptions = document.querySelector("#answer-options");
const quizNextButton = document.querySelector("#next-button");

let quizExampleWords = [];

function clearQuizExamples() {
  if (!quizExamplePanel || !quizExampleList) return;
  quizExampleList.innerHTML = "";
  quizExamplePanel.classList.add("hidden");
}

function getAnsweredWord() {
  const prompt = quizQuestionPrompt?.textContent.trim();
  if (!prompt) return null;

  return quizExampleWords.find((word) =>
    word.word === prompt
    || word.sentences?.some((sentence) => sentence.text === prompt)
  ) || null;
}

function renderQuizExamples(word) {
  if (!quizExamplePanel || !quizExampleList || !Array.isArray(word?.sentences)) return;

  quizExampleList.innerHTML = "";
  word.sentences.slice(0, 3).forEach((sentence) => {
    const item = document.createElement("li");
    item.textContent = sentence.text.replace("_____", sentence.answer);
    quizExampleList.appendChild(item);
  });

  quizExamplePanel.classList.remove("hidden");
}

async function loadQuizExampleWords() {
  try {
    const manifestResponse = await fetch("../data/manifest.json");
    if (!manifestResponse.ok) return;

    const manifest = await manifestResponse.json();
    const files = Object.values(manifest.levels)
      .filter((level) => level.wordCount > 0)
      .map((level) => `../data/${level.file}`);

    const responses = await Promise.all(files.map((file) => fetch(file)));
    if (responses.some((response) => !response.ok)) return;

    quizExampleWords = (await Promise.all(responses.map((response) => response.json()))).flat();
  } catch (error) {
    console.error("Example sentences could not be loaded:", error);
  }
}

quizAnswerOptions?.addEventListener("click", (event) => {
  if (!event.target.closest(".answer-button")) return;
  const answeredWord = getAnsweredWord();
  if (answeredWord) renderQuizExamples(answeredWord);
});

quizNextButton?.addEventListener("click", clearQuizExamples);

document.querySelector("#restart-button")?.addEventListener("click", clearQuizExamples);
document.querySelector("#change-settings-button")?.addEventListener("click", clearQuizExamples);

clearQuizExamples();
loadQuizExampleWords();
