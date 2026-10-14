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
const db = getFirestore(app);
const auth = getAuth(app);

// Step 1: get the quiz
const quizRef = doc(db, "quizzes/quiz-1");
const quizSnapshot = await getDoc(quizRef);
const quiz = quizSnapshot.data();
console.log(quiz);

// Step 2: show the questions
const quizDiv = document.querySelector("#quiz");
for (const question of quiz.questions) {
  quizDiv.innerHTML += `
    <p>
      <label>
        ${question.text}
        <input type="text">
      </label>
    </p>
  `;
}
quizDiv.innerHTML += `<button id="submit">Submit</button>`;

// Step 3: sign in
const signInButton = document.querySelector("#sign-in");
signInButton.addEventListener("click", async () => {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  console.log("Signed in as", result.user.email);
  signInButton.hidden = true;
});

// Step 4: save your answers
const resultsDiv = document.querySelector("#results");
const submitButton = document.querySelector("#submit");
submitButton.addEventListener("click", async () => {
  const answers = [];
  for (const input of quizDiv.querySelectorAll("input")) {
    answers.push(input.value);
  }

  const user = auth.currentUser;
  const myResponseRef = doc(db, `quizzes/quiz-1/responses/${user.uid}`);
  await setDoc(myResponseRef, { answers: answers, name: user.displayName });
  console.log("Saved!");

  // Step 5: see everyone's answers
  const responsesRef = collection(db, "quizzes/quiz-1/responses");
  const responsesSnapshot = await getDocs(responsesRef);

  resultsDiv.innerHTML = "";
  for (const responseDoc of responsesSnapshot.docs) {
    const response = responseDoc.data();
    const row = document.createElement("p");
    row.textContent = `${response.name}: ${response.answers.join(", ")}`;
    resultsDiv.appendChild(row);
  }
});
