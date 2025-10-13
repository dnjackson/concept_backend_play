---
timestamp: 'Sun Oct 12 2025 22:10:00 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_221000.4cea602f.md]]'
content_id: f4ae7b37142c722a01c8f709de0257cb244cf6cebe758e85609dffd893f961db
---

# concept: LikertSurvey

* **concept**: LikertSurvey \[User, Survey, Question, Response]
* **purpose**: understand group sentiment on a set of topics by aggregating quantitative feedback
* **principle**: a user creates a survey and adds questions to it; other users respond to these questions with a quantitative score; the survey owner can then view the aggregated results and analyze the sentiment for each question to understand the group's opinion.
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
    * a choice Number (from 1 to 5)
* **actions**:
  * `createSurvey (title: String, owner: User): (survey: Survey)`
  * `addQuestion (stem: String, survey: Survey): (question: Question)`
  * `removeQuestion (question: Question)`
  * `respondToQuestion (question: Question, responder: User, choice: Number)`
* **queries**:
  * `_getSurveyQuestions (survey: Survey): (questions: array of Question)`
  * `_getQuestionResults (question: Question): (results: map of Number to Number)`
  * `_analyzeSentiment (question: Question): (sentiment: String)`
  * `_getQuestionResponseCounts (question: Question): (counts: array of Number)`
  * `_getUserSurveys (user: User): (surveys: array of Survey)`
