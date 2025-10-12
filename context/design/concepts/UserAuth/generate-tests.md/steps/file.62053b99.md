---
timestamp: 'Sun Oct 12 2025 13:10:37 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_131037.4fe287f3.md]]'
content_id: 62053b99c716657859248f761491316be0559892f7ce88a2ea553aceb1408e0b
---

# file: src/concepts/UserAuth/UserAuthConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserAuthConcept from "./UserAuthConcept.ts";

Deno.test("UserAuthConcept", async (t) => {
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);

  await t.step("Action: register", async (t) => {
    await t.step("should register a new user successfully", async () => {
      console.log("  - Testing successful user registration");
      const result = await userAuth.register({ username: "alice", password: "password123" });
      console.log("    > register({ username: 'alice', password: 'password123' })");

      // **Effects**: A new user is created and their ID is returned.
      assertExists((result as { user: unknown }).user, "Expected a user ID to be returned.");
      assertNotEquals((result as { error: unknown }).error, "Username already taken.", "Did not expect an error.");
      console.log("    ✔ Effects confirmed: returned a user ID.");

      // **Verification**: The user exists in the database.
      const user = await db.collection("UserAuth.users").findOne({ username: "alice" });
      assertExists(user, "User 'alice' should exist in the database after registration.");
      assertEquals(user.password, "password123");
      console.log("    ✔ State confirmed: user 'alice' was created in the database.");
    });

    await t.step("should return an error if username is taken", async () => {
      console.log("  - Testing registration with a duplicate username");

      // **Requires**: A user with the username 'alice' already exists.
      // (This is satisfied by the previous test step).
      console.log("    > register({ username: 'alice', password: 'password456' })");
      const result = await userAuth.register({ username: "alice", password: "password456" });

      // **Effects**: An error message is returned.
      assertEquals(result, { error: "Username already taken." });
      console.log("    ✔ Effects confirmed: returned the correct error message.");

      // **Verification**: No new user was created.
      const users = await db.collection("UserAuth.users").find({ username: "alice" }).toArray();
      assertEquals(users.length, 1, "Should not create a new user with a duplicate username.");
      console.log("    ✔ State confirmed: no duplicate user was created.");
    });
  });

  await t.step("Action: login", async (t) => {
    // Setup: ensure a user exists
    const regResult = await userAuth.register({ username: "bob", password: "password123" });
    const userId = (regResult as { user: string }).user;

    await t.step("should log in a user with correct credentials and return a token", async () => {
      console.log("  - Testing successful login");
      // **Requires**: A user with username 'bob' and password 'password123' exists.
      console.log("    > login({ username: 'bob', password: 'password123' })");
      const result = await userAuth.login({ username: "bob", password: "password123" });

      // **Effects**: A token is returned.
      const token = (result as { token: string }).token;
      assertExists(token, "Expected a session token to be returned.");
      console.log("    ✔ Effects confirmed: returned a session token.");

      // **Verification**: A session is created in the database linking the token to the user.
      const session = await db.collection("UserAuth.sessions").findOne({ _id: token });
      assertExists(session, "Session should be created in the database.");
      assertEquals(session.user, userId, "Session should be linked to the correct user.");
      console.log("    ✔ State confirmed: a valid session was created in the database.");
    });

    await t.step("should return an error for invalid password", async () => {
      console.log("  - Testing login with incorrect password");
      // **Requires**: User 'bob' exists, but password does not match.
      console.log("    > login({ username: 'bob', password: 'wrongpassword' })");
      const result = await userAuth.login({ username: "bob", password: "wrongpassword" });

      // **Effects**: An error is returned.
      assertEquals(result, { error: "Invalid username or password." });
      console.log("    ✔ Effects confirmed: returned invalid credentials error.");
    });

    await t.step("should return an error for non-existent user", async () => {
      console.log("  -
```
