function hasUsableBlankSentence(sentence) {
  if (!sentence || typeof sentence.text !== "string" || typeof sentence.answer !== "string") {
    return false;
  }

  if (sentence.text.includes("_____")) {
    return true;
  }

  const answerPattern = new RegExp(`\\b${escapeRegExp(sentence.answer)}\\b`, "i");
  return answerPattern.test(sentence.text);
}

function getRandomSentence(word) {
  if (!Array.isArray(word.sentences)) {
    return null;
  }

  const usableSentences = word.sentences.filter(hasUsableBlankSentence);
  if (!usableSentences.length) {
    return null;
  }

  return usableSentences[Math.floor(Math.random() * usableSentences.length)];
}
