import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"

source_files = [DATA_DIR / f"words-{index}.json" for index in range(1, 7)]
words = []

for source_file in source_files:
    with source_file.open(encoding="utf-8") as file:
        words.extend(json.load(file))

words.sort(key=lambda item: item["id"])
levels = defaultdict(list)

for word in words:
    converted_word = {
        "id": word["id"],
        "word": word["word"],
        "definition": word["definition"],
        "level": word["level"],
        "category": word["category"],
        "sentences": [
            {
                "text": example,
                "answer": word["word"]
            }
            for example in word["examples"]
        ]
    }
    levels[word["level"]].append(converted_word)

level_names = ["A1", "A2", "B1", "B2", "C1", "C2"]

for level in level_names:
    output_file = DATA_DIR / f"words-{level.lower()}.json"
    with output_file.open("w", encoding="utf-8") as file:
        json.dump(levels[level], file, ensure_ascii=False, indent=2)
        file.write("\n")

manifest = {
    "totalWords": len(words),
    "examplesPerWord": 3,
    "levels": {
        level: {
            "file": f"words-{level.lower()}.json",
            "wordCount": len(levels[level])
        }
        for level in level_names
    }
}

with (DATA_DIR / "manifest.json").open("w", encoding="utf-8") as file:
    json.dump(manifest, file, ensure_ascii=False, indent=2)
    file.write("\n")

quiz_path = ROOT / "assets/js/quiz.js"
quiz_code = quiz_path.read_text(encoding="utf-8")
quiz_code = re.sub(
    r'const VOCABULARY_FILES=.*?;',
    'const MANIFEST_FILE="../data/manifest.json";',
    quiz_code,
    count=1
)
quiz_code = re.sub(
    r'^async function loadWords\(\).*$',
    'async function loadWords(){try{const manifestResponse=await fetch(MANIFEST_FILE);if(!manifestResponse.ok)throw new Error(`Vocabulary manifest could not be loaded: ${manifestResponse.status}`);const manifest=await manifestResponse.json();const files=Object.values(manifest.levels).filter(level=>level.wordCount>0).map(level=>`../data/${level.file}`);const responses=await Promise.all(files.map(file=>fetch(file)));const failed=responses.find(response=>!response.ok);if(failed)throw new Error(`Vocabulary data could not be loaded: ${failed.status}`);const parts=await Promise.all(responses.map(response=>response.json()));const data=parts.flat();if(!Array.isArray(data)||data.length<4)throw new Error("At least four words are required to create a quiz.");words=data;populateCategories();startButton.textContent="Start Game";updateSetupSummary();}catch(error){console.error(error);showScreen("error");}}',
    quiz_code,
    count=1,
    flags=re.MULTILINE
)
quiz_path.write_text(quiz_code, encoding="utf-8")

study_path = ROOT / "assets/js/study.js"
study_code = study_path.read_text(encoding="utf-8")
study_code = re.sub(
    r'const VOCABULARY_FILES = \[.*?\];',
    'const MANIFEST_FILE = "../data/manifest.json";',
    study_code,
    count=1,
    flags=re.DOTALL
)
study_code = re.sub(
    r'function buildExample\(word\) \{.*?^\}',
    '''function buildExample(word) {
  if (!Array.isArray(word.sentences) || word.sentences.length === 0) {
    return "No example sentence is available.";
  }

  const randomSentence = word.sentences[Math.floor(Math.random() * word.sentences.length)];
  return randomSentence.text;
}''',
    study_code,
    count=1,
    flags=re.DOTALL | re.MULTILINE
)
study_code = re.sub(
    r'async function loadWords\(\) \{.*?^\}',
    '''async function loadWords() {
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
}''',
    study_code,
    count=1,
    flags=re.DOTALL | re.MULTILINE
)
study_path.write_text(study_code, encoding="utf-8")

for source_file in source_files:
    source_file.unlink(missing_ok=True)

(DATA_DIR / "words.json").unlink(missing_ok=True)
(ROOT / ".github/workflows/migrate-vocabulary.yml").unlink(missing_ok=True)
Path(__file__).unlink(missing_ok=True)
