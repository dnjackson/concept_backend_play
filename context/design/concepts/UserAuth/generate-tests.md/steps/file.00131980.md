---
timestamp: 'Sun Oct 12 2025 13:38:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_133857.e14dd8f4.md]]'
content_id: 001319804568ee46d1d66713675de5aacecb313be1c81b0750e30c290c8b4eb3
---

# file: src/concepts/UserAuth/UserAuthConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals, assertObjectMatch } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import UserAuthConcept from "./UserAuthConcept.ts";

Deno.test("UserAuth Concept: Principle Trace", async () => {
  console.log("=====================================================");
  console.log("🧪 Testing UserAuth Concept Principle");
  console.log("=====================================================");
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);

  // 1. A new user 'alice' registers successfully.
  console.log("\n-> Action: register({ username: 'alice', password: 'password123' })");
  const registerResult = await userAuth.register({ username: "alice", password: "password123" });
  assertExists((registerResult as { user: ID }).user, "Registration should return a user ID.");
  const aliceId = (registerResult as { user: ID }).user;
  console.log(`   Success: Alice registered with ID: ${aliceId}`);

  // 2. Alice tries to register again with the same username, which should fail.
  console.log("\n-> Action: register({ username: 'alice', password: 'password456' }) -- expecting failure");
  const duplicateRegisterResult = await userAuth.register({ username: "alice", password: "password456" });
  assertEquals((duplicateRegisterResult as { error: string }).error, "Username already taken.", "Should not allow duplicate username registration.");
  console.log("   Success: Prevented duplicate registration for 'alice'.");

  // 3. Alice logs in with the correct credentials and receives a session token.
  console.log("\n-> Action: login({ username: 'alice', password: 'password123' })");
  const loginResult = await userAuth.login({ username: "alice", password: "password123" });
  assertExists((loginResult as { token: string }).token, "Login should return a session token.");
  const aliceToken = (loginResult as { token: string }).token;
  console.log(`   Success: Alice logged in and received token: ${aliceToken}`);

  // 4. We use the token to query for her user ID and username, confirming they are correct.
  console.log("\n-> Query: _getUserFromToken({ token: aliceToken })");
  const userFromResult = await userAuth._getUserFromToken({ token: aliceToken });
  assertEquals(userFromResult.length, 1);
  assertObjectMatch(userFromResult[0], { user: aliceId }, "Query should return the correct user ID.");
  console.log("   Success: Token resolves to correct user ID.");

  console.log("\n-> Query: _getUsernameFromToken({ token: aliceToken })");
  const usernameFromResult = await userAuth._getUsernameFromToken({ token: aliceToken });
  assertEquals(usernameFromResult.length, 1);
  assertObjectMatch(usernameFromResult[0], { username: "alice" }, "Query should return the correct username.");
  console.log("   Success: Token resolves to correct username.");

  // 5. Alice logs out using her token.
  console.log("\n-> Action: logout({ token: aliceToken })");
  await userAuth.logout({ token: aliceToken });
  console.log("   Success: Alice logged out.");

  // 6. We try to use the token again; queries should now fail.
  console.log("\n-> Query: _getUserFromToken({ token: aliceToken }) -- expecting failure");
  const postLogoutUserResult = await userAuth._getUserFromToken({ token: aliceToken });
  assertEquals(postLogoutUserResult.length, 1);
  assertObjectMatch(postLogoutUserResult[0], { error: "Invalid token." }, "Query with a logged-out token should fail.");
  console.log("   Success: Logged-out token is now invalid.");

  console.log("\n✅ Principle test passed!");
  await client.close();
});

Deno.test("UserAuth Concept: Action Tests", async (t) => {
  await t.step("register action", async (t) => {
    const [db, client] = await testDb();
    const userAuth = new UserAuthConcept(db);

    await t.step("should register a new user successfully", async () => {
      console.log("\n-> Testing: register() success case");
      console.log("   Requires: Username does not exist.");
      const result = await userAuth.register({ username: "bob", password: "password123" });
      assertExists((result as { user: ID }).user);
      console.log("   Effects: A new user is created and its ID is returned.");
      const userInDb = await userAuth.users.findOne({ username: "bob" });
      assertExists(userInDb, "User 'bob' should exist in the database after registration.");
      assertEquals(userInDb._id, (result as { user: ID }).user);
    });

    await t.step("should fail to register a user with an existing username", async () => {
      console.log("\n-> Testing: register() error case (duplicate username)");
      await userAuth.register({ username: "charlie", password: "password123" });
      console.log("   Requires: Username 'charlie' already exists.");
      const result = await userAuth.register({ username: "charlie", password: "anotherpassword" });
      assertExists((result as { error: string }).error);
      assertEquals((result as { error: string }).error, "Username already taken.");
      console.log("   Effects: An error is returned.");
      const usersCount = await userAuth.users.countDocuments({ username: "charlie" });
      assertEquals(usersCount, 1, "There should still be only one 'charlie'.");
    });

    await client.close();
  });

  await t.step("login action", async (t) => {
    const [db, client] = await testDb();
    const userAuth = new UserAuthConcept(db);
    await userAuth.register({ username: "dave", password: "correctpassword" });

    await t.step("should log in a user with correct credentials", async () => {
      console.log("\n-> Testing: login() success case");
      console.log("   Requires: User 'dave' exists with password 'correctpassword'.");
      const result = await userAuth.login({ username: "dave", password: "correctpassword" });
      assertExists((result as { token: string }).token);
      console.log("   Effects: A session token is created and returned.");
      const sessionInDb = await userAuth.sessions.findOne({ _id: (result as { token: string }).token });
      assertExists(sessionInDb, "A session should be created in the database.");
    });

    await t.step("should fail to log in with an incorrect password", async () => {
      console.log("\n-> Testing: login() error case (wrong password)");
      console.log("   Requires: No user exists with username 'dave' and password 'wrongpassword'.");
      const result = await userAuth.login({ username: "dave", password: "wrongpassword" });
      assertExists((result as { error: string }).error);
      assertEquals((result as { error: string }).error, "Invalid username or password.");
      console.log("   Effects: An error is returned.");
    });

    await t.step("should fail to log in with a non-existent username", async () => {
      console.log("\n-> Testing: login() error case (non-existent user)");
      console.log("   Requires: No user exists with username 'eve'.");
      const result = await userAuth.login({ username: "eve", password: "password123" });
      assertExists((result as { error: string }).error);
      assertEquals((result as { error: string }).error, "Invalid username or password.");
      console.log("   Effects: An error is returned.");
    });

    await client.close();
  });

  await t.step("logout action", async (t) => {
    const [db, client] = await testDb();
    const userAuth = new UserAuthConcept(db);
    await userAuth.register({ username: "frank", password: "password123" });
    const loginResult = await userAuth.login({ username: "frank", password: "password123" });
    const frankToken = (loginResult as { token: string }).token;

    await t.step("should log out an active session", async () => {
      console.log("\n-> Testing: logout() success case");
      console.log("   Requires: A session exists for the given token.");
      let sessionInDb = await userAuth.sessions.findOne({ _id: frankToken });
      assertExists(sessionInDb, "Session should exist before logout.");
      await userAuth.logout({ token: frankToken });
      console.log("   Effects: The session is deleted.");
      sessionInDb = await userAuth.sessions.findOne({ _id: frankToken });
      assertEquals(sessionInDb, null, "Session should not exist after logout.");
    });

    await t.step("should handle logout with a non-existent token gracefully", async () => {
      console.log("\n-> Testing: logout() case for non-existent token");
      console.log("   Requires: No session exists for 'invalid-token'.");
      await userAuth.logout({ token: "invalid-token" });
      console.log("   Effects: The action completes without error.");
      const sessionsCount = await userAuth.sessions.countDocuments();
      assertEquals(sessionsCount, 0, "No sessions should have been affected.");
    });

    await client.close();
  });
});

Deno.test("UserAuth Concept: Query Tests", async (t) => {
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);
  const { user: userId } = await userAuth.register({ username: "grace", password: "password123" }) as { user: ID };
  const { token } = await userAuth.login({ username: "grace", password: "password123" }) as { token: string };

  await t.step("_getUserFromToken query", async (t) => {
    await t.step("should return the user ID for a valid token", async () => {
      console.log("\n-> Testing: _getUserFromToken() success case");
      console.log("   Requires: A session exists for the token.");
      const result = await userAuth._getUserFromToken({ token });
      assertEquals(result.length, 1);
      assertObjectMatch(result[0], { user: userId });
      console.log("   Effects: Returns the associated user ID.");
    });

    await t.step("should return an error for an invalid token", async () => {
      console.log("\n-> Testing: _getUserFromToken() error case (invalid token)");
      console.log("   Requires: No session exists for 'invalid-token'.");
      const result = await userAuth._getUserFromToken({ token: "invalid-token" });
      assertEquals(result.length, 1);
      assertObjectMatch(result[0], { error: "Invalid token." });
      console.log("   Effects: Returns an error.");
    });
  });

  await t.step("_getUsernameFromToken query", async (t) => {
    await t.step("should return the username for a valid token", async () => {
      console.log("\n-> Testing: _getUsernameFromToken() success case");
      console.log("   Requires: A session and corresponding user exist for the token.");
      const result = await userAuth._getUsernameFromToken({ token });
      assertEquals(result.length, 1);
      assertObjectMatch(result[0], { username: "grace" });
      console.log("   Effects: Returns the associated username.");
    });

    await t.step("should return an error for an invalid token", async () => {
      console.log("\n-> Testing: _getUsernameFromToken() error case (invalid token)");
      console.log("   Requires: No session exists for 'invalid-token'.");
      const result = await userAuth._getUsernameFromToken({ token: "invalid-token" });
      assertEquals(result.length, 1);
      assertObjectMatch(result[0], { error: "Invalid token." });
      console.log("   Effects: Returns an error.");
    });

    await t.step("should handle data inconsistency gracefully", async () => {
      console.log("\n-> Testing: _getUsernameFromToken() error case (data inconsistency)");
      const inconsistentToken = "inconsistent-token";
      const nonExistentUserId = "user:nonexistent" as ID;
      // Manually insert a session that points to a user that doesn't exist
      await userAuth.sessions.insertOne({ _id: inconsistentToken, user: nonExistentUserId });
      console.log("   Requires: A session exists, but its user does not.");
      const result = await userAuth._getUsernameFromToken({ token: inconsistentToken });
      assertEquals(result.length, 1);
      assertObjectMatch(result[0], { error: "User for session not found." });
      console.log("   Effects: Returns a specific error for data inconsistency.");
    });
  });

  await client.close();
});

```
