---
timestamp: 'Sun Oct 12 2025 11:03:19 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_110319.8e408e35.md]]'
content_id: d52091c8a50cc76640ff3865690188dd7b9587570e9ac26af048e55321e20974
---

# file: src/UserAuth/UserAuthConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

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
   * **requires** username must not already be taken by another user.
   *
   * **effects** creates a new User `u`; sets the `username` of `u` to the given `username`; sets the `password` of `u` to a hashed version of the given `password`; returns `u` as `user`.
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
        // Handle potential race condition if two users register at the same time by checking for MongoDB's duplicate key error
        if (typeof e === 'object' && e !== null && 'code' in e && e.code === 11000) { 
            return { error: "Username already taken." };
        }
        throw e; // re-throw other errors
    }


    return { user: newUser };
  }

  /**
   * login (username: String, password: String): (user: User) | (error: String)
   *
   * **requires** a user with the given `username` exists and the given `password` matches the stored password.
   *
   * **effects** returns the matching user's id `u` as `user`.
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
