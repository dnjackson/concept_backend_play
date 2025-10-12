---
timestamp: 'Sat Oct 11 2025 21:55:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251011_215559.ec1289f5.md]]'
content_id: f179b0076a35c0e625e1a1eb280997f91b63f05e36d050587c23795972bab5db
---

# file: src/LikertSurvey/LikertSurveyConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "LikertSurvey" + ".";

// Generic types of this concept
type Author = ID;
type Respondent = ID;

// Internal entity types
type Survey = ID;
type Question = ID;
type Response = ID;

/**
 * concept: LikertSurvey [Author, Respondent]
 * purpose: To measure attitudes or opinions by asking respondents to rate their level of agreement with a series of statements on a predefined scale.
 */

/**
 * A set of `Surveys` with
 *  an `author` of type `Author`
 *  a `title` of type `String`
 *  a `scaleMin` of type `Number`
 *  a `scaleMax` of type `Number`
 */
interface SurveyDoc {
  _id: Survey;
  author: Author;
  title: string;
  scaleMin: number;
  scaleMax: number;
}

/**
 * A set of `Questions` with
 *  a `survey` of type `Survey`
 *  a `text` of type `String`
 */
interface QuestionDoc {
  _id: Question;
  survey: Survey;
  text: string;
}

/**
 * A set of `Responses` with
 *  a `respondent` of type `Respondent`
 *  a `question` of type `Question`
 *  a `value` of type `Number`
 */
interface ResponseDoc {
  _id: Response;
  respondent: Respondent;
  question: Question;
  value: number;
}

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
   * createSurvey (author: Author, title: String, scaleMin: Number, scaleMax: Number): (survey: Survey)
   *
   * **requires**: `scaleMin < scaleMax`
   * **effects**: Creates a new survey with the given author, title, and scale.
   */
  async createSurvey({ author, title, scaleMin, scaleMax }: { author: Author; title: string; scaleMin: number; scaleMax: number }): Promise<{ survey: Survey } | { error: string }> {
    if (scaleMin >= scaleMax) {
      return { error: "scaleMin must be less than scaleMax" };
    }

    const newSurvey: SurveyDoc = {
      _id: freshID(),
      author,
      title,
      scaleMin,
      scaleMax,
    };

    await this.surveys.insertOne(newSurvey);
    return { survey: newSurvey._id };
  }

  /**
   * addQuestion (survey: Survey, text: String): (question: Question)
   *
   * **requires**: The survey must exist.
   * **effects**: Adds a new question to the specified survey.
   */
  async addQuestion({ survey, text }: { survey: Survey; text: string }): Promise<{ question: Question } | { error: string }> {
    const surveyExists = await this.surveys.findOne({ _id: survey });
    if (!surveyExists) {
      return { error: "Survey not found" };
    }

    const newQuestion: QuestionDoc = {
      _id: freshID(),
      survey,
      text,
    };

    await this.questions.insertOne(newQuestion);
    return { question: newQuestion._id };
  }

  /**
   * submitResponse (respondent: Respondent, question: Question, value: Number)
   *
   * **requires**: The question must exist. The respondent must not have already submitted a response for this question. The value must be within the survey's scale.
   * **effects**: Records the respondent's answer for the given question.
   */
  async submitResponse({ respondent, question, value }: { respondent: Respondent; question: Question; value: number }): Promise<Empty | { error: string }> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return { error: "Question not found" };
    }

    const existingResponse = await this.responses.findOne({ respondent, question });
    if (existingResponse) {
      return { error: "Respondent has already submitted a response for this question" };
    }

    const surveyDoc = await this.surveys.findOne({ _id: questionDoc.survey });
    if (!surveyDoc) {
      // This indicates a data integrity issue, but we handle it gracefully.
      return { error: "Associated survey not found" };
    }

    if (value < surveyDoc.scaleMin || value > surveyDoc.scaleMax) {
      return { error: `Value must be between ${surveyDoc.scaleMin} and ${surveyDoc.scaleMax}` };
    }

    const newResponse: ResponseDoc = {
      _id: freshID(),
      respondent,
      question,
      value,
    };

    await this.responses.insertOne(newResponse);
    return {};
  }

  /**
   * updateResponse (respondent: Respondent, question: Question, value: Number)
   *
   * **requires**: The question must exist. The respondent must have already submitted a response for this question. The value must be within the survey's scale.
   * **effects**: Updates the respondent's existing answer for the given question.
   */
  async updateResponse({ respondent, question, value }: { respondent: Respondent; question: Question; value: number }): Promise<Empty | { error: string }> {
    const questionDoc = await this.questions.findOne({ _id: question });
    if (!questionDoc) {
      return { error: "Question not found" };
    }

    const existingResponse = await this.responses.findOne({ respondent, question });
    if (!existingResponse) {
      return { error: "No existing response found to update" };
    }

    const surveyDoc = await this.surveys.findOne({ _id: questionDoc.survey });
    if (!surveyDoc) {
      return { error: "Associated survey not found" };
    }

    if (value < surveyDoc.scaleMin || value > surveyDoc.scaleMax) {
      return { error: `Value must be between ${surveyDoc.scaleMin} and ${surveyDoc.scaleMax}` };
    }

    await this.responses.updateOne(
      { _id: existingResponse._id },
      { $set: { value } },
    );

    return {};
  }
}
```
