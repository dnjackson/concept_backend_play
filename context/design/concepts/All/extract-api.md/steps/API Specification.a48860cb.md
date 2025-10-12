---
timestamp: 'Sun Oct 12 2025 00:18:55 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_001855.90fb2036.md]]'
content_id: a48860cb4dd845a908f9769b185c2ffda8de331eff851fb9c5826ab7b9373084
---

# API Specification: LikertSurvey Concept

**Purpose:** understand group sentiment on a set of topics by aggregating quantitative feedback

***

## API Endpoints

### POST /api/LikertSurvey/createSurvey

**Description:** Creates a new survey with a specified title and owner.

**Requirements:**

* title is non-empty

**Effects:**

* creates a new `Survey` with the given title and owner and returns it

**Request Body:**

```json
{
  "title": "string",
  "owner": "string (User ID)"
}
```

**Success Response Body (Action):**

```json
{
  "survey": "string (Survey ID)"
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
  "survey": "string (Survey ID)"
}
```

**Success Response Body (Action):**

```json
{
  "question": "string (Question ID)"
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

**Description:** Removes a specific question and all of its associated responses.

**Requirements:**

* question exists

**Effects:**

* removes the specified question and all `Response` entities associated with it

**Request Body:**

```json
{
  "question": "string (Question ID)"
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

**Description:** Records a user's response to a specific question, overwriting any previous response from that user.

**Requirements:**

* question exists
* choice is an integer between 1 and 5

**Effects:**

* delete any existing response to this question
* creates a new `Response` linking the responder, question, and choice

**Request Body:**

```json
{
  "question": "string (Question ID)",
  "responder": "string (User ID)",
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

**Description:** Retrieves all questions associated with a specific survey.

**Requirements:**

* survey exists

**Effects:**

* returns the set of all Questions where `Question.survey` is the given survey

**Request Body:**

```json
{
  "survey": "string (Survey ID)"
}
```

**Success Response Body (Query):**

```json
[
  {
    "_id": "string (Question ID)",
    "stem": "string",
    "survey": "string (Survey ID)"
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

**Description:** Gets a summary of response counts for a question, grouped by choice.

**Requirements:**

* question exists

**Effects:**

* returns a map where each key is a choice value (e.g., 1-5) and its value is the count of Responses for this question with that choice

**Request Body:**

```json
{
  "question": "string (Question ID)"
}
```

**Success Response Body (Query):**

```json
[
  {
    "1": "number",
    "2": "number",
    "3": "number",
    "4": "number",
    "5": "number"
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

* N/A

**Effects:**

* This query analyzes all responses for a given `question` and returns a string indicating the overall sentiment. The logic is as follows:
* 1. Collect the `score` from every `Response` where the `question` matches the input `question`.
* 2. If there are no responses, return "neutral".
* 3. Calculate the average and standard deviation of all collected scores.
* 4. Return a sentiment string based on these rules:
* * If the average score is greater than 3.5, return "positive".
* * If the average score is less than 2.5, return "negative".
* * If the standard deviation is greater than 1.5 (indicating a high degree of variance and polarization), return "bimodal".
* * Otherwise, return "mixed".

**Request Body:**

```json
{
  "question": "string (Question ID)"
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

**Description:** Retrieves the count of responses for each possible choice for a given question.

**Requirements:**

* the given question exists

**Effects:**

* returns an array of counts of responses by choice number (that is, the nth element is the number of responses with choice n+1)

**Request Body:**

```json
{
  "question": "string (Question ID)"
}
```

**Success Response Body (Query):**

```json
[
  [
    "number",
    "number",
    "number",
    "number",
    "number"
  ]
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
