---
timestamp: 'Sun Oct 12 2025 00:08:18 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_000818.07d4e4c6.md]]'
content_id: 6c527e6113c24c894fb2fdf61c11b860fac540d8b2dfacaa37a013df8396359a
---

# concept: LikertSurvey

* **concept**: LikertSurvey \[User]
* **purpose**: understand group sentiment on a set of topics by aggregating quantitative feedback
* **principle**: If an owner creates a survey and adds questions, and several users respond to these questions, then the owner can view the aggregated results for each question to understand the collective sentiment, distinguishing between positive, negative, mixed, or bimodal opinions.
* **state**:
  * a set of Surveys with
    * a title String
    * an owner User
  * a set of Questions with
    * a stem String
    * a survey Survey
  * a set of Responses with
    * a responder User
    * a question Question
    * a choice Number (1-5)
* **actions**:
  * `createSurvey (title: String, owner: User): (survey: Survey)`
  * `addQuestion (stem: String, survey: Survey): (question: Question)`
  * `removeQuestion (question: Question)`
  * `respondToQuestion (question: Question, responder: User, choice: Number)`
* **queries**:
  * `_getSurveyQuestions (survey: Survey): (questions: set of Question)`
  * `_getQuestionResults (question: Question): (results: map of Number to Number)`
  * `_analyzeSentiment (question: Question): (sentiment: String)`
  * `_getQuestionResponseCounts (question: Question): (counts: array of Number)`
