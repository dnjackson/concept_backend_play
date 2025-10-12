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
    const result = await likert.createSurvey({
      title: "Customer Feedback",
      owner: userAlice,
    });

    assert(
      !("error" in result),
      `createSurvey should not return an error, but got: ${
        "error" in result && result.error
      }`,
    );
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
    assert(
      "error" in result,
      "createSurvey should have returned an error for empty title",
    );
    assertEquals(result.error, "Survey title cannot be empty.");
    console.log("  - Confirmed error for empty title");
    await client.close();
  });

  await t.step(
    "addQuestion: adds a question to an existing survey",
    async () => {
      console.log("Testing: addQuestion success case");
      const [db, client] = await testDb();
      const likert = new LikertSurveyConcept(db);
      const surveyRes = await likert.createSurvey({
        title: "Team Morale",
        owner: userBob,
      });
      assert(!("error" in surveyRes), "createSurvey failed during test setup");
      console.log(`  - Created survey: ${surveyRes.survey}`);

      const questionRes = await likert.addQuestion({
        stem: "How is the work-life balance?",
        survey: surveyRes.survey,
      });
      assert(!("error" in questionRes), "addQuestion failed");
      console.log(`  - Added question: ${questionRes.question}`);

      const questionDoc = await likert.questions.findOne({
        _id: questionRes.question,
      });
      assertExists(questionDoc);
      assertEquals(questionDoc.stem, "How is the work-life balance?");
      assertEquals(questionDoc.survey, surveyRes.survey);
      console.log("  - Verified question document in database");

      await client.close();
    },
  );

  await t.step("addQuestion: fails with non-existent survey", async () => {
    console.log("Testing: addQuestion requires survey to exist");
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);
    const fakeSurveyId = "survey:fake" as ID;
    const result = await likert.addQuestion({
      stem: "A valid question",
      survey: fakeSurveyId,
    });
    assert(
      "error" in result,
      "addQuestion should have returned an error for a non-existent survey",
    );
    assertEquals(result.error, "Survey not found.");
    console.log("  - Confirmed error for non-existent survey");
    await client.close();
  });

  await t.step(
    "removeQuestion: removes a question and its responses",
    async () => {
      console.log(
        "Testing: removeQuestion effects (removes question and responses)",
      );
      const [db, client] = await testDb();
      const likert = new LikertSurveyConcept(db);

      const surveyRes = await likert.createSurvey({
        title: "Test Survey",
        owner: userAlice,
      });
      assert(!("error" in surveyRes));
      const { survey } = surveyRes;

      const questionRes = await likert.addQuestion({
        stem: "Test Question",
        survey,
      });
      assert(!("error" in questionRes));
      const { question } = questionRes;

      await likert.respondToQuestion({
        question,
        responder: userBob,
        choice: 4,
      });
      console.log(
        `  - Setup: created survey, question ${question}, and a response.`,
      );

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
      console.log(
        "  - Verified question and associated responses were deleted.",
      );

      await client.close();
    },
  );

  await t.step(
    "respondToQuestion: creates and overwrites a response",
    async () => {
      console.log("Testing: respondToQuestion effects (create and overwrite)");
      const [db, client] = await testDb();
      const likert = new LikertSurveyConcept(db);

      const surveyRes = await likert.createSurvey({
        title: "Product Feedback",
        owner: userAlice,
      });
      assert(!("error" in surveyRes));
      const { survey } = surveyRes;

      const questionRes = await likert.addQuestion({
        stem: "Rate our new feature",
        survey,
      });
      assert(!("error" in questionRes));
      const { question } = questionRes;
      console.log(`  - Setup: created survey and question ${question}.`);

      const res1 = await likert.respondToQuestion({
        question,
        responder: userCharlie,
        choice: 3,
      });
      assert(!("error" in res1), "First respondToQuestion call failed");
      let responseDoc = await likert.responses.findOne({
        question,
        responder: userCharlie,
      });
      assertExists(responseDoc);
      assertEquals(responseDoc.choice, 3);
      console.log(
        "  - User Charlie responded with choice 3, response created.",
      );

      const res2 = await likert.respondToQuestion({
        question,
        responder: userCharlie,
        choice: 5,
      });
      assert(!("error" in res2), "Second respondToQuestion call failed");
      responseDoc = await likert.responses.findOne({
        question,
        responder: userCharlie,
      });
      assertExists(responseDoc);
      assertEquals(responseDoc.choice, 5);
      const count = await likert.responses.countDocuments({
        question,
        responder: userCharlie,
      });
      assertEquals(count, 1);
      console.log(
        "  - User Charlie changed response to 5, old response was overwritten.",
      );

      await client.close();
    },
  );

  await t.step("respondToQuestion: fails with invalid choice", async () => {
    console.log(
      "Testing: respondToQuestion requires valid choice (1-5 integer)",
    );
    const [db, client] = await testDb();
    const likert = new LikertSurveyConcept(db);

    const surveyRes = await likert.createSurvey({
      title: "Service Quality",
      owner: userAlice,
    });
    assert(!("error" in surveyRes));
    const { survey } = surveyRes;

    const questionRes = await likert.addQuestion({
      stem: "How was our service?",
      survey,
    });
    assert(!("error" in questionRes));
    const { question } = questionRes;
    console.log("  - Setup complete.");

    const result1 = await likert.respondToQuestion({
      question,
      responder: userBob,
      choice: 0,
    });
    assertEquals(result1.error, "Choice must be an integer between 1 and 5.");
    console.log("  - Confirmed error for choice < 1.");

    const result2 = await likert.respondToQuestion({
      question,
      responder: userBob,
      choice: 6,
    });
    assertEquals(result2.error, "Choice must be an integer between 1 and 5.");
    console.log("  - Confirmed error for choice > 5.");

    const result3 = await likert.respondToQuestion({
      question,
      responder: userBob,
      choice: 3.5,
    });
    assertEquals(result3.error, "Choice must be an integer between 1 and 5.");
    console.log("  - Confirmed error for non-integer choice.");

    await client.close();
  });
});

Deno.test("LikertSurveyConcept Queries", async (t) => {
  await t.step(
    "_getQuestionResults and _getQuestionResponseCounts",
    async () => {
      console.log(
        "Testing: _getQuestionResults and _getQuestionResponseCounts",
      );
      const [db, client] = await testDb();
      const likert = new LikertSurveyConcept(db);

      const surveyRes = await likert.createSurvey({
        title: "Employee Satisfaction",
        owner: userAlice,
      });
      assert(!("error" in surveyRes));
      const { survey } = surveyRes;

      const questionRes = await likert.addQuestion({
        stem: "Are you happy at work?",
        survey,
      });
      assert(!("error" in questionRes));
      const { question } = questionRes;

      await likert.respondToQuestion({
        question,
        responder: userAlice,
        choice: 5,
      });
      await likert.respondToQuestion({
        question,
        responder: userBob,
        choice: 5,
      });
      await likert.respondToQuestion({
        question,
        responder: userCharlie,
        choice: 1,
      });
      console.log(
        "  - Setup: 2 responses with choice 5, 1 response with choice 1.",
      );

      const results = await likert._getQuestionResults({ question });
      assertEquals(results, [{ 1: 1, 2: 0, 3: 0, 4: 0, 5: 2 }]);
      console.log("  - Verified _getQuestionResults returns correct map.");

      const counts = await likert._getQuestionResponseCounts({ question });
      assertEquals(counts, [[1, 0, 0, 0, 2]]);
      console.log(
        "  - Verified _getQuestionResponseCounts returns correct array.",
      );

      await client.close();
    },
  );

  await t.step(
    "_analyzeSentiment: correctly identifies sentiment",
    async () => {
      console.log("Testing: _analyzeSentiment for all cases");
      const [db, client] = await testDb();
      const likert = new LikertSurveyConcept(db);

      const surveyRes = await likert.createSurvey({
        title: "Sentiment Test",
        owner: userAlice,
      });
      assert(!("error" in surveyRes));
      const { survey } = surveyRes;

      // Positive case
      const positiveQRes = await likert.addQuestion({
        stem: "Positive Question",
        survey,
      });
      assert(!("error" in positiveQRes));
      const { question: positiveQ } = positiveQRes;
      await likert.respondToQuestion({
        question: positiveQ,
        responder: userAlice,
        choice: 5,
      });
      await likert.respondToQuestion({
        question: positiveQ,
        responder: userBob,
        choice: 4,
      });
      const positiveSentiment = await likert._analyzeSentiment({
        question: positiveQ,
      });
      assertEquals(positiveSentiment, [{ sentiment: "positive" }]);
      console.log("  - Verified 'positive' sentiment.");

      // Negative case
      const negativeQRes = await likert.addQuestion({
        stem: "Negative Question",
        survey,
      });
      assert(!("error" in negativeQRes));
      const { question: negativeQ } = negativeQRes;
      await likert.respondToQuestion({
        question: negativeQ,
        responder: userAlice,
        choice: 1,
      });
      await likert.respondToQuestion({
        question: negativeQ,
        responder: userBob,
        choice: 2,
      });
      const negativeSentiment = await likert._analyzeSentiment({
        question: negativeQ,
      });
      assertEquals(negativeSentiment, [{ sentiment: "negative" }]);
      console.log("  - Verified 'negative' sentiment.");

      // Bimodal case
      const bimodalQRes = await likert.addQuestion({
        stem: "Bimodal Question",
        survey,
      });
      assert(!("error" in bimodalQRes));
      const { question: bimodalQ } = bimodalQRes;
      await likert.respondToQuestion({
        question: bimodalQ,
        responder: userAlice,
        choice: 1,
      });
      await likert.respondToQuestion({
        question: bimodalQ,
        responder: userBob,
        choice: 5,
      });
      const bimodalSentiment = await likert._analyzeSentiment({
        question: bimodalQ,
      });
      assertEquals(bimodalSentiment, [{ sentiment: "bimodal" }]);
      console.log("  - Verified 'bimodal' sentiment.");

      // Mixed case
      const mixedQRes = await likert.addQuestion({
        stem: "Mixed Question",
        survey,
      });
      assert(!("error" in mixedQRes));
      const { question: mixedQ } = mixedQRes;
      await likert.respondToQuestion({
        question: mixedQ,
        responder: userAlice,
        choice: 2,
      });
      await likert.respondToQuestion({
        question: mixedQ,
        responder: userBob,
        choice: 3,
      });
      await likert.respondToQuestion({
        question: mixedQ,
        responder: userCharlie,
        choice: 4,
      });
      const mixedSentiment = await likert._analyzeSentiment({
        question: mixedQ,
      });
      assertEquals(mixedSentiment, [{ sentiment: "mixed" }]);
      console.log("  - Verified 'mixed' sentiment.");

      // Neutral case (no responses)
      const neutralQRes = await likert.addQuestion({
        stem: "Neutral Question",
        survey,
      });
      assert(!("error" in neutralQRes));
      const { question: neutralQ } = neutralQRes;
      const neutralSentiment = await likert._analyzeSentiment({
        question: neutralQ,
      });
      assertEquals(neutralSentiment, [{ sentiment: "neutral" }]);
      console.log(
        "  - Verified 'neutral' sentiment for question with no responses.",
      );

      await client.close();
    },
  );
});

Deno.test("Principle: Full survey lifecycle", async () => {
  console.log(
    "Testing Principle: If an owner creates a survey and adds questions, and several users respond, then the owner can analyze the aggregated results to understand sentiment.",
  );
  const [db, client] = await testDb();
  const likert = new LikertSurveyConcept(db);

  // 1. Owner (Alice) creates a survey.
  console.log("  (1) Alice creates a survey about 'Canteen Food Quality'.");
  const surveyRes = await likert.createSurvey({
    title: "Canteen Food Quality",
    owner: userAlice,
  });
  assert(
    !("error" in surveyRes),
    "Principle test failed: createSurvey returned an error",
  );
  const surveyId = surveyRes.survey;

  // 2. Alice adds questions to the survey.
  console.log("  (2) Alice adds two questions to the survey.");
  const q1Res = await likert.addQuestion({
    stem: "How is the food taste?",
    survey: surveyId,
  });
  assert(
    !("error" in q1Res),
    "Principle test failed: addQuestion(q1) returned an error",
  );
  const q1Id = q1Res.question;

  const q2Res = await likert.addQuestion({
    stem: "How is the food variety?",
    survey: surveyId,
  });
  assert(
    !("error" in q2Res),
    "Principle test failed: addQuestion(q2) returned an error",
  );
  const q2Id = q2Res.question;

  const questions = await likert._getSurveyQuestions({ survey: surveyId });
  assertEquals(questions.length, 2);
  console.log("      - Verified two questions were added.");

  // 3. Multiple users (Bob and Charlie) respond to the questions.
  console.log("  (3) Bob and Charlie respond to the questions.");
  // Question 1: Taste (Positive)
  await likert.respondToQuestion({
    question: q1Id,
    responder: userBob,
    choice: 4,
  });
  await likert.respondToQuestion({
    question: q1Id,
    responder: userCharlie,
    choice: 5,
  });
  console.log("      - Responses for taste (Q1): Bob (4), Charlie (5).");
  // Question 2: Variety (Bimodal/Polarized)
  await likert.respondToQuestion({
    question: q2Id,
    responder: userBob,
    choice: 1,
  });
  await likert.respondToQuestion({
    question: q2Id,
    responder: userCharlie,
    choice: 5,
  });
  console.log("      - Responses for variety (Q2): Bob (1), Charlie (5).");

  // 4. Owner (Alice) analyzes the results.
  console.log("  (4) Alice analyzes the aggregated results and sentiment.");

  // Analysis for Question 1
  const q1Results = await likert._getQuestionResults({ question: q1Id });
  const q1Sentiment = await likert._analyzeSentiment({ question: q1Id });
  assertEquals(q1Results, [{ 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 }]);
  assertEquals(q1Sentiment, [{ sentiment: "positive" }]);
  console.log(
    "      - Analysis for Q1 (Taste) shows positive sentiment, as expected.",
  );

  // Analysis for Question 2
  const q2Results = await likert._getQuestionResults({ question: q2Id });
  const q2Sentiment = await likert._analyzeSentiment({ question: q2Id });
  assertEquals(q2Results, [{ 1: 1, 2: 0, 3: 0, 4: 0, 5: 1 }]);
  assertEquals(q2Sentiment, [{ sentiment: "bimodal" }]);
  console.log(
    "      - Analysis for Q2 (Variety) shows bimodal sentiment, as expected.",
  );

  console.log(
    "Principle test successful: The concept correctly models the full survey lifecycle from creation to analysis.",
  );
  await client.close();
});
