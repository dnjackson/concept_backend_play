---
timestamp: 'Sat Oct 11 2025 22:40:33 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251011_224033.6c06c876.md]]'
content_id: 8f7c2b4a11dde9cfe4ddc0c98077fbb6642f210639f193cc0dddfe0d5a13b132
---

# file: src/likertsurvey/LikertSurveyConcept.test.ts

```typescript
import { assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "./LikertSurveyConcept.ts";

// Define mock IDs for testing purposes
const authorA = "author:A" as ID;
const authorB = "author:B" as ID;
const respondentX = "respondent:X" as ID;
const respondentY = "respondent:Y" as ID;

Deno.test("LikertSurveyConcept Actions", async (t) => {
  const [db, client] = await testDb();
  const likertSurvey = new LikertSurveyConcept(db);

  await t.step("createSurvey: should create a new survey successfully", async () => {
    console.log("  - Testing: createSurvey success case");
    const result = await likertSurvey.createSurvey({
      author: authorA,
      title: "Customer Satisfaction",
      scaleMin: 1,
      scaleMax: 5,
    });
    assertExists((result as { survey: ID }).survey, "Expected a survey ID to be returned");
  });

  await t.step("createSurvey: should fail if scaleMin >= scaleMax", async () => {
    console.log("  - Testing: createSurvey failure case (invalid scale)");
    const result = await likertSurvey.createSurvey({
      author: authorA,
      title: "Invalid Survey",
      scaleMin: 5,
      scaleMax: 1,
    });
    assertEquals((result as { error: string }).error, "scaleMin must be less than scaleMax");
  });

  await t.step("addQuestion: should add a question to an existing survey", async () => {
    console.log("  - Testing: addQuestion success case");
    const surveyRes = await likertSurvey.createSurvey({ author: authorA, title: "Team Morale", scaleMin: 1, scaleMax: 10 });
    const surveyId = (surveyRes as { survey: ID }).survey;
    const questionRes = await likertSurvey.addQuestion({ survey: surveyId, text: "How do you feel about the new coffee machine?" });
    assertExists((questionRes as { question: ID }).question, "Expected a question ID to be returned");
  });

  await t.step("addQuestion: should fail for a non-existent survey", async () => {
    console.log("  - Testing: addQuestion failure case (non-existent survey)");
    const fakeSurveyId = "survey:fake" as ID;
    const result = await likertSurvey.addQuestion({ survey: fakeSurveyId, text: "This will fail" });
    assertEquals((result as { error: string }).error, `Survey with ID ${fakeSurveyId} not found.`);
  });

  await t.step("submitResponse & updateResponse: should handle response lifecycle", async () => {
    console.log("  - Testing: submitResponse and updateResponse full lifecycle");
    const surveyRes = await likertSurvey.createSurvey({ author: authorB, title: "Product Feedback", scaleMin: 1, scaleMax: 5 });
    const surveyId = (surveyRes as { survey: ID }).survey;
    const questionRes = await likertSurvey.addQuestion({ survey: surveyId, text: "Rate our new feature." });
    const questionId = (questionRes as { question: ID }).question;

    // Test successful submission
    const submitRes = await likertSurvey.submitResponse({ respondent: respondentX, question: questionId, value: 4 });
    assertEquals(submitRes, {}, "Expected successful response submission");

    // Test failure on re-submission
    const submitAgainRes = await likertSurvey.submitResponse({ respondent: respondentX, question: questionId, value: 5 });
    assertEquals((submitAgainRes as { error: string }).error, "Respondent has already answered this question. Use updateResponse to change it.");

    // Test failure on value outside scale
    const submitInvalidRes = await likertSurvey.submitResponse({ respondent: respondentY, question: questionId, value: 6 });
    assertEquals((submitInvalidRes as { error: string }).error, "Response value 6 is outside the survey's scale [1, 5].");

    // Test successful update
    const updateRes = await likertSurvey.updateResponse({ respondent: respondentX, question: questionId, value: 5 });
    assertEquals(updateRes, {}, "Expected successful response update");

    // Test failure on updating non-existent response
    const updateNonExistentRes = await likertSurvey.updateResponse({ respondent: respondentY, question: questionId, value: 3 });
    assertEquals((updateNonExistentRes as { error: string }).error, "No existing response found to update. Use submitResponse to create one.");
  });

  await client.close();
});

Deno.test("LikertSurveyConcept Queries", async (t) => {
  const [db, client] = await testDb();
  const likertSurvey = new LikertSurveyConcept(db);

  // Setup: Create a survey with 2 questions, and have 2 respondents answer.
  const surveyRes = await likertSurvey.createSurvey({ author: authorA, title: "Event Feedback", scaleMin: 1, scaleMax: 7 });
  const surveyId = (surveyRes as { survey: ID }).survey;
  const q1Res = await likertSurvey.addQuestion({ survey: surveyId, text: "Venue rating?" });
  const q1Id = (q1Res as { question: ID }).question;
  const q2Res = await likertSurvey.addQuestion({ survey: surveyId, text: "Speaker rating?" });
  const q2Id = (q2Res as { question: ID }).question;
  await likertSurvey.submitResponse({ respondent: respondentX, question: q1Id, value: 6 });
  await likertSurvey.submitResponse({ respondent: respondentX, question: q2Id, value: 7 });
  await likertSurvey.submitResponse({ respondent: respondentY, question: q1Id, value: 5 });

  await t.step("_getSurveyQuestions: should retrieve all questions for a survey", async () => {
    console.log("  - Testing: _getSurveyQuestions");
    const questions = await likertSurvey._getSurveyQuestions({ survey: surveyId });
    assertEquals(questions.length, 2);
    assertEquals(questions.map((q) => q._id).sort(), [q1Id, q2Id].sort());
  });

  await t.step("_getSurveyResponses: should retrieve all responses for a survey", async () => {
    console.log("  - Testing: _getSurveyResponses");
    const responses = await likertSurvey._getSurveyResponses({ survey: surveyId });
    assertEquals(responses.length, 3);
  });

  await t.step("_getRespondentAnswers: should retrieve all answers for a respondent", async () => {
    console.log("  - Testing: _getRespondentAnswers");
    const respondentXAnswers = await likertSurvey._getRespondentAnswers({ respondent: respondentX });
    assertEquals(respondentXAnswers.length, 2);
    const respondentYAnswers = await likertSurvey._getRespondentAnswers({ respondent: respondentY });
    assertEquals(respondentYAnswers.length, 1);
    assertEquals(respondentYAnswers[0].value, 5);
  });

  await client.close();
});

Deno.test("LikertSurveyConcept Principle Trace", async () => {
  console.log("\n# Trace: Testing the core principle of the LikertSurvey concept.");
  const [db, client] = await testDb();
  const likertSurvey = new LikertSurveyConcept(db);

  console.log("  Principle: An author creates a survey with questions, a respondent answers, and the author can view the responses.");

  // Step 1: Author creates a survey
  console.log("  - Step 1: An author creates a survey titled 'Workspace Comfort'.");
  const surveyRes = await likertSurvey.createSurvey({ author: authorA, title: "Workspace Comfort", scaleMin: 1, scaleMax: 5 });
  const surveyId = (surveyRes as { survey: ID }).survey;
  assertExists(surveyId, "Trace failed: Survey could not be created.");

  // Step 2: Author adds questions
  console.log("  - Step 2: The author adds two questions to the survey.");
  const q1Res = await likertSurvey.addQuestion({ survey: surveyId, text: "How is the chair comfort?" });
  const q1Id = (q1Res as { question: ID }).question;
  const q2Res = await likertSurvey.addQuestion({ survey: surveyId, text: "How is the office lighting?" });
  const q2Id = (q2Res as { question: ID }).question;
  assertExists(q1Id, "Trace failed: First question could not be added.");
  assertExists(q2Id, "Trace failed: Second question could not be added.");

  // Step 3: A respondent submits their answers
  console.log("  - Step 3: A respondent answers the questions.");
  await likertSurvey.submitResponse({ respondent: respondentX, question: q1Id, value: 4 });
  await likertSurvey.submitResponse({ respondent: respondentX, question: q2Id, value: 2 });

  // Step 4: The author views the collected responses
  console.log("  - Step 4: The author views the collected responses to analyze opinions.");
  const responses = await likertSurvey._getSurveyResponses({ survey: surveyId });
  assertEquals(responses.length, 2, "Trace failed: Expected two responses for the survey.");

  const responseForQ1 = responses.find((r) => r.question === q1Id);
  const responseForQ2 = responses.find((r) => r.question === q2Id);
  assertEquals(responseForQ1?.value, 4, "Trace failed: Mismatch in response for question 1.");
  assertEquals(responseForQ2?.value, 2, "Trace failed: Mismatch in response for question 2.");

  console.log("  - Principle successfully verified.");
  await client.close();
});
```
