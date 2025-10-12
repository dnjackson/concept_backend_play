---
timestamp: 'Sun Oct 12 2025 13:38:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_133857.e14dd8f4.md]]'
content_id: 0674d144e29e566fae8a3ac3bfb9fb9c717629478f4713c11d4a338fa35e4ab9
---

# concept: UserAuth

* **concept**: UserAuth \[User]
* **purpose**: To verify a user's identity and grant them a temporary session for access.
* **principle**: If a user registers with a username and password, then they can log in with the same credentials to receive a session token, and that token can be used to identify them until they log out.
* **state**:
  * a set of Users with
    * a username String
    * a password String
  * a set of Sessions with
    * a user User
    * a token String (used as the session ID)
* **actions**:
  * `register(username: String, password: String): (user: User) | (error: String)`
  * `login(username: String, password: String): (token: String) | (error: String)`
  * `logout(token: String)`
* **queries**:
  * `_getUserFromToken(token: String): (user: User) | (error: String)`
  * `_getUsernameFromToken(token: String): (username: String) | (error: String)`
