---
timestamp: 'Mon Oct 13 2025 01:19:40 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_011940.b0a31965.md]]'
content_id: 552f2b731646c7da02b49d6d96b85b1bce7ef822a86a6d39abaf95c26921607b
---

# response:

Of course. This is a crucial clarification. The student's original format was intuitive but, as we discussed, problematic. The key is to define a "simple state form" that is both easy to read and correctly models the data to avoid redundancy.

The fundamental issue with the original state definition:

`a set of Users with - a set of friends User`

...is that it describes the state from the perspective of a single entity (an "entity-centric" view). A more robust model for relationships is a "relation-centric" view, where the relationship itself is the primary piece of information.

Let's fix the state definition by using a simple, clear format that represents this superior relational model.

***

### Corrected State Definition

Here is the revised state definition, written in a clear, simple form that maintains a single source of truth for all information.

* **state**:
  * `Principals`: A set of unique `Principal` identifiers.
  * `PendingRequests`: A set of ordered pairs `(requester: Principal, requestee: Principal)`, where each `Principal` must exist in the `Principals` set.
  * `Friendships`: A set of unordered pairs `{principalA: Principal, principalB: Principal}`, where each `Principal` must exist in the `Principals` set.

### Explanation of This Form

1. **Simple and Declarative:** This format is still very simple. It declares three distinct collections of information that together comprise the entire state of the concept.

2. **Relation-Centric:**
   * Instead of a `User` *having* a list of friends, we now have a global set of `Friendships`. A friendship is a single piece of data—a pair `{A, B}`—that exists independently. To find if `A` and `B` are friends, you just check if the pair `{A, B}` is in the `Friendships` set.
   * Similarly, a request is a single entry `(A, B)` in the `PendingRequests` set. It is not stored in two different places.

3. **Addresses the Core Flaws:**
   * **No Redundancy:** A friendship or a request is stored exactly once.
   * **Guarantees Consistency:** It is impossible for `A` to be friends with `B`, but `B` not be friends with `A`. They are either in the `Friendships` set together, or they are not. The state cannot become "corrupt."
   * **Generic:** It uses the generic type `Principal`, as required by the rules.

This corrected "simple state form" is the proper way to model this concept's state. It directly supports the revised, more robust actions and fully aligns with the principles of creating independent, self-contained concepts.
