---
timestamp: 'Sun Oct 12 2025 00:03:43 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_000343.7327e866.md]]'
content_id: 6bd53c04ba776e6d55124bcd2e31af8e4946efba197e9575db065f1d2a6d1c9e
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
