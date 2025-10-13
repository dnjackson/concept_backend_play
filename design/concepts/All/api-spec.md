# API Specification: LikertSurvey Concept

**Purpose:** understand group sentiment on a set of topics by aggregating quantitative feedback

---

## API Endpoints

### POST /api/LikertSurvey/createSurvey

**Description:** Creates a new survey with a title and an owner.

**Requirements:**
- title is non-empty

**Effects:**
- creates a new `Survey` with the given title and owner and returns it

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
---
### POST /api/LikertSurvey/addQuestion

**Description:** Adds a new question to an existing survey.

**Requirements:**
- stem is non-empty and survey exists

**Effects:**
- creates a new `Question` with the given stem, associates it with the given survey, and returns it

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
---
### POST /api/LikertSurvey/removeQuestion

**Description:** Deletes a question and all associated responses.

**Requirements:**
- question exists

**Effects:**
- removes the specified question and all `Response` entities associated with it

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
---
### POST /api/LikertSurvey/respondToQuestion

**Description:** Records a user's response to a specific question.

**Requirements:**
- question exists
- choice is an integer between 1 and 5

**Effects:**
- delete any existing response to this question
- creates a new `Response` linking the responder, question, and choice

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
---
### POST /api/LikertSurvey/_getSurveyQuestions

**Description:** Retrieves all questions associated with a given survey.

**Requirements:**
- survey exists

**Effects:**
- returns the set of all Questions whose survey is the given survey

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
---
### POST /api/LikertSurvey/_getSurveyTitle

**Description:** Retrieves the title of a specific survey.

**Requirements:**
- survey exists

**Effects:**
- returns the title of the survey

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
---
### POST /api/LikertSurvey/_getSurveyOwner

**Description:** Retrieves the owner of a specific survey.

**Requirements:**
- survey exists

**Effects:**
- returns the owner of the survey

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
---
### POST /api/LikertSurvey/_getQuestionStem

**Description:** Retrieves the text (stem) of a specific question.

**Requirements:**
- question exists

**Effects:**
- returns the stem of the question

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
---
### POST /api/LikertSurvey/_getQuestionResponseCounts

**Description:** Gets a count of responses for each possible choice (1-5) for a question.

**Requirements:**
- question exists

**Effects:**
- returns an array of counts of responses by choice number (that is, the nth element is the number of responses with choice n+1).

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
---
### POST /api/LikertSurvey/_analyzeSentiment

**Description:** Analyzes all responses for a question to determine overall sentiment.

**Requirements:**
- *None specified.*

**Effects:**
- Analyzes all responses for a given `question` and returns a string indicating the overall sentiment (positive, negative, bimodal, mixed, or neutral).

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
---
### POST /api/LikertSurvey/_getUserSurveys

**Description:** Retrieves all surveys owned by a specific user.

**Requirements:**
- the given user exists

**Effects:**
- returns an array of all `Survey` identities where the `owner` field matches the input `user`

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
---
# API Specification: UserAuth Concept

**Purpose:** To verify a user's identity and grant them a temporary session for access.

---

## API Endpoints

### POST /api/UserAuth/register

**Description:** Creates a new user account.

**Requirements:**
- (For success) No user exists with the given `username`.
- (For error) A user already exists with the given `username`.

**Effects:**
- (For success) A new `User` is created, and their ID is returned.
- (For error) An error message is returned indicating the username is taken.

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
  "user": "ID"
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
- (For success) A user exists with a matching `username` and `password`.
- (For error) No user exists with matching credentials.

**Effects:**
- (For success) A new `Session` is created, and its `token` is returned.
- (For error) An error message is returned indicating invalid credentials.

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

**Description:** Invalidates a user's session by deleting their session token.

**Requirements:**
- A session exists for the given `token`.

**Effects:**
- The session associated with the `token` is deleted.

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

**Description:** Retrieves a user ID from a valid session token.

**Requirements:**
- (For success) A session exists with the given `token`.
- (For error) No session exists with the given `token`.

**Effects:**
- (For success) Returns the user ID associated with the session.
- (For error) Returns an error message indicating an invalid token.

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
    "user": "ID"
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

**Description:** Retrieves a username from a valid session token.

**Requirements:**
- (For success) A session exists with the given `token`.
- (For error) No session exists with the given `token`.

**Effects:**
- (For success) Returns the username of the user associated with the session.
- (For error) Returns an error message indicating an invalid token.

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