---
timestamp: 'Sun Oct 12 2025 13:44:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_134447.4731ad6d.md]]'
content_id: 49723103991d27ea4f23cda8e00ac049b89cf93d420120d8cbcf9254b9d83826
---

# response:

Based on the Deno project structure and the fact that your tests interact with a database, you should use the `deno test` command with the necessary permissions.

To run all the test files in your project, navigate to the root directory of your project in the terminal and run the following command:

```bash
deno test --allow-net --allow-env
```

### Explanation of the Command

* `deno test`: This is the built-in Deno command that automatically discovers and runs any files ending in `_test.ts`, `.test.ts`, `_test.js`, or `.test.js` in the current directory and all subdirectories.
* `--allow-net`: This flag grants the code permission to make network connections. It is **required** because your tests connect to a MongoDB database.
* `--allow-env`: This flag grants the code permission to access environment variables. It is **required** because the `testDb` utility needs to read your database connection string, which is typically stored in a `.env` file.

### Running Tests Sequentially

By default, Deno's test runner may execute tests concurrently to speed things up. The user asked for the tests to be run "in sequence". While the provided test setup with isolated databases for each file should prevent issues, if you want to strictly enforce that all tests run one after another, you can add the `--jobs=1` flag:

```bash
deno test --jobs=1 --allow-net --allow-env
```

This forces the test runner to use only a single worker, ensuring sequential execution.
