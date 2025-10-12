---
timestamp: 'Sat Oct 11 2025 22:01:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251011_220157.05c2960f.md]]'
content_id: 854749fb2c150055c047dabbd9f4e080ab05f68d9b5958d776c7668962ddb9d2
---

# file: src/LikertSurvey/LikertSurveyConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Generic type parameter defined by the concept
type User = ID;

// Entity types used within the concept
type Survey = ID;
type Question = ID;
type Response = ID;

/**
 * Represents a survey in the database.
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
 * Represents a question in the database.
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
 * Represents a user's response to a question in the database.
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

// Prefix for MongoDB collections to avoid name collisions.
const PREFIX = "LikertSurvey" + ".";

/**
 * @concept LikertSurvey
 * @purpose understand group sentiment on a set of topics by aggregating quantitative feedback
 */
export default class LikertSurveyConcept {
  public readonly surveys: Collection<SurveyDoc>;
  public readonly questions: Collection<QuestionDoc>;
  public readonly responses: Collection<ResponseDoc>;

  constructor(private readonly db: Db) {
    this.surveys = db.collection<SurveyDoc>(PREFIX + "surveys");
    this.questions = db.collection<QuestionDoc>(PREFIX + "questions");
    this.responses = db.collection<ResponseDoc>(PREFIX + "responses");
  }

  /**
   * createSurvey (title: String, owner: User): (survey: Survey)
   *
   * **requires** title is non-empty
   * **effects** creates a new `Survey` with the given title and owner and returns it
   */
  async createSurvey({ title, owner }: { title: string; owner: User }): Promise<{ survey: Survey } | { error: string }> {
    if (!title.trim()) {
      return { error: "Title cannot be empty" };
    }

    const newSurveyId = freshID() as Survey;
    const result = await this.surveys.insertOne({
      _id: newSurveyId,
      title,
      owner,
    });

    if (!result.acknowledged) {
      return { error: "Failed to create survey" };
    }
    return { survey: newSurveyId };
  }

  /**
   * addQuestion (stem: String, survey: Survey): (question: Question)
   *
   * **requires** stem is non-empty and survey exists
   * **effects** creates a new `Question` with the given stem, associates it with the given survey, and returns it
   */
  async addQuestion({ stem, survey }: { stem: string; survey: Survey }): Promise<{ question: Question } | { error: string }> {
    if (!stem.trim()) {
      return { error: "Question stem cannot be empty" };
    }

    const surveyDoc = await this.surveys.findOne({ _id: survey });
    if (!surveyDoc) {
      return { error: `Survey with id ${survey} does not exist` };
    }

    const newQuestionId = freshID() as Question;
    const result = await this.questions.insertOne({
      _id: newQuestionId,
      stem,
      survey,
    });

    if (!result.acknowledged) {
      return { error: "Failed to add question" };
    }
    return { question: newQuestionId };
  }

  /**
   * removeQuestion (question: Question)
   *
   * **requires** question exists
   * **effects** removes the specified question and all `Response` entities associated with it
   */
  async removeQuestion({ question }: { question: Question }): Promise<Empty | { error: string }> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return { error: `Question with id ${question} does not exist` };
    }

    await this.responses.deleteMany({ question });
    await this.questions.deleteOne({ _id: question });

    return {};
  }

  /**
   * respondToQuestion (question: Question, responder: User, choice: Number)
   *
   * **requires**
   * - question exists
   * - choice is an integer between 1 and 5
   * **effects**
   * - deletes any existing response to this question
   * - creates a new `Response` linking the responder, question, and choice
   */
  async respondToQuestion({ question, responder, choice }: { question: Question; responder: User; choice: number }): Promise<Empty | { error: string }> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return { error: `Question with id ${question} does not exist` };
    }

    if (!Number.isInteger(choice) || choice < 1 || choice > 5) {
      return { error: "Choice must be an integer between 1 and 5" };
    }

    // Delete any previous response from this user to this question to ensure one response per user.
    await this.responses.deleteMany({ question, responder });

    const newResponseId = freshID() as Response;
    const result = await this.responses.insertOne({
      _id: newResponseId,
      question,
      responder,
      choice,
    });

    if (!result.acknowledged) {
      return { error: "Failed to record response" };
    }
    return {};
  }

  /**
   * _getSurveyQuestions (survey: Survey): (questions: set of Question)
   *
   * **requires** survey exists
   * **effects** returns the set of all Questions where `Question.survey` is the given survey
   */
  async _getSurveyQuestions({ survey }: { survey: Survey }): Promise<QuestionDoc[]> {
    const surveyExists = await this.surveys.findOne({ _id: survey });
    if (!surveyExists) {
      return [];
    }
    return await this.questions.find({ survey }).toArray();
  }

  /**
   * _getQuestionResults (question: Question): (results: map of Number to Number)
   *
   * **requires** question exists
   * **effects** returns a map where each key is a choice value (e.g., 1-5) and its value is the count of Responses for this question with that choice
   */
  async _getQuestionResults({ question }: { question: Question }): Promise<{ results: Record<number, number> }[]> {
    const questionExists = await this.questions.findOne({ _id: question });
    if (!questionExists) {
      return [];
    }

    const pipeline = [
      { $match: { question } },
      { $group: { _id: "$choice", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ];

    const aggregationResult = await this.responses.aggregate<{ _id: number; count: number }>(pipeline).toArray();

    const results: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const item of aggregationResult) {
      results[item._id] = item.count;
    }

    // Per instruction, queries must return an array of the specified type.
    return [{ results }];
  }
}
```
