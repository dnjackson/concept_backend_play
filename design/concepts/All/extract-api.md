[@api-extraction](../../templates/api-extraction.md)

Please extract an API for this app from the following two concepts:

## LikertSurvey

Specification:

[@LikertSurvey](../LikertSurvey/LikertSurvey.md)

Code:

[@LikertSurveyConcept.ts](../../../src/concepts/LikertSurvey/LikertSurveyConcept.ts)

## UserAuth

Specification:

[@UserAuth](../UserAuth/UserAuthConcept.md)

Code:

[@UserAuthConcept.ts](../../../src/concepts/UserAuth/UserAuthConcept.ts)


# response:

# API Specification: LikertSurvey Concept

**Purpose:** understand group sentiment on a set of topics by aggregating quantitative feedback

---

## API Endpoints

### POST /api/LikertSurvey/createSurvey

**Description:** Creates a new survey with a title and an owner.

**Requirements:**
- `title` is non-empty

**Effects:**
- Creates a new `Survey` with the given title and owner and returns it.

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
---
### POST /api/LikertSurvey/addQuestion

**Description:** Adds a new question to an existing survey.

**Requirements:**
- `stem` is non-empty and `survey` exists

**Effects:**
- Creates a new `Question` with the given stem, associates it with the given survey, and returns it.

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
---
### POST /api/LikertSurvey/removeQuestion

**Description:** Removes a question and all its associated responses from a survey.

**Requirements:**
- `question` exists

**Effects:**
- Removes the specified question and all `Response` entities associated with it.

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
---
### POST /api/LikertSurvey/respondToQuestion

**Description:** Submits or updates a user's response to a specific question.

**Requirements:**
- `question` exists
- `choice` is an integer between 1 and 5

**Effects:**
- Deletes any existing response to this question.
- Creates a new `Response` linking the responder, question, and choice.

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
---
### POST /api/LikertSurvey/_getSurveyQuestions

**Description:** Retrieves all questions associated with a specific survey.

**Requirements:**
- The given `survey` exists.

**Effects:**
- Returns the set of all `Question` entities whose `survey` field matches the input `survey`.

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
---
### POST /api/LikertSurvey/_getQuestionResults

**Description:** Gets the response counts for each choice (1-5) for a given question.

**Requirements:**
- `question` exists

**Effects:**
- Returns a map where each key is a choice value (e.g., 1-5) and its value is the count of Responses for this question with that choice.

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
---
### POST /api/LikertSurvey/_analyzeSentiment

**Description:** Analyzes the responses for a question to determine the overall sentiment.

**Requirements:**
- None specified.

**Effects:**
- This query analyzes all responses for a given `question` and returns a string indicating the overall sentiment ("positive", "negative", "bimodal", "mixed", or "neutral").

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
---
### POST /api/LikertSurvey/_getQuestionResponseCounts

**Description:** Returns an array of response counts for a question, indexed by choice.

**Requirements:**
- The given `question` exists.

**Effects:**
- Returns an array of counts of responses by choice number (that is, the nth element is the number of responses with choice n+1).

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
---
### POST /api/LikertSurvey/_getUserSurveys

**Description:** Retrieves all surveys owned by a specific user.

**Requirements:**
- The given `user` exists.

**Effects:**
- Returns the set of all `Survey` entities where the `owner` field matches the input `user`.

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
---

# API Specification: UserAuth Concept

**Purpose:** To verify a user's identity and grant them a temporary session for access.

---

## API Endpoints

### POST /api/UserAuth/register

**Description:** Creates a new user account with the provided username and password.

**Requirements:**
- No user exists with the given `username`.

**Effects:**
- A new `User` is created.
- The new user's `username` is set to the input `username`.
- The new user's `password` is set to the input `password`.
- The new `user` is returned.
- If a user already exists with the given username, an error is returned.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "user": "User"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/UserAuth/login

**Description:** Authenticates a user and returns a session token.

**Requirements:**
- A user `u` exists where `u.username` matches the input `username` and `u.password` matches the input `password`.

**Effects:**
- A new, unique `token` string is generated.
- A new `Session` is created, linking the new `token` to the user `u`.
- The `token` is returned.
- If credentials do not match an existing user, an error is returned.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "token": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/UserAuth/logout

**Description:** Invalidates a user's session token, effectively logging them out.

**Requirements:**
- A session `s` exists where `s.token` matches the input `token`.

**Effects:**
- The session `s` is deleted.

**Request Body:**
```json
{
  "token": "string"
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
---
### POST /api/UserAuth/_getUserFromToken

**Description:** Retrieves the user ID associated with a session token.

**Requirements:**
- A session `s` exists with the given `token`.

**Effects:**
- Returns the user associated with session `s`.
- If no session exists with the given token, an error is returned.

**Request Body:**
```json
{
  "token": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "user": "User"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/UserAuth/_getUsernameFromToken

**Description:** Retrieves the username associated with a session token.

**Requirements:**
- A session `s` exists with the given `token`.

**Effects:**
- Returns the username of the user associated with session `s`.
- If no session exists with the given token, an error is returned.

**Request Body:**
```json
{
  "token": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "username": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---