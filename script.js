// =============================================
// CONFIGURATION
// =============================================
const API_URL = "https://script.google.com/macros/s/AKfycby1vOmeyN4AC4KJoZUTk7Qyvyc0ReL1_SOO18vmcmsiqXWNAz5XehCUYp3JFUOHl8JWsA/exec"; 
// ↑ Replace this with your own deployed Google Apps Script URL ending in /exec

let questions = [];
let currentQuestion = 0;
let userAnswers = [];
let name = "";
let email = "";

// =============================================
// PAGE ELEMENTS
// =============================================
const userSection = document.getElementById("user-section");
const instructionsSection = document.getElementById("instructions-section");
const quizSection = document.getElementById("quiz-section");
const resultSection = document.getElementById("result-section");

const questionNumberEl = document.getElementById("question-number");
const questionTextEl = document.getElementById("question-text");
const optionsContainer = document.getElementById("options");
const scoreEl = document.getElementById("score");

// =============================================
// STEP 1: USER ENTERS DETAILS
// =============================================
document.getElementById("startBtn").addEventListener("click", async () => {
  name = document.getElementById("name").value.trim();
  email = document.getElementById("email").value.trim();

  if (!name || !email) {
    alert("Please enter your name and email.");
    return;
  }

  userSection.classList.add("hidden");
  instructionsSection.classList.remove("hidden");
});

document.getElementById("backBtn").addEventListener("click", () => {
  instructionsSection.classList.add("hidden");
  userSection.classList.remove("hidden");
});

// =============================================
// STEP 2: LOAD QUESTIONS
// =============================================
document.getElementById("beginQuizBtn").addEventListener("click", async () => {
  instructionsSection.classList.add("hidden");
  quizSection.classList.remove("hidden");

  try {
    const res = await fetch(`${API_URL}?action=getQuestions`);
    if (!res.ok) throw new Error("Network response was not ok");

    questions = await res.json();
    if (!questions || questions.length === 0) {
      alert("No questions found. Please check the Google Sheet.");
      return;
    }

    currentQuestion = 0;
    userAnswers = Array(questions.length).fill([]);
    showQuestion();
  } catch (err) {
    console.error("Error loading questions:", err);
    alert("Could not connect to server. Please try again later.");
  }
});

// =============================================
// STEP 3: DISPLAY QUESTIONS
// =============================================
function showQuestion() {
  const q = questions[currentQuestion];
  questionNumberEl.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
  questionTextEl.textContent = q.question;
  optionsContainer.innerHTML = "";

  q.options.forEach((opt, i) => {
    if (!opt) return;
    const label = document.createElement("label");
    label.className = "option-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "option";
    checkbox.value = String.fromCharCode(65 + i);
    checkbox.checked = userAnswers[currentQuestion].includes(checkbox.value);

    checkbox.addEventListener("change", () => {
      const selected = Array.from(
        optionsContainer.querySelectorAll("input[name='option']:checked")
      ).map(cb => cb.value);
      userAnswers[currentQuestion] = selected;
    });

    label.appendChild(checkbox);
    label.append(` ${checkbox.value}. ${opt}`);
    optionsContainer.appendChild(label);
  });

  document.getElementById("nextBtn").textContent =
    currentQuestion === questions.length - 1 ? "Finish" : "Next";
}

// =============================================
// STEP 4: NEXT / FINISH BUTTON
// =============================================
document.getElementById("nextBtn").addEventListener("click", () => {
  const q = questions[currentQuestion];
  const selected = userAnswers[currentQuestion];
  if (!selected || selected.length === 0) {
    alert("Please select at least one option.");
    return;
  }

  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    showQuestion();
  } else {
    finishQuiz();
  }
});

// =============================================
// STEP 5: CALCULATE SCORE & SHOW RESULT
// =============================================
function finishQuiz() {
  quizSection.classList.add("hidden");
  resultSection.classList.remove("hidden");

  let score = 0;
  questions.forEach((q, i) => {
    const userAns = userAnswers[i];
    const correctAns = q.correct;

    const allCorrect = correctAns.every(a => userAns.includes(a));
    const noExtra = userAns.every(a => correctAns.includes(a));
    if (allCorrect && noExtra) score++;
  });

  scoreEl.textContent = `${score} / ${questions.length}`;
  saveResults(name, email, score, questions.length, userAnswers, questions.map(q => q.correct));
}

// =============================================
// STEP 6: SAVE RESULTS TO GOOGLE SHEET
// =============================================
async function saveResults(name, email, score, total, answers, correctAnswers) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveResult",
        name,
        email,
        score,
        total,
        answers,
        correctAnswers,
      }),
    });

    const data = await res.json();
    if (data.status === "success") {
      console.log("Results saved successfully");
    } else {
      console.error("Server returned error:", data.message);
      alert("Error saving your results. Try again later.");
    }
  } catch (err) {
    console.error("Error saving results:", err);
    alert("Could not save your results. Please try again later.");
  }
}

// =============================================
// STEP 7: RESTART QUIZ
// =============================================
document.getElementById("restartBtn").addEventListener("click", () => {
  resultSection.classList.add("hidden");
  userSection.classList.remove("hidden");
  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
});
