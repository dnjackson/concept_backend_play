---
timestamp: 'Sun Oct 12 2025 22:27:52 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_222752.63cf5199.md]]'
content_id: a2bcfaebbd3139628e1660f90c8337731a73f928767c8da2efe14acb19ac8ec0
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

* `stem` is non-empty
* `survey` exists

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

**Description:** Removes a specified question and all of its associated responses.

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

**Description:** Records a user's response to a survey question. Replaces any previous response from the same user for the same question.

**Requirements:**

* `question` exists
* `choice` is an integer between 1 and 5

**Effects:**

* Deletes any existing response to this question from the given `responder`.
* Creates a new `Response` linking the `responder`, `question`, and `choice`.

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

**Description:** Retrieves a list of all questions associated with a given survey.

**Requirements:**

* The given `survey` exists.

**Effects:**

* Returns the array of all `Question` identities whose `survey` field matches the input `survey`.

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
    "questions": [
      "ID"
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

### POST /api/LikertSurvey/\_getQuestionResults

**Description:** Retrieves the aggregated response counts for a specific question.

**Requirements:**

* `question` exists

**Effects:**

* Returns a map where each key is a choice value (1-5) and its value is the count of responses for this question with that choice.

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

**Description:** Analyzes all responses for a given question and returns a string indicating the overall sentiment.

**Requirements:**

* The given `question` exists.

**Effects:**

* Analyzes all responses for the question.
* If no responses, returns "neutral".
* Calculates average and standard deviation of scores.
* Returns "positive" if average > 3.5.
* Returns "negative" if average < 2.5.
* Returns "bimodal" if standard deviation > 1.5 (highest priority).
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

**Description:** Retrieves an array of response counts for a question, indexed by choice.

**Requirements:**

* The given `question` exists.

**Effects:**

* Returns an array of counts of responses by choice number (the nth element is the number of responses with choice n+1).

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

* Returns the set of all `Survey` identities where the `owner` field matches the input `user`.

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
    "surveys": [
      "ID"
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
