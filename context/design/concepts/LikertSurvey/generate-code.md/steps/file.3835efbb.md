---
timestamp: 'Sat Oct 11 2025 22:08:29 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251011_220829.cdbe979f.md]]'
content_id: 3835efbbae6ee4097c30f657590b5bd5d5a1628cba868e754c3487da92009d18
---

# file: src/LikertSurvey/LikertSurveyConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Generic types used by this concept
type User = ID;
type SurveyID = ID<"Survey">;
type QuestionID = ID<"Question">;
type ResponseID = ID<"Response">;

/**
 * Represents a survey with a title and an owner.
 * state: a set of Surveys with
 *   a title String
 *   an owner User
 */
interface Survey {
  _id: SurveyID;
  title: string;
  owner: User;
}

/**
 * Represents a question within a survey.
 * state: a set of Questions with
 *   a stem String
 *   a survey Survey
 */
interface Question {
  _id: QuestionID;
  stem: string;
  survey: SurveyID;
}

/**
 * Represents a user's response to a question.
 * state: a set of Responses with
 *   a responder User
 *   a question Question
 *   a choice Number
 */
interface Response {
  _id: ResponseID;
  responder: User;
  question: QuestionID;
  choice: number; // Stored as a number from 1 to 5
}

const PREFIX = "LikertSurvey";

/**
 * @concept LikertSurvey
 * @purpose understand group sentiment on a set of topics by aggregating quantitative feedback
 * @principle if an owner creates a survey with several questions and shares it, and multiple users respond to the questions, then the owner can view an aggregated summary of the responses for each question.
 */
export default class LikertSurveyConcept {
  surveys: Collection<Survey>;
  questions: Collection<Question>;
  responses: Collection<Response>;

  constructor(private readonly db: Db) {
    this.surveys = this.db.collection<Survey>(`${PREFIX}.surveys`);
    this.questions = this.db.collection<Question>(`${PREFIX}.questions`);
    this.responses = this.db.collection<Response>(`${PREFIX}.responses`);
  }

  /**
   * createSurvey (title: String, owner: User): (survey: Survey)
   *
   * **requires** title is non-empty
   * **effects** creates a new `Survey` with the given title and owner and returns it
   */
  async createSurvey({ title, owner }: { title: string; owner: User }): Promise<{ survey: SurveyID } | { error: string }> {
    if (!title) {
      return { error: "Survey title cannot be empty." };
    }

    const newSurvey: Survey = {
      _id: freshID<SurveyID>(),
      title,
      owner,
    };

    await this.surveys.insertOne(newSurvey);
    return { survey: newSurvey._id };
  }

  /**
   * addQuestion (stem: String, survey: Survey): (question: Question)
   *
   * **requires** stem is non-empty and survey exists
   * **effects** creates a new `Question` with the given stem, associates it with the given survey, and returns it
   */
  async addQuestion({ stem, survey }: { stem: string; survey: SurveyID }): Promise<{ question: QuestionID } | { error: string }> {
    if (!stem) {
      return { error: "Question stem cannot be empty." };
    }

    const surveyDoc = await this.surveys.findOne({ _id: survey });
    if (!surveyDoc) {
      return { error: `Survey with id '${survey}' not found.` };
    }

    const newQuestion: Question = {
      _id: freshID<QuestionID>(),
      stem,
      survey,
    };

    await this.questions.insertOne(newQuestion);
    return { question: newQuestion._id };
  }

  /**
   * removeQuestion (question: Question)
   *
   * **requires** question exists
   * **effects** removes the specified question and all `Response` entities associated with it
   */
  async removeQuestion({ question }: { question: QuestionID }): Promise<Empty | { error: string }> {
    const deleteResult = await this.questions.deleteOne({ _id: question });
    if (deleteResult.deletedCount === 0) {
      return { error: `Question with id '${question}' not found.` };
    }

    await this.responses.deleteMany({ question });
    return {};
  }

  /**
   * respondToQuestion (question: Question, responder: User, choice: Number)
   *
   * **requires**
   * - question exists
   * - choice is an integer between 1 and 5
   * **effects**
   * - delete any existing response to this question
   * - creates a new `Response` linking the responder, question, and choice
   */
  async respondToQuestion({ question, responder, choice }: { question: QuestionID; responder: User; choice: number }): Promise<Empty | { error: string }> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return { error: `Question with id '${question}' not found.` };
    }

    if (!Number.isInteger(choice) || choice < 1 || choice > 5) {
      return { error: "Choice must be an integer between 1 and 5." };
    }

    await this.responses.deleteMany({ question, responder });

    const newResponse: Response = {
      _id: freshID<ResponseID>(),
      question,
      responder,
      choice,
    };

    await this.responses.insertOne(newResponse);
    return {};
  }

  /**
   * _getSurveyQuestions (survey: Survey): (questions: set of Question)
   *
   * **requires** survey exists
   * **effects** returns the set of all Questions where `Question.survey` is the given survey
   */
  async _getSurveyQuestions({ survey }: { survey: SurveyID }): Promise<Question[]> {
    return this.questions.find({ survey }).toArray();
  }

  /**
   * _getQuestionResults (question: Question): (results: map of Number to Number)
   *
   * **requires** question exists
   * **effects** returns a map where each key is a choice value (e.g., 1-5) and its value is the count of Responses for this question with that choice
   */
  async _getQuestionResults({ question }: { question: QuestionID }): Promise<{ results: Record<number, number> }[]> {
    const aggregationResult = await this.responses.aggregate<{ _id: number; count: number }>([
      { $match: { question } },
      { $group: { _id: "$choice", count: { $sum: 1 } } },
    ]).toArray();

    const results: Record<number, number> = {};
    for (const item of aggregationResult) {
      results[item._id] = item.count;
    }

    return [{ results }];
  }

  /**
   * _analyzeSentiment (question: Question): (sentiment: String)
   *
   * **effects**
   * This query analyzes all responses for a given `question` and returns a string indicating the overall sentiment.
   */
  async _analyzeSentiment({ question }: { question: QuestionID }): Promise<{ sentiment: string }[]> {
    const responses = await this.responses.find({ question }).toArray();
    const scores = responses.map((r) => r.choice);

    if (scores.length === 0) {
      return [{ sentiment: "neutral" }];
    }

    const n = scores.length;
    const sum = scores.reduce((acc, score) => acc + score, 0);
    const average = sum / n;

    const variance = scores.reduce((acc, score) => acc + Math.pow(score - average, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    let sentiment: string;
    if (average > 3.5) {
      sentiment = "positive";
    } else if (average < 2.5) {
      sentiment = "negative";
    } else if (stdDev > 1.5) {
      sentiment = "bimodal";
    } else {
      sentiment = "mixed";
    }

    return [{ sentiment }];
  }
}
```
