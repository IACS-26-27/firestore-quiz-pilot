import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
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
// Collection: quizzes, Document ID: harry-or-ron
const QUIZ_ID = "harry-or-ron";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const statusEl = document.getElementById("status");
const quizEl = document.getElementById("quiz");
const resultsEl = document.getElementById("results");

let currentUser = null;
let quizData = null;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user) return;
  statusEl.textContent = "Signed in. Loading quiz...";
  await loadQuiz();
  await checkExistingResponse();
});

signInAnonymously(auth).catch((err) => {
  statusEl.textContent = "Sign-in failed: " + err.message;
  console.error(err);
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
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = question.text;
    fieldset.appendChild(legend);

    question.options.forEach((option, oIndex) => {
      const label = document.createElement("label");
      label.className = "option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${qIndex}`;
      input.value = oIndex;
      input.required = true;

      label.appendChild(input);
      label.append(" " + option.text);
      fieldset.appendChild(label);
    });

    form.appendChild(fieldset);
  });

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "See my result";
  form.appendChild(submit);

  form.addEventListener("submit", handleSubmit);
  quizEl.appendChild(form);
}

async function checkExistingResponse() {
  const responseRef = doc(db, "quizzes", QUIZ_ID, "responses", currentUser.uid);
  const snap = await getDoc(responseRef);
  if (snap.exists()) {
    showYourResult(snap.data().result);
  }
  watchAggregateResults();
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;

  const tally = {};
  const answers = quizData.questions.map((question, qIndex) => {
    const picked = form.querySelector(`input[name="q${qIndex}"]:checked`);
    const optionIndex = Number(picked.value);
    const category = question.options[optionIndex].category;
    tally[category] = (tally[category] || 0) + 1;
    return optionIndex;
  });

  // Whichever category got picked the most times wins. (Ties just go to
  // whichever category appears first -- good enough for a hello-world.)
  const result = Object.keys(tally).reduce((best, category) =>
    tally[category] > (tally[best] || 0) ? category : best,
  );

  const responseRef = doc(db, "quizzes", QUIZ_ID, "responses", currentUser.uid);
  try {
    await setDoc(responseRef, {
      answers,
      result,
      submittedAt: serverTimestamp(),
    });
    showYourResult(result);
  } catch (err) {
    statusEl.textContent = "Couldn't save your response: " + err.message;
    console.error(err);
  }
}

function showYourResult(result) {
  const h3 = document.createElement("h3");
  h3.id = "your-result";
  h3.textContent = `Your result: ${result}`;
  const existing = document.getElementById("your-result");
  if (existing) {
    existing.replaceWith(h3);
  } else {
    quizEl.appendChild(h3);
  }
}

function watchAggregateResults() {
  const responsesRef = collection(db, "quizzes", QUIZ_ID, "responses");
  onSnapshot(responsesRef, (snapshot) => {
    const tally = {};
    snapshot.forEach((docSnap) => {
      const { result } = docSnap.data();
      tally[result] = (tally[result] || 0) + 1;
    });
    renderAggregate(tally, snapshot.size);
  });
}

function renderAggregate(tally, total) {
  resultsEl.innerHTML = "";

  const heading = document.createElement("h3");
  heading.textContent = `Everyone's results so far (${total} response${total === 1 ? "" : "s"})`;
  resultsEl.appendChild(heading);

  Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      const pct = total ? Math.round((count / total) * 100) : 0;

      const row = document.createElement("div");
      row.className = "bar-row";

      const label = document.createElement("span");
      label.textContent = `${category} (${pct}%)`;

      const bar = document.createElement("div");
      bar.className = "bar";
      const fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.width = pct + "%";
      bar.appendChild(fill);

      row.appendChild(label);
      row.appendChild(bar);
      resultsEl.appendChild(row);
    });
}
