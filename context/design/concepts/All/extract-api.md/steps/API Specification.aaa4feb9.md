---
timestamp: 'Sun Oct 12 2025 23:48:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_234836.a9236e1a.md]]'
content_id: aaa4feb9b6f4c4c2bdc3c66d01c6282a438a71ae2974b3ee6f05d0940b9d1568
---

# API Specification: UserAuth Concept

**Purpose:** To verify a user's identity and grant them a temporary session for access.

***

## API Endpoints

### POST /api/UserAuth/register

**Description:** Creates a new user account.

**Requirements:**

* (For success) No user exists with the given `username`.
* (For error) A user already exists with the given `username`.

**Effects:**

* (For success) A new `User` is created, and their ID is returned.
* (For error) An error message is returned indicating the username is taken.

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

***

### POST /api/UserAuth/login

**Description:** Authenticates a user and returns a session token.

**Requirements:**

* (For success) A user exists with a matching `username` and `password`.
* (For error) No user exists with matching credentials.

**Effects:**

* (For success) A new `Session` is created, and its `token` is returned.
* (For error) An error message is returned indicating invalid credentials.

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

***

### POST /api/UserAuth/logout

**Description:** Invalidates a user's session by deleting their session token.

**Requirements:**

* A session exists for the given `token`.

**Effects:**

* The session associated with the `token` is deleted.

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

***

### POST /api/UserAuth/\_getUserFromToken

**Description:** Retrieves a user ID from a valid session token.

**Requirements:**

* (For success) A session exists with the given `token`.
* (For error) No session exists with the given `token`.

**Effects:**

* (For success) Returns the user ID associated with the session.
* (For error) Returns an error message indicating an invalid token.

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

***

### POST /api/UserAuth/\_getUsernameFromToken

**Description:** Retrieves a username from a valid session token.

**Requirements:**

* (For success) A session exists with the given `token`.
* (For error) No session exists with the given `token`.

**Effects:**

* (For success) Returns the username of the user associated with the session.
* (For error) Returns an error message indicating an invalid token.

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

***
