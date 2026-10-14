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
- Any `@innovationcharter.org` account can create a quiz with
  `author: <their uid>`, `title`, and a `questions` list (up to 20). Only
  the author can edit or delete it. Quizzes with no `author` (like quiz-1,
  made in the console) can't be changed from the client.
- A user can write only `responses/{their uid}`, only with an
  `@innovationcharter.org` account. The document may contain only `answers`
  (a list of up to 20 items), `name`, and `submittedAt`. If `name` is
  present, it must equal the name on the signed-in Google account.
- Nobody can delete a response.

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
