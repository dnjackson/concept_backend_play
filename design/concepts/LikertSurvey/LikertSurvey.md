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
**effects**
  * delete any existing response to this question
  * creates a new `Response` linking the responder, question, and choice

**queries**

\_getSurveyQuestions (survey: Survey): (questions: set of Question)
**requires** survey exists
**effects** returns the set of all Questions where `Question.survey` is the given survey

\_getQuestionResults (question: Question): (results: map of Number to Number)
**requires** question exists
**effects** returns a map where each key is a choice value (e.g., 1-5) and its value is the count of Responses for this question with that choice

\_analyzeSentiment (question: Question): (sentiment: String)
**effects**
This query analyzes all responses for a given `question` and returns a string indicating the overall sentiment. The logic is as follows:
1.  Collect the `score` from every `Response` where the `question` matches the input `question`.
2.  If there are no responses, return "neutral".
3.  Calculate the average and standard deviation of all collected scores.
4.  Return a sentiment string based on these rules:
    *   If the average score is greater than 3.5, return "positive".
    *   If the average score is less than 2.5, return "negative".
    *   If the standard deviation is greater than 1.5 (indicating a high degree of variance and polarization), return "bimodal".
    *   Otherwise, return "mixed".

\_getSurveyQuestions (survey: Survey): \[questions: Question\]
**requires** the given survey exists
**effects** returns an array of `Question` identities whose `survey` field matches the input `survey`

\_getQuestionResponseCounts (question: Question): \[counts: Number\[\]\]
**requires** the given question exists
**effects** returns an array of counts of responses by choice number (that is, the nth element is the number of responses with choice n+1)

\_getUserSurveys (user: User): \[surveys: Survey\]
**requires** the given user exists
**effects** returns an array of all `Survey` identities where the `owner` field matches the input `user`
