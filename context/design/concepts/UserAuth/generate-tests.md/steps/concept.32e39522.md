---
timestamp: 'Sun Oct 12 2025 13:08:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_130808.d67ef027.md]]'
content_id: 32e3952245d8af987a8fa4d8f3c10db67380bcc10613f734fb10726956a59a1f
---

# concept: UserAuth

* **concept**: UserAuth \[User]
* **purpose**: To verify a user's identity and grant them a temporary session for access.
* **principle**: If a user registers with a username and password, then they can log in with the same credentials to obtain a session token. While the token is valid, it can be used to identify the user. After the user logs out, the token is no longer valid and cannot be used to identify them.
* **state**:
  * a set of Users with
    * a username String
    * a password String
  * a set of Sessions with
    * a token String
    * a user User
* **actions**:
  * register(username: String, password: String): (user: User) | (error: String)
  * login(username: String, password: String): (token: String) | (error: String)
  * logout(token: String)
* **queries**:
  * \_getUserFromToken(token: String): (user: User) | (error: String)
  * \_getUsernameFromToken(token: String): (username: String) | (error: String)
