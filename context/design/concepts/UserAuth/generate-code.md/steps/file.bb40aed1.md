---
timestamp: 'Sun Oct 12 2025 11:13:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_111328.4479b976.md]]'
content_id: bb40aed144f522430e4c047f91ac0501169b5fc70af67d67f030807995a26614
---

# file: src/UserAuth/UserAuthConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { freshID } from "@utils/database.ts";
import { Empty, ID } from "@utils/types.ts";

// Collection prefix for this concept
const PREFIX = "UserAuth" + ".";

// Define generic types used in this concept
type User = ID;

/**
 * Represents a user in the system.
 *
 * a set of Users with
 *   a username String
 *   a password String
 */
interface Users {
  _id: User;
  username: string;
  password: string;
}

/**
 * Represents a user's session. The token is used as the `_id` for
 * efficient lookups and to guarantee uniqueness.
 *
 * a set of Sessions with
 *   a token String
 *   a user User
 */
interface Sessions {
  _id: string; // token
  user: User;
}

/**
 * @concept UserAuth
 * @purpose To verify a user's identity and grant them a temporary session for access.
 */
export default class UserAuthConcept {
  users: Collection<Users>;
  sessions: Collection<Sessions>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
    this.sessions = this.db.collection(PREFIX + "sessions");
  }

  /**
   * register(username: String, password: String): (user: User) | (error: String)
   *
   * **requires** (success) No user exists with the given `username`.
   * **effects** (success) A new `User` is created with the given `username` and `password` and is returned.
   *
   * **requires** (error) A user already exists with the given `username`.
   * **effects** (error) An error message is returned indicating the username is taken.
   */
  async register({ username, password }: { username: string; password: string }): Promise<{ user: User } | { error: string }> {
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: "Username already taken." };
    }

    const newUser: Users = {
      _id: freshID(),
      username,
      password, // In a real application, this should be hashed.
    };

    await this.users.insertOne(newUser);
    return { user: newUser._id };
  }

  /**
   * login(username: String, password: String): (token: String) | (error: String)
   *
   * **requires** (success) A user `u` exists with matching `username` and `password`.
   * **effects** (success) A new session is created for `u`, and a unique token for that session is returned.
   *
   * **requires** (error) No user `u` exists with matching `username` and `password`.
   * **effects** (error) An error message is returned indicating invalid credentials.
   */
  async login({ username, password }: { username: string; password: string }): Promise<{ token: string } | { error: string }> {
    const user = await this.users.findOne({ username, password });
    if (!user) {
      return { error: "Invalid username or password." };
    }

    const token = freshID();
    const newSession: Sessions = {
      _id: token,
      user: user._id,
    };

    await this.sessions.insertOne(newSession);
    return { token };
  }

  /**
   * logout(token: String)
   *
   * **requires** A session `s` exists where `s.token` matches the input `token`.
   * **effects** The session `s` is deleted.
   */
  async logout({ token }: { token: string }): Promise<Empty> {
    await this.sessions.deleteOne({ _id: token });
    return {};
  }

  /**
   * _getUserFromToken(token: String): (user: User) | (error: String)
   *
   * **requires** (success) A session `s` exists with the given `token`.
   * **effects** (success) Returns the user associated with session `s`.
   *
   * **requires** (error) No session exists with the given `token`.
   * **effects** (error) Returns an error message indicating an invalid token.
   */
  async _getUserFromToken({ token }: { token: string }): Promise<Array<{ user: User } | { error: string }>> {
    const session = await this.sessions.findOne({ _id: token });
    if (!session) {
      return [{ error: "Invalid token." }];
    }
    return [{ user: session.user }];
  }

  /**
   * _getUsernameFromToken(token: String): (username: String) | (error: String)
   *
   * **requires** (success) A session `s` exists with the given `token`.
   * **effects** (success) Returns the username of the user associated with session `s`.
   *
   * **requires** (error) No session exists with the given `token`.
   * **effects** (error) Returns an error message indicating an invalid token.
   */
  async _getUsernameFromToken({ token }: { token: string }): Promise<Array<{ username: string } | { error: string }>> {
    const session = await this.sessions.findOne({ _id: token });
    if (!session) {
      return [{ error: "Invalid token." }];
    }

    const user = await this.users.findOne({ _id: session.user });
    if (!user) {
      // This case handles data inconsistency where a session exists for a non-existent user.
      return [{ error: "User for session not found." }];
    }

    return [{ username: user.username }];
  }
}
```
