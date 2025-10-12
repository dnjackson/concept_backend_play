---
timestamp: 'Sat Oct 11 2025 23:57:42 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251011_235742.c7582ffd.md]]'
content_id: 681edf1a655446b2b3b0b0b6247d48adbe7bfb14b10e8ad9557372b4b24bd9ab
---

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
