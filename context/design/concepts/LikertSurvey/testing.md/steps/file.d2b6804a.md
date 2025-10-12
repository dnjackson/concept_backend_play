---
timestamp: 'Sat Oct 11 2025 22:15:23 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251011_221523.e2a5ed59.md]]'
content_id: d2b6804aa45d58119c97d540ad9bac3f8867f886421c3c939cbb2443d17a6b8a
---

# file: src/likertsurvey/LikertSurveyConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "./LikertSurveyConcept.ts";

// Define some mock IDs for testing purposes
const authorA = "author:A" as ID;
const respondentX = "respondent:X" as ID;
const respondentY = "respondent:Y" as ID;

Deno.test("LikertSurvey Concept: Actions", async (t) => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  let testSurvey: ID;
  let testQuestion1: ID;
  let testQuestion2: ID;

  await t.step("Action: createSurvey", async (t) => {
    await t.step("✅ Effects: should create a new survey with valid parameters", async () => {
      console.log("  - Testing successful survey creation...");
      const result = await surveyConcept.createSurvey({ author: authorA, title: "Customer Satisfaction", scaleMin: 1, scaleMax: 5 });
      assertNotEquals("error" in result, true, "Expected survey creation to succeed");
      if (!("error" in result)) {
        testSurvey = result.survey;
        assertExists(testSurvey);
        const surveyDoc = await db.collection("LikertSurvey.surveys").findOne({ _id: testSurvey });
        assertEquals(surveyDoc?.author, authorA);
        assertEquals(surveyDoc?.title, "Customer Satisfaction");
        assertEquals(surveyDoc?.scaleMin, 1);
        assertEquals(surveyDoc?.scaleMax, 5);
      }
    });

    await t.step("❌ Requires: should fail if scaleMin is not less than scaleMax", async () => {
      console.log("  - Testing failed survey creation due to invalid scale...");
      const result = await surveyConcept.createSurvey({ author: authorA, title: "Invalid Survey", scaleMin: 5, scaleMax: 1 });
      assertEquals("error" in result, true);
      if ("error" in result) {
        assertEquals(result.error, "scaleMin must be less than scaleMax");
      }
      const count = await db.collection("LikertSurvey.surveys").countDocuments({ title: "Invalid Survey" });
      assertEquals(count, 0);
    });
  });

  await t.step("Action: addQuestion", async (t) => {
    await t.step("✅ Effects: should add a question to an existing survey", async () => {
      console.log("  - Testing successful question addition...");
      const result1 = await surveyConcept.addQuestion({ survey: testSurvey, text: "How satisfied are you with our service?" });
      const result2 = await surveyConcept.addQuestion({ survey: testSurvey, text: "Would you recommend us to a friend?" });
      assertNotEquals("error" in result1, true);
      assertNotEquals("error" in result2, true);
      if (!("error" in result1) && !("error" in result2)) {
        testQuestion1 = result1.question;
        testQuestion2 = result2.question;
        const questions = await surveyConcept._getSurveyQuestions({ survey: testSurvey });
        assertEquals(questions.length, 2);
        assertEquals(questions.some((q) => q._id === testQuestion1), true);
      }
    });

    await t.step("❌ Requires: should fail if the survey does not exist", async () => {
      console.log("  - Testing failed question addition due to non-existent survey...");
      const nonExistentSurvey = "survey:invalid" as ID;
      const result = await surveyConcept.addQuestion({ survey: nonExistentSurvey, text: "This should fail" });
      assertEquals("error" in result, true);
    });
  });

  await t.step("Action: submitResponse", async (t) => {
    await t.step("✅ Effects: should submit a valid response", async () => {
      console.log("  - Testing successful response submission...");
      const result = await surveyConcept.submitResponse({ respondent: respondentX, question: testQuestion1, value: 4 });
      assertEquals("error" in result, false);
      const responses = await surveyConcept._getRespondentAnswers({ respondent: respondentX });
      assertEquals(responses.length, 1);
      assertEquals(responses[0].value, 4);
    });

    await t.step("❌ Requires: should fail if respondent has already answered", async () => {
      console.log("  - Testing failed submission for an already-answered question...");
      const result = await surveyConcept.submitResponse({ respondent: respondentX, question: testQuestion1, value: 5 });
      assertEquals("error" in result, true);
    });

    await t.step("❌ Requires: should fail if value is outside the survey scale", async () => {
      console.log("  - Testing failed submission for an out-of-scale value...");
      const result = await surveyConcept.submitResponse({ respondent: respondentY, question: testQuestion1, value: 10 });
      assertEquals("error" in result, true);
    });
  });

  await t.step("Action: updateResponse", async (t) => {
    await t.step("✅ Effects: should update an existing response", async () => {
      console.log("  - Testing successful response update...");
      const result = await surveyConcept.updateResponse({ respondent: respondentX, question: testQuestion1, value: 5 });
      assertEquals("error" in result, false);
      const responses = await surveyConcept._getRespondentAnswers({ respondent: respondentX });
      assertEquals(responses[0].value, 5);
    });

    await t.step("❌ Requires: should fail if no response exists to update", async () => {
      console.log("  - Testing failed update for a non-existent response...");
      const result = await surveyConcept.updateResponse({ respondent: respondentY, question: testQuestion1, value: 3 });
      assertEquals("error" in result, true);
    });
  });

  await client.close();
});

Deno.test("LikertSurvey Concept: Principle", async () => {
  console.log("\nTesting Principle: If an author creates a survey and a respondent answers, the author can view the responses.");
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  // 1. An author creates a survey with questions.
  console.log("  - Step 1: Author creates a survey and adds questions.");
  const { survey } = await surveyConcept.createSurvey({ author: authorA, title: "Product Feedback", scaleMin: 1, scaleMax: 7 }) as { survey: ID };
  const { question: q1 } = await surveyConcept.addQuestion({ survey, text: "How easy was the setup process?" }) as { question: ID };
  const { question: q2 } = await surveyConcept.addQuestion({ survey, text: "How likely are you to purchase again?" }) as { question: ID };

  // 2. A respondent submits their answers.
  console.log("  - Step 2: Respondent submits answers to the questions.");
  await surveyConcept.submitResponse({ respondent: respondentX, question: q1, value: 6 });
  await surveyConcept.submitResponse({ respondent: respondentX, question: q2, value: 7 });

  // 3. The author can view the collected responses.
  console.log("  - Step 3: Author views the collected responses for the survey.");
  const surveyResponses = await surveyConcept._getSurveyResponses({ survey });

  // Verification
  console.log("  - Verifying the principle...");
  assertEquals(surveyResponses.length, 2, "Expected to find two responses for the survey.");
  const responseForQ1 = surveyResponses.find((r) => r.question === q1);
  const responseForQ2 = surveyResponses.find((r) => r.question === q2);

  assertExists(responseForQ1, "Response for question 1 should exist.");
  assertExists(responseForQ2, "Response for question 2 should exist.");

  assertEquals(responseForQ1.respondent, respondentX);
  assertEquals(responseForQ1.value, 6);
  assertEquals(responseForQ2.respondent, respondentX);
  assertEquals(responseForQ2.value, 7);

  console.log("  - Principle successfully demonstrated.");
  await client.close();
});
```
