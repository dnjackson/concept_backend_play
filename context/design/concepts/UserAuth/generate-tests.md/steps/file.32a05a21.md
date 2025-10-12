---
timestamp: 'Sun Oct 12 2025 13:16:54 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_131654.9df7b3c2.md]]'
content_id: 32a05a2128d628da465dfb7b6cf3137c7d3e2c6c7b1e08ade861fbc7baa232dc
---

# file: src/concepts/UserAuth/UserAuthConcept.test.ts

````typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserAuthConcept from "./UserAuthConcept.ts";

Deno.test("UserAuth Concept", async (t) => {
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);

  // Test data
  const userAlice = { username: "alice", password: "password123" };
  const userBob = { username: "bob", password: "password456" };

  await t.step("Action: register", async (t) => {
    await t.step("Success: should register a new user", async () => {
      console.log("  - Testing successful registration for", userAlice.username);
      console.log("    - requires: username is not taken");
      const result = await userAuth.register(userAlice);
      console.log("    - result:", result);

      assertNotEquals(result, { error: "Username already taken." }, "Registration should not return an error.");
      assertExists((result as { user: unknown }).user, "Result should contain a user ID.");

      console.log("    - effects: a new User
# response:

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserAuthConcept from "./UserAuthConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("UserAuth Concept", async (t) => {
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);

  // Test data
  const userAlice = { username: "alice", password: "password123" };
  const userBob = { username: "bob", password: "password456" };
  let aliceId: ID;
  let bobId: ID;

  await t.step("Action: register", async (t) => {
    await t.step("Success: should register a new user", async () => {
      console.log(`\n  - Testing successful registration for user: ${userAlice.username}`);
      console.log("    - requires: username is not taken");
      const result = await userAuth.register(userAlice);
      console.log("    - result:", result);

      assertNotEquals((result as { error: string }).error, "Username already taken.", "Registration should not return a 'taken' error.");
      assertExists((result as { user: ID }).user, "Result should contain a user ID.");
      aliceId = (result as { user: ID }).user;

      console.log("    - effects: a new User is created in the database");
      const dbUser = await userAuth.users.findOne({ _id: aliceId });
      assertExists(dbUser, "User should be found in the database by ID.");
      assertEquals(dbUser.username, userAlice.username);
    });

    await t.step("Failure: should not register a user with a taken username", async () => {
      console.log(`\n  - Testing failed registration for existing user: ${userAlice.username}`);
      console.log("    - requires: username is already taken");
      const result = await userAuth.register(userAlice);
      console.log("    - result:", result);

      assertExists((result as { error: string }).error, "Result should contain an error.");
      assertEquals((result as { error: string }).error, "Username already taken.");

      console.log("    - effects: no new user is created");
      const users = await userAuth.users.find({ username: userAlice.username }).toArray();
      assertEquals(users.length, 1, "There should still be only one user named Alice.");
    });
  });

  let aliceToken: string;

  await t.step("Action: login", async (t) => {
    await t.step("Failure: should not login with incorrect password", async () => {
      console.log(`\n  - Testing failed login for ${userAlice.username} with wrong password`);
      console.log("    - requires: user exists, but password doesn't match");
      const result = await userAuth.login({ username: userAlice.username, password: "wrongpassword" });
      console.log("    - result:", result);

      assertEquals((result as { error: string }).error, "Invalid username or password.");

      console.log("    - effects: no session is created");
      const sessionCount = await userAuth.sessions.countDocuments();
      assertEquals(sessionCount, 0);
    });

    await t.step("Success: should login a registered user and return a token", async () => {
      console.log(`\n  - Testing successful login for ${userAlice.username}`);
      console.log("    - requires: user exists with matching credentials");
      const result = await userAuth.login(userAlice);
      console.log("    - result:", result);

      assertExists((result as { token: string }).token, "Result should contain a session token.");
      aliceToken = (result as { token: string }).token;

      console.log("    - effects: a new session is created for the user");
      const session = await userAuth.sessions.findOne({ _id: aliceToken });
      assertExists(session, "A session document should exist for the new token.");
      assertEquals(session.user, aliceId);
    });
  });

  await t.step("Queries: _getUserFromToken & _getUsernameFromToken", async (t) => {
    await t.step("Success: should retrieve user info with a valid token", async () => {
      console.log("\n  - Testing queries with a valid token");
      console.log("    - requires: a session exists for the given token");
      const userResult = await userAuth._getUserFromToken({ token: aliceToken });
      console.log("    - _getUserFromToken result:", userResult);
      assertEquals(userResult, [{ user: aliceId }]);

      const usernameResult = await userAuth._getUsernameFromToken({ token: aliceToken });
      console.log("    - _getUsernameFromToken result:", usernameResult);
      assertEquals(usernameResult, [{ username: userAlice.username }]);
      console.log("    - effects: correct user ID and username are returned");
    });

    await t.step("Failure: should return an error with an invalid token", async () => {
      const invalidToken = "not-a-real-token";
      console.log("\n  - Testing queries with an invalid token");
      console.log("    - requires: no session exists for the given token");

      const userResult = await userAuth._getUserFromToken({ token: invalidToken });
      console.log("    - _getUserFromToken result:", userResult);
      assertEquals(userResult, [{ error: "Invalid token." }]);

      const usernameResult = await userAuth._getUsernameFromToken({ token: invalidToken });
      console.log("    - _getUsernameFromToken result:", usernameResult);
      assertEquals(usernameResult, [{ error: "Invalid token." }]);
      console.log("    - effects: an error is returned");
    });
  });

  await t.step("Action: logout", async (t) => {
    await t.step("Success: should delete the session for a given token", async () => {
      console.log(`\n  - Testing successful logout for ${userAlice.username}`);
      console.log("    - requires: a session exists for the given token");
      const result = await userAuth.logout({ token: aliceToken });
      console.log("    - result:", result);
      assertEquals(result, {}, "Logout should return an empty object.");

      console.log("    - effects: the session is deleted from the database");
      const session = await userAuth.sessions.findOne({ _id: aliceToken });
      assertEquals(session, null, "Session should no longer exist after logout.");
    });
  });

  await t.step("Principle: Full authentication lifecycle", async () => {
    console.log("\n# trace: Modeling the full principle for a new user, Bob");

    // 1. Register
    console.log("  1. Bob registers with his credentials.");
    const regResult = await userAuth.register(userBob);
    bobId = (regResult as { user: ID }).user;
    assertExists(bobId, "Bob should be registered successfully.");
    console.log(`     -> Bob registered with ID: ${bobId}`);

    // 2. Login to get a token
    console.log("  2. Bob logs in with the same credentials.");
    const loginResult = await userAuth.login(userBob);
    const bobToken = (loginResult as { token: string }).token;
    assertExists(bobToken, "Bob should receive a token upon login.");
    console.log(`     -> Bob received token: ${bobToken.substring(0, 10)}...`);

    // 3. Use the token to prove identity
    console.log("  3. The system uses Bob's token to verify his identity.");
    const whoIsBob = await userAuth._getUsernameFromToken({ token: bobToken });
    assertEquals(whoIsBob, [{ username: userBob.username }], "Token should resolve to Bob's username.");
    console.log(`     -> Token verified. User is: ${userBob.username}`);

    // 4. Logout
    console.log("  4. Bob logs out, invalidating his token.");
    await userAuth.logout({ token: bobToken });
    const sessionCount = await userAuth.sessions.countDocuments({ _id: bobToken });
    assertEquals(sessionCount, 0, "Bob's session should be deleted.");
    console.log("     -> Bob's session was successfully deleted.");

    // 5. Token is now invalid
    console.log("  5. The system tries to use the old token again.");
    const whoIsBobAfterLogout = await userAuth._getUsernameFromToken({ token: bobToken });
    assertEquals(whoIsBobAfterLogout, [{ error: "Invalid token." }], "The old token should now be invalid.");
    console.log("     -> Token is now invalid, as expected.");
    console.log("Principle successfully demonstrated.");
  });

  await client.close();
});
````
