# Get to Know the Class: model implementation

This is the finished version of
[firestore-quiz-starter](https://github.com/IACS-26-27/firestore-quiz-starter).
`app.js` here is exactly what a student ends up with after Steps 1–4 of that
repo's instructions, plus a little styling.

- [Open the live demo](https://iacs-26-27.github.io/firestore-quiz-pilot/)
- [Open Firebase](https://console.firebase.google.com/project/iacs-firestore-quiz-pilot/overview)

## The shared project

Both repos point at **IACS Firestore Quiz Pilot** (`iacs-firestore-quiz-pilot`)
on the free Spark plan. The default Firestore database is in `us-east1`.
Google sign-in is enabled. The authorized domains include
`iacs-26-27.github.io`, `localhost`, and `127.0.0.1`.

`firebase-config.js` is committed on purpose. It identifies the project but
grants no access; the rules do that.

## Data

```
quizzes/quiz-1                    { title, questions: [{ text }, ...] }
quizzes/quiz-1/responses/{uid}    { answers: [...], name }
```

quiz-1 was written by hand in the Firebase console, which bypasses the
rules. Students can also create their own quizzes from the client (see
Rules); Step 5's extensions ask them to. They switch quizzes by changing
`quizId` in `app.js`.

## Rules

[`firestore.rules`](firestore.rules), in short:

- Anyone can read quizzes and responses.
- All writes need an `@innovationcharter.org` account.
- Anyone can create a quiz with `author: <their uid>`. Only the author can
  change or delete it. Quizzes with no `author` (like quiz-1, made in the
  console) can't be changed from the client. Quiz shape isn't enforced.
- Only the owner can write or delete `responses/{uid}`. A response needs
  `name` (a string) and `answers` (a list); other fields are allowed.

To deploy changes:

```bash
firebase deploy --only firestore:rules
```

Copy the file into the starter repo too, so the students' reference copy
stays in sync.

## Run locally

```bash
npm start
```

Sign-in uses a popup, so it needs a real click in a real browser.
