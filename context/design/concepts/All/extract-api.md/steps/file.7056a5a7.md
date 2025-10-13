---
timestamp: 'Sun Oct 12 2025 22:26:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_222658.a0b3cf4a.md]]'
content_id: 7056a5a76dfbdf53833c641d9922d9e24967a4899d7b7bb76e3fb1f002b43eaa
---

# file: src/concepts/LikertSurvey/LikertSurveyConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Generic types used in this concept
type User = ID;
type Survey = ID;
type Question = ID;
type Response = ID;

// Collection prefix to namespace collections in the database
const PREFIX = "LikertSurvey.";

// #region State Type Declarations

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

// #endregion

/**
 * @concept LikertSurvey
 * @purpose understand group sentiment on a set of topics by aggregating quantitative feedback
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

  // #region Actions

  /**
   * createSurvey (title: String, owner: User): (survey: Survey)
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

    await this.questions.deleteOne({ _id: question });
    await this.responses.deleteMany({ question: question });

    return {};
  }

  /**
   * respondToQuestion (question: Question, responder: User, choice: Number)
   * @requires
   *  - question exists
   *  - choice is an integer between 1 and 5
   * @effects
   *  - delete any existing response to this question
   *  - creates a new `Response` linking the responder, question, and choice
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

    // Delete any previous response from this user for this question to ensure one response per user.
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

  // #endregion

  // #region Queries

  /**
   * _getSurveyQuestions (survey: Survey): (questions: array of Question)
   * @requires the given survey exists
   * @effects returns the array of all `Question` identities whose `survey` field matches the input `survey`
   */
  async _getSurveyQuestions(
    { survey }: { survey: Survey },
  ): Promise<{ questions: Question[] } | { error: string }> {
    const surveyDoc = await this.surveys.findOne({ _id: survey });
    if (!surveyDoc) {
      return { error: "Survey not found" };
    }

    const questionDocs = await this.questions.find({ survey }).toArray();
    const questions = questionDocs.map((q) => q._id);
    return { questions };
  }

  /**
   * _getQuestionResults (question: Question): (results: map of Number to Number)
   * @requires question exists
   * @effects returns a map where each key is a choice value (e.g., 1-5) and its value is the count of Responses for this question with that choice
   */
  async _getQuestionResults(
    { question }: { question: Question },
  ): Promise<{ results: Record<number, number> } | { error: string }> {
    if (!(await this.questions.findOne({ _id: question }))) {
      return { error: "Question not found" };
    }

    const results: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const responseDocs = await this.responses.find({ question }).toArray();

    for (const response of responseDocs) {
      if (results[response.choice] !== undefined) {
        results[response.choice]++;
      }
    }

    return { results };
  }

  /**
   * _analyzeSentiment (question: Question): (sentiment: String)
   * @effects Analyzes all responses for a given `question` and returns a string indicating the overall sentiment.
   */
  async _analyzeSentiment(
    { question }: { question: Question },
  ): Promise<{ sentiment: string } | { error: string }> {
    if (!(await this.questions.findOne({ _id: question }))) {
      return { error: "Question not found" };
    }

    const responseDocs = await this.responses.find({ question }).toArray();
    const scores = responseDocs.map((r) => r.choice);

    if (scores.length === 0) {
      return { sentiment: "neutral" };
    }

    const n = scores.length;
    const sum = scores.reduce((acc, score) => acc + score, 0);
    const average = sum / n;
    const stdDev = Math.sqrt(
      scores.map((score) => Math.pow(score - average, 2)).reduce(
        (acc, val) => acc + val,
        0,
      ) / n,
    );

    // *** FIX START ***
    // Check for high standard deviation (bimodal) first, as it's the strongest signal of polarization.
    if (stdDev > 1.5) {
      return { sentiment: "bimodal" };
    }
    if (average > 3.5) {
      return { sentiment: "positive" };
    }
    if (average < 2.5) {
      return { sentiment: "negative" };
    }
    // *** FIX END ***

    return { sentiment: "mixed" };
  }

  /**
   * _getQuestionResponseCounts (question: Question): (counts: array of Number)
   * @requires the given question exists
   * @effects returns an array of counts of responses by choice number (that is, the nth element is the number of responses with choice n+1)
   */
  async _getQuestionResponseCounts(
    { question }: { question: Question },
  ): Promise<{ counts: number[] } | { error: string }> {
    if (!(await this.questions.findOne({ _id: question }))) {
      return { error: "Question not found" };
    }

    const counts = [0, 0, 0, 0, 0];
    const responseDocs = await this.responses.find({ question }).toArray();

    for (const response of responseDocs) {
      if (response.choice >= 1 && response.choice <= 5) {
        counts[response.choice - 1]++;
      }
    }

    return { counts };
  }

  /**
   * _getUserSurveys (user: User): (surveys: array of Survey)
   * @requires the given user exists
   * @effects returns the set of all `Survey` identities where the `owner` field matches the input `user`
   */
  async _getUserSurveys(
    { user }: { user: User },
  ): Promise<{ surveys: Survey[] } | { error: string }> {
    // Note: We don't have a User collection in this concept, so we can't verify if the user exists.
    // We proceed by assuming the user ID is valid.
    const surveyDocs = await this.surveys.find({ owner: user }).toArray();
    const surveys = surveyDocs.map((s) => s._id);
    return { surveys };
  }

  // #endregion
}

```

## UserAuth

Specification:

**concept** UserAuth

**purpose** To verify a user's identity and grant them a temporary session for access.

**principle** If a user registers with a username and password, and then they login with the same credentials, they will be given a session token that identifies them as the user who registered. Logging out invalidates this token.

**state**

```
a set of Users with
  a username String
  a password String

a set of Sessions with
  a token String
  a user User
```

**actions**

`register(username: String, password: String): (user: User)`
**requires**
No user exists with the given `username`.
**effects**
A new `User` is created.
The new user's `username` is set to the input `username`.
The new user's `password` is set to the input `password`.
The new `user` is returned.

`register(username: String, password: String): (error: String)`
**requires**
A user already exists with the given `username`.
**effects**
An error message is returned indicating the username is taken.

`login(username: String, password: String): (token: String)`
**requires**
A user `u` exists where `u.username` matches the input `username` and `u.password` matches the input `password`.
**effects**
A new, unique `token` string is generated.
A new `Session` is created, linking the new `token` to the user `u`.
The `token` is returned.

`login(username: String, password: String): (error: String)`
**requires**
No user `u` exists where `u.username` matches the input `username` and `u.password` matches the input `password`.
**effects**
An error message is returned indicating invalid credentials.

`logout(token: String)`
**requires**
A session `s` exists where `s.token` matches the input `token`.
**effects**
The session `s` is deleted.

**queries**

`_getUserFromToken(token: String): (user: User)`
**requires**
A session `s` exists with the given `token`.
**effects**
Returns the user associated with session `s`.

`_getUserFromToken(token: String): (error: String)`
**requires**
No session exists with the given `token`.
**effects**
Returns an error message indicating an invalid token.

`_getUsernameFromToken(token: String): (username: String)`
**requires**
A session `s` exists with the given `token`.
**effects**
Returns the username of the user associated with session `s`.

`_getUsernameFromToken(token: String): (error: String)`
**requires**
No session exists with the given `token`.
**effects**
Returns an error message indicating an invalid token.

Code:
