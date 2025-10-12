---
timestamp: 'Sun Oct 12 2025 13:51:25 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_135125.96ee1190.md]]'
content_id: 84261dd26290c67522c600fa327f5b9770fda35d81d88e8e547a9fdbb2d6ff58
---

# API Specification: LikertSurvey Concept

**Purpose:** understand group sentiment on a set of topics by aggregating quantitative feedback

***

## API Endpoints

### POST /api/LikertSurvey/createSurvey

**Description:** Creates a new survey with a title and an owner.

**Requirements:**

* `title` is non-empty

**Effects:**

* Creates a new `Survey` with the given title and owner and returns it.

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

**Description:** Adds a new question to an existing survey.

**Requirements:**

* `stem` is non-empty and `survey` exists

**Effects:**

* Creates a new `Question` with the given stem, associates it with the given survey, and returns it.

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

**Description:** Removes a question and all its associated responses from a survey.

**Requirements:**

* `question` exists

**Effects:**

* Removes the specified question and all `Response` entities associated with it.

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

**Description:** Submits or updates a user's response to a specific question.

**Requirements:**

* `question` exists
* `choice` is an integer between 1 and 5

**Effects:**

* Deletes any existing response to this question.
* Creates a new `Response` linking the responder, question, and choice.

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

**Description:** Retrieves all questions associated with a specific survey.

**Requirements:**

* The given `survey` exists.

**Effects:**

* Returns the set of all `Question` entities whose `survey` field matches the input `survey`.

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
    "questions": "array of Question"
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

**Description:** Gets the response counts for each choice (1-5) for a given question.

**Requirements:**

* `question` exists

**Effects:**

* Returns a map where each key is a choice value (e.g., 1-5) and its value is the count of Responses for this question with that choice.

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

**Description:** Analyzes the responses for a question to determine the overall sentiment.

**Requirements:**

* None specified.

**Effects:**

* This query analyzes all responses for a given `question` and returns a string indicating the overall sentiment ("positive", "negative", "bimodal", "mixed", or "neutral").

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

### POST /api/LikertSurvey/\_getQuestionResponseCounts

**Description:** Returns an array of response counts for a question, indexed by choice.

**Requirements:**

* The given `question` exists.

**Effects:**

* Returns an array of counts of responses by choice number (that is, the nth element is the number of responses with choice n+1).

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
    "counts": "array of Number"
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

### POST /api/LikertSurvey/\_getUserSurveys

**Description:** Retrieves all surveys owned by a specific user.

**Requirements:**

* The given `user` exists.

**Effects:**

* Returns the set of all `Survey` entities where the `owner` field matches the input `user`.

**Request Body:**

```json
{
  "user": "User"
}
```

**Success Response Body (Query):**

```json
[
  {
    "surveys": "array of Survey"
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
