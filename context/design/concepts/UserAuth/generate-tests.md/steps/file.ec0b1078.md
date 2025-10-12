---
timestamp: 'Sun Oct 12 2025 11:09:21 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_110921.99e7cf84.md]]'
content_id: ec0b10780558878b9a4cfcb97fbab4bf3af658702c84e13ee4db44f0f07dd7a4
---

# file: src/concepts/UserAuth/UserAuthConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import UserAuthConcept from "./UserAuthConcept.ts";

/**
 * # CONCEPT SPECIFICATION (for reference during testing)
 *
 * ## concept: UserAuth [User]
 *
 * ## purpose: authenticate users by username and password
 *
 * ## principle: if a user registers with a username and password, then they can subsequently login with the same username and password to be authenticated.
 *
 * ## state:
 *   a set of Users with
 *     a username String
 *     a password String (stored as a hash)
 *
 * ## actions:
 *   register (username: String, password: String): (user: User) | (error: String)
 *   login (username: String, password: String): (user: User) | (error: String)
 *
 * ## queries:
 *   _getUserById (id: User): (users: UserDoc[])
 *   _getUserByUsername (username: String): (users: UserDoc[])
 */

Deno.test("Principle: A user can register and then login successfully", async () => {
  console.log("TEST: Principle - A user can register and then login successfully.");
  const [db, client] = await testDb();
  try {
    const userAuth = new UserAuthConcept(db);
    const username = "testUserPrinciple";
    const password = "password123";

    // Trace Step 1: Register a new user
    console.log(`  -> ACTION: register({ username: "${username}", password: "..." })`);
    const registerResult = await userAuth.register({ username, password });
    console.log("  <- RESULT:", registerResult);

    // Assert registration was successful
    assertNotEquals("error" in registerResult, true, "Registration should not return an error.");
    const { user: userId } = registerResult as { user: ID };
    assertExists(userId, "Registration should return a user ID.");

    // Trace Step 2: Login with the same credentials
    console.log(`  -> ACTION: login({ username: "${username}", password: "..." })`);
    const loginResult = await userAuth.login({ username, password });
    console.log("  <- RESULT:", loginResult);

    // Assert login was successful and returned the same user ID
    assertNotEquals("error" in loginResult, true, "Login should not return an error.");
    const { user: loggedInUserId } = loginResult as { user: ID };
    assertEquals(loggedInUserId, userId, "Login should return the same user ID as registration.");
    console.log("✅ Principle fulfilled: Successful registration followed by a successful login authenticates the user.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: register", async (t) => {
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);

  await t.step("should successfully register a new user with valid credentials", async () => {
    console.log("TEST: register [effects] - Should succeed with valid, unique credentials.");
    const username = "alice";
    const password = "securePassword123";

    console.log(`  -> ACTION: register({ username: "${username}", password: "..." })`);
    const result = await userAuth.register({ username, password });
    console.log("  <- RESULT:", result);

    // Check effects: returns a user ID
    assertNotEquals("error" in result, true, "Registration should succeed.");
    const { user: userId } = result as { user: ID };
    assertExists(userId, "A user ID must be returned on success.");

    // Check effects: user is stored in the database correctly
    const userDoc = await db.collection("UserAuth.users").findOne({ _id: userId });
    assertExists(userDoc, "User document should exist in the database.");
    assertEquals(userDoc.username, username, "Stored username should match the input.");
    assertNotEquals(userDoc.passwordHash, password, "Password should be hashed, not stored in plaintext.");
    console.log("✅ Effects confirmed: User created in DB with correct username and a hashed password.");
  });

  await t.step("should fail if username is already taken", async () => {
    console.log("TEST: register [requires] - Should fail if username is already taken.");
    const username = "bob";
    const password = "passwordForBob";
    await userAuth.register({ username, password }); // First registration should succeed

    console.log(`  -> ACTION: register({ username: "${username}", password: "anotherPassword" })`);
    const result = await userAuth.register({ username, password: "anotherPassword" }); // Second attempt
    console.log("  <- RESULT:", result);

    // Check effects: returns an error
    assertEquals("error" in result, true, "Registration should fail with an error.");
    const { error } = result as { error: string };
    assertEquals(error, "Username already taken.", "Error message should indicate the username is taken.");
    console.log("✅ Requirement confirmed: Cannot register with a duplicate username.");
  });

  await t.step("should fail if password is too short", async () => {
    console.log("TEST: register [requires] - Should fail if password is too short.");
    const username = "shortPassUser";
    const shortPassword = "short"; // Less than 8 chars

    console.log(`  -> ACTION: register({ username: "${username}", password: "${shortPassword}" })`);
    const result = await userAuth.register({ username, password: shortPassword });
    console.log("  <- RESULT:", result);

    // Check effects: returns an error
    assertEquals("error" in result, true, "Registration should fail with an error.");
    const { error } = result as { error: string };
    assertEquals(error, "Password must be at least 8 characters long.", "Error message should indicate password length requirement.");
    console.log("✅ Requirement confirmed: Cannot register with a password shorter than 8 characters.");
  });

  await client.close();
});

Deno.test("Action: login", async (t) => {
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);
  const username = "charlie";
  const password = "correct-horse-battery-staple";

  // Setup: Register a user to test login against
  const registerResult = await userAuth.register({ username, password });
  const { user: userId } = registerResult as { user: ID };

  await t.step("should fail with an incorrect password", async () => {
    console.log("TEST: login [requires] - Should fail with an incorrect password.");
    const wrongPassword = "incorrect-password";

    console.log(`  -> ACTION: login({ username: "${username}", password: "${wrongPassword}" })`);
    const result = await userAuth.login({ username, password: wrongPassword });
    console.log("  <- RESULT:", result);

    // Check effects: returns an error
    assertEquals("error" in result, true, "Login should fail with an error.");
    const { error } = result as { error: string };
    assertEquals(error, "Invalid username or password.", "Error message should be generic for security.");
    console.log("✅ Requirement confirmed: Login fails with wrong password.");
  });

  await t.step("should fail with a non-existent username", async () => {
    console.log("TEST: login [requires] - Should fail with a non-existent username.");
    const nonExistentUser = "dave";

    console.log(`  -> ACTION: login({ username: "${nonExistentUser}", password: "${password}" })`);
    const result = await userAuth.login({ username: nonExistentUser, password });
    console.log("  <- RESULT:", result);

    // Check effects: returns an error
    assertEquals("error" in result, true, "Login should fail with an error.");
    const { error } = result as { error: string };
    assertEquals(error, "Invalid username or password.", "Error message should be generic for security.");
    console.log("✅ Requirement confirmed: Login fails with non-existent username.");
  });

  await client.close();
});

Deno.test("Queries: should retrieve user data correctly", async (t) => {
  console.log("TEST: Queries - Verifying user data retrieval.");
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);

  // Setup: Register a user to query against
  const username = "queryUser";
  const password = "a-very-secure-password";
  console.log(`  -> ACTION: register({ username: "${username}", password: "..." })`);
  const registerResult = await userAuth.register({ username, password });
  const { user: userId } = registerResult as { user: ID };
  console.log(`  <- RESULT: User registered with ID: ${userId}`);

  await t.step("should get user by ID", async () => {
    console.log(`  -> QUERY: _getUserById({ id: "${userId}" })`);
    const users = await userAuth._getUserById({ id: userId });
    console.log("  <- RESULT:", users);

    assertEquals(users.length, 1, "Should find exactly one user for a valid ID.");
    const userDoc = users[0];
    assertEquals(userDoc._id, userId, "The retrieved user's ID should match the queried ID.");
    assertEquals(userDoc.username, username, "The retrieved user's username should be correct.");
    assertExists(userDoc.passwordHash, "The user document should contain a password hash.");
    console.log("✅ Query successful: _getUserById returns correct user data.");
  });

  await t.step("should return an empty array for a non-existent ID", async () => {
    const nonExistentId = "user:nonexistent" as ID;
    console.log(`  -> QUERY: _getUserById({ id: "${nonExistentId}" })`);
    const users = await userAuth._getUserById({ id: nonExistentId });
    console.log("  <- RESULT:", users);

    assertEquals(users.length, 0, "Should return an empty array for a non-existent ID.");
    console.log("✅ Query successful: _getUserById handles non-existent IDs correctly.");
  });

  await t.step("should get user by username", async () => {
    console.log(`  -> QUERY: _getUserByUsername({ username: "${username}" })`);
    const users = await userAuth._getUserByUsername({ username });
    console.log("  <- RESULT:", users);

    assertEquals(users.length, 1, "Should find exactly one user for a valid username.");
    const userDoc = users[0];
    assertEquals(userDoc._id, userId, "The retrieved user's ID should be correct.");
    assertEquals(userDoc.username, username, "The retrieved user's username should match the queried username.");
    console.log("✅ Query successful: _getUserByUsername returns correct user data.");
  });

  await t.step("should return an empty array for a non-existent username", async () => {
    const nonExistentUsername = "not-a-real-user";
    console.log(`  -> QUERY: _getUserByUsername({ username: "${nonExistentUsername}" })`);
    const users = await userAuth._getUserByUsername({ username: nonExistentUsername });
    console.log("  <- RESULT:", users);

    assertEquals(users.length, 0, "Should return an empty array for a non-existent username.");
    console.log("✅ Query successful: _getUserByUsername handles non-existent usernames correctly.");
  });

  await client.close();
});
```
