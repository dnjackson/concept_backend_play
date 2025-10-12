---
timestamp: 'Sun Oct 12 2025 11:00:24 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_110024.50af14cf.md]]'
content_id: 0a556a79d165b4070f663645bdb9013553e8023a2fe03eb3d39d9c41cfce60cf
---

# file: src/UserAuth/UserAuthConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID, freshID } from "@utils/types.ts";

/**
 * A helper function to securely hash a password using SHA-256.
 * In a production environment, a stronger, salted hashing algorithm like Argon2 or bcrypt would be preferred.
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // convert bytes to hex string
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

const PREFIX = "UserAuth" + ".";

// Generic types for this concept
type User = ID;

/**
 * @purpose authenticate users by username and password
 */

/**
 * state: a set of Users with
 *  a username String
 *  a password String (stored as a secure hash)
 */
interface UserDoc {
  _id: User;
  username: string;
  passwordHash: string;
}

export default class UserAuthConcept {
  users: Collection<UserDoc>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
    // Create a unique index on username to enforce the 'requires' condition of register at the database level
    this.users.createIndex({ username: 1 }, { unique: true });
  }

  /**
   * register (username: String, password: String): (user: User) | (error: String)
   *
   * **requires** username is not already taken
   *
   * **effects** creates a new User `u` with the given username and a hash of the password; returns the new user's id
   */
  async register({ username, password }: { username: string; password: string }): Promise<{ user: User } | { error: string }> {
    // Requires check
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: "Username already taken." };
    }

    if (!password || password.length < 8) {
        return { error: "Password must be at least 8 characters long." };
    }

    // Effects
    const newUser: User = freshID();
    const passwordHash = await hashPassword(password);
    
    try {
        await this.users.insertOne({
          _id: newUser,
          username,
          passwordHash,
        });
    } catch (e) {
        // Handle potential race condition if two users register at the same time
        if (e.code === 11000) { // MongoDB duplicate key error code
            return { error: "Username already taken." };
        }
        throw e; // re-throw other errors
    }


    return { user: newUser };
  }

  /**
   * login (username: String, password: String): (user: User) | (error: String)
   *
   * **requires** true
   *
   * **effects** if a user exists with the given username and the password matches, returns the user's id
   */
  async login({ username, password }: { username: string; password: string }): Promise<{ user: User } | { error: string }> {
    // Effects
    const user = await this.users.findOne({ username });
    if (!user) {
      return { error: "Invalid username or password." };
    }

    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      return { error: "Invalid username or password." };
    }

    return { user: user._id };
  }
}
```
