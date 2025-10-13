---
timestamp: 'Sun Oct 12 2025 22:52:30 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_225230.ad1749ca.md]]'
content_id: dfcfdaa591e3a5069d034663a6b7fc74a55a699012480f878af51f0002b38c96
---

# concept: LikertSurvey

* **concept**: LikertSurvey \[User]
* **purpose**: understand group sentiment on a set of topics by aggregating quantitative feedback
* **principle**: after a survey owner creates a survey and adds a question, multiple users can respond to that question with their choice on a 1-5 scale. Later, the owner (or any interested party) can query the results for that question to see an aggregate distribution of responses and an analysis of the overall sentiment.
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
    * a choice Number (integer from 1 to 5)
* **actions**:
  * `createSurvey (title: String, owner: User): (survey: Survey)`
  * `addQuestion (stem: String, survey: Survey): (question: Question)`
  * `removeQuestion (question: Question)`
  * `respondToQuestion (question: Question, responder: User, choice: Number)`
* **queries**:
  * `_getSurveyQuestions (survey: Survey): [questions: Question]`
  * `_getQuestionResults (question: Question): [{ results: map of Number to Number }]`
  * `_analyzeSentiment (question: Question): [{ sentiment: String }]`
  * `_getQuestionResponseCounts (question: Question): [{ counts: Number[] }]`
  * `_getUserSurveys (user: User): [surveys: Survey]`
