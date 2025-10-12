---
timestamp: 'Sat Oct 11 2025 21:47:42 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251011_214742.eec61c1f.md]]'
content_id: 1b611adabe18755f40b5d4be22a3fbf2f8e5862fb0f636e221ca13d6fbe72729
---

# response:

Excellent. This is a very clear and well-structured concept specification. You've correctly applied the provided structure to define the `LikertSurvey` concept. My feedback will focus on identifying potential errors, ambiguities, and areas for improvement based on the principles outlined in your guide.

### Overall Assessment

This is a strong first draft. The purpose, principle, and high-level actions capture the essence of a Likert survey system. The main areas for improvement are in refining the state model for clarity and robustness, making the actions more precise, and improving the design of the queries.

***

### Detailed Review and Suggestions

#### **Purpose**

> **purpose** collect quantitative Likert-style feedback from a group of users

This is good, but it could be improved by focusing more on the *need* being fulfilled, as suggested by the guide's criteria. "Collecting feedback" is an activity. *Why* do we collect it?

* **Critique:** It's more need-focused to state what the collected feedback *enables*.
* **Suggestion:** A stronger purpose would be:
  > **purpose** understand group sentiment on a set of topics by aggregating quantitative feedback

This is more evaluable (does the concept let me understand sentiment?) and focused on the user's end goal, not just the mechanism.

#### **Principle**

> **principle** a user creates a survey, adds questions to it, and then multiple other users respond to the questions; then the user who created the survey can view the number of responses of each value

This is a good, archetypal scenario. It correctly demonstrates how the purpose is fulfilled.

* **Critique:** The phrasing is slightly narrative. The guide suggests the "if... then..." form can be more compelling.
* **Suggestion (minor):** Rephrasing it slightly could make it more direct:
  > **principle** if an owner creates a survey with several questions and shares it, and multiple users respond to the questions, then the owner can view an aggregated summary of the responses for each question.

#### **State**

This is the section with the most significant opportunities for improvement.

```
a set of Surveys with
	a title String
	an owner User
	a questions set of Questions

a set of Questions with
	a stem String
	an owner User

a set of Responses with
	a responder User
	a question Question
	a choice Number
```

* **Error 1: Redundant `owner` on `Question`**. The `Question` has an `owner`. This is likely redundant, as the question's ownership is implicitly determined by the survey it belongs to. This adds complexity and a potential for inconsistency (what if a question's owner is different from its survey's owner?).
  * **Suggestion:** A better model is to make the relationship between a question and its survey explicit. This also directly enforces the invariant you listed in the notes ("each question... belongs to exactly one survey").

* **Error 2: Ambiguity in `Responses`**. The current state allows a single `User` to submit multiple `Response`s to the same `Question`. When you calculate the results, would you count all of them, or only the latest one? The current actions and queries don't specify. This is a critical ambiguity. Most survey systems enforce one response per user per question.
  * **Suggestion:** The concept should decide on a policy. The simplest policy is that a user can only respond once. This should be enforced in the `respondToQuestion` action.

* **Suggested State Rewrite:**

  ```
  a set of Surveys with
      a title String
      an owner User
      -- Note: The set of questions is now defined via the back-link from Question

  a set of Questions with
      a stem String
      a survey Survey -- Explicitly links a question to its one and only survey

  a set of Responses with
      a responder User
      a question Question
      a choice Number
  ```

  This model is cleaner. To get the questions for a survey, you query the set of all `Questions` where the `survey` field matches the desired survey.

#### **Actions**

* `addQuestion`: The signature is `(stem: String, survey: Survey)`. This is good and aligns with the suggested state change.

* `removeQuestion`:
  * **Critique:** The effect `removes question from set of questions and from its survey` is incomplete. What happens to the `Response`s associated with that question? They are now orphaned, pointing to a non-existent question. This violates data integrity.
  * **Suggestion:** The effect should specify a cascading delete.
    > **effects** removes the question and all responses associated with it.

* `respondToQuestion`:

  * **Critique:** As noted in the State section, this action has a critical ambiguity. It allows a user to respond multiple times.
  * **Suggestion:** Add a precondition to enforce the "respond once" policy.
    > **requires** question exists, choice is an integer between 1 and 5, and **there is no existing Response where responder is the same as the input responder and question is the same as the input question**
    > **effects** creates a new Response linking the responder, question, and choice

  Alternatively, if you want to allow users to *change* their answer, the action's logic would be different:

  > **effects** if a Response from this responder to this question already exists, update its choice; otherwise, create a new Response.

  The first option (respond once) is simpler and often sufficient.

#### **Queries**

* **Critique 1: Presentational Return Types**. The queries `_displaySurvey` and `_displaySurveyResults` return a `String`. This conflates the logic of data retrieval with the logic of presentation. A concept should ideally return structured data, leaving the formatting to the UI layer.

* **Critique 2: Copy-Paste Errors**. `_displaySummarizedQuestionResponses` has a `requires` clause that refers to `survey` but takes `question` as an argument. Its `effects` description is also an exact copy of the previous query's effects. This is clearly an error.

* **Suggested Query Rewrite:**

  **queries**

  \_getSurveyQuestions (survey: Survey): (questions: set of Question)
  **requires** survey exists
  **effects** returns the set of all Questions that belong to the given survey

  \_getQuestionResults (question: Question): (results: map of Number to Number)
  **requires** question exists
  **effects** returns a map where each key is a choice value (1-5) and its corresponding value is the count of how many Responses for this question have that choice.
  *Example result: `{1: 10, 2: 15, 3: 30, 4: 20, 5: 5}`*

These revised queries are more reusable and adhere better to the principle of separation of concerns. The UI can call `_getQuestionResults` for each question in a survey and then format the string "strong disagree: 10, disagree: 15, ..." as needed.

***

### Revised Concept Specification

Here is a complete, revised version of the concept incorporating all the suggestions above.

**concept** LikertSurvey \[User]

**purpose** understand group sentiment on a set of topics by aggregating quantitative feedback

**principle** if an owner creates a survey with several questions and shares it, and multiple users respond to the questions, then the owner can view an aggregated summary of the responses for each question.

**state**

```
a set of Surveys with
    a title String
    an owner User

a set of Questions with
    a stem String
    a survey Survey  -- Links a question to its parent survey

a set of Responses with
    a responder User
    a question Question
    a choice Number
```

**actions**

createSurvey (title: String, owner: User): (survey: Survey)
**requires** title is non-empty
**effects** creates a new `Survey` with the given title and owner and returns it

addQuestion (stem: String, survey: Survey): (question: Question)
**requires** stem is non-empty and survey exists
**effects** creates a new `Question` with the given stem, associates it with the given survey, and returns it

removeQuestion (question: Question)
**requires** question exists
**effects** removes the specified question and all `Response` entities associated with it

respondToQuestion (question: Question, responder: User, choice: Number)
**requires**

* question exists
* choice is an integer between 1 and 5
* no `Response` exists for this `responder` and `question`
  **effects** creates a new `Response` linking the responder, question, and choice

**queries**

\_getSurveyQuestions (survey: Survey): (questions: set of Question)
**requires** survey exists
**effects** returns the set of all Questions where `Question.survey` is the given survey

\_getQuestionResults (question: Question): (results: map of Number to Number)
**requires** question exists
**effects** returns a map where each key is a choice value (e.g., 1-5) and its value is the count of Responses for this question with that choice
