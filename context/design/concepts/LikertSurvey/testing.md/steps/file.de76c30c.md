---
timestamp: 'Sat Oct 11 2025 22:43:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251011_224316.35e8ec78.md]]'
content_id: de76c30c4baa93c42e03670adeb0c15a9e9769bfc6319370cb709be4798c3648
---

# file: src/likertsurvey/LikertSurveyConcept.v2.test.ts

```typescript
import { assertEquals, assertExists, assert } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
// NOTE: This assumes an implementation named LikertSurveyConceptV2 that matches the second spec.
import LikertSurveyConceptV2 from "./LikertSurveyConceptV2.ts"; 

// Define mock IDs for testing purposes
const ownerA = "user:Alice" as ID;
const responderX = "user:Bob" as ID;
const responderY = "user:Charlie" as ID;
const responderZ = "user:Dave" as ID;

Deno.test("LikertSurveyConceptV2 Actions", async (t) => {
  const [db, client] = await testDb();
  // We are testing against the hypothetical V2 implementation
  const likertSurvey = new LikertSurveyConceptV2(db);

  let surveyId: ID;
  let q1Id: ID, q2Id: ID;

  await t.step("createSurvey: should create a new survey", async () => {
    console.log("  - Testing: createSurvey success case");
    const result = await likertSurvey.createSurvey({ owner: ownerA, title: "Service Quality" });
    surveyId = (result as { survey: ID }).survey;
    assertExists(surveyId);
  });
  
  await t.step("addQuestion: should add questions to the survey", async () => {
    console.log("  - Testing: addQuestion success case");
    const res1 = await likertSurvey.addQuestion({ survey: surveyId, stem: "Was the service prompt?" });
    const res2 = await likertSurvey.addQuestion({ survey: surveyId, stem: "Was the staff helpful?" });
    q1Id = (res1 as { question: ID }).question;
    q2Id = (res2 as { question: ID }).question;
    assertExists(q1Id);
    assertExists(q2Id);
  });

  await t.step("respondToQuestion: should create a new response", async () => {
    console.log("  - Testing: respondToQuestion (create)");
    const result = await likertSurvey.respondToQuestion({ question: q1Id, responder: responderX, choice: 5 });
    assertEquals(result, {});
  });
  
  await t.step("respondToQuestion: should update an existing response", async () => {
    console.log("  - Testing: respondToQuestion (update)");
    // First response was 5. Let's update it to 4.
    const result = await likertSurvey.respondToQuestion({ question: q1Id, responder: responderX, choice: 4 });
    assertEquals(result, {});

    // Verify the update by checking results
    const results = await likertSurvey._getQuestionResults({ question: q1Id });
    assertEquals(results.get(5), undefined, "The old choice (5) should be gone.");
    assertEquals(results.get(4), 1, "The new choice (4) should be present.");
  });

  await t.step("removeQuestion: should remove a question and its responses", async () => {
    console.log("  - Testing: removeQuestion");
    // Add another response to the question to be deleted
    await likertSurvey.respondToQuestion({ question: q1Id, responder: responderY, choice: 4 });
    
    // Check state before removal
    let questions = await likertSurvey._getSurveyQuestions({ survey: surveyId });
    assertEquals(questions.length, 2, "Should have 2 questions before removal.");
    let results = await likertSurvey._getQuestionResults({ question: q1Id });
    assertEquals(results.get(4), 2, "Should have 2 responses before removal.");

    // Perform removal
    const removeResult = await likertSurvey.removeQuestion({ question: q1Id });
    assertEquals(removeResult, {});

    // Check state after removal
    questions = await likertSurvey._getSurveyQuestions({ survey: surveyId });
    assertEquals(questions.length, 1, "Should have 1 question after removal.");
    assertEquals(questions[0]._id, q2Id);
    results = await likertSurvey._getQuestionResults({ question: q1Id });
    assertEquals(results.size, 0, "Should have 0 responses for the removed question.");
  });

  await client.close();
});


Deno.test("LikertSurveyConceptV2 Queries", async (t) => {
    const [db, client] = await testDb();
    const likertSurvey = new LikertSurveyConceptV2(db);

    // Setup
    const { survey } = await likertSurvey.createSurvey({ owner: ownerA, title: "Sentiment Analysis Test" }) as { survey: ID };
    const { question } = await likertSurvey.addQuestion({ survey, stem: "Rate this feature" }) as { question: ID };

    await t.step("_analyzeSentiment: should return 'positive'", async () => {
        await likertSurvey.respondToQuestion({ question, responder: responderX, choice: 4 });
        await likertSurvey.respondToQuestion({ question, responder: responderY, choice: 5 });
        const { sentiment } = await likertSurvey._analyzeSentiment({ question });
        assertEquals(sentiment, "positive"); // Average is 4.5 > 3.5
    });

    await t.step("_analyzeSentiment: should return 'negative'", async () => {
        await likertSurvey.respondToQuestion({ question, responder: responderX, choice: 1 });
        await likertSurvey.respondToQuestion({ question, responder: responderY, choice: 2 });
        const { sentiment } = await likertSurvey._analyzeSentiment({ question });
        assertEquals(sentiment, "negative"); // Average is 1.5 < 2.5
    });

    await t.step("_analyzeSentiment: should return 'bimodal' for polarized responses", async () => {
        await likertSurvey.respondToQuestion({ question, responder: responderX, choice: 1 });
        await likertSurvey.respondToQuestion({ question, responder: responderY, choice: 5 });
        const { sentiment } = await likertSurvey._analyzeSentiment({ question });
        assertEquals(sentiment, "bimodal"); // Average is 3, but std dev > 1.5
    });

    await t.step("_analyzeSentiment: should return 'mixed' for neutral/varied responses", async () => {
        await likertSurvey.respondToQuestion({ question, responder: responderX, choice: 2 });
        await likertSurvey.respondToQuestion({ question, responder: responderY, choice: 3 });
        await likertSurvey.respondToQuestion({ question, responder: responderZ, choice: 4 });
        const { sentiment } = await likertSurvey._analyzeSentiment({ question });
        assertEquals(sentiment, "mixed"); // Average is 3, std dev is low
    });
    
    await t.step("_analyzeSentiment: should return 'neutral' for no responses", async () => {
      const { question: noRespQuestion } = await likertSurvey.addQuestion({ survey, stem: "An unanswered question" }) as { question: ID };
      const { sentiment } = await likertSurvey._analyzeSentiment({ question: noRespQuestion });
      assertEquals(sentiment, "neutral");
    });

    await client.close();
});
```
