---
timestamp: 'Sun Oct 12 2025 15:02:01 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_150201.ea48b03d.md]]'
content_id: 45ba9c673e4a6a523b4cb49a3a68258bb7067c24eb532083d8e6f83ab7acabbe
---

# file: deno.json

```json
{
    "imports": {
        "@concepts/": "./src/concepts/",
        "@utils/": "./src/utils/",
        "jsr:@std/": "https://deno.land/std@1.1.2/",
        "jsr:@hono/": "https://esm.sh/@hono/"
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
