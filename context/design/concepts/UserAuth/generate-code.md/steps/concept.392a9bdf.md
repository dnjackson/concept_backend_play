---
timestamp: 'Sun Oct 12 2025 11:13:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_111328.4479b976.md]]'
content_id: 392a9bdfbb430eb7c507114b5b46e9365f1f17eee8fc43851dca2d277d2d9804
---

# concept: UserAuth

**concept** UserAuth

**purpose** To verify a user's identity and grant them a temporary session for access.

**principle** If a user registers with a username and password, and then they login with the same credentials, they will be given a session token that identifies them as the user who registered. Logging out invalidates this token.

**state**

```
a set of Users with
  a username String
  a password String

a set of Sessions with
  a token String
  a user User
```

**actions**

`register(username: String, password: String): (user: User)`
**requires**
No user exists with the given `username`.
**effects**
A new `User` is created.
The new user's `username` is set to the input `username`.
The new user's `password` is set to the input `password`.
The new `user` is returned.

`register(username: String, password: String): (error: String)`
**requires**
A user already exists with the given `username`.
**effects**
An error message is returned indicating the username is taken.

`login(username: String, password: String): (token: String)`
**requires**
A user `u` exists where `u.username` matches the input `username` and `u.password` matches the input `password`.
**effects**
A new, unique `token` string is generated.
A new `Session` is created, linking the new `token` to the user `u`.
The `token` is returned.

`login(username: String, password: String): (error: String)`
**requires**
No user `u` exists where `u.username` matches the input `username` and `u.password` matches the input `password`.
**effects**
An error message is returned indicating invalid credentials.

`logout(token: String)`
**requires**
A session `s` exists where `s.token` matches the input `token`.
**effects**
The session `s` is deleted.

**queries**

`_getUserFromToken(token: String): (user: User)`
**requires**
A session `s` exists with the given `token`.
**effects**
Returns the user associated with session `s`.

`_getUserFromToken(token: String): (error: String)`
**requires**
No session exists with the given `token`.
**effects**
Returns an error message indicating an invalid token.

`_getUsernameFromToken(token: String): (username: String)`
**requires**
A session `s` exists with the given `token`.
**effects**
Returns the username of the user associated with session `s`.

`_getUsernameFromToken(token: String): (error: String)`
**requires**
No session exists with the given `token`.
**effects**
Returns an error message indicating an invalid token.
