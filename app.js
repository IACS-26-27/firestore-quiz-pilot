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
const titleElement = document.querySelector("#quiz-title");
titleElement.innerHTML = quiz.title;

const questionsDiv = document.querySelector("#quiz-questions");
for (const q of quiz.questions) {
  questionsDiv.innerHTML += `
    <label>
      ${q.text}:
      <input type="text">
    </label>
  `;
}

// Step 3: sign in
let user;
const signInButton = document.querySelector("#sign-in");
signInButton.addEventListener("click", async () => {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  console.log("Signed in as", result.user.email);
  user = result.user;
  signInButton.hidden = true;
});

// Step 4: save your answers
const submitButton = document.querySelector("#quiz-submit");
submitButton.addEventListener("click", async () => {
  const answers = [];
  for (const input of document.querySelectorAll("#quiz-questions input")) {
    answers.push(input.value);
  }

  const myResponseRef = doc(db, `quizzes/quiz-1/responses/${user.uid}`);
  const myResponse = {
    name: user.displayName,
    answers: answers,
  };
  await setDoc(myResponseRef, myResponse);
  console.log("Saved!");

  // Step 5: see everyone's answers
  const responsesRef = collection(db, "quizzes/quiz-1/responses");
  const responsesSnapshot = await getDocs(responsesRef);

  const resultsDiv = document.querySelector("#results");
  resultsDiv.innerHTML = "";
  for (const responseDoc of responsesSnapshot.docs) {
    const response = responseDoc.data();
    const row = document.createElement("p");
    row.textContent = `${response.name}: ${response.answers.join(", ")}`;
    resultsDiv.appendChild(row);
  }
});
