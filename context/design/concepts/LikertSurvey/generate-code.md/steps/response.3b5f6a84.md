---
timestamp: 'Sat Oct 11 2025 22:26:11 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251011_222611.8da8d1f5.md]]'
content_id: 3b5f6a84eefe20fc1342c6a1847225b91b3ef063ad19aaf8e56cc1c67b1cead3
---

# response:

You've run into a common Deno linting rule. The error message is quite helpful:

```
Inline 'npm:', 'jsr:' or 'https:' dependency not allowed
Add it as a dependency in a deno.json or package.json instead and reference it here via its bare specifier
```

This means that instead of importing directly from an `npm:` specifier in your code, you should add the dependency to your `deno.json` import map. This practice centralizes your project's dependencies, making them easier to manage and update.

Here is the solution:

1. Update `deno.json` to include an import map for `mongodb`.
2. Update the import statement in `LikertSurveyConcept.ts` to use the new "bare specifier".
