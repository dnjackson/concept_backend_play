---
timestamp: 'Sun Oct 12 2025 22:17:32 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_221732.cf84ebe7.md]]'
content_id: 13b5868ea035a0898998b68d11e61d1aba1bbd8c32a33974b6ad0c370e92542f
---

# solution:

The fix is to remove the incorrect `jsr:` overrides from your `deno.json` file. Deno will then use its native support to correctly resolve and download packages from JSR.

Here is the corrected version of the file.
