const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data", "manifest.json"), "utf8"));

const irregularForms = {
  choose: ["chose", "chosen"],
  make: ["made"],
  take: ["took", "taken"],
  give: ["gave", "given"],
  get: ["got", "gotten"],
  find: ["found"],
  think: ["thought"],
  leave: ["left"],
  keep: ["kept"],
  bring: ["brought"],
  build: ["built"],
  teach: ["taught"],
  catch: ["caught"],
  buy: ["bought"],
  become: ["became"],
  begin: ["began", "begun"],
  grow: ["grew", "grown"],
  know: ["knew", "known"],
  write: ["wrote", "written"],
  speak: ["spoke", "spoken"],
  break: ["broke", "broken"],
  run: ["ran"],
  meet: ["met"],
  pay: ["paid"],
  send: ["sent"],
  spend: ["spent"],
  understand: ["understood"],
  win: ["won"],
  lose: ["lost"],
  feel: ["felt"],
  mean: ["meant"],
  lead: ["led"],
  read: ["read"]
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function regularForms(word) {
  const forms = new Set([word]);

  forms.add(`${word}s`);
  forms.add(`${word}ed`);
  forms.add(`${word}ing`);

  if (word.endsWith("e")) {
    forms.add(`${word}d`);
    forms.add(`${word.slice(0, -1)}ing`);
  }

  if (word.endsWith("y") && !/[aeiou]y$/i.test(word)) {
    forms.add(`${word.slice(0, -1)}ies`);
    forms.add(`${word.slice(0, -1)}ied`);
  }

  if (/(s|x|z|ch|sh)$/i.test(word)) forms.add(`${word}es`);

  const finalThree = word.slice(-3);
  if (/^[^aeiou][aeiou][^aeiouwxy]$/i.test(finalThree)) {
    const last = word.slice(-1);
    forms.add(`${word}${last}ed`);
    forms.add(`${word}${last}ing`);
  }

  (irregularForms[word] || []).forEach((form) => forms.add(form));
  return [...forms].sort((a, b) => b.length - a.length);
}

function findSurfaceAnswer(text, baseAnswer) {
  const candidates = regularForms(baseAnswer.toLowerCase());

  for (const candidate of candidates) {
    const match = text.match(new RegExp(`\\b${escapeRegExp(candidate)}\\b`, "i"));
    if (match) return match[0];
  }

  return null;
}

let sentenceCount = 0;
const unresolved = [];

for (const level of Object.values(manifest.levels)) {
  if (!level.wordCount) continue;

  const filePath = path.join(root, "data", level.file);
  const words = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const word of words) {
    for (const sentence of word.sentences || []) {
      sentenceCount += 1;

      if (sentence.text.includes("_____")) continue;

      const surfaceAnswer = findSurfaceAnswer(sentence.text, String(sentence.answer).toLowerCase());
      if (!surfaceAnswer) {
        unresolved.push({ id: word.id, word: word.word, text: sentence.text, answer: sentence.answer });
        continue;
      }

      sentence.text = sentence.text.replace(
        new RegExp(`\\b${escapeRegExp(surfaceAnswer)}\\b`, "i"),
        "_____"
      );
      sentence.answer = surfaceAnswer;
    }
  }

  fs.writeFileSync(filePath, `${JSON.stringify(words, null, 2)}\n`);
}

if (unresolved.length) {
  console.error("Unresolved sentences:");
  console.error(JSON.stringify(unresolved, null, 2));
  process.exit(1);
}

console.log(`Normalized ${sentenceCount} vocabulary sentences.`);
