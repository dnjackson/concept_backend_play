---
timestamp: 'Sun Oct 12 2025 11:00:24 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_110024.50af14cf.md]]'
content_id: 857596c6c6709aabd0df5e4897fbb651572a556bc6029573f1bc2c08beb8e9bd
---

# concept: UserAuth

**concept** UserAuth

**purpose** authenticate users by username and password

**principle** after a user registers with a username and password, they can then login with the same username and password to be authenticated as that user

**state**
a set of Users with

* a username String
* a password String (stored as a secure hash)

**actions**

* `register (username: String, password: String): (user: User)`
  * **requires** `username` must not already be taken by another user.
  * **effects** creates a new `User` `u`; sets the `username` of `u` to the given `username`; sets the `password` of `u` to a hashed version of the given `password`; returns `u` as `user`.
* `register (username: String, password: String): (error: String)`
  * **requires** `username` is already taken by another user.
  * **effects** returns an error message.
* `login (username: String, password: String): (user: User)`
  * **requires** a user with the given `username` exists and the given `password` matches the stored password.
  * **effects** returns the matching user's id `u` as `user`.
* `login (username: String, password: String): (error: String)`
  * **requires** no user exists with the given `username` or the password does not match.
  * **effects** returns an error message.
