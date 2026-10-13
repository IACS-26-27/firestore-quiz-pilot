# Firestore Personality Quiz (starter)

A personality quiz ("Harry or Ron?") where the quiz itself lives as one
document in a database, every answer gets saved, and the page shows everyone's
aggregate results in real time.

This is the "hello world" of document databases: one document holds
structured data (a title + a list of questions), and a whole collection of
small documents (one per person) holds the responses.

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
2. Document ID: `harry-or-ron` (don't use "auto-ID" -- our code looks for
   this exact name).
3. Add these fields, one at a time, using **+ Add field**:

   | Field name | Type   | Value |
   |---|---|---|
   | `title` | string | `Harry or Ron?` |
   | `questions` | array | *(see below)* |

4. For the `questions` field, choose type **array**. Firestore will let you
   add items to the array one at a time -- for each item, choose type
   **map**, and build it like this:

   **Question 1**
   - `text` (string): `Pick a subject:`
   - `options` (array), each item a **map** with `text` + `category`:
     - `{ text: "Defense Against the Dark Arts", category: "harry" }`
     - `{ text: "Quidditch Strategy", category: "ron" }`

   **Question 2**
   - `text`: `Pick a trait:`
   - `options`:
     - `{ text: "Follows the rules, even when it's hard", category: "harry" }`
     - `{ text: "Fiercely loyal to your friends", category: "ron" }`

   **Question 3**
   - `text`: `Pick a snack:`
   - `options`:
     - `{ text: "Just one Chocolate Frog", category: "harry" }`
     - `{ text: "Chocolate Frogs, and seconds", category: "ron" }`

   **Question 4**
   - `text`: `Pick a flaw:`
   - `options`:
     - `{ text: "Reckless -- you run toward danger", category: "harry" }`
     - `{ text: "Insecure about living in someone's shadow", category: "ron" }`

   Yes, this is a little tedious by hand -- that's on purpose. By the time
   you're done clicking through 4 questions x 2 options x 2 fields each,
   you'll have a real feel for what "a document contains fields, which can
   contain arrays, which can contain more documents (maps), which can contain
   more fields" actually means. Nobody ever forgets this lesson once they've
   typed it by hand.

5. Click **Save**. You should have one document at `quizzes/harry-or-ron`
   with a `title` and 4 nested `questions`.

**Stuck or made a typo?** You can edit any field by clicking on it in the
console -- no need to start over.

## Part 2: Wire up the starter code

### 4. Turn on Anonymous sign-in

- **Build -> Authentication -> Get started**.
- **Sign-in method** tab -> enable **Anonymous**.
- We're using anonymous auth because this quiz doesn't need real identity --
  every visitor still gets a stable, unique ID, which is what lets us track
  "have you already answered this?" without anyone creating a password.

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
  publishes your site automatically. Nothing about this step changes from
  projects you've done before.

### 8. Take the quiz

- Open your published site.
- Answer all 4 questions and submit. You should see "Your result: harry" (or
  "ron"), plus a live tally below it.
- Open the same site in an incognito/private window (a fresh anonymous
  identity) and answer differently. Both windows should update their tallies
  within a second or two.

## Part 3: Think about security

A few things to actually try, not just read:

1. **Try to vote twice as the same person.** Reload the page and answer
   again -- notice your *own* result updates (the rule allows you to
   overwrite your own response), but you still only ever count once in the
   tally, because it's still the same document.
2. **Try to edit someone else's response.** Open your browser's dev tools
   console on the published page and run:

   ```js
   // paste in the browser console while your page is open
   import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
     .then(({ getFirestore, doc, setDoc }) => {
       const db = getFirestore();
       return setDoc(doc(db, "quizzes", "harry-or-ron", "responses", "someone-elses-uid"), {
         result: "harry",
       });
     })
     .catch(console.error);
   ```

   This should fail with a `permission-denied` error. That's the rule from
   `firestore.rules` doing its job: `request.auth.uid == uid` means you can
   only ever write the document whose ID matches your own account.

3. **Discuss: why does this design avoid the "shared counter" problem?**
   Imagine instead we'd stored running totals directly on the quiz document,
   like `harryCount: 12, ronCount: 9`, and had every submission increment
   them. Two problems come up:
   - If two people submit at the exact same moment, both might read
     `harryCount: 12` and both write back `13` -- one vote silently
     vanishes. (Firestore's `increment()` operation actually fixes *this*
     specific problem without needing a server.)
   - But even with `increment()`, nothing stops a savvy visitor from calling
     `setDoc` directly and setting `harryCount` to `999999`. Firestore's
     security rules are fundamentally per-document and per-field, not
     "only this operation (+1) is allowed" -- you'd have to hand-write much
     more complicated rules to prevent that, or trust a server you control.

   Our design sidesteps both problems: there is no shared mutable number
   anywhere. Every response is its own small, individually-owned document,
   and the tally is just "count up the documents" -- read-only math, done
   fresh every time, with nothing to race or spoof.

4. **Discuss: what does `allow read: if true` on `responses` actually
   expose?** Anyone can currently read every individual response document,
   not just the aggregate percentages -- meaning someone could see exactly
   how every single (anonymous) uid answered each question. For this quiz
   that's low-stakes, since the IDs are random anonymous strings with no
   name attached. Would you design it differently for something more
   sensitive?

## How it works

- `firebase-config.js` -- your project's public identifier. Not secret.
- `firestore.rules` -- a copy, for reference, of the rules you pasted into
  the console. (This file isn't deployed automatically -- if you change your
  rules, update both places.)
- `app.js` -- signs you in anonymously, reads the quiz document, renders it
  as a form, saves your answer as `quizzes/harry-or-ron/responses/{your-uid}`,
  and listens to the whole `responses` collection in real time to compute
  and redraw the aggregate bars.
- `.github/workflows/pages.yml` -- the same GitHub Pages deploy you've used
  before. Nothing about it changes for this project.

## Things to try once it works

- Change the quiz questions/categories in the console -- no code changes
  needed, since `app.js` just renders whatever is in the document.
- Add a third category (e.g. "hermione") and a third option per question.
- Show *when* someone answered, using the `submittedAt` timestamp.
- Make a totally different quiz (math speed-quiz, trivia, whatever) by
  changing only the data, not the code -- that's the whole point of
  separating "data" from "display logic."
- (Harder) Think through: what would it take to let *students* author their
  own quiz through a form, instead of you typing it into the console? What
  new security question does that raise (who's allowed to create a quiz at
  all)?
