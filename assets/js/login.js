const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-button");
const loginMessage = document.getElementById("login-message");

async function redirectAuthenticatedUser() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (!error && data.session) {
    window.location.replace("profile.html");
  }
}

function showLoginMessage(message, type = "error") {
  loginMessage.textContent = message;
  loginMessage.className = `auth-message ${type}`;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";
  showLoginMessage("");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showLoginMessage("Email or password is incorrect.");
    loginButton.disabled = false;
    loginButton.textContent = "Sign In";
    return;
  }

  showLoginMessage("Login successful. Redirecting...", "success");
  window.location.replace("profile.html");
});

redirectAuthenticatedUser();
