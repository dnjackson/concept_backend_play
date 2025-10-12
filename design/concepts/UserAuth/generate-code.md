[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

# implement: UserAuthConcept

Please generate code from this concept spec:

[@UserAuthConcept](UserAuthConcept.md)

# response:

# concept: UserAuth

**concept** UserAuth

**purpose** To verify a user's identity and grant them a temporary session for access.

**principle** If a user registers with a username and password, and then they login with the same credentials, they will be given a session token that identifies them as the user who registered. Logging out invalidates this token.

**state**

```
a set of Users with
  a username String
  a password String

a set of Sessions with
  a token String
  a user User
```

**actions**

`register(username: String, password: String): (user: User)`
**requires**
No user exists with the given `username`.
**effects**
A new `User` is created.
The new user's `username` is set to the input `username`.
The new user's `password` is set to the input `password`.
The new `user` is returned.

`register(username: String, password: String): (error: String)`
**requires**
A user already exists with the given `username`.
**effects**
An error message is returned indicating the username is taken.

`login(username: String, password: String): (token: String)`
**requires**
A user `u` exists where `u.username` matches the input `username` and `u.password` matches the input `password`.
**effects**
A new, unique `token` string is generated.
A new `Session` is created, linking the new `token` to the user `u`.
The `token` is returned.

`login(username: String, password: String): (error: String)`
**requires**
No user `u` exists where `u.username` matches the input `username` and `u.password` matches the input `password`.
**effects**
An error message is returned indicating invalid credentials.

`logout(token: String)`
**requires**
A session `s` exists where `s.token` matches the input `token`.
**effects**
The session `s` is deleted.

**queries**

`_getUserFromToken(token: String): (user: User)`
**requires**
A session `s` exists with the given `token`.
**effects**
Returns the user associated with session `s`.

`_getUserFromToken(token: String): (error: String)`
**requires**
No session exists with the given `token`.
**effects**
Returns an error message indicating an invalid token.

`_getUsernameFromToken(token: String): (username: String)`
**requires**
A session `s` exists with the given `token`.
**effects**
Returns the username of the user associated with session `s`.

`_getUsernameFromToken(token: String): (error: String)`
**requires**
No session exists with the given `token`.
**effects**
Returns an error message indicating an invalid token.

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