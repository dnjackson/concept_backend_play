---
timestamp: 'Sun Oct 12 2025 22:17:32 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_221732.cf84ebe7.md]]'
content_id: dc3d17ddde159872d8df8c1a650f800dad5688a8004465d5aa94efd549351abf
---

# problem:

Deno's test runner reports `running 0 tests` when it fails to load and evaluate the test file. In this case, the test file fails to load because of an incorrect configuration in your `deno.json` that breaks how Deno handles JSR packages.

The `jsr:` specifier (like in `jsr:@std/assert`) is a special prefix that Deno understands natively to fetch packages from the JSR registry. Your `deno.json` contains these lines:

```json
"imports": {
    ...
    "jsr:@std/": "https://deno.land/std@1.1.2/",
    "jsr:@hono/": "https://esm.sh/@hono/"
    ...
},
```

These mappings incorrectly override Deno's built-in `jsr:` handling. You are telling Deno, "When you see `jsr:@std/`, don't use the JSR registry; instead, go to the old `deno.land/std` URL." This causes the import to fail, the test module is never successfully parsed, and consequently, the test runner discovers zero tests.
