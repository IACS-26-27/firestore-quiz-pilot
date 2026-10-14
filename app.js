import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const quizId = "quiz-1";

const signInButton = document.querySelector("#sign-in");
const quizSection = document.querySelector("#quiz");
const resultsSection = document.querySelector("#results");

signInButton.addEventListener("click", async () => {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  const user = result.user;
  signInButton.hidden = true;
  console.log("Signed in as", user.email);

  // Step 1: get the quiz
  const quizRef = doc(db, "quizzes", quizId);
  const quizSnapshot = await getDoc(quizRef);
  const quiz = quizSnapshot.data();
  console.log(quiz);

  // Step 2: show the questions
  for (const question of quiz.questions) {
    quizSection.innerHTML += `
      <label>
        ${question.text}
        <input type="text">
      </label>
    `;
  }
  quizSection.innerHTML += `<button id="submit">Submit</button>`;

  // Step 3: save your answers
  const submitButton = document.querySelector("#submit");
  submitButton.addEventListener("click", async () => {
    const answers = [];
    for (const input of quizSection.querySelectorAll("input")) {
      answers.push(input.value);
    }

    const myResponseRef = doc(db, "quizzes", quizId, "responses", user.uid);
    await setDoc(myResponseRef, { answers: answers, name: user.displayName });
    console.log("Saved!");

    // Step 4: see everyone's answers
    const responsesRef = collection(db, "quizzes", quizId, "responses");
    const responsesSnapshot = await getDocs(responsesRef);

    resultsSection.innerHTML = "";
    for (const responseDoc of responsesSnapshot.docs) {
      const response = responseDoc.data();
      const row = document.createElement("p");
      row.textContent = `${response.name}: ${response.answers.join(", ")}`;
      resultsSection.appendChild(row);
    }
  });
});
