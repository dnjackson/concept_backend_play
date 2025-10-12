---
timestamp: 'Sun Oct 12 2025 00:56:12 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_005612.282d016e.md]]'
content_id: 7feaaeafd898b7dfeff48271f94c29a79098a57a6d156eebaae641388c111d5e
---

# file: src/LikertSurvey/LikertSurveyConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

const PREFIX = "LikertSurvey" + ".";

// Generic types of this concept
type User = ID;

// Concept-specific types
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
    this.surveys = this.db.collection(PREFIX + "surveys");
    this.questions = this.db.collection(PREFIX + "questions");
    this.responses = this.db.collection(PREFIX + "responses");
  }

  /**
   * createSurvey (title: String, owner: User): (survey: Survey)
   *
   * **requires** title is non-empty
   * **effects** creates a new `Survey` with the given title and owner and returns it
   */
  async createSurvey({ title, owner }: { title: string; owner: User }): Promise<{ survey: Survey } | { error: string }> {
    if (!title) {
      return { error: "Survey title cannot be empty." };
    }

    const survey: SurveyDoc = {
      _id: freshID(),
      title,
      owner,
    };
    await this.surveys.insertOne(survey);
    return { survey: survey._id };
  }

  /**
   * addQuestion (stem: String, survey: Survey): (question: Question)
   *
   * **requires** stem is non-empty and survey exists
   * **effects** creates a new `Question` with the given stem, associates it with the given survey, and returns it
   */
  async addQuestion({ stem, survey }: { stem: string; survey: Survey }): Promise<{ question: Question } | { error: string }> {
    if (!stem) {
      return { error: "Question stem cannot be empty." };
    }
    const parentSurvey = await this.surveys.findOne({ _id: survey });
    if (!parentSurvey) {
      return { error: "Survey not found." };
    }

    const question: QuestionDoc = {
      _id: freshID(),
      stem,
      survey,
    };
    await this.questions.insertOne(question);
    return { question: question._id };
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
      return { error: "Question not found." };
    }

    await this.questions.deleteOne({ _id: question });
    await this.responses.deleteMany({ question: question });

    return {};
  }

  /**
   * respondToQuestion (question: Question, responder: User, choice: Number)
   *
   * **requires** question exists; choice is an integer between 1 and 5
   * **effects** deletes any existing response to this question by the responder; creates a new `Response` linking the responder, question, and choice
   */
  async respondToQuestion({ question, responder, choice }: { question: Question; responder: User; choice: number }): Promise<Empty | { error: string }> {
    if (!Number.isInteger(choice) || choice < 1 || choice > 5) {
      return { error: "Choice must be an integer between 1 and 5." };
    }
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return { error: "Question not found." };
    }

    // Delete any previous response from this user for this question
    await this.responses.deleteMany({ question, responder });

    const response: ResponseDoc = {
      _id: freshID(),
      responder,
      question,
      choice,
    };
    await this.responses.insertOne(response);
    return {};
  }

  /**
   * _getSurveyQuestions (survey: Survey): (questions: set of Question)
   *
   * **requires** the given survey exists
   * **effects** returns the set of all `Question` entities whose `survey` field matches the input `survey`
   */
  async _getSurveyQuestions({ survey }: { survey: Survey }): Promise<QuestionDoc[]> {
    const surveyDoc = await this.surveys.findOne({ _id: survey });
    if (!surveyDoc) {
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
  async _getQuestionResults({ question }: { question: Question }): Promise<Array<Record<number, number>>> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return [];
    }

    const pipeline = [
      { $match: { question } },
      { $group: { _id: "$choice", count: { $sum: 1 } } },
    ];

    const results = await this.responses.aggregate<{ _id: number; count: number }>(pipeline).toArray();
    const responseMap: Record<number, number> = {};
    for (const result of results) {
      responseMap[result._id] = result.count;
    }

    // Ensure all choices 1-5 are present, even if their count is 0
    for (let i = 1; i <= 5; i++) {
      if (!responseMap[i]) {
        responseMap[i] = 0;
      }
    }
    return [responseMap];
  }

  /**
   * _analyzeSentiment (question: Question): (sentiment: String)
   *
   * **effects** analyzes all responses for a given `question` and returns a string indicating the overall sentiment.
   */
  async _analyzeSentiment({ question }: { question: Question }): Promise<Array<{ sentiment: string }>> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      // Per spec, no responses means neutral. An invalid question has no responses.
      return [{ sentiment: "neutral" }];
    }

    const responses = await this.responses.find({ question }).toArray();
    const scores = responses.map((r) => r.choice);

    if (scores.length === 0) {
      return [{ sentiment: "neutral" }];
    }

    const n = scores.length;
    const mean = scores.reduce((a, b) => a + b) / n;
    const variance = scores.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n;
    const stdDev = Math.sqrt(variance);

    let sentiment: string;
    if (mean > 3.5) {
      sentiment = "positive";
    } else if (mean < 2.5) {
      sentiment = "negative";
    } else if (stdDev > 1.5) {
      sentiment = "bimodal";
    } else {
      sentiment = "mixed";
    }

    return [{ sentiment }];
  }

  /**
   * _getQuestionResponseCounts (question: Question): (counts: array of Number)
   *
   * **requires** the given question exists
   * **effects** returns an array of counts of responses by choice number (that is, the nth element is the number of responses with choice n+1)
   */
  async _getQuestionResponseCounts({ question }: { question: Question }): Promise<Array<number[]>> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return [];
    }
    
    const pipeline = [
      { $match: { question } },
      { $group: { _id: "$choice", count: { $sum: 1 } } },
    ];
    
    const results = await this.responses.aggregate<{ _id: number; count: number }>(pipeline).toArray();
    
    const counts = [0, 0, 0, 0, 0];
    for (const result of results) {
      // result._id is the choice (1-5)
      counts[result._id - 1] = result.count;
    }
    
    return [counts];
  }

  /**
   * _getUserSurveys (user: User): (surveys: set of Survey)
   *
   * **requires** the given user exists
   * **effects** returns the set of all `Survey` entities where the `owner` field matches the input `user`
   */
  async _getUserSurveys({ user }: { user: User }): Promise<SurveyDoc[]> {
    return await this.surveys.find({ owner: user }).toArray();
  }
}
```
