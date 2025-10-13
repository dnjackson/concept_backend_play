[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

[@LikertSurvey-spec](LikertSurvey.md)

# generate code: LikertSurvey

# response:

# file: src/LikertSurvey/LikertSurveyConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Define the generic and entity types for the concept
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

const PREFIX = "LikertSurvey" + ".";

/**
 * concept: LikertSurvey
 * purpose: understand group sentiment on a set of topics by aggregating quantitative feedback
 */
export default class LikertSurveyConcept {
  public readonly surveys: Collection<SurveyDoc>;
  public readonly questions: Collection<QuestionDoc>;
  public readonly responses: Collection<ResponseDoc>;

  constructor(private readonly db: Db) {
    this.surveys = this.db.collection(PREFIX + "surveys");
    this.questions = this.db.collection(PREFIX + "questions");
    this.responses = this.db.collection(PREFIX + "responses");
  }

  // Actions

  /**
   * createSurvey (title: String, owner: User): (survey: Survey)
   *
   * **requires** title is non-empty
   *
   * **effects** creates a new `Survey` with the given title and owner and returns it
   */
  async createSurvey({ title, owner }: { title: string; owner: User }): Promise<{ survey: Survey } | { error: string }> {
    if (!title) {
      return { error: "Title cannot be empty" };
    }

    const surveyId = freshID() as Survey;
    const surveyDoc: SurveyDoc = {
      _id: surveyId,
      title,
      owner,
    };

    await this.surveys.insertOne(surveyDoc);
    return { survey: surveyId };
  }

  /**
   * addQuestion (stem: String, survey: Survey): (question: Question)
   *
   * **requires** stem is non-empty and survey exists
   *
   * **effects** creates a new `Question` with the given stem, associates it with the given survey, and returns it
   */
  async addQuestion({ stem, survey }: { stem: string; survey: Survey }): Promise<{ question: Question } | { error: string }> {
    if (!stem) {
      return { error: "Question stem cannot be empty" };
    }

    const surveyExists = await this.surveys.findOne({ _id: survey });
    if (!surveyExists) {
      return { error: `Survey with id ${survey} not found` };
    }

    const questionId = freshID() as Question;
    const questionDoc: QuestionDoc = {
      _id: questionId,
      stem,
      survey,
    };

    await this.questions.insertOne(questionDoc);
    return { question: questionId };
  }

  /**
   * removeQuestion (question: Question)
   *
   * **requires** question exists
   *
   * **effects** removes the specified question and all `Response` entities associated with it
   */
  async removeQuestion({ question }: { question: Question }): Promise<Empty | { error: string }> {
    const deleteQuestionResult = await this.questions.deleteOne({ _id: question });
    if (deleteQuestionResult.deletedCount === 0) {
      return { error: `Question with id ${question} not found` };
    }

    await this.responses.deleteMany({ question: question });

    return {};
  }

  /**
   * respondToQuestion (question: Question, responder: User, choice: Number)
   *
   * **requires**
   *   - question exists
   *   - choice is an integer between 1 and 5
   *
   * **effects**
   *   - delete any existing response to this question
   *   - creates a new `Response` linking the responder, question, and choice
   */
  async respondToQuestion({ question, responder, choice }: { question: Question; responder: User; choice: number }): Promise<Empty | { error: string }> {
    if (!Number.isInteger(choice) || choice < 1 || choice > 5) {
      return { error: "Choice must be an integer between 1 and 5" };
    }

    const questionExists = await this.questions.findOne({ _id: question });
    if (!questionExists) {
      return { error: `Question with id ${question} not found` };
    }

    // Delete previous response if it exists
    await this.responses.deleteMany({ question, responder });

    const responseId = freshID() as Response;
    const responseDoc: ResponseDoc = {
      _id: responseId,
      responder,
      question,
      choice,
    };

    await this.responses.insertOne(responseDoc);
    return {};
  }

  // Queries

  /**
   * _getSurveyQuestions (survey: Survey): [questions: Question]
   *
   * **requires** the given survey exists
   *
   * **effects** returns an array of `Question` identities whose `survey` field matches the input `survey`
   */
  async _getSurveyQuestions({ survey }: { survey: Survey }): Promise<{ questions: Question }[] | { error: string }> {
    const surveyExists = await this.surveys.findOne({ _id: survey });
    if (!surveyExists) {
      return { error: `Survey with id ${survey} not found` };
    }

    const questionDocs = await this.questions.find({ survey }).toArray();
    return questionDocs.map((q) => ({ questions: q._id }));
  }

  /**
   * _getQuestionResults (question: Question): (results: map of Number to Number)
   *
   * **requires** question exists
   *
   * **effects** returns a map where each key is a choice value (e.g., 1-5) and its value is the count of Responses for this question with that choice
   */
  async _getQuestionResults({ question }: { question: Question }): Promise<{ results: Record<number, number> }[] | { error: string }> {
    const questionExists = await this.questions.findOne({ _id: question });
    if (!questionExists) {
      return { error: `Question with id ${question} not found` };
    }

    const responses = await this.responses.find({ question }).toArray();
    const results: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const response of responses) {
      if (results[response.choice] !== undefined) {
        results[response.choice]++;
      }
    }
    return [{ results }];
  }

  /**
   * _analyzeSentiment (question: Question): (sentiment: String)
   *
   * **effects** This query analyzes all responses for a given `question` and returns a string indicating the overall sentiment.
   */
  async _analyzeSentiment({ question }: { question: Question }): Promise<{ sentiment: string }[] | { error: string }> {
    const questionExists = await this.questions.findOne({ _id: question });
    if (!questionExists) {
      return { error: `Question with id ${question} not found` };
    }

    const responses = await this.responses.find({ question }).toArray();
    const scores = responses.map((r) => r.choice);

    if (scores.length === 0) {
      return [{ sentiment: "neutral" }];
    }

    const n = scores.length;
    const mean = scores.reduce((a, b) => a + b, 0) / n;
    const variance = scores.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / n;
    const stddev = Math.sqrt(variance);

    let sentiment: string;
    if (mean > 3.5) {
      sentiment = "positive";
    } else if (mean < 2.5) {
      sentiment = "negative";
    } else if (stddev > 1.5) {
      sentiment = "bimodal";
    } else {
      sentiment = "mixed";
    }

    return [{ sentiment }];
  }

  /**
   * _getQuestionResponseCounts (question: Question): [counts: Number[]]
   *
   * **requires** the given question exists
   *
   * **effects** returns an array of counts of responses by choice number (that is, the nth element is the number of responses with choice n+1)
   */
  async _getQuestionResponseCounts({ question }: { question: Question }): Promise<{ counts: number[] }[] | { error: string }> {
    const questionExists = await this.questions.findOne({ _id: question });
    if (!questionExists) {
      return { error: `Question with id ${question} not found` };
    }

    const aggregationResult = await this.responses
      .aggregate<{ _id: number; count: number }>([
        { $match: { question } },
        { $group: { _id: "$choice", count: { $sum: 1 } } },
      ])
      .toArray();

    const counts = [0, 0, 0, 0, 0];
    for (const group of aggregationResult) {
      if (group._id >= 1 && group._id <= 5) {
        counts[group._id - 1] = group.count;
      }
    }

    return [{ counts }];
  }

  /**
   * _getUserSurveys (user: User): [surveys: Survey]
   *
   * **requires** the given user exists
   *
   * **effects** returns an array of all `Survey` identities where the `owner` field matches the input `user`
   */
  async _getUserSurveys({ user }: { user: User }): Promise<{ surveys: Survey }[] | { error: string }> {
    const surveyDocs = await this.surveys.find({ owner: user }).toArray();
    return surveyDocs.map((s) => ({ surveys: s._id }));
  }
}
```