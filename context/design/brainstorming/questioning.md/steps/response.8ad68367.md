---
timestamp: 'Mon Oct 13 2025 00:17:39 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_001739.9f270b8f.md]]'
content_id: 8ad6836792f3195ac5c65b847da8fe92f3874beebffe6f9290834eafb4e5a7b6
---

# response:

Excellent follow-up question! This is a very common scenario for developers moving from Node.js to Deno. You want to leverage the convenience of the official client library instead of making raw `fetch` calls.

Deno has a built-in compatibility layer that allows you to import most npm packages directly, without a `package.json` or `node_modules` folder.

You do this using an `npm:` specifier.

### The Direct Answer: How to Import

The Node.js import:

```javascript
// Node.js
import { GoogleGenerativeAI } from '@google/generative-ai';
```

Becomes this in Deno:

```typescript
// Deno
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
```

It's that simple! Deno will see the `npm:` prefix, fetch the package from the npm registry, and cache it locally for future use.

### Alternative: Using a CDN

Before `npm:` specifiers were stabilized, the common way was to use an ES Module CDN like `esm.sh`. This is still a perfectly valid and excellent option.

The import would look like this:

```typescript
// Deno (using esm.sh)
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";
```

**Which one should you use?**

* **`npm:` specifier:** This is the modern, recommended Deno-native way. It's generally preferred.
* **`esm.sh`:** A fantastic and robust alternative. It's especially useful if you run into any compatibility issues with the `npm:` specifier for a particular package.

For this example, we'll use the recommended `npm:` specifier.

***

### Full Example: Using the Google Generative AI SDK in Deno

Here is the previous example, refactored to use the official Google AI SDK. Notice how much cleaner the API call logic becomes, as the SDK handles the request formatting and response parsing for you.

#### `main.ts` (SDK Version)

```typescript
// main.ts (using the official SDK)

// -----------------------------------------------------
// 1. IMPORTS
// -----------------------------------------------------

// Import the official Google Generative AI client library using an npm: specifier.
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

// Import the `load` function from Deno's standard library for .env file support.
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";


// -----------------------------------------------------
// 2. SETUP AND CONFIGURATION
// -----------------------------------------------------

// Load environment variables from the .env file.
await load();

// Retrieve the API key from the environment.
const API_KEY = Deno.env.get("GOOGLE_API_KEY");

// Throw an error if the API key is not set.
if (!API_KEY) {
  throw new Error("GOOGLE_API_KEY is not set in the environment.");
}

// Instantiate the GoogleGenerativeAI client with your API key.
const genAI = new GoogleGenerativeAI(API_KEY);

// Select the specific Gemini model you want to use.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// -----------------------------------------------------
// 3. THE API CALL LOGIC (Simplified with SDK)
// -----------------------------------------------------

async function callGeminiWithSDK(prompt: string): Promise<string> {
  console.log("Sending prompt to Gemini via SDK:", `"${prompt}"`);
  console.log("...");

  try {
    // The SDK simplifies the call. Just pass the prompt to `generateContent`.
    const result = await model.generateContent(prompt);
    
    // The SDK also simplifies response parsing.
    const response = result.response;
    const text = response.text();
    
    return text.trim();

  } catch (error) {
    console.error("Error calling Gemini API via SDK:", error);
    throw error;
  }
}


// -----------------------------------------------------
// 4. EXECUTION
// -----------------------------------------------------

// Get prompt from command-line arguments or use a default.
const userPrompt = Deno.args[0] || "Explain what Deno is in a single, concise paragraph.";

// Call our function and print the result.
try {
  const result = await callGeminiWithSDK(userPrompt);
  console.log("\n--- Gemini's Response ---");
  console.log(result);
  console.log("-------------------------\n");
} catch (e) {
  console.error("Failed to get a response from Gemini.");
}
```

### How to Run It

The required permissions are exactly the same. Deno still needs network access for the SDK to make its underlying API calls and environment/read access for your API key.

```bash
# Make sure you are in the deno-gemini-app directory
deno run --allow-net --allow-env --allow-read main.ts
```

When you run this for the first time, you will see Deno downloading and caching the `@google/generative-ai` package and its dependencies:

```
Download npm:@google/generative-ai@0.11.3
...
```

The output will be the same as before, but your code is now more robust, maintainable, and easier to read thanks to the official SDK.
