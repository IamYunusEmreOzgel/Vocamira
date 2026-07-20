const profileContent = document.getElementById("profile-content");
const profileStatus = document.getElementById("profile-status");
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const logoutButton = document.getElementById("logout-button");

function setStat(id, value) {
  document.getElementById(id).textContent = value ?? 0;
}

async function loadProfile() {
  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.replace("login.html");
    return;
  }

  const [profileResult, statsResult] = await Promise.all([
    supabaseClient
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single(),
    supabaseClient
      .from("user_stats")
      .select("games_played, total_questions, correct_answers, wrong_answers, definition_correct, definition_wrong, fill_blank_correct, fill_blank_wrong")
      .eq("user_id", user.id)
      .single()
  ]);

  if (profileResult.error || statsResult.error) {
    profileStatus.textContent = "Your profile could not be loaded. Please refresh the page.";
    return;
  }

  profileName.textContent = profileResult.data.display_name || "Vocamira Learner";
  profileEmail.textContent = user.email;

  const stats = statsResult.data;
  setStat("games-played", stats.games_played);
  setStat("total-questions", stats.total_questions);
  setStat("correct-answers", stats.correct_answers);
  setStat("wrong-answers", stats.wrong_answers);
  setStat("definition-correct", stats.definition_correct);
  setStat("fill-blank-correct", stats.fill_blank_correct);

  profileStatus.hidden = true;
  profileContent.hidden = false;
}

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = "Signing out...";

  await supabaseClient.auth.signOut();
  window.location.replace("login.html");
});

loadProfile();
