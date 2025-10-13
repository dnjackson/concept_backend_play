---
timestamp: 'Sun Oct 12 2025 22:17:32 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_221732.cf84ebe7.md]]'
content_id: db99079827f8c2c43113022fc132f15ed313909db78c1c0a4635db30b1b279be
---

# file: deno.json

```json
{
    "imports": {
        "@concepts/": "./src/concepts/",
        "@utils/": "./src/utils/"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api"
    },
    "lint": {
        "rules": {
            "exclude": ["no-import-prefix", "no-unversioned-import"]
        }
    }
}
```

After making this change, save the file and run your test command again. It should now correctly discover and run all the tests in `LikertSurveyConcept.test.ts`.
