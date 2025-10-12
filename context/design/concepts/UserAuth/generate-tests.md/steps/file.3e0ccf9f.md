---
timestamp: 'Sun Oct 12 2025 13:08:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_130808.d67ef027.md]]'
content_id: 3e0ccf9f0652e32879fbc70c5de23c7978d4ab910ce2e1c1302c0d95a70687ff
---

# file: src/concepts/UserAuth/UserAuthConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserAuthConcept from "./UserAuthConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("UserAuthConcept Action Tests", async (t) => {
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);

  await t.step("register: should create a new user successfully", async () => {
    console.log("\n🧪 Testing: register (success)");
    const result = await userAuth.register({ username: "alice", password: "password123" });

    console.log("  - Action: register({ username: 'alice', password: 'password123' })");
    console.log("  - Result:", result);

    assertExists((result as { user: ID }).user, "Expected a user ID to be returned.");
    const user = await userAuth.users.findOne({ username: "alice" });
    assertEquals(user?.username, "alice");
    assertEquals(user?.password, "password123");
    console.log("  - ✅ Effects confirmed: User 'alice' exists in the database.");
  });

  await t.step("register: should fail if username is already taken", async () => {
    console.log("\n🧪 Testing: register (failure - username taken)");
    const result = await userAuth.register({ username: "alice", password: "anotherpassword" });

    console.log("  - Action: register({ username: 'alice', password: 'anotherpassword' })");
    console.log("  - Result:", result);

    assertEquals(result, { error: "Username already taken." });
    console.log("  - ✅ Requirement confirmed: Cannot register with a duplicate username.");
    const count = await userAuth.users.countDocuments({ username: "alice" });
    assertEquals(count, 1, "Should not create a second user with the same username.");
    console.log("  - ✅ Effects confirmed: No new user was created.");
  });

  await t.step("login: should log in a valid user and return a token", async () => {
    console.log("\n🧪 Testing: login (success)");
    const result = await userAuth.login({ username: "alice", password: "password123" });

    console.log("  - Action: login({ username: 'alice', password: 'password123' })");
    console.log("  - Result:", result);

    assertExists((result as { token: string }).token);
    const token = (result as { token: string }).token;
    const session = await userAuth.sessions.findOne({ _id: token });
    assertExists(session, "A session should be created in the database.");
    console.log("  - ✅ Effects confirmed: A new session was created for 'alice'.");
  });

  await t.step("login: should fail with invalid credentials", async () => {
    console.log("\n🧪 Testing: login (failure - invalid credentials)");

    const badUsernameResult = await userAuth.login({ username: "bob", password: "password123" });
    console.log("  - Action: login({ username: 'bob', password: 'password123' })");
    console.log("  - Result:", badUsernameResult);
    assertEquals(badUsernameResult, { error: "Invalid username or password." });
    console.log("  - ✅ Requirement confirmed: Cannot log in with a non-existent username.");

    const badPasswordResult = await userAuth.login({ username: "alice", password: "wrongpassword" });
    console.log("  - Action: login({ username: 'alice', password: 'wrongpassword' })");
    console.log("  - Result:", badPasswordResult);
    assertEquals(badPasswordResult, { error: "Invalid username or password." });
    console.log("  - ✅ Requirement confirmed: Cannot log in with an incorrect password.");
  });

  await t.step("logout: should remove the user session", async () => {
    console.log("\n🧪 Testing: logout");
    const loginResult = await userAuth.login({ username: "alice", password: "password123" });
    const token = (loginResult as { token: string }).token;
    assertExists(token);
    console.log(`  - Setup: Logged in 'alice' to get token: ${token}`);

    let session = await userAuth.sessions.findOne({ _id: token });
    assertExists(session);

    console.log(`  - Action: logout({ token: '${token}' })`);
    await userAuth.logout({ token });

    session = await userAuth.sessions.findOne({ _id: token });
    assertEquals(session, null, "The session should be deleted after logout.");
    console.log("  - ✅ Effects confirmed: Session was successfully deleted.");
  });

  await client.close();
});

Deno.test("UserAuthConcept Query and Principle Tests", async (t) => {
  const [db, client] = await testDb();
  const userAuth = new UserAuthConcept(db);

  // Setup for queries
  const registerRes = await userAuth.register({ username: "charlie", password: "secure" });
  const userId = (registerRes as { user: ID }).user;
  const loginRes = await userAuth.login({ username: "charlie", password: "secure" });
  const token = (loginRes as { token: string }).token;

  await t.step("_getUserFromToken: should return user ID for a valid token", async () => {
    console.log("\n🧪 Testing query: _getUserFromToken (success)");
    const result = await userAuth._getUserFromToken({ token });
    console.log(`  - Query: _getUserFromToken({ token: '${token}' })`);
    console.log("  - Result:", result);
    assertEquals(result, [{ user: userId }]);
    console.log("  - ✅ Correct user ID returned.");
  });

  await t.step("_getUserFromToken: should return error for an invalid token", async () => {
    console.log("\n🧪 Testing query: _getUserFromToken (failure)");
    const result = await userAuth._getUserFromToken({ token: "invalid-token" });
    console.log("  - Query: _getUserFromToken({ token: 'invalid-token' })");
    console.log("  - Result:", result);
    assertEquals(result, [{ error: "Invalid token." }]);
    console.log("  - ✅ Correct error returned for invalid token.");
  });

  await t.step("_getUsernameFromToken: should return username for a valid token", async () => {
    console.log("\n🧪 Testing query: _getUsernameFromToken (success)");
    const result = await userAuth._getUsernameFromToken({ token });
    console.log(`  - Query: _getUsernameFromToken({ token: '${token}' })`);
    console.log("  - Result:", result);
    assertEquals(result, [{ username: "charlie" }]);
    console.log("  - ✅ Correct username returned.");
  });

  await t.step("Principle: full authentication flow", async () => {
    console.log("\n📜 Testing Principle: A user registers, logs in, uses their token, and logs out.");
    await principleTrace(userAuth);
  });

  await client.close();
});

# trace:

async function principleTrace(userAuth: UserAuthConcept) {
  // 1. A user, 'diana', registers with a username and password.
  console.log("  1. Action: register({ username: 'diana', password: 'pw' })");
  const registerResult = await userAuth.register({ username: "diana", password: "pw" });
  assertExists((registerResult as { user: ID }).user);
  console.log("     - Success: 'diana' is registered.", registerResult);

  // 2. 'diana' logs in with the same credentials to obtain a session token.
  console.log("  2. Action: login({ username: 'diana', password: 'pw' })");
  const loginResult = await userAuth.login({ username: "diana", password: "pw" });
  const token = (loginResult as { token: string }).token;
  assertExists(token);
  console.log(`     - Success: 'diana' logged in, received token '${token.substring(0, 8)}...'`);

  // 3. While the token is valid, it can be used to identify the user.
  console.log(`  3. Query: _getUsernameFromToken({ token: '${token.substring(0, 8)}...' })`);
  const whoAmIResult = await userAuth._getUsernameFromToken({ token });
  assertEquals(whoAmIResult, [{ username: "diana" }]);
  console.log("     - Success: Token correctly identified user as 'diana'.");

  // 4. 'diana' logs out, which should invalidate the token.
  console.log(`  4. Action: logout({ token: '${token.substring(0, 8)}...' })`);
  await userAuth.logout({ token });
  console.log("     - Success: 'diana' logged out.");

  // 5. After logging out, the token is no longer valid.
  console.log(`  5. Query: _getUsernameFromToken({ token: '${token.substring(0, 8)}...' })`);
  const finalCheckResult = await userAuth._getUsernameFromToken({ token });
  assertEquals(finalCheckResult, [{ error: "Invalid token." }]);
  console.log("     - Success: The invalidated token can no longer identify the user.");
  console.log("\n  - ✅ Principle successfully demonstrated.");
}

```
