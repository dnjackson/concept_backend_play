---
timestamp: 'Sun Oct 12 2025 22:54:14 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_225414.3e4241d9.md]]'
content_id: f7e062e18eb85a1b6ac8b04a19a64d83540952f501acbfeae82d944fe0083f1f
---

# API Specification: LikertSurvey Concept

**Purpose:** understand group sentiment on a set of topics by aggregating quantitative feedback

***

## API Endpoints

### POST /api/LikertSurvey/createSurvey

**Description:** Creates a new survey with a specified title and owner.

**Requirements:**

* `title` is non-empty

**Effects:**

* Creates a new `Survey` with the given title and owner and returns it.

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

* `stem` is non-empty and survey exists

**Effects:**

* Creates a new `Question` with the given stem, associates it with the given survey, and returns it.

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

**Description:** Removes a question and all of its associated responses.

**Requirements:**

* `question` exists

**Effects:**

* Removes the specified question and all `Response` entities associated with it.

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

**Description:** Retrieves all question IDs associated with a given survey.

**Requirements:**

* The given `survey` exists.

**Effects:**

* Returns an array of `Question` identities whose `survey` field matches the input `survey`.

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
    "questions": "ID"
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

**Description:** Retrieves a summary of response counts for a question, grouped by choice.

**Requirements:**

* `question` exists

**Effects:**

* Returns a map where each key is a choice value (e.g., 1-5) and its value is the count of Responses for this question with that choice.

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
    "results": {
      "1": "number",
      "2": "number",
      "3": "number",
      "4": "number",
      "5": "number"
    }
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

**Description:** Analyzes the overall sentiment of responses for a given question.

**Requirements:**

* The given `question` exists.

**Effects:**

* This query analyzes all responses for a given `question` and returns a string indicating the overall sentiment.
* If there are no responses, returns "neutral".
* Calculates the average and standard deviation of all collected scores.
* Returns a sentiment string based on these rules:
  * If the average score is greater than 3.5, returns "positive".
  * If the average score is less than 2.5, returns "negative".
  * If the standard deviation is greater than 1.5, returns "bimodal".
  * Otherwise, returns "mixed".

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

### POST /api/LikertSurvey/\_getQuestionResponseCounts

**Description:** Retrieves an array of response counts for a question, indexed by choice number.

**Requirements:**

* The given `question` exists.

**Effects:**

* Returns an array of counts of responses by choice number (that is, the nth element is the number of responses with choice n+1).

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
    "counts": [
      "number"
    ]
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

* Returns an array of all `Survey` identities where the `owner` field matches the input `user`.

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
    "surveys": "ID"
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

***
