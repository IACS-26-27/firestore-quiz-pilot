import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// The quiz document you hand-authored in the Firestore console.
// Collection: quizzes, Document ID: quiz-1
const QUIZ_ID = "quiz-1";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const statusEl = document.getElementById("status");
const signInBtn = document.getElementById("sign-in");
const quizEl = document.getElementById("quiz");
const resultsEl = document.getElementById("results");

let currentUser = null;
let quizData = null;

signInBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider).catch((err) => {
    statusEl.textContent = "Sign-in failed: " + err.message;
    console.error(err);
  });
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user) {
    signInBtn.hidden = false;
    statusEl.textContent = "Sign in to take the quiz.";
    quizEl.innerHTML = "";
    resultsEl.innerHTML = "";
    return;
  }
  signInBtn.hidden = true;
  statusEl.textContent = `Signed in as ${user.displayName || user.email}. Loading quiz...`;
  await loadQuiz();
  await checkExistingResponse();
});

async function loadQuiz() {
  const quizRef = doc(db, "quizzes", QUIZ_ID);
  const snap = await getDoc(quizRef);

  if (!snap.exists()) {
    statusEl.textContent =
      `No quiz found at quizzes/${QUIZ_ID}. Did you create the document ` +
      "in the Firestore console yet? See the README.";
    return;
  }

  quizData = snap.data();
  renderQuiz(quizData);
  statusEl.textContent = "";
}

function renderQuiz(quiz) {
  quizEl.innerHTML = "";

  const h2 = document.createElement("h2");
  h2.textContent = quiz.title || "Quiz";
  quizEl.appendChild(h2);

  const form = document.createElement("form");
  form.id = "quiz-form";

  quiz.questions.forEach((question, qIndex) => {
    const label = document.createElement("label");
    label.textContent = question.text;
    label.htmlFor = `q${qIndex}`;

    const input = document.createElement("input");
    input.type = "text";
    input.id = `q${qIndex}`;
    input.required = true;

    const wrapper = document.createElement("div");
    wrapper.className = "field";
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Submit my answers";
  form.appendChild(submit);

  form.addEventListener("submit", handleSubmit);
  quizEl.appendChild(form);
}

async function checkExistingResponse() {
  const responseRef = doc(db, "quizzes", QUIZ_ID, "responses", currentUser.uid);
  const snap = await getDoc(responseRef);
  if (snap.exists()) {
    fillInAnswers(snap.data().answers);
    showSubmitted();
  }
  watchAllResponses();
}

function fillInAnswers(answers) {
  answers.forEach((value, qIndex) => {
    const input = document.getElementById(`q${qIndex}`);
    if (input) input.value = value;
  });
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;

  const answers = quizData.questions.map((_, qIndex) => {
    return document.getElementById(`q${qIndex}`).value.trim();
  });

  const responseRef = doc(db, "quizzes", QUIZ_ID, "responses", currentUser.uid);
  try {
    await setDoc(responseRef, {
      answers,
      submittedAt: serverTimestamp(),
    });
    showSubmitted();
  } catch (err) {
    statusEl.textContent = "Couldn't save your answers: " + err.message;
    console.error(err);
  }
}

function showSubmitted() {
  const existing = document.getElementById("submitted-note");
  if (existing) return;
  const p = document.createElement("p");
  p.id = "submitted-note";
  p.textContent = "Your answers are saved. Submit again any time to update them.";
  quizEl.appendChild(p);
}

function watchAllResponses() {
  const responsesRef = collection(db, "quizzes", QUIZ_ID, "responses");
  onSnapshot(responsesRef, (snapshot) => {
    renderAllResponses(snapshot, quizData.questions);
  });
}

// Shows every response as-is (no names attached) -- this is the raw
// material for a "guess whose answer is whose" game. Revealing names is
// intentionally left as a follow-up, not automated here.
function renderAllResponses(snapshot, questions) {
  resultsEl.innerHTML = "";

  const heading = document.createElement("h3");
  heading.textContent = `${snapshot.size} response${snapshot.size === 1 ? "" : "s"} so far`;
  resultsEl.appendChild(heading);

  const table = document.createElement("table");

  const headRow = document.createElement("tr");
  questions.forEach((q) => {
    const th = document.createElement("th");
    th.textContent = q.text;
    headRow.appendChild(th);
  });
  table.appendChild(headRow);

  snapshot.forEach((docSnap) => {
    const { answers } = docSnap.data();
    const row = document.createElement("tr");
    answers.forEach((answer) => {
      const td = document.createElement("td");
      // textContent, not innerHTML -- never trust stored text as HTML.
      td.textContent = answer;
      row.appendChild(td);
    });
    table.appendChild(row);
  });

  resultsEl.appendChild(table);
}
