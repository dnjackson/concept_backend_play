---
timestamp: 'Sat Oct 11 2025 22:15:23 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251011_221523.e2a5ed59.md]]'
content_id: ae814905b84ef82c01b602bb3dd2b9828de2e4da0bb916412ca583006b8ae685
---

# trace:

The principle for the `LikertSurvey` concept is: *If an author creates a survey with several questions on a 1-5 scale, and a respondent submits their answers to those questions, then the author can view the collected responses to analyze the respondent's opinions.*

The test named `LikertSurvey Concept: Principle` simulates this exact scenario with the following trace:

1. **Action**: `createSurvey({ author: "author:A", title: "Product Feedback", scaleMin: 1, scaleMax: 7 })`
   * **Description**: An author, identified as `author:A`, creates a new survey.
   * **Effect**: A new `Survey` document is created in the database. The test captures its unique ID.

2. **Action**: `addQuestion({ survey: <survey_id>, text: "How easy was the setup process?" })`
   * **Description**: The author adds the first question to their newly created survey.
   * **Effect**: A new `Question` document is created, linked to the `survey_id`.

3. **Action**: `addQuestion({ survey: <survey_id>, text: "How likely are you to purchase again?" })`
   * **Description**: The author adds a second question.
   * **Effect**: Another `Question` document is created, also linked to the `survey_id`.

4. **Action**: `submitResponse({ respondent: "respondent:X", question: <q1_id>, value: 6 })`
   * **Description**: A respondent, `respondent:X`, answers the first question with a score of 6.
   * **Effect**: A new `Response` document is created, linking the respondent to their answer for the first question.

5. **Action**: `submitResponse({ respondent: "respondent:X", question: <q2_id>, value: 7 })`
   * **Description**: The same respondent answers the second question with a score of 7.
   * **Effect**: Another `Response` document is created for the second question.

6. **Query**: `_getSurveyResponses({ survey: <survey_id> })`
   * **Description**: The author requests all responses associated with their survey.
   * **Effect**: The query finds all questions for the survey, then finds all responses linked to those questions. It returns an array containing the two `Response` documents submitted by `respondent:X`.

7. **Verification**: The test asserts that the returned responses match the data submitted by the respondent in steps 4 and 5. This confirms that the author can indeed view the collected responses, thus fulfilling the concept's principle.
