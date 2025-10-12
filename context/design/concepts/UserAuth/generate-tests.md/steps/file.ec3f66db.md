---
timestamp: 'Sun Oct 12 2025 13:01:00 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_130100.e7579b5e.md]]'
content_id: ec3f66db8814b7256049e03d8f91f6a07879a9dc2892b34f6e75242b03458dd2
---

# file: src/concepts/UserAuth/UserAuthConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserAuthConcept from "./UserAuthConcept.ts";
import { ID } from "@utils/types.ts";

/**
 * @concept UserAuth [User]
 * @purpose To verify a user's identity and grant them a temporary session for access.
 * @principle If a user registers with a username and password, then they can log in with the same credentials to receive a session token. Using this token, their identity can be verified. If they log out, the token becomes invalid.
 */
Deno.test("UserAuthConcept", async (t) => {
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);

  // Test data
  const username = "testuser";
  const password = "password123";
  const wrongPassword = "wrongpassword";

  await t.step("Action: register", async (t) => {
    await t.step("should register a new user successfully", async () => {
      console.log("  - Testing successful registration...");
      const result = await userAuth.register({ username, password });
      console.log(`    - register({ username: "${username}", password: "..." }) ->`, result);

      assertNotEquals((result as { error: string }).error, undefined, "Expected successful registration, but got an error.");
      assertExists((result as { user: ID }).user, "Expected a user ID to be returned.");

      // **Effects**: A new User is created.
      const userInDb = await userAuth.users.findOne({ username });
      assertExists(userInDb, "User should exist in the database after registration.");
      assertEquals(userInDb?._id, (result as { user: ID }).user);
      assertEquals(userInDb?.password, password);
    });

    await t.step("should fail to register a user with a taken username", async () => {
      console.log("  - Testing registration with a duplicate username...");
      // **Requires**: A user already exists with the given username.
      const result = await userAuth.register({ username, password });
      console.log(`    - register({ username: "${username}", password: "..." }) ->`, result);

      assertExists((result as { error: string }).error, "Expected an error for duplicate username.");
      assertEquals((result as { error: string }).error, "Username already taken.");

      // **Effects**: No new user is created.
      const userCount = await userAuth.users.countDocuments({ username });
      assertEquals(userCount, 1, "No new user should be created.");
    });
  });

  await t.step("Action: login", async (t) => {
    await t.step("should log in a registered user successfully", async () => {
      console.log("  - Testing successful login...");
      // **Requires**: A user `u` exists with matching username and password.
      const result = await userAuth.login({ username, password });
      console.log(`    - login({ username: "${username}", password: "..." }) ->`, result);

      assertNotEquals((result as { error: string }).error, undefined, "Expected successful login, but got an error.");
      const { token } = result as { token: string };
      assertExists(token);

      // **Effects**: A new session is created.
      const sessionInDb = await userAuth.sessions.findOne({ _id: token });
      assertExists(sessionInDb, "Session should exist in the database after login.");

      const userInDb = await userAuth.users.findOne({ username });
      assertEquals(sessionInDb?.user, userInDb?._id);
    });

    await t.step("should fail to log in with an incorrect password", async () => {
      console.log("  - Testing login with incorrect password...");
      // **Requires**: No user `u` exists with matching username and password.
      const result = await userAuth.login({ username, password: wrongPassword });
      console.log(`    - login({ username: "${username}", password: "..." }) ->`, result);

      assertExists((result as { error: string }).error);
      assertEquals((result as { error: string }).error, "Invalid username or password.");

      // **Effects**: No session is created.
      const sessionCount = await userAuth.sessions.countDocuments();
      // One session from the successful login test above.
      assertEquals(sessionCount, 1, "No new session should be created on failed login.");
    });

    await t.step("should fail to log in with a non-existent username", async () => {
      console.log("  - Testing login with non-existent username...");
      const result = await userAuth.login({ username: "nouser", password });
      console.log(`    - login({ username: "nouser", password: "..." }) ->`, result);

      assertExists((result as { error: string }).error);
      assertEquals((result as { error: string }).error, "Invalid username or password.");
    });
  });

  // This block tests multiple actions and queries in sequence to validate the principle.
  await t.step("Principle: Full authentication flow", async () => {
    console.log("\n# Trace: Testing the operational principle of UserAuth");
    const testUsername = "principle_user";
    const testPassword = "principle_password";
    let userId: ID;
    let token: string;

    // 1. A user registers with a username and password
    console.log("  1. Registering a new user...");
    const regResult = await userAuth.register({ username: testUsername, password: testPassword });
    console.log(`     ->`, regResult);
    userId = (regResult as { user: ID }).user;
    assertExists(userId);

    // 2. They can log in with the same credentials to receive a session token
    console.log("  2. Logging in with the correct credentials...");
    const loginResult = await userAuth.login({ username: testUsername, password: testPassword });
    console.log(`     ->`, loginResult);
    token = (loginResult as { token: string }).token;
    assertExists(token);

    // 3. Using this token, their identity can be verified
    console.log("  3. Verifying identity with the token...");
    const getUserResult = await userAuth._getUserFromToken({ token });
    console.log(`     -> _getUserFromToken(...) ->`, getUserResult);
    assertEquals(getUserResult.length, 1);
    assertEquals((getUserResult[0] as { user: ID }).user, userId);

    const getUsernameResult = await userAuth._getUsernameFromToken({ token });
    console.log(`     -> _getUsernameFromToken(...) ->`, getUsernameResult);
    assertEquals(getUsernameResult.length, 1);
    assertEquals((getUsernameResult[0] as { username: string }).username, testUsername);

    // 4. If they log out, the token becomes invalid
    console.log("  4. Logging out...");
    const logoutResult = await userAuth.logout({ token });
    console.log(`     -> logout(...) ->`, logoutResult);
    assertEquals(logoutResult, {});

    console.log("  5. Verifying the token is now invalid...");
    const finalCheckResult = await userAuth._getUserFromToken({ token });
    console.log(`     -> _getUserFromToken(...) ->`, finalCheckResult);
    assertEquals(finalCheckResult.length, 1);
    assertEquals((finalCheckResult[0] as { error: string }).error, "Invalid token.");
    console.log("# Trace: Principle test completed successfully.\n");
  });

  await t.step("Action: logout", async (t) => {
    await t.step("should do nothing when logging out with an invalid token", async () => {
      console.log("  - Testing logout with an invalid/non-existent token...");
      const sessionCountBefore = await userAuth.sessions.countDocuments();
      const result = await userAuth.logout({ token: "invalidtoken" });
      console.log(`    - logout({ token: "invalidtoken" }) ->`, result);

      assertEquals(result, {});
      const sessionCountAfter = await userAuth.sessions.countDocuments();
      assertEquals(sessionCountAfter, sessionCountBefore, "Logout with invalid token should not change session count.");
    });
  });

  await t.step("Query: _getUserFromToken and _getUsernameFromToken", async (t) => {
    await t.step("should return an error for an invalid token", async () => {
      console.log("  - Testing queries with an invalid token...");
      const userResult = await userAuth._getUserFromToken({ token: "invalidtoken" });
      console.log(`    - _getUserFromToken({ token: "invalidtoken" }) ->`, userResult);
      assertEquals((userResult[0] as { error: string }).error, "Invalid token.");

      const usernameResult = await userAuth._getUsernameFromToken({ token: "invalidtoken" });
      console.log(`    - _getUsernameFromToken({ token: "invalidtoken" }) ->`, usernameResult);
      assertEquals((usernameResult[0] as { error: string }).error, "Invalid token.");
    });

    await t.step("should handle data inconsistency (session for deleted user)", async () => {
      console.log("  - Testing _getUsernameFromToken for session with non-existent user...");
      // Manually insert a session that points to a non-existent user ID
      const danglingSession = { _id: "danglingtoken", user: "user:dangling" as ID };
      await userAuth.sessions.insertOne(danglingSession);

      const result = await userAuth._getUsernameFromToken({ token: "danglingtoken" });
      console.log(`    - _getUsernameFromToken({ token: "danglingtoken" }) ->`, result);
      assertEquals((result[0] as { error: string }).error, "User for session not found.");

      // Cleanup
      await userAuth.sessions.deleteOne({ _id: "danglingtoken" });
    });
  });

  // Teardown
  await client.close();
});
```
