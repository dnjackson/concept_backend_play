---
timestamp: 'Sun Oct 12 2025 00:54:34 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_005434.e54787b1.md]]'
content_id: fae318af44dfbf47c559d41db815c70e67a55df4e73401f5e7ff57b3ccd3dd24
---

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
