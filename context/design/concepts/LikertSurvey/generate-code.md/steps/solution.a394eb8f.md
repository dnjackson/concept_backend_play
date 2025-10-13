---
timestamp: 'Sun Oct 12 2025 23:41:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_234159.159bb918.md]]'
content_id: a394eb8f654a587bf288fc478274f4253399b3a0d5075c0c43d77f868d28c84f
---

# solution:

The error `'e' is of type 'unknown'` occurs because TypeScript, by default, types the variable in a `catch` block as `unknown` for type safety. To access the `message` property, we must first verify that the caught object `e` is actually an `Error` instance. This can be done with an `instanceof` check.
