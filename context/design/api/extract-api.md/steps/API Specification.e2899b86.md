---
timestamp: 'Sat Oct 11 2025 22:11:10 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251011_221110.50e015a4.md]]'
content_id: e2899b86b25d35cd611a0ade4daf35f49febd23f114629e553012211ce0b35a3
---

# API Specification: LikertSurvey Concept

**Purpose:** understand group sentiment on a set of topics by aggregating quantitative feedback

***

## API Endpoints

### POST /api/LikertSurvey/createSurvey

**Description:** Creates a new survey with a title and an owner.

**Requirements:**

* title is non-empty

**Effects:**

* creates a new `Survey` with the given title and owner and returns it

**Request Body:**

```json
{
  "title": "string",
  "owner": "User"
}
```

**Success Response Body (Action):**

```json
{
  "survey": "Survey"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/LikertSurvey/addQuestion

**Description:** Adds a new question with a given stem to an existing survey.

**Requirements:**

* stem is non-empty and survey exists

**Effects:**

* creates a new `Question` with the given stem, associates it with the given survey, and returns it

**Request Body:**

```json
{
  "stem": "string",
  "survey": "Survey"
}
```

**Success Response Body (Action):**

```json
{
  "question": "Question"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/LikertSurvey/removeQuestion

**Description:** Removes a specified question and all of its associated responses.

**Requirements:**

* question exists

**Effects:**

* removes the specified question and all `Response` entities associated with it

**Request Body:**

```json
{
  "question": "Question"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/LikertSurvey/respondToQuestion

**Description:** Records a user's choice for a specific question, overwriting any previous response.

**Requirements:**

* question exists
* choice is an integer between 1 and 5

**Effects:**

* delete any existing response to this question
* creates a new `Response` linking the responder, question, and choice

**Request Body:**

```json
{
  "question": "Question",
  "responder": "User",
  "choice": "Number"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/LikertSurvey/\_getSurveyQuestions

**Description:** Retrieves the set of all questions associated with a given survey.

**Requirements:**

* survey exists

**Effects:**

* returns the set of all Questions where `Question.survey` is the given survey

**Request Body:**

```json
{
  "survey": "Survey"
}
```

**Success Response Body (Query):**

```json
[
  {
    "questions": "set of Question"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/LikertSurvey/\_getQuestionResults

**Description:** Retrieves a summary of response counts for each possible choice on a question.

**Requirements:**

* question exists

**Effects:**

* returns a map where each key is a choice value (e.g., 1-5) and its value is the count of Responses for this question with that choice

**Request Body:**

```json
{
  "question": "Question"
}
```

**Success Response Body (Query):**

```json
[
  {
    "results": "map of Number to Number"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/LikertSurvey/\_analyzeSentiment

**Description:** Analyzes all responses for a question to determine the overall sentiment.

**Requirements:**

* (None specified in concept)

**Effects:**

* This query analyzes all responses for a given `question` and returns a string indicating the overall sentiment. The logic is as follows:
* 1. Collect the `score` from every `Response` where the `question` matches the input `question`.
* 2. If there are no responses, return "neutral".
* 3. Calculate the average and standard deviation of all collected scores.
* 4. Return a sentiment string based on these rules:
  * If the average score is greater than 3.5, return "positive".
  * If the average score is less than 2.5, return "negative".
  * If the standard deviation is greater than 1.5 (indicating a high degree of variance and polarization), return "bimodal".
  * Otherwise, return "mixed".

**Request Body:**

```json
{
  "question": "Question"
}
```

**Success Response Body (Query):**

```json
[
  {
    "sentiment": "string"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
