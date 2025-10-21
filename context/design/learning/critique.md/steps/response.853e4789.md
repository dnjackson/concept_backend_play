---
timestamp: 'Mon Oct 13 2025 01:21:09 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_012109.40fe0f9e.md]]'
content_id: 853e47898a95cae8761f0907effcdef8d40d8211f926d6d41aa7a1ed9ccebfac
---

# response:

Of course. Based on the provided documentation and rubric, here is a detailed critique of the student's `Friending` concept specification.

### Overall Assessment

This is a good first attempt. The student has correctly identified the main entities (`User`) and the key interactions (sending, accepting, removing). The logic within the actions is sound for the state they've designed.

However, the specification falls short on several key tenets of Concept Design, particularly regarding **Independence**, **Separation of Concerns**, **Completeness**, and the precise formulation of the **Purpose** and **Principle**. The state model is also redundant, which can lead to implementation complexities.

***

### Detailed Critique by Section

#### **Concept Name & Parameters**

* **Missing Type Parameter:** The concept uses an external type, `User`, but does not declare it as a generic parameter. According to the documentation, this is required.
* **Correction:** The header should be `concept Friending [User]`. This makes it explicit that `User` is a generic type provided from outside the concept, reinforcing its independence.

#### **Purpose**

* **Critique:** The stated purpose, `allow users to add each other as friends to share information with`, violates the **Independence** and **Separation of Concerns** criteria.
  * **Fails Independence:** The phrase "to share information with" describes a *consequence* of friendship that depends on other concepts (e.g., a `Post` concept, a `Photo` concept). The `Friending` concept itself knows nothing about "information" or how it's shared. The rubric warns against this: "Purpose cannot be fulfilled by the concept itself, but would require other concepts too."
  * **Focuses on Means, Not Need:** "allow users to add each other as friends" describes the mechanism, not the core need being fulfilled. The underlying need is to establish a specific kind of relationship.
* **Recommendation:** The purpose should be rephrased to focus only on what this concept accomplishes in isolation.
* **Suggested Revision:** `purpose: establish a mutual, symmetric, and declared connection between users.` This is specific to the concept, evaluable on its own, and independent of how that connection is used elsewhere.

#### **Principle**

* **Critique:** The principle, `users may add and remove each other as friends. These friendships define boundaries regarding who has access to see whose information`, is not an archetypal scenario.
  * **Fails "Is a Scenario" criterion:** The documentation states a principle should be a story-like scenario, often in an "if... then..." form. This principle is a description of capabilities, not a scenario demonstrating them.
  * **Violates Independence:** Like the purpose, it mentions "access to see whose information," which is outside the concept's scope.
  * **Incomplete Lifecycle:** It mentions adding and removing friends but omits the crucial request/accept step, which is a key part of this specific design.
* **Recommendation:** The principle should be rewritten as a concise story that illustrates the core interaction from start to finish.
* **Suggested Revision:** `principle: If user A sends a friend request to user B, and user B accepts the request, then A and B become friends. Later, if A decides to remove B as a friend, the relationship is severed for both of them.`

#### **State**

* **Critique:** The state model is understandable but has two main issues: minor syntax errors and significant data redundancy.
  * **Minor Syntax Errors:** The use of dashes and the plural `Users` for the type are not standard SSF. It should be `a friends set of User`, `a sentRequests set of User`, etc.
  * **Redundancy (Major Issue):** The `sentRequests` and `receivedRequests` sets are two sides of the same coin. If user A is in B's `receivedRequests` set, then B must be in A's `sentRequests` set. Storing this relationship in two places is redundant and creates a consistency burden that the actions must carefully manage. A more robust design would model the request as a single, first-class entity.
* **Recommendation:** Refactor the state to eliminate redundancy. This simplifies the model and makes the actions easier to reason about.
* **Suggested Revision:**
  ```
  state
    a set of Users with
      a friends set of User

    a set of FriendRequests with
      a sender User
      a receiver User
  ```
  In this improved model, a single `FriendRequest` object from `sender` to `receiver` represents a pending request. This is the single source of truth, eliminating the need for `sentRequests` and `receivedRequests` entirely. The `friends` relation remains, but it's important to note it implies a symmetric relationship that the actions must enforce.

#### **Actions**

* **Critique:** The actions are logically consistent with the student's chosen state model. The pre- and post-conditions are well-defined. However, the set of actions is incomplete.
  * **Completeness:** The concept is missing crucial "undo" or compensating actions.
    1. **Cancel Request:** What if a user sends a request by mistake? There's no way for the *sender* to cancel it.
    2. **Deny Request:** What if a user receives a request they don't want to accept? Their only options are to accept it or leave it pending forever. There is no `denyRequest` action.
  * **Clarity:** The argument names in `removeFriend` (`user`, `to_be_removed_friend`) are a bit verbose but clear. They could be simplified to `remover` and `removed`, for example.
* **Recommendation:** Add actions to cover the full user journey and make the concept more robust.
* **Suggested Additional Actions (based on the revised state):**
  ```
  - cancelRequest (sender: User, receiver: User)
    * requires: a FriendRequest from sender to receiver exists
    * effects: the FriendRequest from sender to receiver is deleted

  - denyRequest (sender: User, receiver: User)
    * requires: a FriendRequest from sender to receiver exists
    * effects: the FriendRequest from sender to receiver is deleted
  ```
  *(Note: `cancelRequest` and `denyRequest` have the same effect on the state, but they represent different user intentions and would be triggered by different users in the UI).*

### Summary of Recommendations

1. **Add Type Parameter:** Change `concept Friending` to `concept Friending [User]`.
2. **Refine Purpose:** Focus solely on establishing the relationship, removing any mention of what the friendship is *for*.
3. **Rewrite Principle:** Formulate it as an archetypal "if... then..." scenario covering the request-accept-remove lifecycle.
4. **Refactor State:** Eliminate the redundant `sentRequests` and `receivedRequests` by creating a single `FriendRequests` set.
5. **Expand Actions:** Add `cancelRequest` and `denyRequest` to make the concept functionally complete from a user's perspective.
