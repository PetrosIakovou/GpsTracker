const userEmail = "user@gmail.com";
const userPassword = "1212";

function isValid(event) {
  event.preventDefault();

  // Get the input element
  const emailElement = document.getElementById("email-input");
  const passwordElement = document.getElementById("password-input");
  // Get the input value
  const loginEmail = emailElement.value;
  const loginPassword = passwordElement.value;
  // Print value to the console
  console.log("email:", loginEmail);
  console.log("password:", loginPassword);

  if (loginPassword == userPassword && loginEmail == userEmail) {
    //alert("Log in successfully");
    // Store login status in localStorage
    localStorage.setItem("isLoggedIn", "true");
    // Redirect to display.html
    window.location.assign("display.html");
  } else {
    alert("wrong email or password");
  }
  // Clear the input value
  loginEmail = "";
  loginPassword = "";
}
