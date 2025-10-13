---
timestamp: 'Sun Oct 12 2025 22:54:14 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_225414.3e4241d9.md]]'
content_id: 7583d06ec91866dfc7cea878bbaa920c9eac3738a8b186b07071e9bf56a4be50
---

# API Specification: UserAuth Concept

**Purpose:** To verify a user's identity and grant them a temporary session for access.

***

## API Endpoints

### POST /api/UserAuth/register

**Description:** Creates a new user account with a unique username.

**Requirements:**

* No user exists with the given `username`.

**Effects:**

* A new `User` is created.
* The new user's `username` is set to the input `username`.
* The new user's `password` is set to the input `password`.
* The new `user` ID is returned.

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

**Description:** Authenticates a user with their credentials and returns a session token.

**Requirements:**

* A user `u` exists where `u.username` matches the input `username` and `u.password` matches the input `password`.

**Effects:**

* A new, unique `token` string is generated.
* A new `Session` is created, linking the new `token` to the user `u`.
* The `token` is returned.

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

**Description:** Invalidates a user's session token, effectively logging them out.

**Requirements:**

* A session `s` exists where `s.token` matches the input `token`.

**Effects:**

* The session `s` is deleted.

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

**Description:** Retrieves a user's unique ID from a valid session token.

**Requirements:**

* A session `s` exists with the given `token`.

**Effects:**

* Returns the user ID associated with session `s`.

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

**Description:** Retrieves a user's username from a valid session token.

**Requirements:**

* A session `s` exists with the given `token`.

**Effects:**

* Returns the username of the user associated with session `s`.

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
