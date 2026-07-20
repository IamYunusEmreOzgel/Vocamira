const profileContent = document.getElementById("profile-content");
const profileStatus = document.getElementById("profile-status");
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const logoutButton = document.getElementById("logout-button");

function setStat(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value ?? 0;
}

function calculateAccuracy(correct, wrong) {
  const total = Number(correct || 0) + Number(wrong || 0);
  return total > 0 ? Math.round((Number(correct || 0) / total) * 100) : 0;
}

function setModePerformance(prefix, correct, wrong) {
  const total = Number(correct || 0) + Number(wrong || 0);
  const accuracy = calculateAccuracy(correct, wrong);

  setStat(`${prefix}-accuracy`, `${accuracy}%`);
  setStat(
    `${prefix}-summary`,
    total > 0 ? `${Number(correct || 0)} correct out of ${total}` : "No answers yet"
  );

  const progressBar = document.getElementById(`${prefix}-progress`);
  if (progressBar) progressBar.style.width = `${accuracy}%`;
}

async function loadVocabularyMap() {
  try {
    const manifestResponse = await fetch("../data/manifest.json");
    if (!manifestResponse.ok) throw new Error("Vocabulary manifest could not be loaded.");

    const manifest = await manifestResponse.json();
    const levelFiles = Object.values(manifest.levels)
      .filter((level) => level.wordCount > 0)
      .map((level) => level.file);

    const wordCollections = await Promise.all(
      levelFiles.map(async (file) => {
        const response = await fetch(`../data/${file}`);
        if (!response.ok) return [];
        return response.json();
      })
    );

    return new Map(wordCollections.flat().map((word) => [Number(word.id), word]));
  } catch (error) {
    console.error("Vocabulary names could not be loaded:", error);
    return new Map();
  }
}

function renderReviewWords(progressRows, vocabularyMap) {
  const reviewList = document.getElementById("review-words");
  const difficultRows = progressRows
    .filter((row) => row.status === "difficult")
    .sort((a, b) => Number(b.wrong_count || 0) - Number(a.wrong_count || 0))
    .slice(0, 6);

  if (!difficultRows.length) {
    reviewList.innerHTML = `
      <p class="empty-review-message">
        No difficult words yet. Keep playing to build a clearer learning profile.
      </p>
    `;
    return;
  }

  reviewList.innerHTML = difficultRows.map((row) => {
    const wordData = vocabularyMap.get(Number(row.word_id));
    const wordName = wordData?.word || `Word #${row.word_id}`;
    const definition = wordData?.definition || "Review this word in the Study section.";
    const wrongCount = Number(row.wrong_count || 0);

    return `
      <article class="review-word-item">
        <div>
          <strong>${wordName}</strong>
          <p>${definition}</p>
        </div>
        <span>${wrongCount} wrong ${wrongCount === 1 ? "answer" : "answers"}</span>
      </article>
    `;
  }).join("");
}

async function loadProfile() {
  const {
    data: { user },
    error: userError
  } = await window.supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.replace("login.html");
    return;
  }

  const [profileResult, statsResult, progressResult, vocabularyMap] = await Promise.all([
    window.supabaseClient
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single(),
    window.supabaseClient
      .from("user_stats")
      .select("games_played, total_questions, correct_answers, wrong_answers, definition_correct, definition_wrong, fill_blank_correct, fill_blank_wrong")
      .eq("user_id", user.id)
      .single(),
    window.supabaseClient
      .from("user_word_progress")
      .select("word_id, definition_correct_count, fill_blank_correct_count, wrong_count, status")
      .eq("user_id", user.id),
    loadVocabularyMap()
  ]);

  if (profileResult.error || statsResult.error || progressResult.error) {
    console.error("Profile load error:", {
      profile: profileResult.error,
      stats: statsResult.error,
      progress: progressResult.error
    });
    profileStatus.textContent = "Your profile could not be loaded. Please refresh the page.";
    return;
  }

  const stats = statsResult.data || {};
  const progressRows = progressResult.data || [];
  const overallAccuracy = calculateAccuracy(stats.correct_answers, stats.wrong_answers);

  profileName.textContent = profileResult.data?.display_name || "Vocamira Learner";
  profileEmail.textContent = user.email || "";

  setStat("games-played", Number(stats.games_played || 0));
  setStat("total-questions", Number(stats.total_questions || 0));
  setStat("overall-accuracy", `${overallAccuracy}%`);
  setStat("words-practised", progressRows.length);

  setStat("learned-words", progressRows.filter((row) => row.status === "learned").length);
  setStat("learning-words", progressRows.filter((row) => row.status === "learning").length);
  setStat("difficult-words", progressRows.filter((row) => row.status === "difficult").length);

  setModePerformance("definition", stats.definition_correct, stats.definition_wrong);
  setModePerformance("fill-blank", stats.fill_blank_correct, stats.fill_blank_wrong);
  renderReviewWords(progressRows, vocabularyMap);

  profileStatus.hidden = true;
  profileContent.hidden = false;
}

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = "Signing out...";

  await window.supabaseClient.auth.signOut();
  window.location.replace("login.html");
});

loadProfile();