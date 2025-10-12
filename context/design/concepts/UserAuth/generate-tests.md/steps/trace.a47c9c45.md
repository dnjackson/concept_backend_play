---
timestamp: 'Sun Oct 12 2025 13:38:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_133857.e14dd8f4.md]]'
content_id: a47c9c45f94dc8b7c5eee12c85bf2a53d6eff9d981f838ec062e94c18f23ee91
---

# trace:

The principle test trace demonstrates the core lifecycle of user authentication as intended by the concept:

1. **`register('alice')`**: Alice successfully creates an account. This establishes the initial state for a new user. The **effect** is a new `User` document in the database, confirmed by the returned `userId`.
2. **`register('alice')` (fails)**: An attempt to create a duplicate account is rejected. This confirms the **requirement** of the `register` action that the username must be unique.
3. **`login('alice')`**: Alice provides correct credentials to authenticate. The **effect** is the creation of a `Session` document, and a `token` is returned to her.
4. **`_getUserFromToken(token)` & `_getUsernameFromToken(token)`**: The received token is used to query for Alice's identity. This confirms that the token is a valid credential that correctly maps back to the authenticated user, which is central to the concept's **purpose**.
5. **`logout(token)`**: Alice ends her session. The **effect** is the deletion of the `Session` document from the database.
6. **`_getUserFromToken(token)` (fails)**: An attempt to use the now-invalidated token is rejected. This demonstrates that logging out successfully revokes access, completing the session lifecycle and fulfilling the **principle**.
