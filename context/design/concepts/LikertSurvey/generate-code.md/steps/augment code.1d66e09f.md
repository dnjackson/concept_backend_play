---
timestamp: 'Sun Oct 12 2025 00:55:46 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_005546.76d7a86a.md]]'
content_id: 1d66e09fa540f71ccbb7d811ed572f4b8170d4e7991171015820a69915208d1b
---

# augment code:

please write code for this additional query:

\_getUserSurveys (user: User): (surveys: set of Survey)
**requires** the given user exists
**effects** returns the set of all `Survey` entities where the `owner` field matches the input `user`
