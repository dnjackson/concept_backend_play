---
timestamp: 'Sun Oct 12 2025 23:43:34 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_234334.d30cd05f.md]]'
content_id: ceaffe9a851af2a5a42f1aec3a5dfc50cc24c27b613ec46c156be3625737dcc6
---

# concept: LikertSurvey

* **concept**: LikertSurvey \[User]
* **purpose**: understand group sentiment on a set of topics by aggregating quantitative feedback
* **principle**: A user creates a survey containing several questions. Other users can then respond to these questions on a scale of 1 to 5. The survey owner can then analyze the aggregated responses for each question to understand overall sentiment, which might be positive, negative, mixed, or even bimodal.
* **state**:
  * a set of Surveys with a title (String) and an owner (User)
  * a set of Questions with a stem (String) and a survey (Survey)
  * a set of Responses with a responder (User), a question (Question), and a choice (Number from 1-5)
* **actions**:
  * `createSurvey (title: String, owner: User): (survey: Survey)`
  * `addQuestion (stem: String, survey: Survey): (question: Question)`
  * `removeQuestion (question: Question)`
  * `respondToQuestion (question: Question, responder: User, choice: Number)`
* **queries**:
  * `_getSurveyQuestions (survey: Survey): (question: Question)`
  * `_getSurveyTitle (survey: Survey): (title: String)`
  * `_getSurveyOwner (survey: Survey): (owner: User)`
  * `_getQuestionStem (question: Question): (stem: String)`
  * `_getQuestionResponseCounts (question: Question): (counts: Number[])`
  * `_analyzeSentiment (question: Question): (sentiment: String)`
  * `_getUserSurveys (user: User): (survey: Survey)`
