---
timestamp: 'Sun Oct 12 2025 23:43:34 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_234334.d30cd05f.md]]'
content_id: dd45e49ce6036930da7f09ca9df0ed939d2cc46a2e9f76f7e7ea3320e8f5ca8a
---

# file: src/concepts/LikertSurvey/LikertSurveyConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to prevent collisions
const PREFIX = "LikertSurvey";

// Generic types for this concept
type User = ID;
type Survey = ID;
type Question = ID;
type Response = ID;

/**
 * a set of Surveys with
 *   a title String
 *   an owner User
 */
interface SurveyDoc {
  _id: Survey;
  title: string;
  owner: User;
}

/**
 * a set of Questions with
 *   a stem String
 *   a survey Survey
 */
interface QuestionDoc {
  _id: Question;
  stem: string;
  survey: Survey;
}

/**
 * a set of Responses with
 *   a responder User
 *   a question Question
 *   a choice Number
 */
interface ResponseDoc {
  _id: Response;
  responder: User;
  question: Question;
  choice: number;
}

/**
 * @concept LikertSurvey
 * @purpose understand group sentiment on a set of topics by aggregating quantitative feedback
 */
export default class LikertSurveyConcept {
  surveys: Collection<SurveyDoc>;
  questions: Collection<QuestionDoc>;
  responses: Collection<ResponseDoc>;

  constructor(private readonly db: Db) {
    this.surveys = this.db.collection(PREFIX + ".surveys");
    this.questions = this.db.collection(PREFIX + ".questions");
    this.responses = this.db.collection(PREFIX + ".responses");
  }

  /**
   * createSurvey (title: String, owner: User): (survey: Survey)
   *
   * @requires title is non-empty
   * @effects creates a new `Survey` with the given title and owner and returns it
   */
  async createSurvey(
    { title, owner }: { title: string; owner: User },
  ): Promise<{ survey: Survey } | { error: string }> {
    if (!title) {
      return { error: "Title cannot be empty" };
    }

    const surveyId = freshID() as Survey;
    const result = await this.surveys.insertOne({
      _id: surveyId,
      title,
      owner,
    });

    if (!result.acknowledged) {
      return { error: "Failed to create survey" };
    }

    return { survey: surveyId };
  }

  /**
   * addQuestion (stem: String, survey: Survey): (question: Question)
   *
   * @requires stem is non-empty and survey exists
   * @effects creates a new `Question` with the given stem, associates it with the given survey, and returns it
   */
  async addQuestion(
    { stem, survey }: { stem: string; survey: Survey },
  ): Promise<{ question: Question } | { error: string }> {
    if (!stem) {
      return { error: "Question stem cannot be empty" };
    }

    const surveyDoc = await this.surveys.findOne({ _id: survey });
    if (!surveyDoc) {
      return { error: "Survey not found" };
    }

    const questionId = freshID() as Question;
    const result = await this.questions.insertOne({
      _id: questionId,
      stem,
      survey,
    });

    if (!result.acknowledged) {
      return { error: "Failed to add question" };
    }

    return { question: questionId };
  }

  /**
   * removeQuestion (question: Question)
   *
   * @requires question exists
   * @effects removes the specified question and all `Response` entities associated with it
   */
  async removeQuestion(
    { question }: { question: Question },
  ): Promise<Empty | { error: string }> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return { error: "Question not found" };
    }

    // Atomicity is not guaranteed here, but concept design allows for this.
    // In a production system, one might use a transaction.
    await this.responses.deleteMany({ question });
    await this.questions.deleteOne({ _id: question });

    return {};
  }

  /**
   * respondToQuestion (question: Question, responder: User, choice: Number)
   *
   * @requires question exists and choice is an integer between 1 and 5
   * @effects delete any existing response to this question, then creates a new `Response` linking the responder, question, and choice
   */
  async respondToQuestion(
    { question, responder, choice }: {
      question: Question;
      responder: User;
      choice: number;
    },
  ): Promise<Empty | { error: string }> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return { error: "Question not found" };
    }

    if (!Number.isInteger(choice) || choice < 1 || choice > 5) {
      return { error: "Choice must be an integer between 1 and 5" };
    }

    // Delete previous response to ensure one response per user per question
    await this.responses.deleteMany({ question, responder });

    const responseId = freshID() as Response;
    await this.responses.insertOne({
      _id: responseId,
      question,
      responder,
      choice,
    });

    return {};
  }

  // Queries

  /**
   * _getSurveyQuestions (survey: Survey): (question: Question)
   *
   * @requires survey exists
   * @effects returns the set of all Questions whose survey is the given survey
   */
  async _getSurveyQuestions(
    { survey }: { survey: Survey },
  ): Promise<{ question: Question }[] | { error: string }[]> {
    const surveyDoc = await this.surveys.findOne({ _id: survey });
    if (!surveyDoc) {
      return [{ error: "Survey not found" }];
    }

    const questionDocs = await this.questions.find({ survey }).toArray();
    return questionDocs.map((q) => ({ question: q._id }));
  }

  /**
   * _getSurveyTitle (survey: Survey): (title: String)
   *
   * @requires survey exists
   * @effects returns the title of the survey
   */
  async _getSurveyTitle(
    { survey }: { survey: Survey },
  ): Promise<{ title: string }[] | { error: string }[]> {
    const surveyDoc = await this.surveys.findOne({ _id: survey });
    if (!surveyDoc) {
      return [{ error: "Survey not found" }];
    }
    return [{ title: surveyDoc.title }];
  }

  /**
   * _getSurveyOwner (survey: Survey): (owner: String)
   *
   * @requires survey exists
   * @effects returns the owner of the survey
   */
  async _getSurveyOwner(
    { survey }: { survey: Survey },
  ): Promise<{ owner: User }[] | { error: string }[]> {
    const surveyDoc = await this.surveys.findOne({ _id: survey });
    if (!surveyDoc) {
      return [{ error: "Survey not found" }];
    }
    return [{ owner: surveyDoc.owner }];
  }

  /**
   * _getQuestionStem (question: String): (stem: String)
   *
   * @requires question exists
   * @effects returns the stem of the question
   */
  async _getQuestionStem(
    { question }: { question: Question },
  ): Promise<{ stem: string }[] | { error: string }[]> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return [{ error: "Question not found" }];
    }
    return [{ stem: questionDoc.stem }];
  }

  /**
   * _getQuestionResponseCounts (question: Question): (counts: Number[])
   *
   * @requires question exists
   * @effects returns an array of counts of responses by choice number (that is, the nth element is the number of responses with choice n+1). The result is an array containing an array.
   */
  async _getQuestionResponseCounts(
    { question }: { question: Question },
  ): Promise<{ counts: number[] }[] | { error: string }[]> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return [{ error: "Question not found" }];
    }

    const responses = await this.responses.find({ question }).toArray();
    const counts = [0, 0, 0, 0, 0];
    for (const response of responses) {
      if (response.choice >= 1 && response.choice <= 5) {
        counts[response.choice - 1]++;
      }
    }

    return [{ counts }];
  }

  /**
   * _analyzeSentiment (question: Question): (sentiment: String)
   *
   * @effects This query analyzes all responses for a given `question` and returns a string indicating the overall sentiment.
   */
  async _analyzeSentiment(
    { question }: { question: Question },
  ): Promise<{ sentiment: string }[] | { error: string }[]> {
    const responses = await this.responses.find({ question }).toArray();

    if (responses.length === 0) {
      return [{ sentiment: "neutral" }];
    }

    const scores = responses.map((r) => r.choice);
    const sum = scores.reduce((acc, score) => acc + score, 0);
    const avg = sum / scores.length;

    const squaredDiffs = scores.map((score) => Math.pow(score - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((acc, diff) => acc + diff, 0) /
      scores.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    if (avg > 3.5) {
      return [{ sentiment: "positive" }];
    }
    if (avg < 2.5) {
      return [{ sentiment: "negative" }];
    }
    if (stdDev > 1.5) {
      return [{ sentiment: "bimodal" }];
    }

    return [{ sentiment: "mixed" }];
  }

  /**
   * _getUserSurveys (user: User): (survey: Survey)
   *
   * @requires the given user exists
   * @effects returns an array of all `Survey` identities where the `owner` field matches the input `user`
   */
  async _getUserSurveys(
    { user }: { user: User },
  ): Promise<{ survey: Survey }[] | { error: string }[]> {
    try {
      const surveyDocs = await this.surveys.find({ owner: user }).toArray();
      return surveyDocs.map((s) => ({ survey: s._id }));
    } catch (e) {
      if (e instanceof Error) {
        return [{ error: e.message }];
      }
      return [{ error: "An unknown error occurred" }];
    }
  }
}

```
