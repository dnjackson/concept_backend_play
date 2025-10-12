---
timestamp: 'Sun Oct 12 2025 13:06:35 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_130635.c91fc984.md]]'
content_id: 6799eaa20693ed2c8b95ba2b407ade78ffdf99502e73008428070d621e9596dd
---

# concept: UserAuth

* **concept**: UserAuth \[User]
* **purpose**: To verify a user's identity and grant them a temporary session for access.
* **principle**: If a user registers with a username and password, they can then log in with those same credentials to receive a session token. This token can be used to identify them for subsequent actions. When the user logs out, the token is invalidated and can no longer be used.
* **state**:
  * `users`: a set of Users with a `username` (String) and `password` (String).
  * `sessions`: a set of Sessions with a `_id` (String, representing the token) and `user` (User).
* **actions**:
  * `register(username: String, password: String): (user: User) | (error: String)`
  * `login(username: String, password: String): (token: String) | (error: String)`
  * `logout(token: String)`
* **queries**:
  * `_getUserFromToken(token: String): Array<(user: User) | (error: String)>`
  * `_getUsernameFromToken(token: String): Array<(username: String) | (error: String)>`
