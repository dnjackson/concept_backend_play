---
timestamp: 'Sun Oct 12 2025 13:06:35 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_130635.c91fc984.md]]'
content_id: 49ec219d0c26a8e60316b7c7591b725b266ec84b6281667cb701afd7d0e8378e
---

# file: src/concepts/UserAuth/UserAuthConcept.test.ts

```typescript
import { testDb } from "@utils/database.ts";
import { assertEquals, assertExists } from "jsr:@std/assert";
import UserAuthConcept from "./UserAuthConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("UserAuthConcept: register action", async (t) => {
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);

  await t.step("should register a new user successfully", async () => {
    console.log("  - Testing successful user registration");
    const result = await userAuth.register({ username: "alice", password: "password123" });
    console.log("    Action: register({ username: 'alice', password: 'password123' })");
    console.log("    Result:", result);

    assertExists((result as { user: ID }).user, "Expected a user ID to be returned.");
    assertEquals("error" in result, false, "Expected no error for successful registration.");

    // Effect verification
    const user = await userAuth.users.findOne({ username: "alice" });
    assertExists(user, "User 'alice' should exist in the database after registration.");
    assertEquals(user.password, "password123");
  });

  await t.step("should return an error when username is already taken", async () => {
    console.log("  - Testing registration with a duplicate username");
    // Pre-condition: User 'alice' already exists from the previous step.
    const result = await userAuth.register({ username: "alice", password: "anotherpassword" });
    console.log("    Action: register({ username: 'alice', password: 'anotherpassword' })");
    console.log("    Result:", result);

    assertExists((result as { error: string }).error, "Expected an error message for duplicate username.");
    assertEquals((result as { error: string }).error, "Username already taken.");

    // Effect verification: ensure no new user was created
    const userCount = await userAuth.users.countDocuments({ username: "alice" });
    assertEquals(userCount, 1, "Should not create a new user with a duplicate username.");
  });

  await client.close();
});

Deno.test("UserAuthConcept: login action", async (t) => {
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);

  // Setup: Register a user to test login against
  await userAuth.register({ username: "bob", password: "password456" });
  console.log("  - Setup: Registered user 'bob'");

  await t.step("should log in a user with correct credentials", async () => {
    console.log("  - Testing successful login");
    const result = await userAuth.login({ username: "bob", password: "password456" });
    console.log("    Action: login({ username: 'bob', password: 'password456' })");
    console.log("    Result:", result);

    assertExists((result as { token: string }).token, "Expected a session token to be returned.");
    assertEquals("error" in result, false, "Expected no error for successful login.");

    // Effect verification
    const session = await userAuth.sessions.findOne({ _id: (result as { token: string }).token });
    assertExists(session, "A session should be created in the database upon login.");
  });

  await t.step("should return an error with incorrect password", async () => {
    console.log("  - Testing login with incorrect password");
    const result = await userAuth.login({ username: "bob", password: "wrongpassword" });
    console.log("    Action: login({ username: 'bob', password: 'wrongpassword' })");
    console.log("    Result:", result);

    assertExists((result as { error: string }).error, "Expected an error for incorrect password.");
    assertEquals((result as { error: string }).error, "Invalid username or password.");
  });

  await t.step("should return an error with non-existent username", async () => {
    console.log("  - Testing login with a non-existent username");
    const result = await userAuth.login({ username: "charlie", password: "password789" });
    console.log("    Action: login({ username: 'charlie', password: 'password789' })");
    console.log("    Result:", result);

    assertExists((result as { error: string }).error, "Expected an error for non-existent user.");
    assertEquals((result as { error: string }).error, "Invalid username or password.");
  });

  await client.close();
});

Deno.test("UserAuthConcept: query actions with invalid token", async (t) => {
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);

  await t.step("should return an error when querying user with an invalid token", async () => {
    console.log("  - Testing _getUserFromToken with an invalid token");
    const result = await userAuth._getUserFromToken({ token: "invalid-token" });
    console.log("    Query: _getUserFromToken({ token: 'invalid-token' })");
    console.log("    Result:", result);
    assertEquals(result.length, 1);
    assertEquals((result[0] as { error: string }).error, "Invalid token.");
  });

  await t.step("should return an error when querying username with an invalid token", async () => {
    console.log("  - Testing _getUsernameFromToken with an invalid token");
    const result = await userAuth._getUsernameFromToken({ token: "invalid-token" });
    console.log("    Query: _getUsernameFromToken({ token: 'invalid-token' })");
    console.log("    Result:", result);
    assertEquals(result.length, 1);
    assertEquals((result[0] as { error: string }).error, "Invalid token.");
  });

  await client.close();
});

Deno.test("UserAuthConcept: principle trace - register, login, query, logout", async () => {
  console.log("\nTesting UserAuth Principle:");
  console.log("If a user registers, they can log in to get a token, use the token to be identified, and then log out to invalidate the token.");

  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);
  const username = "diana";
  const password = "passwordxyz";

  // 1. A user registers
  console.log("\nStep 1: Register a new user 'diana'");
  const regResult = await userAuth.register({ username, password });
  console.log("  Action: register({ username: 'diana', password: 'passwordxyz' }) ->", regResult);
  const userId = (regResult as { user: ID }).user;
  assertExists(userId, "Registration should succeed and return a user ID.");

  // 2. The user logs in with the same credentials
  console.log("\nStep 2: Log in as 'diana'");
  const loginResult = await userAuth.login({ username, password });
  console.log("  Action: login({ username: 'diana', password: 'passwordxyz' }) ->", loginResult);
  const token = (loginResult as { token: string }).token;
  assertExists(token, "Login should succeed and return a token.");

  // 3. The token can be used to identify them
  console.log("\nStep 3: Use the token to identify the user");
  const userQueryResult = await userAuth._getUserFromToken({ token });
  console.log("  Query: _getUserFromToken({ token: '...' }) ->", userQueryResult);
  assertEquals((userQueryResult[0] as { user: ID }).user, userId, "Query should return the correct user ID.");

  const usernameQueryResult = await userAuth._getUsernameFromToken({ token });
  console.log("  Query: _getUsernameFromToken({ token: '...' }) ->", usernameQueryResult);
  assertEquals((usernameQueryResult[0] as { username: string }).username, username, "Query should return the correct username.");

  // 4. The user logs out, invalidating the token
  console.log("\nStep 4: Log out to invalidate the token");
  await userAuth.logout({ token });
  console.log("  Action: logout({ token: '...' })");
  const sessionCount = await userAuth.sessions.countDocuments({ _id: token });
  assertEquals(sessionCount, 0, "Session should be deleted after logout.");

  // 5. The token can no longer be used
  console.log("\nStep 5: Verify the token is now invalid");
  const finalUserQuery = await userAuth._getUserFromToken({ token });
  console.log("  Query: _getUserFromToken({ token: '...' }) ->", finalUserQuery);
  assertEquals((finalUserQuery[0] as { error: string }).error, "Invalid token.", "Token should be invalid after logout.");

  const finalUsernameQuery = await userAuth._getUsernameFromToken({ token });
  console.log("  Query: _getUsernameFromToken({ token: '...' }) ->", finalUsernameQuery);
  assertEquals((finalUsernameQuery[0] as { error: string }).error, "Invalid token.", "Token should be invalid after logout.");

  console.log("\nPrinciple test completed successfully.");
  await client.close();
});
```
