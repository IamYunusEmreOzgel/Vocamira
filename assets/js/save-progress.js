window.saveGameResults = async function saveGameResultsAtomically() {
  if (resultSaved || !window.supabaseClient) {
    return;
  }

  resultSaved = true;
  restartButton.disabled = true;
  changeSettingsButton.disabled = true;

  try {
    const {
      data: { user },
      error: userError
    } = await window.supabaseClient.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      saveStatus.textContent = "You played as a guest. Sign in before your next game to save statistics.";
      return;
    }

    saveStatus.textContent = "Saving your progress...";

    const payload = questionResults.map((result) => ({
      wordId: Number(result.wordId),
      mode: result.mode,
      isCorrect: Boolean(result.isCorrect)
    }));

    const { data, error } = await window.supabaseClient.rpc("save_game_results", {
      p_results: payload
    });

    if (error) {
      throw error;
    }

    if (!data?.saved) {
      throw new Error("The database did not confirm the save operation.");
    }

    saveStatus.textContent = "Your statistics and word progress were saved.";
  } catch (error) {
    console.error("Game results could not be saved:", error);
    resultSaved = false;
    saveStatus.textContent = `Statistics could not be saved: ${error.message || "Unknown error"}`;
  } finally {
    restartButton.disabled = false;
    changeSettingsButton.disabled = false;
  }
};
