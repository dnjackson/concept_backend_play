---
timestamp: 'Sun Oct 12 2025 23:40:34 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_234034.79f8457d.md]]'
content_id: 899cde14af50aa36780f16a9f56e34647aaad4230ca21d38348f930a7d62109a
---

# file: src/concepts/LikertSurvey/LikertSurveyConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "./LikertSurveyConcept.ts";

// Define mock IDs for readable tests
const owner = "user:owner" as ID;
const responder1 = "user:responder1" as ID;
const responder2 = "user:responder2" as ID;
const responder3 = "user:responder3" as ID;
const nonExistentSurvey = "survey:nonExistent" as ID;
const nonExistentQuestion = "question:nonExistent" as ID;

Deno.test("LikertSurveyConcept: Principle Test", async (t) => {
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);

  await t.step(
    "Principle: An owner creates a survey, users respond, and the owner analyzes the results",
    async () => {
      console.log("TRACE: Testing the core principle of the LikertSurvey concept.");

      // 1. Owner creates a survey
      console.log("  Action: Owner creates a 'Team Satisfaction' survey.");
      const createSurveyResult = await likert.createSurvey({
        title: "Team Satisfaction",
        owner,
      });
      assertNotEquals("error" in createSurveyResult, true, "Survey creation should not fail");
      const { survey } = createSurveyResult as { survey: ID };
      assertExists(survey);

      // 2. Owner adds questions
      console.log("  Action: Owner adds two questions to the survey.");
      const addQ1Result = await likert.addQuestion({
        stem: "How do you feel about the work-life balance?",
        survey,
      });
      assertNotEquals("error" in addQ1Result, true, "Adding question 1 should not fail");
      const { question: q1 } = addQ1Result as { question: ID };
      assertExists(q1);

      const addQ2Result = await likert.addQuestion({
        stem: "Are you happy with the current tooling?",
        survey,
      });
      assertNotEquals("error" in addQ2Result, true, "Adding question 2 should not fail");
      const { question: q2 } = addQ2Result as { question: ID };
      assertExists(q2);

      // 3. Users respond to the questions
      console.log("  Action: Three users respond to the questions.");
      await likert.respondToQuestion({ question: q1, responder: responder1, choice: 5 });
      await likert.respondToQuestion({ question: q1, responder: responder2, choice: 4 });
      await likert.respondToQuestion({ question: q1, responder: responder3, choice: 5 });

      await likert.respondToQuestion({ question: q2, responder: responder1, choice: 4 });
      await likert.respondToQuestion({ question: q2, responder: responder2, choice: 1 });
      await likert.respondToQuestion({ question: q2, responder: responder3, choice: 2 });

      // 4. Owner analyzes the results
      console.log("  Verification: Owner analyzes the survey results.");
      const q1CountsResult = await likert._getQuestionResponseCounts({ question: q1 });
      assertEquals("error" in q1CountsResult[0], false);
      const { counts: q1Counts } = q1CountsResult[0] as { counts: number[] };
      assertEquals(q1Counts, [0, 0, 0, 1, 2], "Q1 counts should reflect 1 'Agree' and 2 'Strongly Agree'");

      const q1SentimentResult = await likert._analyzeSentiment({ question: q1 });
      assertEquals("error" in q1SentimentResult[0], false);
      const { sentiment: q1Sentiment } = q1SentimentResult[0] as { sentiment: string };
      assertEquals(q1Sentiment, "positive", "Q1 sentiment should be positive");

      const q2CountsResult = await likert._getQuestionResponseCounts({ question: q2 });
      assertEquals("error" in q2CountsResult[0], false);
      const { counts: q2Counts } = q2CountsResult[0] as { counts: number[] };
      assertEquals(q2Counts, [1, 1, 0, 1, 0], "Q2 counts should reflect one response for choice 1, 2, and 4");

      const q2SentimentResult = await likert._analyzeSentiment({ question: q2 });
      assertEquals("error" in q2SentimentResult[0], false);
      const { sentiment: q2Sentiment } = q2SentimentResult[0] as { sentiment: string };
      // Average is (4+1+2)/3 = 2.33, which is < 2.5, so 'negative'
      assertEquals(q2Sentiment, "negative", "Q2 sentiment should be negative due to low average score");

      console.log("TRACE: Principle test passed.");
    },
  );

  await client.close();
});

Deno.test("LikertSurveyConcept: Action Tests", async (t) => {
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);

  await t.step("Action: createSurvey", async (t) => {
    await t.step("Effects: Creates a new survey with a title and owner", async () => {
      console.log("\nTEST: createSurvey (success case)");
      const result = await likert.createSurvey({ title: "New Survey", owner });
      assertNotEquals("error" in result, true);
      const { survey } = result as { survey: ID };
      assertExists(survey);

      const titleResult = await likert._getSurveyTitle({ survey });
      const ownerResult = await likert._getSurveyOwner({ survey });
      assertEquals((titleResult[0] as { title: string }).title, "New Survey");
      assertEquals((ownerResult[0] as { owner: ID }).owner, owner);
      console.log("  Success: Survey created and verified.");
    });

    await t.step("Requires: Title must be non-empty", async () => {
      console.log("\nTEST: createSurvey (failure case - empty title)");
      const result = await likert.createSurvey({ title: "", owner });
      assertExists("error" in result && result.error);
      assertEquals(result.error, "Title cannot be empty");
      console.log("  Success: Action failed as required.");
    });
  });

  await t.step("Action: addQuestion", async (t) => {
    // Setup: create a survey first
    const { survey } = await likert.createSurvey({ title: "Survey for Questions", owner }) as { survey: ID };

    await t.step("Effects: Creates and associates a question with a survey", async () => {
      console.log("\nTEST: addQuestion (success case)");
      const result = await likert.addQuestion({ stem: "Is this a test question?", survey });
      assertNotEquals("error" in result, true);
      const { question } = result as { question: ID };
      assertExists(question);

      const questions = await likert._getSurveyQuestions({ survey });
      assertEquals(questions.length, 1);
      assertEquals((questions[0] as { question: ID }).question, question);
      console.log("  Success: Question added and verified.");
    });

    await t.step("Requires: Stem must be non-empty", async () => {
      console.log("\nTEST: addQuestion (failure case - empty stem)");
      const result = await likert.addQuestion({ stem: "", survey });
      assertExists("error" in result && result.error);
      assertEquals(result.error, "Question stem cannot be empty");
      console.log("  Success: Action failed as required.");
    });

    await t.step("Requires: Survey must exist", async () => {
      console.log("\nTEST: addQuestion (failure case - non-existent survey)");
      const result = await likert.addQuestion({ stem: "A valid question", survey: nonExistentSurvey });
      assertExists("error" in result && result.error);
      assertEquals(result.error, "Survey not found");
      console.log("  Success: Action failed as required.");
    });
  });

  await t.step("Action: removeQuestion", async (t) => {
    // Setup
    const { survey } = await likert.createSurvey({ title: "Survey for Deletion", owner }) as { survey: ID };
    const { question } = await likert.addQuestion({ stem: "To be deleted", survey }) as { question: ID };
    await likert.respondToQuestion({ question, responder: responder1, choice: 3 });

    await t.step("Effects: Removes a question and its associated responses", async () => {
      console.log("\nTEST: removeQuestion (success case)");
      const result = await likert.removeQuestion({ question });
      assertEquals("error" in result, false);

      const questions = await likert._getSurveyQuestions({ survey });
      assertEquals(questions.length, 0, "Question should be removed from survey");

      const counts = await likert._getQuestionResponseCounts({ question });
      assertExists("error" in counts[0], "Querying for a deleted question should fail");
      console.log("  Success: Question and its responses removed.");
    });

    await t.step("Requires: Question must exist", async () => {
      console.log("\nTEST: removeQuestion (failure case - non-existent question)");
      const result = await likert.removeQuestion({ question: nonExistentQuestion });
      assertExists("error" in result && result.error);
      assertEquals(result.error, "Question not found");
      console.log("  Success: Action failed as required.");
    });
  });

  await t.step("Action: respondToQuestion", async (t) => {
    // Setup
    const { survey } = await likert.createSurvey({ title: "Survey for Responses", owner }) as { survey: ID };
    const { question } = await likert.addQuestion({ stem: "A question to answer", survey }) as { question: ID };

    await t.step("Effects: Creates a new response", async () => {
      console.log("\nTEST: respondToQuestion (success case)");
      const result = await likert.respondToQuestion({ question, responder: responder1, choice: 5 });
      assertEquals("error" in result, false);

      const countsResult = await likert._getQuestionResponseCounts({ question });
      const { counts } = countsResult[0] as { counts: number[] };
      assertEquals(counts, [0, 0, 0, 0, 1]);
      console.log("  Success: Response recorded.");
    });

    await t.step("Effects: Overwrites a user's previous response", async () => {
      console.log("\nTEST: respondToQuestion (update case)");
      await likert.respondToQuestion({ question, responder: responder2, choice: 1 });
      let countsResult = await likert._getQuestionResponseCounts({ question });
      assertEquals((countsResult[0] as { counts: number[] }).counts, [1, 0, 0, 0, 1]);

      // Now, responder2 changes their mind
      await likert.respondToQuestion({ question, responder: responder2, choice: 2 });
      countsResult = await likert._getQuestionResponseCounts({ question });
      assertEquals((countsResult[0] as { counts: number[] }).counts, [0, 1, 0, 0, 1], "Previous response should be replaced");
      console.log("  Success: Response updated.");
    });

    await t.step("Requires: Choice must be an integer between 1 and 5", async (t) => {
      console.log("\nTEST: respondToQuestion (failure case - invalid choices)");
      const invalidChoices = [0, 6, 3.5, -1];
      for (const choice of invalidChoices) {
        await t.step(`Choice: ${choice}`, async () => {
          const result = await likert.respondToQuestion({ question, responder: responder3, choice });
          assertExists("error" in result && result.error);
          assertEquals(result.error, "Choice must be an integer between 1 and 5");
        });
      }
      console.log("  Success: Action failed for all invalid choices.");
    });
  });

  await client.close();
});

Deno.test("LikertSurveyConcept: Query Tests", async (t) => {
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);

  // Setup: Create a comprehensive state for testing queries
  const { survey: s1 } = await likert.createSurvey({ title: "Survey 1", owner }) as { survey: ID };
  const { survey: s2 } = await likert.createSurvey({ title: "Survey 2", owner: responder1 }) as { survey: ID };

  const { question: q1 } = await likert.addQuestion({ stem: "Q1", survey: s1 }) as { question: ID };
  const { question: q2 } = await likert.addQuestion({ stem: "Q2", survey: s1 }) as { question: ID };
  // q1 responses: [5, 4, 1, 1, 5] -> avg 3.2, stddev high -> bimodal
  // q2 responses: [3, 3] -> avg 3 -> mixed
  await likert.respondToQuestion({ question: q1, responder: "u1" as ID, choice: 5 });
  await likert.respondToQuestion({ question: q1, responder: "u2" as ID, choice: 4 });
  await likert.respondToQuestion({ question: q1, responder: "u3" as ID, choice: 1 });
  await likert.respondToQuestion({ question: q1, responder: "u4" as ID, choice: 1 });
  await likert.respondToQuestion({ question: q1, responder: "u5" as ID, choice: 5 });
  await likert.respondToQuestion({ question: q2, responder: "u1" as ID, choice: 3 });
  await likert.respondToQuestion({ question: q2, responder: "u2" as ID, choice: 3 });

  await t.step("_getSurveyQuestions: Returns all questions for a survey", async () => {
    const result = await likert._getSurveyQuestions({ survey: s1 });
    assertEquals(result.length, 2);
    const questionIds = result.map((r) => (r as { question: ID }).question);
    assertEquals(questionIds.includes(q1), true);
    assertEquals(questionIds.includes(q2), true);
  });

  await t.step("_getQuestionResponseCounts: Returns correct counts", async () => {
    const result = await likert._getQuestionResponseCounts({ question: q1 });
    assertEquals((result[0] as { counts: number[] }).counts, [2, 0, 0, 1, 2]);
  });

  await t.step("_getUserSurveys: Returns all surveys owned by a user", async () => {
    const result = await likert._getUserSurveys({ user: owner });
    assertEquals(result.length, 1);
    assertEquals((result[0] as { survey: ID }).survey, s1);
  });

  await t.step("_analyzeSentiment: Correctly identifies sentiment", async (t) => {
    await t.step("Identifies 'positive' sentiment", async () => {
      const { question } = await likert.addQuestion({ stem: "Positive Q", survey: s1 }) as { question: ID };
      await likert.respondToQuestion({ question, responder: "u1" as ID, choice: 5 });
      await likert.respondToQuestion({ question, responder: "u2" as ID, choice: 4 });
      const result = await likert._analyzeSentiment({ question });
      assertEquals((result[0] as { sentiment: string }).sentiment, "positive");
    });
    await t.step("Identifies 'negative' sentiment", async () => {
      const { question } = await likert.addQuestion({ stem: "Negative Q", survey: s1 }) as { question: ID };
      await likert.respondToQuestion({ question, responder: "u1" as ID, choice: 1 });
      await likert.respondToQuestion({ question, responder: "u2" as ID, choice: 2 });
      const result = await likert._analyzeSentiment({ question });
      assertEquals((result[0] as { sentiment: string }).sentiment, "negative");
    });
    await t.step("Identifies 'mixed' sentiment", async () => {
      const result = await likert._analyzeSentiment({ question: q2 });
      assertEquals((result[0] as { sentiment: string }).sentiment, "mixed");
    });
    await t.step("Identifies 'bimodal' sentiment", async () => {
      const result = await likert._analyzeSentiment({ question: q1 });
      assertEquals((result[0] as { sentiment: string }).sentiment, "bimodal");
    });
    await t.step("Identifies 'neutral' for no responses", async () => {
      const { question } = await likert.addQuestion({ stem: "Neutral Q", survey: s1 }) as { question: ID };
      const result = await likert._analyzeSentiment({ question });
      assertEquals((result[0] as { sentiment: string }).sentiment, "neutral");
    });
  });

  await client.close();
});
```
