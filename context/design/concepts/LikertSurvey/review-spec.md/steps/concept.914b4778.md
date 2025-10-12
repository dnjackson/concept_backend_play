---
timestamp: 'Sat Oct 11 2025 21:43:52 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251011_214352.1743484e.md]]'
content_id: 914b4778aaa4a6225d778a82d33141660d36028a6ee35ba0d04bb333f805cc87
---

# concept: LikertSurvey

  **concept** LikertSurvey \[User]
  **purpose** collect quantitative Likert-style feedback from a group of users
  **principle** a user creates a survey, adds questions to it, and then multiple other users respond to the questions; then the user who created the survey can view the number of responses of each value
  **state**
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

  **actions**

createSurvey (title: String, owner: User): (survey: Survey)
**requires** title is non empty
**effects** creates new survey with given title and owner and returns it

addQuestion (stem: String, survey: Survey): (question: Question)
**requires** stem is non empty, survey exists
**effects** creates new question with given stem, adds to survey and returns it

removeQuestion (question: Question)
**requires** question exists
**effects** removes question from set of questions and from its survey

respondToQuestion (question: Question, responder: User, choice: Number)
**requires** question exists, choice is an integer between 1 and 5
**effects** creates new response with responder, question and choice

**queries**

\_displaySurvey (survey: Survey): (result: String)
**requires** survey exists
**effects** returns an string representation of the questions in the survey

\_displaySurveyResults (survey: Survey): (result: String)
**requires** survey exists
**effects** returns an string representation of the questions in the survey, and against each question the total of the number of responses for that question with each choice, in the form "strong disagree: A, disagree: B, neutral: C, agree: D, strongly agree: E" where the letters A through E represent the number of users voting 1 through 5 respectively

\_displaySummarizedQuestionResponses (question: Question): (Number \[])
**requires** survey exists
**effects** returns an string representation of the questions in the survey, and against each question the total of the number of responses for that question with each choice, in the form "strong disagree: A, disagree: B, neutral: C, agree: D, strongly agree: E" where the letters A through E represent the number of users voting 1 through 5 respectively

**notes**
state invariants

* each question in the question set belongs to exactly one survey
* response choices are integers between 1 and 5
  not invariants
* titles do not need to be unique across surveys
* stems do not need to be unique across questions
