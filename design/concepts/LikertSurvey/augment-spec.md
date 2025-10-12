[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@concept-state](../../background/detailed/concept-state.md)

Please read this concept spec and write specs for two new queries: one that given a survey returns all the questions, and one that given a question returns the count of responses with each number:

[@LikertSurvey](LikertSurvey.md)
# response:

Of course. Based on the provided documentation and the existing `LikertSurvey` concept, here are the specifications for the two requested queries.

***

**queries**

\_getSurveyQuestions (survey: Survey): (questions: set of Question)
**requires** the given survey exists
**effects** returns the set of all `Question` entities whose `survey` field matches the input `survey`

\_getQuestionResponseCounts (question: Question): (counts: map of Number to Number)
**requires** the given question exists
**effects** returns a map where each key is a choice number (from 1 to 5) and its associated value is the total number of `Response` entities for that question with that choice number


# augment again:

please write me a spec of another query that given a user returns their surveys.

# response:

Of course. Here is the specification for the new query, designed to fit with the existing `LikertSurvey` concept.

***

**queries**

\_getSurveyQuestions (survey: Survey): (questions: set of Question)
**requires** the given survey exists
**effects** returns the set of all `Question` entities whose `survey` field matches the input `survey`

\_getQuestionResponseCounts (question: Question): (counts: map of Number to Number)
**requires** the given question exists
**effects** returns a map where each key is a choice number (from 1 to 5) and its associated value is the total number of `Response` entities for that question with that choice number

\_getUserSurveys (user: User): (surveys: set of Survey)
**requires** the given user exists
**effects** returns the set of all `Survey` entities where the `owner` field matches the input `user`