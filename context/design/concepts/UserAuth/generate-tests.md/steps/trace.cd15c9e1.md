---
timestamp: 'Sun Oct 12 2025 13:15:55 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_131555.69632e4e.md]]'
content_id: cd15c9e1682ef03db73d4e79a47476355b8fb6c329bca8d4375cf4556a241172
---

# trace:

The principle is "If a user registers with a username and password, they can then log in with the same credentials to receive an access token. This token can be used to identify them, and when they log out, the token becomes invalid."

The test step `Principle: Full authentication lifecycle` models this directly:

1. **Register**: A new user, Bob, is created using `userAuth.register({ username: "bob", password: "password456" })`.
2. **Login and get token**: Bob then calls `userAuth.login({ username: "bob", password: "password456" })`, which successfully returns a unique token.
3. **Use token for identification**: A query `_getUsernameFromToken` is called with Bob's new token. The test confirms that this query correctly returns Bob's username, proving the token is a valid identifier for his session.
4. **Logout and invalidate token**: Bob calls `userAuth.logout({ token: ... })` with his token. The test verifies that his session is removed from the database.
5. **Verify token invalidation**: The same `_getUsernameFromToken` query is called again with the now-logged-out token. The test confirms that this now fails and returns an "Invalid token" error, proving the principle's final clause.
