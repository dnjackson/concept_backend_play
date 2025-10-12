---
timestamp: 'Sun Oct 12 2025 13:10:37 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_131037.4fe287f3.md]]'
content_id: c9217846ac63b4db398f2ddf0c4ff77900e87b29d4bdb7613be2b43c2b83b7ef
---

# concept: UserAuth

* **concept**: UserAuth \[User]
* **purpose**: To verify a user's identity and grant them a temporary session for access.
* **principle**: If a user registers with a username and password, then they can log in with the same credentials to receive an access token. This token can then be used to identify them until they log out, at which point the token becomes invalid.
* **state**:
  * a set of Users with
    * a username String
    * a password String
  * a set of Sessions with
    * a token String (as ID)
    * a user User
* **actions**:
  * `register(username: String, password: String): (user: User) | (error: String)`
  * `login(username: String, password: String): (token: String) | (error: String)`
  * `logout(token: String)`
* **queries**:
  * `_getUserFromToken(token: String): (user: User) | (error: String)`
  * `_getUsernameFromToken(token: String): (username: String) | (error: String)`
