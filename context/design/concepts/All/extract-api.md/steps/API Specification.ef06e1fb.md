---
timestamp: 'Sun Oct 12 2025 23:48:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_234836.a9236e1a.md]]'
content_id: ef06e1fb902929fceef41c34bf28d3c544987ce7e764e4a5dbeb450cedcf1f17
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
  "owner": "ID"
}
```

**Success Response Body (Action):**

```json
{
  "survey": "ID"
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

* stem is non-empty and survey exists

**Effects:**

* creates a new `Question` with the given stem, associates it with the given survey, and returns it

**Request Body:**

```json
{
  "stem": "string",
  "survey": "ID"
}
```

**Success Response Body (Action):**

```json
{
  "question": "ID"
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

**Description:** Deletes a question and all associated responses.

**Requirements:**

* question exists

**Effects:**

* removes the specified question and all `Response` entities associated with it

**Request Body:**

```json
{
  "question": "ID"
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

**Description:** Records a user's response to a specific question.

**Requirements:**

* question exists
* choice is an integer between 1 and 5

**Effects:**

* delete any existing response to this question
* creates a new `Response` linking the responder, question, and choice

**Request Body:**

```json
{
  "question": "ID",
  "responder": "ID",
  "choice": "number"
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

**Description:** Retrieves all questions associated with a given survey.

**Requirements:**

* survey exists

**Effects:**

* returns the set of all Questions whose survey is the given survey

**Request Body:**

```json
{
  "survey": "ID"
}
```

**Success Response Body (Query):**

```json
[
  {
    "question": "ID"
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

### POST /api/LikertSurvey/\_getSurveyTitle

**Description:** Retrieves the title of a specific survey.

**Requirements:**

* survey exists

**Effects:**

* returns the title of the survey

**Request Body:**

```json
{
  "survey": "ID"
}
```

**Success Response Body (Query):**

```json
[
  {
    "title": "string"
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

### POST /api/LikertSurvey/\_getSurveyOwner

**Description:** Retrieves the owner of a specific survey.

**Requirements:**

* survey exists

**Effects:**

* returns the owner of the survey

**Request Body:**

```json
{
  "survey": "ID"
}
```

**Success Response Body (Query):**

```json
[
  {
    "owner": "ID"
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

### POST /api/LikertSurvey/\_getQuestionStem

**Description:** Retrieves the text (stem) of a specific question.

**Requirements:**

* question exists

**Effects:**

* returns the stem of the question

**Request Body:**

```json
{
  "question": "ID"
}
```

**Success Response Body (Query):**

```json
[
  {
    "stem": "string"
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

**Description:** Gets a count of responses for each possible choice (1-5) for a question.

**Requirements:**

* question exists

**Effects:**

* returns an array of counts of responses by choice number (that is, the nth element is the number of responses with choice n+1).

**Request Body:**

```json
{
  "question": "ID"
}
```

**Success Response Body (Query):**

```json
[
  {
    "counts": "[number]"
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

**Description:** Analyzes all responses for a question to determine overall sentiment.

**Requirements:**

* *None specified.*

**Effects:**

* Analyzes all responses for a given `question` and returns a string indicating the overall sentiment (positive, negative, bimodal, mixed, or neutral).

**Request Body:**

```json
{
  "question": "ID"
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

### POST /api/LikertSurvey/\_getUserSurveys

**Description:** Retrieves all surveys owned by a specific user.

**Requirements:**

* the given user exists

**Effects:**

* returns an array of all `Survey` identities where the `owner` field matches the input `user`

**Request Body:**

```json
{
  "user": "ID"
}
```

**Success Response Body (Query):**

```json
[
  {
    "survey": "ID"
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
