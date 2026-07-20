const wordElement = document.getElementById("moment-word");
const definitionElement = document.getElementById("moment-definition");
const levelElement = document.getElementById("moment-level");
const categoryElement = document.getElementById("moment-category");

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