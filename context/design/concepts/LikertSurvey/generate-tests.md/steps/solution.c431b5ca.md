---
timestamp: 'Sun Oct 12 2025 22:11:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_221159.9d9ad53d.md]]'
content_id: c431b5cab3d51149c0901a743f6380ee294a52b8f1c1497bf995df691c9a753d
---

# solution:

The error `Property 'error' does not exist on type '{ survey: ID; } | { error: string; }'` occurs because TypeScript cannot guarantee that the `error` property exists on the `result` object without first narrowing its type. When an action can return either a success object (e.g., `{ survey: ID }`) or an error object (`{ error: string }`), you must use a type guard to inform the compiler which branch of the union you are handling.

The fix is to replace direct access like `assertExists(result.error)` with a type-guarding assertion, such as `assert("error" in result)`. This assertion confirms to the type checker that the `error` property exists, allowing you to access `result.error` safely in subsequent lines.

Here is the corrected test file with the necessary changes applied.
