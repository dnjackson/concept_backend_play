---
timestamp: 'Sun Oct 12 2025 00:08:18 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_000818.07d4e4c6.md]]'
content_id: fbb84baf8f4645588d6e544821b5a6dbaf4dec8b18572a3c53d0da4d14bc2406
---

# trace:

The principle for the `LikertSurvey` concept is: "If an owner creates a survey and adds questions, and several users respond to these questions, then the owner can view the aggregated results for each question to understand the collective sentiment, distinguishing between positive, negative, mixed, or bimodal opinions."

The test case `Principle: Full survey lifecycle` demonstrates this as follows:

1. **Action**: `createSurvey({ title: "Canteen Food Quality", owner: userAlice })`
   * **State Change**: A new `Survey` document is created, owned by `userAlice`.
   * **Trace Step**: The survey owner, Alice, initiates the process by creating the survey.

2. **Action**: `addQuestion({ stem: "How is the food taste?", survey: ... })` and `addQuestion({ stem: "How is the food variety?", survey: ... })`
   * **State Change**: Two `Question` documents are created and linked to the survey from step 1.
   * **Trace Step**: Alice populates her survey with topics for feedback.

3. **Action**: `respondToQuestion(...)` is called four times:
   * `{ question: q1, responder: userBob, choice: 4 }`
   * `{ question: q1, responder: userCharlie, choice: 5 }`
   * `{ question: q2, responder: userBob, choice: 1 }`
   * `{ question: q2, responder: userCharlie, choice: 5 }`
   * **State Change**: Four `Response` documents are created, linking the responders, questions, and their chosen scores.
   * **Trace Step**: Different users provide their feedback, creating the raw data for analysis. The responses are intentionally chosen to produce different sentiment outcomes for each question.

4. **Query**: `_getQuestionResults({ question: q1 })` and `_analyzeSentiment({ question: q1 })`
   * **Observation**: The query returns a count of `{ 4: 1, 5: 1 }` and a sentiment of `"positive"`.
   * **Trace Step**: Alice analyzes the first question. The aggregated results show high scores, and the concept correctly interprets this as a positive sentiment, fulfilling part of the purpose.

5. **Query**: `_getQuestionResults({ question: q2 })` and `_analyzeSentiment({ question: q2 })`
   * **Observation**: The query returns a count of `{ 1: 1, 5: 1 }` and a sentiment of `"bimodal"`.
   * **Trace Step**: Alice analyzes the second question. The aggregated results show polarized scores (one very low, one very high), and the concept correctly identifies this as a bimodal (or divisive) sentiment. This demonstrates the nuance required by the principle.

This sequence of actions and verified query results confirms that the concept successfully fulfills its purpose as described by the principle: it allows for the creation, response, and detailed analysis of survey data to understand group sentiment.
