---
timestamp: 'Sun Oct 12 2025 13:15:24 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_131524.d3fc7b08.md]]'
content_id: 068c4f4fdc88efb8429d2ac2c0a849a95b54aca95bff730130053e8d4fb0b192
---

# concept: UserAuth

* **concept**: UserAuth \[User]
* **purpose**: To verify a user's identity and grant them a temporary session for access.
* **principle**: If a user registers with a username and password, they can then log in with the same credentials to receive an access token. This token can be used to identify them, and when they log out, the token becomes invalid.
* **state**:
  * a set of Users with
    * a username String
    * a password String
  * a set of Sessions with
    * a token String
    * a user User
* **actions**:
  * register (username: String, password: String): (user: User) | (error: String)
  * login (username: String, password: String): (token: String) | (error: String)
  * logout (token: String)
* **queries**:
  * \_getUserFromToken (token: String): (user: User) | (error: String)
  * \_getUsernameFromToken (token: String): (username: String) | (error: String)
