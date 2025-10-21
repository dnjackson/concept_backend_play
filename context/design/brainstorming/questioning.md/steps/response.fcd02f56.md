---
timestamp: 'Mon Oct 13 2025 00:13:12 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_001312.61df1a21.md]]'
content_id: fcd02f5651f41e5f6fb4cbb2d5d0e2cfaeb7072b0589da45c422749e99f2c408
---

# response:

Of course! Here is a complete, step-by-step guide on how to make a call to the Google Gemini API within a Deno application, including setup, required imports, and a runnable code example.

We'll use Deno's built-in `fetch` API and a standard library module to handle environment variables securely.

### Prerequisites

1. **Deno Installed:** If you don't have Deno, install it from [deno.land](https://deno.land/#installation).
2. **Gemini API Key:** You need an API key from Google AI Studio. You can get one for free [here](https://aistudio.google.com/app/apikey).

***

### Step 1: Set Up Your Deno Project

First, create a new folder for your project and a couple of files.

1. Create a directory:
   ```bash
   mkdir deno-gemini-app
   cd deno-gemini-app
   ```

2. Create a `.env` file to securely store your API key. **Never commit this file to Git.**
   ```bash
   touch .env
   ```

3. Add your API key to the `.env` file:
   ```
   # .env
   GOOGLE_API_KEY="YOUR_API_KEY_HERE"
   ```
   Replace `YOUR_API_KEY_HERE` with the actual key you got from Google AI Studio.

4. Create your main Deno script file. Let's call it `main.ts`.
   ```bash
   touch main.ts
   ```

Your project structure should now look like this:

```
deno-gemini-app/
├── .env
└── main.ts
```

***

### Step 2: The Deno Code (`main.ts`)

Here is the full code for `main.ts`. It includes all the necessary imports and logic to load the API key, construct the request, make the API call, and parse the response.

```typescript
// main.ts

// -----------------------------------------------------
// 1. IMPORTS
// -----------------------------------------------------

// We import the `load` function from Deno's standard library `dotenv` module.
// This allows us to load variables from our `.env` file into the Deno environment.
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";


// -----------------------------------------------------
// 2. SETUP AND CONFIGURATION
// -----------------------------------------------------

// Load environment variables from the .env file.
await load();

// Retrieve the API key from the environment.
const API_KEY = Deno.env.get("GOOGLE_API_KEY");

// Throw an error if the API key is not set, preventing the app from running without it.
if (!API_KEY) {
  throw new Error("GOOGLE_API_KEY is not set in the environment.");
}

// Define the specific Gemini model and the API endpoint URL.
// We are using 'gemini-1.5-flash' here as it's fast and effective.
const MODEL = "gemini-1.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;


// -----------------------------------------------------
// 3. THE API CALL LOGIC
// -----------------------------------------------------

async function callGemini(prompt: string): Promise<string> {
  console.log("Sending prompt to Gemini:", `"${prompt}"`);
  console.log("...");

  try {
    // Construct the request payload in the format Gemini expects.
    const payload = {
      contents: [{
        parts: [{
          text: prompt,
        }],
      }],
    };

    // Use Deno's built-in `fetch` to make the API call.
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Check if the request was successful.
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API call failed with status ${response.status}: ${errorBody}`);
    }

    // Parse the JSON response from the API.
    const data = await response.json();
    
    // Extract the generated text from the nested response structure.
    // We use optional chaining (?.) for safety in case the response structure is unexpected.
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("Could not extract generated text from the API response.");
    }

    return generatedText.trim();

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Re-throw the error to be handled by the caller or crash the script.
    throw error;
  }
}


// -----------------------------------------------------
// 4. EXECUTION
// -----------------------------------------------------

// Check if a prompt was provided as a command-line argument.
const userPrompt = Deno.args[0] || "Explain what Deno is in a single, concise paragraph.";

// Call our function and print the result.
try {
  const result = await callGemini(userPrompt);
  console.log("\n--- Gemini's Response ---");
  console.log(result);
  console.log("-------------------------\n");
} catch (e) {
  console.error("Failed to get a response from Gemini.");
}

```

### Key Parts Explained

1. **Imports:**
   * `import { load } from "https://deno.land/std/dotenv/mod.ts";`
   * This is the only external import you need. It's from Deno's official standard library, which is a collection of high-quality, audited modules. The `load` function reads your `.env` file and makes its variables available via `Deno.env.get()`.

2. **Configuration:**
   * `await load();` loads the variables.
   * `Deno.env.get("GOOGLE_API_KEY");` retrieves the specific key. This is the secure way to handle secrets.
   * The `API_URL` is constructed using the model name and your API key.

3. **The API Call (`fetch`)**:
   * `fetch` is built into Deno, so no import is needed. It works just like the browser's Fetch API.
   * **Method:** `POST`, as required by the Gemini API.
   * **Headers:** We must specify `"Content-Type": "application/json"`.
   * **Body:** The prompt is wrapped in the specific JSON structure required by the `generateContent` endpoint and then stringified using `JSON.stringify()`.

4. **Parsing the Response:**
   * `const data = await response.json();` parses the JSON response body.
   * The actual text is nested deep inside the response object. The path `data.candidates[0].content.parts[0].text` is the standard way to access it.

***

### Step 3: Run the Deno App

To run the script, you need to grant Deno specific permissions. This is a core security feature of Deno.

* `--allow-net`: To allow the `fetch` call to the Google API.
* `--allow-env`: To allow access to environment variables (for the API key).
* `--allow-read`: To allow reading the `.env` file.

Open your terminal in the `deno-gemini-app` directory and run the following command:

```bash
deno run --allow-net --allow-env --allow-read main.ts
```

**Output:**

```
Sending prompt to Gemini: "Explain what Deno is in a single, concise paragraph."
...

--- Gemini's Response ---
Deno is a modern and secure runtime for JavaScript and TypeScript that aims to simplify the overall developer experience. Created by the original developer of Node.js, Ryan Dahl, it features security by default (requiring explicit permissions for file, network, and environment access), has built-in support for TypeScript without a separate compilation step, and uses modern ES modules for dependency management instead of a centralized package manager like npm.
-------------------------
```

You can also pass your own prompt as a command-line argument:

```bash
deno run --allow-net --allow-env --allow-read main.ts "What are the three best features of the Rust programming language?"
```
