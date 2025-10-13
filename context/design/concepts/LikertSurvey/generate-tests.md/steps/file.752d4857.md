---
timestamp: 'Sun Oct 12 2025 22:52:30 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_225230.ad1749ca.md]]'
content_id: 752d4857532fdffc71b35fe485ea2164083c56824aca8f7cabe6ec979b70fec1
---

# file: src/concepts/LikertSurvey/LikertSurveyConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "./LikertSurveyConcept.ts";

// Define generic types for test data
type User = ID;
type Survey = ID;
type Question = ID;

Deno.test("LikertSurveyConcept - Actions", async (t) => {
  const [db, client] = await testDb();
  const likertSurvey = new LikertSurveyConcept(db);

  const owner = "user:owner" as User;
  let surveyId: Survey;
  let questionId: Question;

  await t.step("createSurvey action", async (t) => {
    await t.step("should create a survey successfully", async () => {
      console.log("  - Testing successful survey creation...");
      const result = await likertSurvey.createSurvey({
        title: "Customer Satisfaction",
        owner: owner,
      });
      assertNotEquals("error" in result, true, "Should not return an error");
      const { survey } = result as { survey: Survey };
      assertExists(survey);
      surveyId = survey;

      // Effect verification: Check if the survey is in the database
      const userSurveys = await likertSurvey._getUserSurveys({ user: owner });
      assertEquals(Array.isArray(userSurveys), true);
      const surveys = userSurveys as { surveys: Survey }[];
      assertEquals(surveys.length, 1);
      assertEquals(surveys[0].surveys, surveyId);
      console.log("    -> Survey created and verified.");
    });

    await t.step(
      "should fail to create survey if title is empty",
      async () => {
        console.log(
          "  - Testing requirement: non-empty title for createSurvey...",
        );
        const result = await likertSurvey.createSurvey({ title: "", owner });
        assertEquals("error" in result, true);
        assertEquals(
          (result as { error: string }).error,
          "Title cannot be empty",
        );
        console.log("    -> Correctly failed with empty title.");
      },
    );
  });

  await t.step("addQuestion action", async (t) => {
    await t.step("should add a question to an existing survey", async () => {
      console.log("  - Testing successful question addition...");
      const result = await likertSurvey.addQuestion({
        stem: "How satisfied are you with our service?",
        survey: surveyId,
      });
      assertNotEquals("error" in result, true);
      const { question } = result as { question: Question };
      assertExists(question);
      questionId = question;

      // Effect verification: Check if the question is associated with the survey
      const surveyQuestions = await likertSurvey._getSurveyQuestions({
        survey: surveyId,
      });
      assertEquals(Array.isArray(surveyQuestions), true);
      const questions = surveyQuestions as { questions: Question }[];
      assertEquals(questions.length, 1);
      assertEquals(questions[0].questions, questionId);
      console.log("    -> Question added and verified.");
    });

    await t.step("should fail if stem is empty", async () => {
      console.log(
        "  - Testing requirement: non-empty stem for addQuestion...",
      );
      const result = await likertSurvey.addQuestion({
        stem: "",
        survey: surveyId,
      });
      assertEquals("error" in result, true);
      assertEquals(
        (result as { error: string }).error,
        "Question stem cannot be empty",
      );
      console.log("    -> Correctly failed with empty stem.");
    });

    await t.step("should fail if survey does not exist", async () => {
      console.log(
        "  - Testing requirement: existing survey for addQuestion...",
      );
      const fakeSurveyId = "survey:fake" as Survey;
      const result = await likertSurvey.addQuestion({
        stem: "A valid question",
        survey: fakeSurveyId,
      });
      assertEquals("error" in result, true);
      assertEquals(
        (result as { error: string }).error,
        `Survey with id ${fakeSurveyId} not found`,
      );
      console.log("    -> Correctly failed with non-existent survey.");
    });
  });

  await t.step("respondToQuestion action", async (t) => {
    const responder = "user:responder" as User;

    await t.step(
      "should successfully record a response to a question",
      async () => {
        console.log("  - Testing successful response recording...");
        const result = await likertSurvey.respondToQuestion({
          question: questionId,
          responder,
          choice: 4,
        });
        assertEquals("error" in result, false);

        // Effect verification: check results
        const results = await likertSurvey._getQuestionResults({
          question: questionId,
        });
        const res = results as { results: Record<number, number> }[];
        assertEquals(res[0].results[4], 1);
        console.log("    -> Response recorded and verified.");
      },
    );

    await t.step("should update an existing response", async () => {
      console.log("  - Testing response update...");
      const result = await likertSurvey.respondToQuestion({
        question: questionId,
        responder,
        choice: 5,
      });
      assertEquals("error" in result, false);

      // Effect verification: old response is gone, new one is present
      const results = await likertSurvey._getQuestionResults({
        question: questionId,
      });
      const res = results as { results: Record<number, number> }[];
      assertEquals(res[0].results[4], 0);
      assertEquals(res[0].results[5], 1);
      console.log("    -> Response updated and verified.");
    });

    await t.step(
      "should fail if choice is not an integer between 1 and 5",
      async () => {
        console.log(
          "  - Testing requirement: valid choice for respondToQuestion...",
        );
        const invalidChoices = [0, 6, 3.5, NaN];
        for (const choice of invalidChoices) {
          const result = await likertSurvey.respondToQuestion({
            question: questionId,
            responder,
            choice,
          });
          assertEquals("error" in result, true, `Failed for choice: ${choice}`);
          assertEquals(
            (result as { error: string }).error,
            "Choice must be an integer between 1 and 5",
          );
        }
        console.log(
          "    -> Correctly failed for multiple invalid choice values.",
        );
      },
    );
  });

  await t.step("removeQuestion action", async (t) => {
    await t.step(
      "should remove a question and its associated responses",
      async () => {
        console.log("  - Testing successful question removal...");
        // Add a response to be removed
        await likertSurvey.respondToQuestion({
          question: questionId,
          responder: "user:another" as User,
          choice: 3,
        });

        const result = await likertSurvey.removeQuestion({
          question: questionId,
        });
        assertEquals("error" in result, false);

        // Effect verification: question is gone
        const surveyQuestions = await likertSurvey._getSurveyQuestions({
          survey: surveyId,
        });
        assertEquals(Array.isArray(surveyQuestions), true);
        assertEquals((surveyQuestions as { questions: Question }[]).length, 0);

        // Effect verification: responses are gone
        const questionResults = await likertSurvey._getQuestionResults({
          question: questionId,
        });
        assertEquals("error" in questionResults, true); // The query should now fail as the question doesn't exist
        console.log("    -> Question and its responses removed and verified.");
      },
    );

    await t.step("should fail if question does not exist", async () => {
      console.log(
        "  - Testing requirement: existing question for removeQuestion...",
      );
      const fakeQuestionId = "question:fake" as Question;
      const result = await likertSurvey.removeQuestion({
        question: fakeQuestionId,
      });
      assertEquals("error" in result, true);
      assertEquals(
        (result as { error: string }).error,
        `Question with id ${fakeQuestionId} not found`,
      );
      console.log("    -> Correctly failed with non-existent question.");
    });
  });

  await client.close();
});

Deno.test("LikertSurveyConcept - Principle", async () => {
  console.log("Testing principle: Create survey, get responses, analyze sentiment");
  const [db, client] = await testDb();
  const likertSurvey = new LikertSurveyConcept(db);

  // Define actors
  const owner = "user:principle-owner" as User;
  const responders = [
    "user:alice" as User,
    "user:bob" as User,
    "user:charlie" as User,
    "user:diana" as User,
  ];

  // 1. Owner creates a survey and adds a question
  console.log("  - Step 1: Owner creates a survey and adds a question.");
  const surveyRes = await likertSurvey.createSurvey({
    title: "Team Mood Check",
    owner,
  });
  const surveyId = (surveyRes as { survey: Survey }).survey;
  const questionRes = await likertSurvey.addQuestion({
    stem: "How do you feel about the new workflow?",
    survey: surveyId,
  });
  const questionId = (questionRes as { question: Question }).question;
  console.log(`    -> Survey '${surveyId}' and Question '${questionId}' created.`);

  // 2. Multiple users respond to the question
  console.log("  - Step 2: Multiple users respond.");
  await likertSurvey.respondToQuestion({
    question: questionId,
    responder: responders[0],
    choice: 5,
  }); // Alice: Strongly Agree
  await likertSurvey.respondToQuestion({
    question: questionId,
    responder: responders[1],
    choice: 4,
  }); // Bob: Agree
  await likertSurvey.respondToQuestion({
    question: questionId,
    responder: responders[2],
    choice: 4,
  }); // Charlie: Agree
  await likertSurvey.respondToQuestion({
    question: questionId,
    responder: responders[3],
    choice: 2,
  }); // Diana: Disagree
  console.log("    -> Alice(5), Bob(4), Charlie(4), Diana(2) responded.");

  // 3. Owner queries the results and sentiment
  console.log("  - Step 3: Owner queries results and analyzes sentiment.");

  // Verify response counts
  const countsRes = await likertSurvey._getQuestionResponseCounts({
    question: questionId,
  });
  const counts = (countsRes as { counts: number[] }[])[0].counts;
  assertEquals(counts, [0, 1, 0, 2, 1]); // [choice 1, choice 2, choice 3, choice 4, choice 5]
  console.log(`    -> Verified response counts: ${counts}`);

  // Verify sentiment
  const sentimentRes = await likertSurvey._analyzeSentiment({
    question: questionId,
  });
  const sentiment = (sentimentRes as { sentiment: string }[])[0].sentiment;
  // Mean is (5+4+4+2)/4 = 15/4 = 3.75, which is > 3.5
  assertEquals(sentiment, "positive");
  console.log(`    -> Verified sentiment: '${sentiment}'.`);

  console.log("Principle test successful: The concept correctly aggregates and analyzes responses.");

  await client.close();
});
```
