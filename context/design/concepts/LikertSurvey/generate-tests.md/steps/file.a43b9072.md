---
timestamp: 'Sun Oct 12 2025 23:47:01 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_234701.abfeee5e.md]]'
content_id: a43b9072fc5ae6fbdd6640aa74feb4ec5979120e5f19df4ccbf65f9112462ffd
---

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
