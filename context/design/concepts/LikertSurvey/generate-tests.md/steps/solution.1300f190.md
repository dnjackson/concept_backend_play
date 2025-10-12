---
timestamp: 'Sun Oct 12 2025 00:12:52 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_001252.8a3c81d4.md]]'
content_id: 1300f190e15d21399ff1158284b744a885582a58afd4105f192a491fbeb03bda
---

# solution:

The problem is that TypeScript cannot guarantee that a property like `survey` exists on a variable whose type is a union like `{ survey: ID } | { error: string }`. To fix this, we must first assert that the `error` property does *not* exist. This "narrows" the type, assuring the compiler that the variable must be the success variant of the union, allowing safe access to properties like `survey` or `question`.
