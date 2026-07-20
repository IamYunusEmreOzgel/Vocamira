import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const dataDirectory = resolve(projectRoot, "data");

async function readJson(path) {
  const content = await readFile(path, "utf8");
  return JSON.parse(content);
}

function countBlanks(text) {
  return text.split("_____").length - 1;
}

function requireNonEmptyString(value, fieldName, context, errors) {
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${context}: ${fieldName} must be a non-empty string.`);
  }
}

async function validateVocabulary() {
  const errors = [];
  const manifest = await readJson(resolve(dataDirectory, "manifest.json"));
  const seenIds = new Set();
  let totalWords = 0;

  for (const [levelName, levelConfig] of Object.entries(manifest.levels || {})) {
    const expectedWordCount = Number(levelConfig?.wordCount || 0);

    if (!levelConfig?.file) {
      errors.push(`${levelName}: manifest file name is missing.`);
      continue;
    }

    if (expectedWordCount === 0) {
      continue;
    }

    const words = await readJson(resolve(dataDirectory, levelConfig.file));

    if (!Array.isArray(words)) {
      errors.push(`${levelConfig.file}: root value must be an array.`);
      continue;
    }

    totalWords += words.length;

    if (words.length !== expectedWordCount) {
      errors.push(
        `${levelConfig.file}: manifest says ${expectedWordCount} words, but the file contains ${words.length}.`
      );
    }

    words.forEach((word, wordIndex) => {
      const context = `${levelConfig.file} word ${wordIndex + 1}`;
      const numericId = Number(word?.id);

      if (!Number.isInteger(numericId) || numericId <= 0) {
        errors.push(`${context}: id must be a positive integer.`);
      } else if (seenIds.has(numericId)) {
        errors.push(`${context}: duplicate id ${numericId}.`);
      } else {
        seenIds.add(numericId);
      }

      requireNonEmptyString(word?.word, "word", context, errors);
      requireNonEmptyString(word?.definition, "definition", context, errors);
      requireNonEmptyString(word?.category, "category", context, errors);

      if (word?.level !== levelName) {
        errors.push(`${context}: level must be ${levelName}, but found ${word?.level ?? "missing"}.`);
      }

      if (!Array.isArray(word?.sentences)) {
        errors.push(`${context}: sentences must be an array.`);
        return;
      }

      if (word.sentences.length !== Number(manifest.examplesPerWord || 0)) {
        errors.push(
          `${context}: expected ${manifest.examplesPerWord} sentences, but found ${word.sentences.length}.`
        );
      }

      word.sentences.forEach((sentence, sentenceIndex) => {
        const sentenceContext = `${context}, sentence ${sentenceIndex + 1}`;
        requireNonEmptyString(sentence?.text, "text", sentenceContext, errors);
        requireNonEmptyString(sentence?.answer, "answer", sentenceContext, errors);

        if (typeof sentence?.text === "string" && countBlanks(sentence.text) !== 1) {
          errors.push(`${sentenceContext}: text must contain exactly one _____ placeholder.`);
        }
      });
    });
  }

  if (totalWords !== Number(manifest.totalWords || 0)) {
    errors.push(`Manifest totalWords is ${manifest.totalWords}, but active files contain ${totalWords} words.`);
  }

  if (errors.length) {
    console.error(`Vocabulary validation failed with ${errors.length} error(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Vocabulary validation passed: ${totalWords} words and ${totalWords * manifest.examplesPerWord} sentences.`);
}

validateVocabulary().catch((error) => {
  console.error("Vocabulary validation could not be completed:", error);
  process.exitCode = 1;
});