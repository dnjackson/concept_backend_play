[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

[@testing-concepts](../../background/testing-concepts.md)

Please generate a test file for this concept implementation:

[@LikertSurveyConcept.ts](../../../src/concepts/LikertSurvey/LikertSurveyConcept.ts)
# response:

Here are the test file and trace for the `LikertSurveyConcept`.

# concept: LikertSurvey

*   **concept**: LikertSurvey \[User]
*   **purpose**: understand group sentiment on a set of topics by aggregating quantitative feedback
*   **principle**: If an owner creates a survey and adds questions, and several users respond to these questions, then the owner can view the aggregated results for each question to understand the collective sentiment, distinguishing between positive, negative, mixed, or bimodal opinions.
*   **state**:
    *   a set of Surveys with
        *   a title String
        *   an owner User
    *   a set of Questions with
        *   a stem String
        *   a survey Survey
    *   a set of Responses with
        *   a responder User
        *   a question Question
        *   a choice Number (1-5)
*   **actions**:
    *   `createSurvey (title: String, owner: User): (survey: Survey)`
    *   `addQuestion (stem: String, survey: Survey): (question: Question)`
    *   `removeQuestion (question: Question)`
    *   `respondToQuestion (question: Question, responder: User, choice: Number)`
*   **queries**:
    *   `_getSurveyQuestions (survey: Survey): (questions: set of Question)`
    *   `_getQuestionResults (question: Question): (results: map of Number to Number)`
    *   `_analyzeSentiment (question: Question): (sentiment: String)`
    *   `_getQuestionResponseCounts (question: Question): (counts: array of Number)`

# file: src/concepts/LikertSurvey/LikertSurveyConcept.test.ts

```typescript
import { assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "./LikertSurveyConcept.ts";

// Mock IDs for testing
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const userCharlie = "user:Charlie" as ID;

Deno.test("LikertSurveyConcept Actions", async (t) => {
  await t.step("createSurvey: creates a survey successfully", async () => {
    console.log("Testing: createSurvey success case");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);
    const result = await likert.createSurvey({ title: "Customer Feedback", owner: userAlice });
    assertExists(result.survey);
    console.log(`  - Created survey with ID: ${result.survey}`);

    const surveyDoc = await likert.surveys.findOne({ _id: result.survey });
    assertExists(surveyDoc);
    assertEquals(surveyDoc.title, "Customer Feedback");
    assertEquals(surveyDoc.owner, userAlice);
    console.log("  - Verified survey document in database");

    await client.close();
  });

  await t.step("createSurvey: fails with empty title", async () => {
    console.log("Testing: createSurvey requires non-empty title");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);
    const result = await likert.createSurvey({ title: "", owner: userAlice });
    assertEquals(result.error, "Survey title cannot be empty.");
    console.log("  - Confirmed error for empty title");
    await client.close();
  });

  await t.step("addQuestion: adds a question to an existing survey", async () => {
    console.log("Testing: addQuestion success case");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);
    const surveyRes = await likert.createSurvey({ title: "Team Morale", owner: userBob });
    assertExists(surveyRes.survey);
    console.log(`  - Created survey: ${surveyRes.survey}`);

    const questionRes = await likert.addQuestion({ stem: "How is the work-life balance?", survey: surveyRes.survey });
    assertExists(questionRes.question);
    console.log(`  - Added question: ${questionRes.question}`);

    const questionDoc = await likert.questions.findOne({ _id: questionRes.question });
    assertExists(questionDoc);
    assertEquals(questionDoc.stem, "How is the work-life balance?");
    assertEquals(questionDoc.survey, surveyRes.survey);
    console.log("  - Verified question document in database");

    await client.close();
  });

  await t.step("addQuestion: fails with non-existent survey", async () => {
    console.log("Testing: addQuestion requires survey to exist");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);
    const fakeSurveyId = "survey:fake" as ID;
    const result = await likert.addQuestion({ stem: "A valid question", survey: fakeSurveyId });
    assertEquals(result.error, "Survey not found.");
    console.log("  - Confirmed error for non-existent survey");
    await client.close();
  });

  await t.step("removeQuestion: removes a question and its responses", async () => {
    console.log("Testing: removeQuestion effects (removes question and responses)");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);

    const { survey } = await likert.createSurvey({ title: "Test Survey", owner: userAlice });
    const { question } = await likert.addQuestion({ stem: "Test Question", survey });
    await likert.respondToQuestion({ question, responder: userBob, choice: 4 });
    console.log(`  - Setup: created survey, question ${question}, and a response.`);

    let questionDoc = await likert.questions.findOne({ _id: question });
    let responses = await likert.responses.find({ question }).toArray();
    assertExists(questionDoc);
    assertEquals(responses.length, 1);
    console.log("  - Verified setup state is correct.");

    const result = await likert.removeQuestion({ question });
    assertEquals(result, {});
    console.log("  - Executed removeQuestion action successfully.");

    questionDoc = await likert.questions.findOne({ _id: question });
    responses = await likert.responses.find({ question }).toArray();
    assertEquals(questionDoc, null);
    assertEquals(responses.length, 0);
    console.log("  - Verified question and associated responses were deleted.");

    await client.close();
  });

  await t.step("respondToQuestion: creates and overwrites a response", async () => {
    console.log("Testing: respondToQuestion effects (create and overwrite)");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);

    const { survey } = await likert.createSurvey({ title: "Product Feedback", owner: userAlice });
    const { question } = await likert.addQuestion({ stem: "Rate our new feature", survey });
    console.log(`  - Setup: created survey and question ${question}.`);

    await likert.respondToQuestion({ question, responder: userCharlie, choice: 3 });
    let responseDoc = await likert.responses.findOne({ question, responder: userCharlie });
    assertExists(responseDoc);
    assertEquals(responseDoc.choice, 3);
    console.log("  - User Charlie responded with choice 3, response created.");

    await likert.respondToQuestion({ question, responder: userCharlie, choice: 5 });
    responseDoc = await likert.responses.findOne({ question, responder: userCharlie });
    assertExists(responseDoc);
    assertEquals(responseDoc.choice, 5);
    const count = await likert.responses.countDocuments({ question, responder: userCharlie });
    assertEquals(count, 1);
    console.log("  - User Charlie changed response to 5, old response was overwritten.");

    await client.close();
  });

  await t.step("respondToQuestion: fails with invalid choice", async () => {
    console.log("Testing: respondToQuestion requires valid choice (1-5 integer)");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);

    const { survey } = await likert.createSurvey({ title: "Service Quality", owner: userAlice });
    const { question } = await likert.addQuestion({ stem: "How was our service?", survey });
    console.log("  - Setup complete.");

    const result1 = await likert.respondToQuestion({ question, responder: userBob, choice: 0 });
    assertEquals(result1.error, "Choice must be an integer between 1 and 5.");
    console.log("  - Confirmed error for choice < 1.");

    const result2 = await likert.respondToQuestion({ question, responder: userBob, choice: 6 });
    assertEquals(result2.error, "Choice must be an integer between 1 and 5.");
    console.log("  - Confirmed error for choice > 5.");

    const result3 = await likert.respondToQuestion({ question, responder: userBob, choice: 3.5 });
    assertEquals(result3.error, "Choice must be an integer between 1 and 5.");
    console.log("  - Confirmed error for non-integer choice.");

    await client.close();
  });
});

Deno.test("LikertSurveyConcept Queries", async (t) => {
  await t.step("_getQuestionResults and _getQuestionResponseCounts", async () => {
    console.log("Testing: _getQuestionResults and _getQuestionResponseCounts");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);

    const { survey } = await likert.createSurvey({ title: "Employee Satisfaction", owner: userAlice });
    const { question } = await likert.addQuestion({ stem: "Are you happy at work?", survey });

    await likert.respondToQuestion({ question, responder: userAlice, choice: 5 });
    await likert.respondToQuestion({ question, responder: userBob, choice: 5 });
    await likert.respondToQuestion({ question, responder: userCharlie, choice: 1 });
    console.log("  - Setup: 2 responses with choice 5, 1 response with choice 1.");

    const results = await likert._getQuestionResults({ question });
    assertEquals(results, [{ 1: 1, 2: 0, 3: 0, 4: 0, 5: 2 }]);
    console.log("  - Verified _getQuestionResults returns correct map.");

    const counts = await likert._getQuestionResponseCounts({ question });
    assertEquals(counts, [[1, 0, 0, 0, 2]]);
    console.log("  - Verified _getQuestionResponseCounts returns correct array.");

    await client.close();
  });

  await t.step("_analyzeSentiment: correctly identifies sentiment", async () => {
    console.log("Testing: _analyzeSentiment for all cases");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);

    const { survey } = await likert.createSurvey({ title: "Sentiment Test", owner: userAlice });

    // Positive case
    const { question: positiveQ } = await likert.addQuestion({ stem: "Positive Question", survey });
    await likert.respondToQuestion({ question: positiveQ, responder: userAlice, choice: 5 });
    await likert.respondToQuestion({ question: positiveQ, responder: userBob, choice: 4 });
    const positiveSentiment = await likert._analyzeSentiment({ question: positiveQ });
    assertEquals(positiveSentiment, [{ sentiment: "positive" }]);
    console.log("  - Verified 'positive' sentiment.");

    // Negative case
    const { question: negativeQ } = await likert.addQuestion({ stem: "Negative Question", survey });
    await likert.respondToQuestion({ question: negativeQ, responder: userAlice, choice: 1 });
    await likert.respondToQuestion({ question: negativeQ, responder: userBob, choice: 2 });
    const negativeSentiment = await likert._analyzeSentiment({ question: negativeQ });
    assertEquals(negativeSentiment, [{ sentiment: "negative" }]);
    console.log("  - Verified 'negative' sentiment.");

    // Bimodal case
    const { question: bimodalQ } = await likert.addQuestion({ stem: "Bimodal Question", survey });
    await likert.respondToQuestion({ question: bimodalQ, responder: userAlice, choice: 1 });
    await likert.respondToQuestion({ question: bimodalQ, responder: userBob, choice: 5 });
    const bimodalSentiment = await likert._analyzeSentiment({ question: bimodalQ });
    assertEquals(bimodalSentiment, [{ sentiment: "bimodal" }]);
    console.log("  - Verified 'bimodal' sentiment.");

    // Mixed case
    const { question: mixedQ } = await likert.addQuestion({ stem: "Mixed Question", survey });
    await likert.respondToQuestion({ question: mixedQ, responder: userAlice, choice: 2 });
    await likert.respondToQuestion({ question: mixedQ, responder: userBob, choice: 3 });
    await likert.respondToQuestion({ question: mixedQ, responder: userCharlie, choice: 4 });
    const mixedSentiment = await likert._analyzeSentiment({ question: mixedQ });
    assertEquals(mixedSentiment, [{ sentiment: "mixed" }]);
    console.log("  - Verified 'mixed' sentiment.");

    // Neutral case (no responses)
    const { question: neutralQ } = await likert.addQuestion({ stem: "Neutral Question", survey });
    const neutralSentiment = await likert._analyzeSentiment({ question: neutralQ });
    assertEquals(neutralSentiment, [{ sentiment: "neutral" }]);
    console.log("  - Verified 'neutral' sentiment for question with no responses.");

    await client.close();
  });
});

Deno.test("Principle: Full survey lifecycle", async () => {
  console.log("Testing Principle: If an owner creates a survey and adds questions, and several users respond, then the owner can analyze the aggregated results to understand sentiment.");
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);

  // 1. Owner (Alice) creates a survey.
  console.log("  (1) Alice creates a survey about 'Canteen Food Quality'.");
  const surveyRes = await likert.createSurvey({ title: "Canteen Food Quality", owner: userAlice });
  assertExists(surveyRes.survey);
  const surveyId = surveyRes.survey;

  // 2. Alice adds questions to the survey.
  console.log("  (2) Alice adds two questions to the survey.");
  const q1Res = await likert.addQuestion({ stem: "How is the food taste?", survey: surveyId });
  const q2Res = await likert.addQuestion({ stem: "How is the food variety?", survey: surveyId });
  assertExists(q1Res.question);
  assertExists(q2Res.question);
  const q1Id = q1Res.question;
  const q2Id = q2Res.question;

  const questions = await likert._getSurveyQuestions({ survey: surveyId });
  assertEquals(questions.length, 2);
  console.log("      - Verified two questions were added.");

  // 3. Multiple users (Bob and Charlie) respond to the questions.
  console.log("  (3) Bob and Charlie respond to the questions.");
  // Question 1: Taste (Positive)
  await likert.respondToQuestion({ question: q1Id, responder: userBob, choice: 4 });
  await likert.respondToQuestion({ question: q1Id, responder: userCharlie, choice: 5 });
  console.log("      - Responses for taste (Q1): Bob (4), Charlie (5).");
  // Question 2: Variety (Bimodal/Polarized)
  await likert.respondToQuestion({ question: q2Id, responder: userBob, choice: 1 });
  await likert.respondToQuestion({ question: q2Id, responder: userCharlie, choice: 5 });
  console.log("      - Responses for variety (Q2): Bob (1), Charlie (5).");

  // 4. Owner (Alice) analyzes the results.
  console.log("  (4) Alice analyzes the aggregated results and sentiment.");

  // Analysis for Question 1
  const q1Results = await likert._getQuestionResults({ question: q1Id });
  const q1Sentiment = await likert._analyzeSentiment({ question: q1Id });
  assertEquals(q1Results, [{ 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 }]);
  assertEquals(q1Sentiment, [{ sentiment: "positive" }]);
  console.log("      - Analysis for Q1 (Taste) shows positive sentiment, as expected.");

  // Analysis for Question 2
  const q2Results = await likert._getQuestionResults({ question: q2Id });
  const q2Sentiment = await likert._analyzeSentiment({ question: q2Id });
  assertEquals(q2Results, [{ 1: 1, 2: 0, 3: 0, 4: 0, 5: 1 }]);
  assertEquals(q2Sentiment, [{ sentiment: "bimodal" }]);
  console.log("      - Analysis for Q2 (Variety) shows bimodal sentiment, as expected.");

  console.log("Principle test successful: The concept correctly models the full survey lifecycle from creation to analysis.");
  await client.close();
});
```

# trace:

The principle for the `LikertSurvey` concept is: "If an owner creates a survey and adds questions, and several users respond to these questions, then the owner can view the aggregated results for each question to understand the collective sentiment, distinguishing between positive, negative, mixed, or bimodal opinions."

The test case `Principle: Full survey lifecycle` demonstrates this as follows:

1.  **Action**: `createSurvey({ title: "Canteen Food Quality", owner: userAlice })`
    *   **State Change**: A new `Survey` document is created, owned by `userAlice`.
    *   **Trace Step**: The survey owner, Alice, initiates the process by creating the survey.

2.  **Action**: `addQuestion({ stem: "How is the food taste?", survey: ... })` and `addQuestion({ stem: "How is the food variety?", survey: ... })`
    *   **State Change**: Two `Question` documents are created and linked to the survey from step 1.
    *   **Trace Step**: Alice populates her survey with topics for feedback.

3.  **Action**: `respondToQuestion(...)` is called four times:
    *   `{ question: q1, responder: userBob, choice: 4 }`
    *   `{ question: q1, responder: userCharlie, choice: 5 }`
    *   `{ question: q2, responder: userBob, choice: 1 }`
    *   `{ question: q2, responder: userCharlie, choice: 5 }`
    *   **State Change**: Four `Response` documents are created, linking the responders, questions, and their chosen scores.
    *   **Trace Step**: Different users provide their feedback, creating the raw data for analysis. The responses are intentionally chosen to produce different sentiment outcomes for each question.

4.  **Query**: `_getQuestionResults({ question: q1 })` and `_analyzeSentiment({ question: q1 })`
    *   **Observation**: The query returns a count of `{ 4: 1, 5: 1 }` and a sentiment of `"positive"`.
    *   **Trace Step**: Alice analyzes the first question. The aggregated results show high scores, and the concept correctly interprets this as a positive sentiment, fulfilling part of the purpose.

5.  **Query**: `_getQuestionResults({ question: q2 })` and `_analyzeSentiment({ question: q2 })`
    *   **Observation**: The query returns a count of `{ 1: 1, 5: 1 }` and a sentiment of `"bimodal"`.
    *   **Trace Step**: Alice analyzes the second question. The aggregated results show polarized scores (one very low, one very high), and the concept correctly identifies this as a bimodal (or divisive) sentiment. This demonstrates the nuance required by the principle.

This sequence of actions and verified query results confirms that the concept successfully fulfills its purpose as described by the principle: it allows for the creation, response, and detailed analysis of survey data to understand group sentiment.


# request fix: 

getting compile errors on the test code like this:

[{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts",
	"owner": "_generated_diagnostic_collection_name_#3",
	"code": "2339",
	"severity": 8,
	"message": "Property 'survey' does not exist on type '{ survey: ID; } | { error: string; }'.\n  Property 'survey' does not exist on type '{ error: string; }'.",
	"source": "deno-ts",
	"startLineNumber": 20,
	"startColumn": 25,
	"endLineNumber": 20,
	"endColumn": 31,
	"origin": "extHost1"
}]

# response:

Of course. The compilation errors you're seeing are due to TypeScript's strict type checking on union types. When a method can return either a success object (e.g., `{ survey: ID }`) or an error object (`{ error: string }`), you must first check which type you have before accessing its properties.

Here is the corrected test file. I've added assertions to act as type guards, ensuring that the code only proceeds if the actions return a success object, which resolves the compilation errors.

# solution:

The problem is that TypeScript cannot guarantee that a property like `survey` exists on a variable whose type is a union like `{ survey: ID } | { error: string }`. To fix this, we must first assert that the `error` property does *not* exist. This "narrows" the type, assuring the compiler that the variable must be the success variant of the union, allowing safe access to properties like `survey` or `question`.

# file: src/concepts/LikertSurvey/LikertSurveyConcept.test.ts

```typescript
import { assert, assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "./LikertSurveyConcept.ts";

// Mock IDs for testing
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const userCharlie = "user:Charlie" as ID;

Deno.test("LikertSurveyConcept Actions", async (t) => {
  await t.step("createSurvey: creates a survey successfully", async () => {
    console.log("Testing: createSurvey success case");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);
    const result = await likert.createSurvey({ title: "Customer Feedback", owner: userAlice });

    assert(!("error" in result), `createSurvey should not return an error, but got: ${"error" in result && result.error}`);
    assertExists(result.survey);
    console.log(`  - Created survey with ID: ${result.survey}`);

    const surveyDoc = await likert.surveys.findOne({ _id: result.survey });
    assertExists(surveyDoc);
    assertEquals(surveyDoc.title, "Customer Feedback");
    assertEquals(surveyDoc.owner, userAlice);
    console.log("  - Verified survey document in database");

    await client.close();
  });

  await t.step("createSurvey: fails with empty title", async () => {
    console.log("Testing: createSurvey requires non-empty title");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);
    const result = await likert.createSurvey({ title: "", owner: userAlice });
    assert("error" in result, "createSurvey should have returned an error for empty title");
    assertEquals(result.error, "Survey title cannot be empty.");
    console.log("  - Confirmed error for empty title");
    await client.close();
  });

  await t.step("addQuestion: adds a question to an existing survey", async () => {
    console.log("Testing: addQuestion success case");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);
    const surveyRes = await likert.createSurvey({ title: "Team Morale", owner: userBob });
    assert(!("error" in surveyRes), "createSurvey failed during test setup");
    console.log(`  - Created survey: ${surveyRes.survey}`);

    const questionRes = await likert.addQuestion({ stem: "How is the work-life balance?", survey: surveyRes.survey });
    assert(!("error" in questionRes), "addQuestion failed");
    console.log(`  - Added question: ${questionRes.question}`);

    const questionDoc = await likert.questions.findOne({ _id: questionRes.question });
    assertExists(questionDoc);
    assertEquals(questionDoc.stem, "How is the work-life balance?");
    assertEquals(questionDoc.survey, surveyRes.survey);
    console.log("  - Verified question document in database");

    await client.close();
  });

  await t.step("addQuestion: fails with non-existent survey", async () => {
    console.log("Testing: addQuestion requires survey to exist");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);
    const fakeSurveyId = "survey:fake" as ID;
    const result = await likert.addQuestion({ stem: "A valid question", survey: fakeSurveyId });
    assert("error" in result, "addQuestion should have returned an error for a non-existent survey");
    assertEquals(result.error, "Survey not found.");
    console.log("  - Confirmed error for non-existent survey");
    await client.close();
  });

  await t.step("removeQuestion: removes a question and its responses", async () => {
    console.log("Testing: removeQuestion effects (removes question and responses)");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);

    const surveyRes = await likert.createSurvey({ title: "Test Survey", owner: userAlice });
    assert(!("error" in surveyRes));
    const { survey } = surveyRes;

    const questionRes = await likert.addQuestion({ stem: "Test Question", survey });
    assert(!("error" in questionRes));
    const { question } = questionRes;

    await likert.respondToQuestion({ question, responder: userBob, choice: 4 });
    console.log(`  - Setup: created survey, question ${question}, and a response.`);

    let questionDoc = await likert.questions.findOne({ _id: question });
    let responses = await likert.responses.find({ question }).toArray();
    assertExists(questionDoc);
    assertEquals(responses.length, 1);
    console.log("  - Verified setup state is correct.");

    const result = await likert.removeQuestion({ question });
    assert(!("error" in result), "removeQuestion should not return an error");
    assertEquals(result, {});
    console.log("  - Executed removeQuestion action successfully.");

    questionDoc = await likert.questions.findOne({ _id: question });
    responses = await likert.responses.find({ question }).toArray();
    assertEquals(questionDoc, null);
    assertEquals(responses.length, 0);
    console.log("  - Verified question and associated responses were deleted.");

    await client.close();
  });

  await t.step("respondToQuestion: creates and overwrites a response", async () => {
    console.log("Testing: respondToQuestion effects (create and overwrite)");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);

    const surveyRes = await likert.createSurvey({ title: "Product Feedback", owner: userAlice });
    assert(!("error" in surveyRes));
    const { survey } = surveyRes;

    const questionRes = await likert.addQuestion({ stem: "Rate our new feature", survey });
    assert(!("error" in questionRes));
    const { question } = questionRes;
    console.log(`  - Setup: created survey and question ${question}.`);

    const res1 = await likert.respondToQuestion({ question, responder: userCharlie, choice: 3 });
    assert(!("error" in res1), "First respondToQuestion call failed");
    let responseDoc = await likert.responses.findOne({ question, responder: userCharlie });
    assertExists(responseDoc);
    assertEquals(responseDoc.choice, 3);
    console.log("  - User Charlie responded with choice 3, response created.");

    const res2 = await likert.respondToQuestion({ question, responder: userCharlie, choice: 5 });
    assert(!("error" in res2), "Second respondToQuestion call failed");
    responseDoc = await likert.responses.findOne({ question, responder: userCharlie });
    assertExists(responseDoc);
    assertEquals(responseDoc.choice, 5);
    const count = await likert.responses.countDocuments({ question, responder: userCharlie });
    assertEquals(count, 1);
    console.log("  - User Charlie changed response to 5, old response was overwritten.");

    await client.close();
  });

  await t.step("respondToQuestion: fails with invalid choice", async () => {
    console.log("Testing: respondToQuestion requires valid choice (1-5 integer)");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);

    const surveyRes = await likert.createSurvey({ title: "Service Quality", owner: userAlice });
    assert(!("error" in surveyRes));
    const { survey } = surveyRes;

    const questionRes = await likert.addQuestion({ stem: "How was our service?", survey });
    assert(!("error" in questionRes));
    const { question } = questionRes;
    console.log("  - Setup complete.");

    const result1 = await likert.respondToQuestion({ question, responder: userBob, choice: 0 });
    assertEquals(result1.error, "Choice must be an integer between 1 and 5.");
    console.log("  - Confirmed error for choice < 1.");

    const result2 = await likert.respondToQuestion({ question, responder: userBob, choice: 6 });
    assertEquals(result2.error, "Choice must be an integer between 1 and 5.");
    console.log("  - Confirmed error for choice > 5.");

    const result3 = await likert.respondToQuestion({ question, responder: userBob, choice: 3.5 });
    assertEquals(result3.error, "Choice must be an integer between 1 and 5.");
    console.log("  - Confirmed error for non-integer choice.");

    await client.close();
  });
});

Deno.test("LikertSurveyConcept Queries", async (t) => {
  await t.step("_getQuestionResults and _getQuestionResponseCounts", async () => {
    console.log("Testing: _getQuestionResults and _getQuestionResponseCounts");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);

    const surveyRes = await likert.createSurvey({ title: "Employee Satisfaction", owner: userAlice });
    assert(!("error" in surveyRes));
    const { survey } = surveyRes;

    const questionRes = await likert.addQuestion({ stem: "Are you happy at work?", survey });
    assert(!("error" in questionRes));
    const { question } = questionRes;

    await likert.respondToQuestion({ question, responder: userAlice, choice: 5 });
    await likert.respondToQuestion({ question, responder: userBob, choice: 5 });
    await likert.respondToQuestion({ question, responder: userCharlie, choice: 1 });
    console.log("  - Setup: 2 responses with choice 5, 1 response with choice 1.");

    const results = await likert._getQuestionResults({ question });
    assertEquals(results, [{ 1: 1, 2: 0, 3: 0, 4: 0, 5: 2 }]);
    console.log("  - Verified _getQuestionResults returns correct map.");

    const counts = await likert._getQuestionResponseCounts({ question });
    assertEquals(counts, [[1, 0, 0, 0, 2]]);
    console.log("  - Verified _getQuestionResponseCounts returns correct array.");

    await client.close();
  });

  await t.step("_analyzeSentiment: correctly identifies sentiment", async () => {
    console.log("Testing: _analyzeSentiment for all cases");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);

    const surveyRes = await likert.createSurvey({ title: "Sentiment Test", owner: userAlice });
    assert(!("error" in surveyRes));
    const { survey } = surveyRes;

    // Positive case
    const positiveQRes = await likert.addQuestion({ stem: "Positive Question", survey });
    assert(!("error" in positiveQRes));
    const { question: positiveQ } = positiveQRes;
    await likert.respondToQuestion({ question: positiveQ, responder: userAlice, choice: 5 });
    await likert.respondToQuestion({ question: positiveQ, responder: userBob, choice: 4 });
    const positiveSentiment = await likert._analyzeSentiment({ question: positiveQ });
    assertEquals(positiveSentiment, [{ sentiment: "positive" }]);
    console.log("  - Verified 'positive' sentiment.");

    // Negative case
    const negativeQRes = await likert.addQuestion({ stem: "Negative Question", survey });
    assert(!("error" in negativeQRes));
    const { question: negativeQ } = negativeQRes;
    await likert.respondToQuestion({ question: negativeQ, responder: userAlice, choice: 1 });
    await likert.respondToQuestion({ question: negativeQ, responder: userBob, choice: 2 });
    const negativeSentiment = await likert._analyzeSentiment({ question: negativeQ });
    assertEquals(negativeSentiment, [{ sentiment: "negative" }]);
    console.log("  - Verified 'negative' sentiment.");

    // Bimodal case
    const bimodalQRes = await likert.addQuestion({ stem: "Bimodal Question", survey });
    assert(!("error" in bimodalQRes));
    const { question: bimodalQ } = bimodalQRes;
    await likert.respondToQuestion({ question: bimodalQ, responder: userAlice, choice: 1 });
    await likert.respondToQuestion({ question: bimodalQ, responder: userBob, choice: 5 });
    const bimodalSentiment = await likert._analyzeSentiment({ question: bimodalQ });
    assertEquals(bimodalSentiment, [{ sentiment: "bimodal" }]);
    console.log("  - Verified 'bimodal' sentiment.");

    // Mixed case
    const mixedQRes = await likert.addQuestion({ stem: "Mixed Question", survey });
    assert(!("error" in mixedQRes));
    const { question: mixedQ } = mixedQRes;
    await likert.respondToQuestion({ question: mixedQ, responder: userAlice, choice: 2 });
    await likert.respondToQuestion({ question: mixedQ, responder: userBob, choice: 3 });
    await likert.respondToQuestion({ question: mixedQ, responder: userCharlie, choice: 4 });
    const mixedSentiment = await likert._analyzeSentiment({ question: mixedQ });
    assertEquals(mixedSentiment, [{ sentiment: "mixed" }]);
    console.log("  - Verified 'mixed' sentiment.");

    // Neutral case (no responses)
    const neutralQRes = await likert.addQuestion({ stem: "Neutral Question", survey });
    assert(!("error" in neutralQRes));
    const { question: neutralQ } = neutralQRes;
    const neutralSentiment = await likert._analyzeSentiment({ question: neutralQ });
    assertEquals(neutralSentiment, [{ sentiment: "neutral" }]);
    console.log("  - Verified 'neutral' sentiment for question with no responses.");

    await client.close();
  });
});

Deno.test("Principle: Full survey lifecycle", async () => {
  console.log("Testing Principle: If an owner creates a survey and adds questions, and several users respond, then the owner can analyze the aggregated results to understand sentiment.");
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);

  // 1. Owner (Alice) creates a survey.
  console.log("  (1) Alice creates a survey about 'Canteen Food Quality'.");
  const surveyRes = await likert.createSurvey({ title: "Canteen Food Quality", owner: userAlice });
  assert(!("error" in surveyRes), "Principle test failed: createSurvey returned an error");
  const surveyId = surveyRes.survey;

  // 2. Alice adds questions to the survey.
  console.log("  (2) Alice adds two questions to the survey.");
  const q1Res = await likert.addQuestion({ stem: "How is the food taste?", survey: surveyId });
  assert(!("error" in q1Res), "Principle test failed: addQuestion(q1) returned an error");
  const q1Id = q1Res.question;

  const q2Res = await likert.addQuestion({ stem: "How is the food variety?", survey: surveyId });
  assert(!("error" in q2Res), "Principle test failed: addQuestion(q2) returned an error");
  const q2Id = q2Res.question;

  const questions = await likert._getSurveyQuestions({ survey: surveyId });
  assertEquals(questions.length, 2);
  console.log("      - Verified two questions were added.");

  // 3. Multiple users (Bob and Charlie) respond to the questions.
  console.log("  (3) Bob and Charlie respond to the questions.");
  // Question 1: Taste (Positive)
  await likert.respondToQuestion({ question: q1Id, responder: userBob, choice: 4 });
  await likert.respondToQuestion({ question: q1Id, responder: userCharlie, choice: 5 });
  console.log("      - Responses for taste (Q1): Bob (4), Charlie (5).");
  // Question 2: Variety (Bimodal/Polarized)
  await likert.respondToQuestion({ question: q2Id, responder: userBob, choice: 1 });
  await likert.respondToQuestion({ question: q2Id, responder: userCharlie, choice: 5 });
  console.log("      - Responses for variety (Q2): Bob (1), Charlie (5).");

  // 4. Owner (Alice) analyzes the results.
  console.log("  (4) Alice analyzes the aggregated results and sentiment.");

  // Analysis for Question 1
  const q1Results = await likert._getQuestionResults({ question: q1Id });
  const q1Sentiment = await likert._analyzeSentiment({ question: q1Id });
  assertEquals(q1Results, [{ 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 }]);
  assertEquals(q1Sentiment, [{ sentiment: "positive" }]);
  console.log("      - Analysis for Q1 (Taste) shows positive sentiment, as expected.");

  // Analysis for Question 2
  const q2Results = await likert._getQuestionResults({ question: q2Id });
  const q2Sentiment = await likert._analyzeSentiment({ question: q2Id });
  assertEquals(q2Results, [{ 1: 1, 2: 0, 3: 0, 4: 0, 5: 1 }]);
  assertEquals(q2Sentiment, [{ sentiment: "bimodal" }]);
  console.log("      - Analysis for Q2 (Variety) shows bimodal sentiment, as expected.");

  console.log("Principle test successful: The concept correctly models the full survey lifecycle from creation to analysis.");
  await client.close();
});
```