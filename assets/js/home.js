const wordElement = document.getElementById("moment-word");
const definitionElement = document.getElementById("moment-definition");
const levelElement = document.getElementById("moment-level");
const categoryElement = document.getElementById("moment-category");
const examplesElement = document.getElementById("moment-examples");

function createExampleSentence(sentence) {
  const sentenceElement = document.createElement("p");
  const parts = sentence.text.split("_____");

  sentenceElement.append(parts[0]);

  if (parts.length > 1) {
    const highlightedAnswer = document.createElement("mark");
    highlightedAnswer.textContent = sentence.answer;
    sentenceElement.append(highlightedAnswer, parts.slice(1).join("_____"));
  }

  return sentenceElement;
}

function showExamples(sentences = []) {
  if (!examplesElement) return;

  examplesElement.replaceChildren();

  sentences.slice(0, 3).forEach((sentence) => {
    examplesElement.appendChild(createExampleSentence(sentence));
  });
}

async function showRandomWord() {
  if (!wordElement || !definitionElement) return;

  try {
    const manifestResponse = await fetch("data/manifest.json");
    if (!manifestResponse.ok) throw new Error("Manifest could not be loaded.");

    const manifest = await manifestResponse.json();
    const availableLevels = Object.values(manifest.levels).filter(
      (level) => level.wordCount > 0
    );

    if (!availableLevels.length) throw new Error("No vocabulary files are available.");

    const randomLevel = availableLevels[
      Math.floor(Math.random() * availableLevels.length)
    ];

    const wordsResponse = await fetch(`data/${randomLevel.file}`);
    if (!wordsResponse.ok) throw new Error("Vocabulary could not be loaded.");

    const words = await wordsResponse.json();
    if (!words.length) throw new Error("The vocabulary file is empty.");

    const randomWord = words[Math.floor(Math.random() * words.length)];

    wordElement.textContent = randomWord.word;
    definitionElement.textContent = randomWord.definition;
    showExamples(randomWord.sentences);

    if (levelElement) {
      levelElement.textContent = randomWord.level || "Vocabulary";
    }

    if (categoryElement) {
      categoryElement.textContent = randomWord.category || "General";
    }
  } catch (error) {
    console.error(error);
  }
}

showRandomWord();