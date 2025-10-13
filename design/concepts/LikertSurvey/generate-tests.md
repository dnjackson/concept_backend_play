[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

[@testing-concepts](../../background/testing-concepts.md)

Please generate a test file for this concept implementation:

[@LikertSurveyConcept.ts](../../../src/concepts/LikertSurvey/LikertSurveyConcept.ts)

# response:

Here is a complete test suite for the `LikertSurveyConcept`.

First, let's document the concept specification that guides these tests, as derived from the implementation.

# concept: LikertSurvey

*   **concept**: LikertSurvey \[User]
*   **purpose**: understand group sentiment on a set of topics by aggregating quantitative feedback
*   **principle**: A user creates a survey containing several questions. Other users can then respond to these questions on a scale of 1 to 5. The survey owner can then analyze the aggregated responses for each question to understand overall sentiment, which might be positive, negative, mixed, or even bimodal.
*   **state**:
    *   a set of Surveys with a title (String) and an owner (User)
    *   a set of Questions with a stem (String) and a survey (Survey)
    *   a set of Responses with a responder (User), a question (Question), and a choice (Number from 1-5)
*   **actions**:
    *   `createSurvey (title: String, owner: User): (survey: Survey)`
    *   `addQuestion (stem: String, survey: Survey): (question: Question)`
    *   `removeQuestion (question: Question)`
    *   `respondToQuestion (question: Question, responder: User, choice: Number)`
*   **queries**:
    *   `_getSurveyQuestions (survey: Survey): (question: Question)`
    *   `_getSurveyTitle (survey: Survey): (title: String)`
    *   `_getSurveyOwner (survey: Survey): (owner: User)`
    *   `_getQuestionStem (question: Question): (stem: String)`
    *   `_getQuestionResponseCounts (question: Question): (counts: Number[])`
    *   `_analyzeSentiment (question: Question): (sentiment: String)`
    *   `_getUserSurveys (user: User): (survey: Survey)`

# file: src/concepts/LikertSurvey/LikertSurveyConcept.test.ts

```typescript
import { assertEquals, assertExists, assert } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "./LikertSurveyConcept.ts";

// Mock IDs for testing
const userA = "user:Alice" as ID;
const userB = "user:Bob" as ID;
const userC = "user:Charlie" as ID;
const nonExistentSurvey = "survey:nonExistent" as ID;
const nonExistentQuestion = "question:nonExistent" as ID;

Deno.test("LikertSurveyConcept: Action `createSurvey`", async (t) => {
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);

  await t.step("requires: title should be non-empty", async () => {
    console.log("  - Testing requirement: title must be non-empty");
    const res = await likert.createSurvey({ title: "", owner: userA });
    assert("error" in res, "Expected an error for empty title");
    assertEquals(res.error, "Title cannot be empty");
  });

  await t.step("effects: creates a survey and associates it with an owner", async () => {
    console.log("  - Testing effect: successfully creates a survey");
    const res = await likert.createSurvey({ title: "Team Morale", owner: userA });
    assert("survey" in res, "Expected a survey ID on successful creation");
    const { survey } = res;
    assertExists(survey);

    console.log("  - Verifying survey properties using queries...");
    const [titleRes] = await likert._getSurveyTitle({ survey });
    const [ownerRes] = await likert._getSurveyOwner({ survey });
    const userSurveys = await likert._getUserSurveys({ user: userA });

    assertEquals(titleRes.title, "Team Morale");
    assertEquals(ownerRes.owner, userA);
    assertEquals(userSurveys.length, 1);
    assertEquals(userSurveys[0].survey, survey);
  });

  await client.close();
});

Deno.test("LikertSurveyConcept: Action `addQuestion`", async (t) => {
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);
  const { survey } = await likert.createSurvey({ title: "Team Morale", owner: userA }) as { survey: ID };

  await t.step("requires: stem should be non-empty", async () => {
    console.log("  - Testing requirement: stem must be non-empty");
    const res = await likert.addQuestion({ stem: "", survey });
    assert("error" in res, "Expected an error for empty stem");
    assertEquals(res.error, "Question stem cannot be empty");
  });

  await t.step("requires: survey must exist", async () => {
    console.log("  - Testing requirement: survey must exist");
    const res = await likert.addQuestion({ stem: "A valid question", survey: nonExistentSurvey });
    assert("error" in res, "Expected an error for non-existent survey");
    assertEquals(res.error, "Survey not found");
  });

  await t.step("effects: creates a question and associates it with a survey", async () => {
    console.log("  - Testing effect: successfully creates a question");
    const res = await likert.addQuestion({ stem: "How is the work-life balance?", survey });
    assert("question" in res, "Expected a question ID on successful creation");
    const { question } = res;
    assertExists(question);

    console.log("  - Verifying question properties using queries...");
    const [stemRes] = await likert._getQuestionStem({ question });
    const surveyQuestions = await likert._getSurveyQuestions({ survey });

    assertEquals(stemRes.stem, "How is the work-life balance?");
    assertEquals(surveyQuestions.length, 1);
    assertEquals(surveyQuestions[0].question, question);
  });

  await client.close();
});

Deno.test("LikertSurveyConcept: Action `respondToQuestion`", async (t) => {
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);
  const { survey } = await likert.createSurvey({ title: "Product Feedback", owner: userA }) as { survey: ID };
  const { question } = await likert.addQuestion({ stem: "Is the UI intuitive?", survey }) as { question: ID };

  await t.step("requires: question must exist", async () => {
    console.log("  - Testing requirement: question must exist");
    const res = await likert.respondToQuestion({ question: nonExistentQuestion, responder: userB, choice: 5 });
    assert("error" in res, "Expected an error for non-existent question");
    assertEquals(res.error, "Question not found");
  });

  await t.step("requires: choice must be an integer between 1 and 5", async () => {
    console.log("  - Testing requirement: choice must be an integer 1-5");
    const invalidChoices = [0, 6, 3.5, -1];
    for (const choice of invalidChoices) {
      const res = await likert.respondToQuestion({ question, responder: userB, choice });
      assert("error" in res, `Expected an error for choice ${choice}`);
      assertEquals(res.error, "Choice must be an integer between 1 and 5");
    }
  });

  await t.step("effects: creates a response and can overwrite a previous one", async () => {
    console.log("  - Testing effect: user B responds with choice 4");
    const res1 = await likert.respondToQuestion({ question, responder: userB, choice: 4 });
    assert(!("error" in res1), "Should successfully create a response");

    let [countsRes1] = await likert._getQuestionResponseCounts({ question });
    assertEquals(countsRes1.counts, [0, 0, 0, 1, 0]);

    console.log("  - Testing effect: user B changes response to choice 5");
    const res2 = await likert.respondToQuestion({ question, responder: userB, choice: 5 });
    assert(!("error" in res2), "Should successfully overwrite the response");

    let [countsRes2] = await likert._getQuestionResponseCounts({ question });
    assertEquals(countsRes2.counts, [0, 0, 0, 0, 1], "Previous response should be removed");
  });

  await client.close();
});

Deno.test("LikertSurveyConcept: Action `removeQuestion`", async (t) => {
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);
  const { survey } = await likert.createSurvey({ title: "Workshop Feedback", owner: userA }) as { survey: ID };
  const { question } = await likert.addQuestion({ stem: "Was the content useful?", survey }) as { question: ID };
  await likert.respondToQuestion({ question, responder: userB, choice: 5 });
  await likert.respondToQuestion({ question, responder: userC, choice: 4 });

  await t.step("requires: question must exist", async () => {
    console.log("  - Testing requirement: question must exist");
    const res = await likert.removeQuestion({ question: nonExistentQuestion });
    assert("error" in res, "Expected an error for non-existent question");
    assertEquals(res.error, "Question not found");
  });

  await t.step("effects: removes the question and its associated responses", async () => {
    console.log("  - Verifying state before removal...");
    assertEquals((await likert._getSurveyQuestions({ survey })).length, 1);
    const [countsBefore] = await likert._getQuestionResponseCounts({ question });
    assertEquals(countsBefore.counts, [0, 0, 0, 1, 1]);

    console.log("  - Testing effect: removing the question");
    const res = await likert.removeQuestion({ question });
    assert(!("error" in res), "Should successfully remove the question");

    console.log("  - Verifying state after removal...");
    assertEquals((await likert._getSurveyQuestions({ survey })).length, 0);
    // Querying for the removed question should now fail
    const [stemAfter] = await likert._getQuestionStem({ question });
    assert("error" in stemAfter, "Querying a deleted question should fail");
  });

  await client.close();
});

# trace:

Deno.test("LikertSurveyConcept: Principle Test", async () => {
  console.log("Principle: An owner creates a survey, users respond, and the owner analyzes sentiment.");
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);

  console.log("\n1. Alice (owner) creates a 'Team Satisfaction' survey.");
  const surveyRes = await likert.createSurvey({ title: "Team Satisfaction", owner: userA });
  const { survey } = surveyRes as { survey: ID };
  assertExists(survey);

  console.log("\n2. Alice adds two questions to the survey.");
  const q1Res = await likert.addQuestion({ stem: "Are you happy with the work-life balance?", survey });
  const { question: q1 } = q1Res as { question: ID };
  const q2Res = await likert.addQuestion({ stem: "Is the project challenging enough?", survey });
  const { question: q2 } = q2Res as { question: ID };
  assertExists(q1);
  assertExists(q2);

  console.log("\n3. Other users (Bob and Charlie) respond to the questions.");
  console.log("  - Bob responds to Q1 ('work-life balance') with 5 (Strongly Agree).");
  await likert.respondToQuestion({ question: q1, responder: userB, choice: 5 });
  console.log("  - Charlie responds to Q1 ('work-life balance') with 4 (Agree).");
  await likert.respondToQuestion({ question: q1, responder: userC, choice: 4 });
  console.log("  - Bob responds to Q2 ('challenging enough') with 1 (Strongly Disagree).");
  await likert.respondToQuestion({ question: q2, responder: userB, choice: 1 });
  console.log("  - Charlie responds to Q2 ('challenging enough') with 5 (Strongly Agree).");
  await likert.respondToQuestion({ question: q2, responder: userC, choice: 5 });

  console.log("\n4. Alice analyzes the results.");

  console.log("\n  - Analyzing Q1: 'Are you happy with the work-life balance?'");
  const [countsQ1] = await likert._getQuestionResponseCounts({ question: q1 });
  const [sentimentQ1] = await likert._analyzeSentiment({ question: q1 });
  console.log(`    Response counts: ${JSON.stringify(countsQ1.counts)}`);
  console.log(`    Calculated sentiment: ${sentimentQ1.sentiment}`);
  assertEquals(countsQ1.counts, [0, 0, 0, 1, 1]);
  assertEquals(sentimentQ1.sentiment, "positive");

  console.log("\n  - Analyzing Q2: 'Is the project challenging enough?'");
  const [countsQ2] = await likert._getQuestionResponseCounts({ question: q2 });
  const [sentimentQ2] = await likert._analyzeSentiment({ question: q2 });
  console.log(`    Response counts: ${JSON.stringify(countsQ2.counts)}`);
  console.log(`    Calculated sentiment: ${sentimentQ2.sentiment}`);
  assertEquals(countsQ2.counts, [1, 0, 0, 0, 1]);
  assertEquals(sentimentQ2.sentiment, "bimodal"); // Avg is 3, std dev is 2 > 1.5

  console.log("\nPrinciple successfully demonstrated.");
  await client.close();
});
```

# fix errors:

[{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'title' does not exist on type '{ title: string; } | { error: string; }'.\n  Property 'title' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 36,
	"startColumn": 27,
	"endLineNumber": 36,
	"endColumn": 32,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'owner' does not exist on type '{ owner: ID; } | { error: string; }'.\n  Property 'owner' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 37,
	"startColumn": 27,
	"endLineNumber": 37,
	"endColumn": 32,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'survey' does not exist on type '{ survey: ID; } | { error: string; }'.\n  Property 'survey' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 39,
	"startColumn": 33,
	"endLineNumber": 39,
	"endColumn": 39,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'stem' does not exist on type '{ stem: string; } | { error: string; }'.\n  Property 'stem' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 75,
	"startColumn": 26,
	"endLineNumber": 75,
	"endColumn": 30,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'question' does not exist on type '{ question: ID; } | { error: string; }'.\n  Property 'question' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 77,
	"startColumn": 37,
	"endLineNumber": 77,
	"endColumn": 45,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'counts' does not exist on type '{ counts: number[]; } | { error: string; }'.\n  Property 'counts' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 112,
	"startColumn": 29,
	"endLineNumber": 112,
	"endColumn": 35,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'counts' does not exist on type '{ counts: number[]; } | { error: string; }'.\n  Property 'counts' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 119,
	"startColumn": 29,
	"endLineNumber": 119,
	"endColumn": 35,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'counts' does not exist on type '{ counts: number[]; } | { error: string; }'.\n  Property 'counts' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 144,
	"startColumn": 31,
	"endLineNumber": 144,
	"endColumn": 37,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "1127",
	"severity": 8,
	"message": "Invalid character.",
	"source": "deno-ts",
	"startLineNumber": 160,
	"startColumn": 1,
	"endLineNumber": 160,
	"endColumn": 2,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "1005",
	"severity": 8,
	"message": "';' expected.",
	"source": "deno-ts",
	"startLineNumber": 160,
	"startColumn": 3,
	"endLineNumber": 160,
	"endColumn": 8,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'counts' does not exist on type '{ counts: number[]; } | { error: string; }'.\n  Property 'counts' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 195,
	"startColumn": 63,
	"endLineNumber": 195,
	"endColumn": 69,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'sentiment' does not exist on type '{ sentiment: string; } | { error: string; }'.\n  Property 'sentiment' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 196,
	"startColumn": 56,
	"endLineNumber": 196,
	"endColumn": 65,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'counts' does not exist on type '{ counts: number[]; } | { error: string; }'.\n  Property 'counts' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 197,
	"startColumn": 25,
	"endLineNumber": 197,
	"endColumn": 31,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'sentiment' does not exist on type '{ sentiment: string; } | { error: string; }'.\n  Property 'sentiment' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 198,
	"startColumn": 28,
	"endLineNumber": 198,
	"endColumn": 37,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'counts' does not exist on type '{ counts: number[]; } | { error: string; }'.\n  Property 'counts' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 203,
	"startColumn": 63,
	"endLineNumber": 203,
	"endColumn": 69,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'sentiment' does not exist on type '{ sentiment: string; } | { error: string; }'.\n  Property 'sentiment' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 204,
	"startColumn": 56,
	"endLineNumber": 204,
	"endColumn": 65,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'counts' does not exist on type '{ counts: number[]; } | { error: string; }'.\n  Property 'counts' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 205,
	"startColumn": 25,
	"endLineNumber": 205,
	"endColumn": 31,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'sentiment' does not exist on type '{ sentiment: string; } | { error: string; }'.\n  Property 'sentiment' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 206,
	"startColumn": 28,
	"endLineNumber": 206,
	"endColumn": 37,
	"origin": "extHost1"
}]
# response:

# solution

The provided test file has several TypeScript compilation errors. These errors stem from a single root cause: attempting to access properties on a union type without first using a type guard. The actions and queries in `LikertSurveyConcept` correctly return a union type that includes a potential `error` object (e.g., `{ survey: ID } | { error: string }`). The tests must verify that an error was not returned before accessing the properties of the success object.

Additionally, a formatting artifact `# trace:` was incorrectly included as a line of code in the test file, causing a syntax error.

The solution involves two changes:
1.  Adding `assert("property" in result)` checks after each query and action call within the tests. This acts as a type guard, satisfying the TypeScript compiler that the property exists before it is accessed.
2.  Removing the extraneous `# trace:` line from the file.

Here is the corrected test file.

# file: src/concepts/LikertSurvey/LikertSurveyConcept.test.ts

```typescript
import { assertEquals, assertExists, assert } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "./LikertSurveyConcept.ts";

// Mock IDs for testing
const userA = "user:Alice" as ID;
const userB = "user:Bob" as ID;
const userC = "user:Charlie" as ID;
const nonExistentSurvey = "survey:nonExistent" as ID;
const nonExistentQuestion = "question:nonExistent" as ID;

Deno.test("LikertSurveyConcept: Action `createSurvey`", async (t) => {
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);

  await t.step("requires: title should be non-empty", async () => {
    console.log("  - Testing requirement: title must be non-empty");
    const res = await likert.createSurvey({ title: "", owner: userA });
    assert("error" in res, "Expected an error for empty title");
    assertEquals(res.error, "Title cannot be empty");
  });

  await t.step("effects: creates a survey and associates it with an owner", async () => {
    console.log("  - Testing effect: successfully creates a survey");
    const res = await likert.createSurvey({ title: "Team Morale", owner: userA });
    assert("survey" in res, "Expected a survey ID on successful creation");
    const { survey } = res;
    assertExists(survey);

    console.log("  - Verifying survey properties using queries...");
    const [titleRes] = await likert._getSurveyTitle({ survey });
    const [ownerRes] = await likert._getSurveyOwner({ survey });
    const userSurveys = await likert._getUserSurveys({ user: userA });

    assert("title" in titleRes, "Query for title should not fail");
    assertEquals(titleRes.title, "Team Morale");
    assert("owner" in ownerRes, "Query for owner should not fail");
    assertEquals(ownerRes.owner, userA);

    assertEquals(userSurveys.length, 1);
    const [userSurvey] = userSurveys;
    assert("survey" in userSurvey, "Query for user surveys should not fail");
    assertEquals(userSurvey.survey, survey);
  });

  await client.close();
});

Deno.test("LikertSurveyConcept: Action `addQuestion`", async (t) => {
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);
  const { survey } = await likert.createSurvey({ title: "Team Morale", owner: userA }) as { survey: ID };

  await t.step("requires: stem should be non-empty", async () => {
    console.log("  - Testing requirement: stem must be non-empty");
    const res = await likert.addQuestion({ stem: "", survey });
    assert("error" in res, "Expected an error for empty stem");
    assertEquals(res.error, "Question stem cannot be empty");
  });

  await t.step("requires: survey must exist", async () => {
    console.log("  - Testing requirement: survey must exist");
    const res = await likert.addQuestion({ stem: "A valid question", survey: nonExistentSurvey });
    assert("error" in res, "Expected an error for non-existent survey");
    assertEquals(res.error, "Survey not found");
  });

  await t.step("effects: creates a question and associates it with a survey", async () => {
    console.log("  - Testing effect: successfully creates a question");
    const res = await likert.addQuestion({ stem: "How is the work-life balance?", survey });
    assert("question" in res, "Expected a question ID on successful creation");
    const { question } = res;
    assertExists(question);

    console.log("  - Verifying question properties using queries...");
    const [stemRes] = await likert._getQuestionStem({ question });
    const surveyQuestions = await likert._getSurveyQuestions({ survey });

    assert("stem" in stemRes, "Query for stem should not fail");
    assertEquals(stemRes.stem, "How is the work-life balance?");

    assertEquals(surveyQuestions.length, 1);
    const [surveyQuestion] = surveyQuestions;
    assert("question" in surveyQuestion, "Query for survey questions should not fail");
    assertEquals(surveyQuestion.question, question);
  });

  await client.close();
});

Deno.test("LikertSurveyConcept: Action `respondToQuestion`", async (t) => {
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);
  const { survey } = await likert.createSurvey({ title: "Product Feedback", owner: userA }) as { survey: ID };
  const { question } = await likert.addQuestion({ stem: "Is the UI intuitive?", survey }) as { question: ID };

  await t.step("requires: question must exist", async () => {
    console.log("  - Testing requirement: question must exist");
    const res = await likert.respondToQuestion({ question: nonExistentQuestion, responder: userB, choice: 5 });
    assert("error" in res, "Expected an error for non-existent question");
    assertEquals(res.error, "Question not found");
  });

  await t.step("requires: choice must be an integer between 1 and 5", async () => {
    console.log("  - Testing requirement: choice must be an integer 1-5");
    const invalidChoices = [0, 6, 3.5, -1];
    for (const choice of invalidChoices) {
      const res = await likert.respondToQuestion({ question, responder: userB, choice });
      assert("error" in res, `Expected an error for choice ${choice}`);
      assertEquals(res.error, "Choice must be an integer between 1 and 5");
    }
  });

  await t.step("effects: creates a response and can overwrite a previous one", async () => {
    console.log("  - Testing effect: user B responds with choice 4");
    const res1 = await likert.respondToQuestion({ question, responder: userB, choice: 4 });
    assert(!("error" in res1), "Should successfully create a response");

    let [countsRes1] = await likert._getQuestionResponseCounts({ question });
    assert("counts" in countsRes1, "Query for counts should not fail");
    assertEquals(countsRes1.counts, [0, 0, 0, 1, 0]);

    console.log("  - Testing effect: user B changes response to choice 5");
    const res2 = await likert.respondToQuestion({ question, responder: userB, choice: 5 });
    assert(!("error" in res2), "Should successfully overwrite the response");

    let [countsRes2] = await likert._getQuestionResponseCounts({ question });
    assert("counts" in countsRes2, "Query for counts should not fail after overwrite");
    assertEquals(countsRes2.counts, [0, 0, 0, 0, 1], "Previous response should be removed");
  });

  await client.close();
});

Deno.test("LikertSurveyConcept: Action `removeQuestion`", async (t) => {
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);
  const { survey } = await likert.createSurvey({ title: "Workshop Feedback", owner: userA }) as { survey: ID };
  const { question } = await likert.addQuestion({ stem: "Was the content useful?", survey }) as { question: ID };
  await likert.respondToQuestion({ question, responder: userB, choice: 5 });
  await likert.respondToQuestion({ question, responder: userC, choice: 4 });

  await t.step("requires: question must exist", async () => {
    console.log("  - Testing requirement: question must exist");
    const res = await likert.removeQuestion({ question: nonExistentQuestion });
    assert("error" in res, "Expected an error for non-existent question");
    assertEquals(res.error, "Question not found");
  });

  await t.step("effects: removes the question and its associated responses", async () => {
    console.log("  - Verifying state before removal...");
    assertEquals((await likert._getSurveyQuestions({ survey })).length, 1);
    const [countsBefore] = await likert._getQuestionResponseCounts({ question });
    assert("counts" in countsBefore, "Query for counts should not fail");
    assertEquals(countsBefore.counts, [0, 0, 0, 1, 1]);

    console.log("  - Testing effect: removing the question");
    const res = await likert.removeQuestion({ question });
    assert(!("error" in res), "Should successfully remove the question");

    console.log("  - Verifying state after removal...");
    assertEquals((await likert._getSurveyQuestions({ survey })).length, 0);
    // Querying for the removed question should now fail
    const [stemAfter] = await likert._getQuestionStem({ question });
    assert("error" in stemAfter, "Querying a deleted question should fail");
  });

  await client.close();
});

Deno.test("LikertSurveyConcept: Principle Test", async () => {
  console.log("Principle: An owner creates a survey, users respond, and the owner analyzes sentiment.");
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);

  console.log("\n1. Alice (owner) creates a 'Team Satisfaction' survey.");
  const surveyRes = await likert.createSurvey({ title: "Team Satisfaction", owner: userA });
  assert("survey" in surveyRes, "Survey creation should succeed");
  const { survey } = surveyRes;
  assertExists(survey);

  console.log("\n2. Alice adds two questions to the survey.");
  const q1Res = await likert.addQuestion({ stem: "Are you happy with the work-life balance?", survey });
  assert("question" in q1Res, "Adding Q1 should succeed");
  const { question: q1 } = q1Res;

  const q2Res = await likert.addQuestion({ stem: "Is the project challenging enough?", survey });
  assert("question" in q2Res, "Adding Q2 should succeed");
  const { question: q2 } = q2Res;
  assertExists(q1);
  assertExists(q2);

  console.log("\n3. Other users (Bob and Charlie) respond to the questions.");
  console.log("  - Bob responds to Q1 ('work-life balance') with 5 (Strongly Agree).");
  await likert.respondToQuestion({ question: q1, responder: userB, choice: 5 });
  console.log("  - Charlie responds to Q1 ('work-life balance') with 4 (Agree).");
  await likert.respondToQuestion({ question: q1, responder: userC, choice: 4 });
  console.log("  - Bob responds to Q2 ('challenging enough') with 1 (Strongly Disagree).");
  await likert.respondToQuestion({ question: q2, responder: userB, choice: 1 });
  console.log("  - Charlie responds to Q2 ('challenging enough') with 5 (Strongly Agree).");
  await likert.respondToQuestion({ question: q2, responder: userC, choice: 5 });

  console.log("\n4. Alice analyzes the results.");

  console.log("\n  - Analyzing Q1: 'Are you happy with the work-life balance?'");
  const [countsQ1] = await likert._getQuestionResponseCounts({ question: q1 });
  const [sentimentQ1] = await likert._analyzeSentiment({ question: q1 });
  assert("counts" in countsQ1, "Query for Q1 counts should not fail");
  assert("sentiment" in sentimentQ1, "Query for Q1 sentiment should not fail");
  console.log(`    Response counts: ${JSON.stringify(countsQ1.counts)}`);
  console.log(`    Calculated sentiment: ${sentimentQ1.sentiment}`);
  assertEquals(countsQ1.counts, [0, 0, 0, 1, 1]);
  assertEquals(sentimentQ1.sentiment, "positive");

  console.log("\n  - Analyzing Q2: 'Is the project challenging enough?'");
  const [countsQ2] = await likert._getQuestionResponseCounts({ question: q2 });
  const [sentimentQ2] = await likert._analyzeSentiment({ question: q2 });
  assert("counts" in countsQ2, "Query for Q2 counts should not fail");
  assert("sentiment" in sentimentQ2, "Query for Q2 sentiment should not fail");
  console.log(`    Response counts: ${JSON.stringify(countsQ2.counts)}`);
  console.log(`    Calculated sentiment: ${sentimentQ2.sentiment}`);
  assertEquals(countsQ2.counts, [1, 0, 0, 0, 1]);
  assertEquals(sentimentQ2.sentiment, "bimodal"); // Avg is 3, std dev is 2 > 1.5

  console.log("\nPrinciple successfully demonstrated.");
  await client.close();
});
```