---
timestamp: 'Sat Oct 11 2025 22:26:11 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251011_222611.8da8d1f5.md]]'
content_id: f8a73ea3ef40bdda1b67c3eb9835f762822a0c6242c0ab76b708fdfa34fc9579
---

# file: deno.json

```json
{
    "imports": {
        "mongodb": "npm:mongodb",
        "@concepts/": "./src/concepts/",
        "@utils/": "./src/utils/"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api"
    }
}
```
