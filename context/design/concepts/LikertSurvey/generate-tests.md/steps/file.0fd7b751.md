---
timestamp: 'Sun Oct 12 2025 22:11:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_221159.9d9ad53d.md]]'
content_id: 0fd7b7514a1aa110a865d76f7ad669cd961913ad5a0bde3f9b3f62766031ee5a
---

# file: src/concepts/LikertSurvey/LikertSurveyConcept.test.ts

```typescript
import { assert, assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "./LikertSurveyConcept.ts";

// Define generic type aliases for clarity in tests
type User = ID;
type Survey = ID;
type Question = ID;

Deno.test("LikertSurveyConcept: Principle Test", async () => {
  console.log("--- Principle Test: Fulfilling the Likert Survey purpose ---");
  const [db, client] = await testDb();
  try {
    const concept = new LikertSurveyConcept(db);
    const owner = "user:owner" as User;
    const responder1 = "user:responder1" as User;
    const responder2 = "user:responder2" as User;
    const responder3 = "user:responder3" as User;

    console.log(`Action: ${owner} creates a survey.`);
    const createSurveyResult = await concept.createSurvey({ title: "Team Satisfaction", owner });
    assertNotEquals("error" in createSurveyResult, true, "createSurvey should not fail");
    const { survey } = createSurveyResult as { survey: Survey };
    console.log(` > Survey created with ID: ${survey}`);

    console.log(`Action: ${owner} adds two questions to the survey.`);
    const addQ1Result = await concept.addQuestion({ stem: "How satisfied are you with work-life balance?", survey });
    const addQ2Result = await concept.addQuestion({ stem: "How do you rate team collaboration?", survey });
    assertNotEquals("error" in addQ1Result, true);
    assertNotEquals("error" in addQ2Result, true);
    const { question: q1 } = addQ1Result as { question: Question };
    const { question: q2 } = addQ2Result as { question: Question };
    console.log(` > Question 1 added: ${q1}`);
    console.log(` > Question 2 added: ${q2}`);

    console.log("Action: Users respond to the questions.");
    await concept.respondToQuestion({ question: q1, responder: responder1, choice: 5 }); // Positive
    await concept.respondToQuestion({ question: q1, responder: responder2, choice: 4 }); // Positive
    await concept.respondToQuestion({ question: q2, responder: responder1, choice: 1 }); // Negative
    await concept.respondToQuestion({ question: q2, responder: responder2, choice: 2 }); // Negative
    await concept.respondToQuestion({ question: q2, responder: responder3, choice: 5 }); // Bimodal contributor
    console.log(` > ${responder1} responded to Q1 with 5, Q2 with 1.`);
    console.log(` > ${responder2} responded to Q1 with 4, Q2 with 2.`);
    console.log(` > ${responder3} responded to Q2 with 5.`);

    console.log("Query: Retrieving aggregated results for Question 1.");
    const resultsQ1Result = await concept._getQuestionResults({ question: q1 });
    assertNotEquals("error" in resultsQ1Result, true);
    const { results: resultsQ1 } = resultsQ1Result as { results: Record<number, number> };
    assertEquals(resultsQ1, { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 });
    console.log(" > Verified: Results for Q1 are correct.", resultsQ1);

    console.log("Query: Analyzing sentiment for Question 1.");
    const sentimentQ1Result = await concept._analyzeSentiment({ question: q1 });
    assertNotEquals("error" in sentimentQ1Result, true);
    const { sentiment: sentimentQ1 } = sentimentQ1Result as { sentiment: string };
    assertEquals(sentimentQ1, "positive");
    console.log(" > Verified: Sentiment for Q1 is 'positive'.");

    console.log("Query: Retrieving aggregated results for Question 2.");
    const resultsQ2Result = await concept._getQuestionResults({ question: q2 });
    assertNotEquals("error" in resultsQ2Result, true);
    const { results: resultsQ2 } = resultsQ2Result as { results: Record<number, number> };
    assertEquals(resultsQ2, { 1: 1, 2: 1, 3: 0, 4: 0, 5: 1 });
    console.log(" > Verified: Results for Q2 are correct.", resultsQ2);

    console.log("Query: Analyzing sentiment for Question 2.");
    const sentimentQ2Result = await concept._analyzeSentiment({ question: q2 });
    assertNotEquals("error" in sentimentQ2Result, true);
    const { sentiment: sentimentQ2 } = sentimentQ2Result as { sentiment: string };
    assertEquals(sentimentQ2, "bimodal");
    console.log(" > Verified: Sentiment for Q2 is 'bimodal'.");

    console.log("--- Principle Test Passed ---");
  } finally {
    await client.close();
  }
});

Deno.test("LikertSurveyConcept: Action tests", async (t) => {
  const [db, client] = await testDb();
  const concept = new LikertSurveyConcept(db);
  const owner = "user:test" as User;
  const responder = "user:responder" as User;

  let surveyId: Survey;
  let questionId: Question;

  await t.step("createSurvey: requires a non-empty title", async () => {
    console.log("Test: createSurvey requires a non-empty title.");
    const result = await concept.createSurvey({ title: "", owner });
    assert("error" in result, "Expected an error for empty title");
    assertEquals(result.error, "Title cannot be empty");
    console.log(" > Passed: Correctly returns error for empty title.");
  });

  await t.step("createSurvey: effects create a new survey", async () => {
    console.log("Test: createSurvey effects create a new survey.");
    const result = await concept.createSurvey({ title: "My Survey", owner });
    assertNotEquals("error" in result, true);
    surveyId = (result as { survey: Survey }).survey;
    const surveyDoc = await concept.surveys.findOne({ _id: surveyId });
    assertExists(surveyDoc);
    assertEquals(surveyDoc.title, "My Survey");
    assertEquals(surveyDoc.owner, owner);
    console.log(" > Passed: Survey created successfully in DB.");
  });

  await t.step("addQuestion: requires survey to exist", async () => {
    console.log("Test: addQuestion requires survey to exist.");
    const fakeSurvey = "survey:fake" as Survey;
    const result = await concept.addQuestion({ stem: "A Question", survey: fakeSurvey });
    assert("error" in result, "Expected an error for non-existent survey");
    assertEquals(result.error, "Survey not found");
    console.log(" > Passed: Correctly returns error for non-existent survey.");
  });

  await t.step("addQuestion: effects create a new question", async () => {
    console.log("Test: addQuestion effects create a new question.");
    const result = await concept.addQuestion({ stem: "A Real Question", survey: surveyId });
    assertNotEquals("error" in result, true);
    questionId = (result as { question: Question }).question;
    const questionDoc = await concept.questions.findOne({ _id: questionId });
    assertExists(questionDoc);
    assertEquals(questionDoc.stem, "A Real Question");
    assertEquals(questionDoc.survey, surveyId);
    console.log(" > Passed: Question created successfully in DB.");
  });

  await t.step("respondToQuestion: requires a valid choice (1-5)", async () => {
    console.log("Test: respondToQuestion requires a valid choice.");
    const r1 = await concept.respondToQuestion({ question: questionId, responder, choice: 0 });
    assert("error" in r1, "Expected error for choice 0");
    const r2 = await concept.respondToQuestion({ question: questionId, responder, choice: 6 });
    assert("error" in r2, "Expected error for choice 6");
    const r3 = await concept.respondToQuestion({ question: questionId, responder, choice: 3.5 });
    assert("error" in r3, "Expected error for non-integer choice");
    console.log(" > Passed: Correctly returns errors for invalid choices.");
  });

  await t.step("respondToQuestion: effects create a response and overwrite previous ones", async () => {
    console.log("Test: respondToQuestion effects create/overwrite responses.");
    // First response
    await concept.respondToQuestion({ question: questionId, responder, choice: 3 });
    let responses = await concept.responses.find({ question: questionId, responder }).toArray();
    assertEquals(responses.length, 1);
    assertEquals(responses[0].choice, 3);
    console.log(" > First response recorded.");

    // Second response from the same user should overwrite the first
    await concept.respondToQuestion({ question: questionId, responder, choice: 5 });
    responses = await concept.responses.find({ question: questionId, responder }).toArray();
    assertEquals(responses.length, 1);
    assertEquals(responses[0].choice, 5);
    console.log(" > Passed: Second response correctly overwrote the first.");
  });

  await t.step("removeQuestion: effects remove the question and its responses", async () => {
    console.log("Test: removeQuestion effects remove question and responses.");
    assertExists(await concept.questions.findOne({ _id: questionId }));
    assertExists(await concept.responses.findOne({ question: questionId }));

    const result = await concept.removeQuestion({ question: questionId });
    assert(!("error" in result), "removeQuestion should not fail");

    assertEquals(await concept.questions.findOne({ _id: questionId }), null);
    assertEquals(await concept.responses.findOne({ question: questionId }), null);
    console.log(" > Passed: Question and its associated responses were deleted.");
  });

  await client.close();
});

Deno.test("LikertSurveyConcept: Query tests", async (t) => {
  const [db, client] = await testDb();
  const concept = new LikertSurveyConcept(db);
  const owner = "user:owner" as User;
  const survey = "survey:1" as Survey;

  await concept.surveys.insertOne({ _id: survey, owner, title: "Query Test Survey" });
  const q1 = "q:1" as Question;
  const q2 = "q:2" as Question;
  await concept.questions.insertMany([
    { _id: q1, survey, stem: "Q1" },
    { _id: q2, survey, stem: "Q2" },
  ]);

  await concept.responses.insertMany([
    { _id: "r:1" as ID, question: q1, responder: "u:1" as User, choice: 1 },
    { _id: "r:2" as ID, question: q1, responder: "u:2" as User, choice: 1 },
    { _id: "r:3" as ID, question: q1, responder: "u:3" as User, choice: 5 },
  ]);

  await t.step("_getUserSurveys: returns surveys for a given user", async () => {
    const res = await concept._getUserSurveys({ user: owner });
    assertNotEquals("error" in res, true);
    const { surveys } = res as { surveys: Survey[] };
    assertEquals(surveys.length, 1);
    assertEquals(surveys[0], survey);
  });

  await t.step("_getSurveyQuestions: returns questions for a given survey", async () => {
    const res = await concept._getSurveyQuestions({ survey });
    assertNotEquals("error" in res, true);
    const { questions } = res as { questions: Question[] };
    assertEquals(questions.length, 2);
    assertEquals(new Set(questions), new Set([q1, q2]));
  });

  await t.step("_getQuestionResponseCounts: returns array of counts by choice", async () => {
    const res = await concept._getQuestionResponseCounts({ question: q1 });
    assertNotEquals("error" in res, true);
    const { counts } = res as { counts: number[] };
    assertEquals(counts, [2, 0, 0, 0, 1]);
  });

  await t.step("_analyzeSentiment: correctly identifies 'bimodal' sentiment", async () => {
    const res = await concept._analyzeSentiment({ question: q1 });
    assertNotEquals("error" in res, true);
    const { sentiment } = res as { sentiment: string };
    assertEquals(sentiment, "bimodal");
  });

  await client.close();
});

```
