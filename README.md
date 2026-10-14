# Get to Know the Class (starter)

A simple shared quiz: a handful of open-ended questions, everyone's answers
saved to a database, and a live table of every response so far. It's the
setup for a "guess whose answer is whose" game once everyone's taken it.

This is the "hello world" of document databases: one document holds
structured data (a title + a list of questions), and a whole collection of
small documents (one per person) holds the responses.

## Configured teacher pilot

This checkout is connected to **IACS Firestore Quiz Pilot**
(`iacs-firestore-quiz-pilot`) on the free Spark plan. The default Firestore
database is in `us-east1`, and `quizzes/quiz-1` contains the four questions
below. Google sign-in is enabled. The authorized domains include
`iacs-26-27.github.io`, `localhost`, and `127.0.0.1`.

- [Open the pilot](https://iacs-26-27.github.io/firestore-quiz-pilot/)
- [Open Firebase](https://console.firebase.google.com/project/iacs-firestore-quiz-pilot/overview)
- Deploy changes to the rules with `firebase deploy --only firestore:rules`.

Students creating their own projects should replace `firebase-config.js`
with their own web app config, update `.firebaserc` to their project ID,
and authorize their own GitHub Pages domain in Authentication settings.
The pilot's rules deliberately make quiz questions and submitted answers
publicly readable; sign-in is required to write your own response.

## Part 1: Build the quiz document (no code)

Before touching any JavaScript, you're going to create the actual data by
hand, in Firebase's own interface. This is the best way to see what a
"document" actually is.

### 1. Create your own Firebase project

- Go to [console.firebase.google.com](https://console.firebase.google.com)
  and create a new project. The free "Spark" plan is all you need -- no
  billing/credit card required.

### 2. Turn on Firestore

- Left sidebar -> **Build -> Firestore Database -> Create database**.
- Choose **production mode** (we'll paste in real rules in Part 3).
- Pick any location close to you.

### 3. Create the quiz document by hand

In the Firestore console:

1. Click **Start collection**. Collection ID: `quizzes`.
2. Document ID: `quiz-1` (don't use "auto-ID" -- our code looks for this
   exact name).
3. Add these fields, using **+ Add field**:

   | Field name | Type | Value |
   |---|---|---|
   | `title` | string | `Get to Know the Class` |
   | `questions` | array | *(see below)* |

4. For `questions`, choose type **array**, and add 4 items, each a **map**
   with one field, `text`:

   - `{ text: "What is your favorite color?" }`
   - `{ text: "What is your favorite number?" }`
   - `{ text: "Which is the best classroom at IACS?" }`
   - `{ text: "What day of the month were you born?" }`

   (Feel free to swap in your own questions -- the code just renders
   whatever is in this array. Keep them things people don't mind sharing.)

5. Click **Save**. You should have one document at `quizzes/quiz-1` with a
   `title` and 4 `questions`.

**Stuck or made a typo?** Click on any field in the console to edit it --
no need to start over.

## Part 2: Wire up the starter code

### 4. Turn on Google sign-in

- **Build -> Authentication -> Get started**.
- **Sign-in method** tab -> enable **Google**. You'll need to pick a support
  email (your own is fine) -- that's just a contact address Google shows
  on the consent screen, not a secret.
- We're using real sign-in (not anonymous) here, since the end goal is
  being able to tell whose answers are whose -- an anonymous session
  wouldn't let us do that later.

### 5. Paste in the security rules

- Firestore Database -> **Rules** tab.
- Replace the contents with everything in [`firestore.rules`](firestore.rules)
  in this repo, then **Publish**.
- Read the comments in that file. They explain exactly what each rule
  allows and why -- this is the actual security boundary for your data.

### 6. Get your web app config

- **Project settings** (gear icon) -> scroll to **Your apps** -> click the
  web icon (`</>`) -> register an app (any nickname, skip Hosting).
- Copy the `firebaseConfig` object.
- Paste it into [`firebase-config.js`](firebase-config.js), replacing the
  placeholder values.
- This file is **not a secret** -- it's fine to commit and push it. Your
  rules (step 5), not this file, are what protect your data.

### 7. Turn on GitHub Pages

- Repo **Settings -> Pages -> Build and deployment -> Source: GitHub
  Actions**.
- Push a commit and check the **Actions** tab -- the included workflow
  publishes your site automatically.

### 8. Take the quiz

- Open your published site, click **Sign in with Google**, answer the 4
  questions, and submit.
- You should see a confirmation message, plus a table below showing every
  response submitted so far (including yours).
- Have someone else take it too (or sign into a different Google account in
  another browser/incognito window) -- the table should update within a
  second or two.

## Part 3: Think about security

A few things to actually try, not just read:

1. **Try to edit someone else's response.** Open your browser's dev tools
   console on the published page and run:

   ```js
   // paste in the browser console while your page is open
   import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
     .then(({ getFirestore, doc, setDoc }) => {
       const db = getFirestore();
       return setDoc(doc(db, "quizzes", "quiz-1", "responses", "someone-elses-uid"), {
         answers: ["hacked", "hacked", "hacked", "hacked"],
       });
     })
     .catch(console.error);
   ```

   This should fail with a `permission-denied` error. That's the rule from
   `firestore.rules` doing its job: `request.auth.uid == uid` means you can
   only ever write the document whose ID matches your own account.

2. **Discuss: what does `allow read: if true` on `responses` actually
   expose?** Anyone can currently read every individual response, not just
   a summary -- which is exactly what we want for the "guess whose answer
   is whose" game, but it's worth noticing that's a deliberate choice, not
   a default. Would you design it differently for something more personal
   than a favorite color?

3. **Notice what the table does NOT show: who wrote what.** The response
   documents don't currently store a name, only answers -- which is exactly
   what makes a reveal-later game possible. (A fun follow-up project: how
   would you let the quiz-taker's own name get revealed only after they've
   submitted an answer themselves, not before?)

## How it works

- `firebase-config.js` -- your project's public identifier. Not secret.
- `firestore.rules` -- the deployed rules for the pilot. Changes aren't
  deployed automatically; run `firebase deploy --only firestore:rules`
  after editing them.
- `app.js` -- signs you in with Google, reads the quiz document, renders one
  text box per question, saves your answers as
  `quizzes/quiz-1/responses/{your-uid}`, and listens to the whole
  `responses` collection in real time to redraw the table of everyone's
  answers.
- `.github/workflows/pages.yml` -- the same GitHub Pages deploy you've used
  before. Nothing about it changes for this project.

## Things to try once it works

- Change the quiz questions in the console -- no code changes needed.
- Build the "reveal" step: show names next to answers, but only after
  class has had a chance to guess.
- Only show the table of responses *after* you've submitted your own
  answers (right now you can peek without playing).
- Add a 5th question and watch the table grow a column automatically.
