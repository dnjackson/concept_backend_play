[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

Please generate code that produces a single sample survey with about 100 interesting questions about the topic of vibe coding. Remember that this is a LikertSurvey so the questions should be formulated so that answers like "strongly agree" make sense. 

For the owner, use "Alice" as the string.

The code should construct the survey by making calls to the LikertSurveyConcept:

[@LikertSurvey-spec](LikertSurvey.md)

[@LikertSurveyConcept.ts](../../../src/concepts/LikertSurvey/LikertSurveyConcept.ts)



# response:

# file: src/scripts/createVibeSurvey.ts

```typescript
import { getDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "@concepts/LikertSurvey/LikertSurveyConcept.ts";

/**
 * A list of ~100 Likert-scale questions about "vibe coding".
 * These questions explore the definition, process, tools, team dynamics, outcomes,
 * and personal feelings associated with this development approach.
 */
const vibeCodingQuestions = [
  // --- Definition & Understanding ---
  "I have a clear and consistent definition of 'vibe coding'.",
  "'Vibe coding' is primarily about intuition rather than formal logic.",
  "'Vibe coding' is just a modern term for 'hacking it until it works'.",
  "A project's success can be determined by the 'vibe' of its codebase.",
  "Understanding the 'vibe' of a legacy system is the first step to refactoring it.",
  "You can't teach 'vibe coding'; it's an innate skill.",
  "'Vibe coding' is the opposite of 'enterprise' software development.",
  "Gut feelings about code are usually correct.",
  "Code that 'feels right' is often high-quality code.",
  "'Vibe-driven development' is a legitimate software methodology.",
  "The term 'vibe coding' accurately captures a real phenomenon in software development.",
  "A good 'code vibe' is easily recognizable, even if it's hard to define.",
  "The 'vibe' of code is more about its structure and architecture than its syntax.",

  // --- Process & Methodology ---
  "My best code is written when I'm in a state of flow, or 'in the vibe'.",
  "Strict adherence to Agile or Scrum ceremonies hinders vibe-driven development.",
  "Refactoring based on 'code smells' is a form of vibe coding.",
  "I often start coding without a detailed plan, letting the 'vibe' guide the architecture.",
  "Test-Driven Development (TDD) is incompatible with vibe coding.",
  "The 'right' solution to a problem often reveals itself during the coding process, not before.",
  "I prefer to explore multiple solutions in code rather than on a whiteboard.",
  "When I get stuck, changing my physical environment helps reset my coding vibe.",
  "Pair programming is most effective when both developers share the same 'vibe'.",
  "I rely on the compiler and linter to handle the details so I can focus on the vibe.",
  "Timeboxing tasks is counterproductive to achieving a good coding vibe.",
  "A period of unstructured 'tinkering' is essential for complex problem-solving.",

  // --- Tools & Environment ---
  "An aesthetically pleasing code editor and theme are essential for good vibes.",
  "The right background music significantly improves my coding productivity.",
  "Fast feedback loops (e.g., hot reloading, fast tests) are crucial for maintaining a good coding vibe.",
  "I am more productive when my physical workspace has the right 'vibe'.",
  "The choice of programming language heavily influences the 'vibe' of a project.",
  "A powerful and well-configured machine is critical for a smooth coding vibe.",
  "I feel a strong connection to my preferred set of development tools.",
  "Minimalist tooling and environments are more conducive to vibe coding than complex IDEs.",
  "A cluttered desktop or project directory negatively impacts my coding vibe.",
  "Mechanical keyboards with a satisfying sound/feel contribute to a better coding vibe.",
  "Good noise-canceling headphones are a requirement for entering the 'zone'.",
  "The font I use for coding has a measurable impact on my performance.",

  // --- Team Dynamics & Culture ---
  "A team that 'vibes' together codes better together.",
  "'Vibe coding' is an individual activity that is difficult to scale across a large team.",
  "Code reviews should assess the 'vibe' of the code, not just its functional correctness.",
  "It's more important for a new hire to match the team's 'vibe' than to have specific technical skills.",
  "Disagreements about architecture are often disagreements about 'vibe'.",
  "A team's 'vibe' is its most important asset.",
  "I can tell the 'vibe' of a team just by reading their code.",
  "Asynchronous communication (e.g., Slack, comments) is insufficient for establishing a shared team vibe.",
  "Onboarding a new developer is mostly about getting them in sync with the project's vibe.",
  "A 'vibe mismatch' is a valid reason for a developer not succeeding on a team.",
  "Humor and memes in team communication are vital for a positive coding vibe.",
  "Mandatory in-office days are bad for the development vibe.",

  // --- Outcomes & Quality ---
  "Code produced through 'vibe coding' is often more creative and innovative.",
  "Vibe-coded projects tend to accumulate more technical debt than rigorously planned projects.",
  "The user experience of a product is a direct reflection of the development team's vibe.",
  "Code that has a bad 'vibe' is more likely to contain bugs.",
  "Over-engineering is a sign of a lack of a clear 'vibe' for the project.",
  "The most elegant solutions come from vibe-driven exploration.",
  "Vibe-coded features are often harder for other developers to maintain.",
  "A consistent 'vibe' throughout the codebase is more important than following a strict style guide.",
  "The 'vibe' of the code directly impacts application performance.",
  "Products built with a good vibe feel more 'human' and are more enjoyable to use.",
  "Vibe coding is excellent for prototypes but unsustainable for long-term products.",
  "The 'bus factor' is higher on projects primarily driven by one person's 'vibe'.",

  // --- Personal Feelings & Identity ---
  "I proudly identify as a 'vibe-driven' developer.",
  "Feeling a good 'vibe' while coding is more important to me than following strict guidelines.",
  "When the vibe is off, it is nearly impossible for me to be productive.",
  "I have a deep emotional connection to the code I write.",
  "I sometimes dream about code or solve problems in my sleep.",
  "I feel personally attacked when someone criticizes the 'vibe' of my code.",
  "My mood for the day is heavily influenced by how my coding sessions go.",
  "The feeling of code 'just clicking into place' is why I became a developer.",
  "I experience 'coder's block' that feels similar to writer's block.",
  "I would rather work on a technically simple project with a great vibe than a complex one with a bad vibe.",
  "I am at my happiest when I am deep in the 'coding zone'.",

  // --- Industry Perception & Future ---
  "'Vibe coding' is a skill that will become more valuable with the rise of AI coding assistants.",
  "The term 'vibe coding' is often used dismissively by 'serious' engineers.",
  "Startups are more likely to succeed with a vibe-driven engineering culture.",
  "AI coding assistants (like Copilot) disrupt a developer's natural coding vibe.",
  "As the software industry matures, there will be less room for vibe-driven development.",
  "Future programming languages will have features designed to enhance the coding 'vibe'.",
  "Interview processes should include exercises that test for 'vibe' and intuition.",
  "Bootcamps and universities should teach 'vibe coding' alongside data structures and algorithms.",
  "The '10x engineer' is simply a developer who is consistently in sync with their project's vibe.",
  "'Vibe coding' will always be a critical part of the craft of software development.",
];

/**
 * Creates a sample survey about Vibe Coding using the LikertSurveyConcept.
 */
async function createVibeCodingSurvey() {
  const [db, client] = await getDb();
  try {
    console.log("Database connection established.");
    const surveyConcept = new LikertSurveyConcept(db);
    const owner = "Alice" as ID;
    const title = "Vibe Coding Sentiment Analysis";

    console.log(`Creating survey titled: "${title}" for owner: ${owner}...`);

    const createSurveyResult = await surveyConcept.createSurvey({ title, owner });

    if ("error" in createSurveyResult) {
      console.error("Failed to create survey:", createSurveyResult.error);
      return;
    }

    const { survey: surveyId } = createSurveyResult;
    console.log(`Survey created successfully! ID: ${surveyId}`);
    console.log("Adding questions to the survey...");

    let questionCount = 0;
    for (const stem of vibeCodingQuestions) {
      const addQuestionResult = await surveyConcept.addQuestion({
        stem,
        survey: surveyId,
      });

      if ("error" in addQuestionResult) {
        console.error(
          `Failed to add question "${stem}":`,
          addQuestionResult.error,
        );
        // Continue to next question
      } else {
        questionCount++;
        if (questionCount % 10 === 0) {
          console.log(`Added ${questionCount} of ${vibeCodingQuestions.length} questions...`);
        }
      }
    }

    console.log(`\nFinished adding questions. Total questions added: ${questionCount}`);
    console.log("Vibe Coding survey creation complete.");
  } catch (e) {
    console.error("An unexpected error occurred:", e);
  } finally {
    await client.close();
    console.log("Database connection closed.");
  }
}

// Execute the script
createVibeCodingSurvey();
```

# fix errors:

Please fix these errors

[{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/scripts/createVibeSurvey.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2345",
	"severity": 8,
	"message": "Argument of type 'MongoClient | Db' is not assignable to parameter of type 'Db'.\n  Type 'MongoClient' is missing the following properties from type 'Db': databaseName, secondaryOk, namespace, createCollection, and 16 more.",
	"source": "deno-ts",
	"startLineNumber": 115,
	"startColumn": 51,
	"endLineNumber": 115,
	"endColumn": 53,
	"origin": "extHost1"
},{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/scripts/createVibeSurvey.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2339",
	"severity": 8,
	"message": "Property 'close' does not exist on type 'MongoClient | Db'.\n  Property 'close' does not exist on type 'Db'.",
	"source": "deno-ts",
	"startLineNumber": 165,
	"startColumn": 18,
	"endLineNumber": 165,
	"endColumn": 23,
	"origin": "extHost1"
}]

# response:

Of course. The errors you're seeing are due to TypeScript's type inference. The `getDb()` function returns a tuple `[Db, MongoClient]`, but without explicit typing, TypeScript is inferring the type of `db` and `client` as a union `(Db | MongoClient)`, which is too broad.

The fix is to explicitly type the destructured variables. This will correctly inform TypeScript that `db` is of type `Db` and `client` is of type `MongoClient`, resolving both errors.

Here is the corrected file:

# file: src/scripts/createVibeSurvey.ts

```typescript
import { Db, MongoClient } from "npm:mongodb";
import { getDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "@concepts/LikertSurvey/LikertSurveyConcept.ts";

/**
 * A list of ~100 Likert-scale questions about "vibe coding".
 * These questions explore the definition, process, tools, team dynamics, outcomes,
 * and personal feelings associated with this development approach.
 */
const vibeCodingQuestions = [
  // --- Definition & Understanding ---
  "I have a clear and consistent definition of 'vibe coding'.",
  "'Vibe coding' is primarily about intuition rather than formal logic.",
  "'Vibe coding' is just a modern term for 'hacking it until it works'.",
  "A project's success can be determined by the 'vibe' of its codebase.",
  "Understanding the 'vibe' of a legacy system is the first step to refactoring it.",
  "You can't teach 'vibe coding'; it's an innate skill.",
  "'Vibe coding' is the opposite of 'enterprise' software development.",
  "Gut feelings about code are usually correct.",
  "Code that 'feels right' is often high-quality code.",
  "'Vibe-driven development' is a legitimate software methodology.",
  "The term 'vibe coding' accurately captures a real phenomenon in software development.",
  "A good 'code vibe' is easily recognizable, even if it's hard to define.",
  "The 'vibe' of code is more about its structure and architecture than its syntax.",

  // --- Process & Methodology ---
  "My best code is written when I'm in a state of flow, or 'in the vibe'.",
  "Strict adherence to Agile or Scrum ceremonies hinders vibe-driven development.",
  "Refactoring based on 'code smells' is a form of vibe coding.",
  "I often start coding without a detailed plan, letting the 'vibe' guide the architecture.",
  "Test-Driven Development (TDD) is incompatible with vibe coding.",
  "The 'right' solution to a problem often reveals itself during the coding process, not before.",
  "I prefer to explore multiple solutions in code rather than on a whiteboard.",
  "When I get stuck, changing my physical environment helps reset my coding vibe.",
  "Pair programming is most effective when both developers share the same 'vibe'.",
  "I rely on the compiler and linter to handle the details so I can focus on the vibe.",
  "Timeboxing tasks is counterproductive to achieving a good coding vibe.",
  "A period of unstructured 'tinkering' is essential for complex problem-solving.",

  // --- Tools & Environment ---
  "An aesthetically pleasing code editor and theme are essential for good vibes.",
  "The right background music significantly improves my coding productivity.",
  "Fast feedback loops (e.g., hot reloading, fast tests) are crucial for maintaining a good coding vibe.",
  "I am more productive when my physical workspace has the right 'vibe'.",
  "The choice of programming language heavily influences the 'vibe' of a project.",
  "A powerful and well-configured machine is critical for a smooth coding vibe.",
  "I feel a strong connection to my preferred set of development tools.",
  "Minimalist tooling and environments are more conducive to vibe coding than complex IDEs.",
  "A cluttered desktop or project directory negatively impacts my coding vibe.",
  "Mechanical keyboards with a satisfying sound/feel contribute to a better coding vibe.",
  "Good noise-canceling headphones are a requirement for entering the 'zone'.",
  "The font I use for coding has a measurable impact on my performance.",

  // --- Team Dynamics & Culture ---
  "A team that 'vibes' together codes better together.",
  "'Vibe coding' is an individual activity that is difficult to scale across a large team.",
  "Code reviews should assess the 'vibe' of the code, not just its functional correctness.",
  "It's more important for a new hire to match the team's 'vibe' than to have specific technical skills.",
  "Disagreements about architecture are often disagreements about 'vibe'.",
  "A team's 'vibe' is its most important asset.",
  "I can tell the 'vibe' of a team just by reading their code.",
  "Asynchronous communication (e.g., Slack, comments) is insufficient for establishing a shared team vibe.",
  "Onboarding a new developer is mostly about getting them in sync with the project's vibe.",
  "A 'vibe mismatch' is a valid reason for a developer not succeeding on a team.",
  "Humor and memes in team communication are vital for a positive coding vibe.",
  "Mandatory in-office days are bad for the development vibe.",

  // --- Outcomes & Quality ---
  "Code produced through 'vibe coding' is often more creative and innovative.",
  "Vibe-coded projects tend to accumulate more technical debt than rigorously planned projects.",
  "The user experience of a product is a direct reflection of the development team's vibe.",
  "Code that has a bad 'vibe' is more likely to contain bugs.",
  "Over-engineering is a sign of a lack of a clear 'vibe' for the project.",
  "The most elegant solutions come from vibe-driven exploration.",
  "Vibe-coded features are often harder for other developers to maintain.",
  "A consistent 'vibe' throughout the codebase is more important than following a strict style guide.",
  "The 'vibe' of the code directly impacts application performance.",
  "Products built with a good vibe feel more 'human' and are more enjoyable to use.",
  "Vibe coding is excellent for prototypes but unsustainable for long-term products.",
  "The 'bus factor' is higher on projects primarily driven by one person's 'vibe'.",

  // --- Personal Feelings & Identity ---
  "I proudly identify as a 'vibe-driven' developer.",
  "Feeling a good 'vibe' while coding is more important to me than following strict guidelines.",
  "When the vibe is off, it is nearly impossible for me to be productive.",
  "I have a deep emotional connection to the code I write.",
  "I sometimes dream about code or solve problems in my sleep.",
  "I feel personally attacked when someone criticizes the 'vibe' of my code.",
  "My mood for the day is heavily influenced by how my coding sessions go.",
  "The feeling of code 'just clicking into place' is why I became a developer.",
  "I experience 'coder's block' that feels similar to writer's block.",
  "I would rather work on a technically simple project with a great vibe than a complex one with a bad vibe.",
  "I am at my happiest when I am deep in the 'coding zone'.",

  // --- Industry Perception & Future ---
  "'Vibe coding' is a skill that will become more valuable with the rise of AI coding assistants.",
  "The term 'vibe coding' is often used dismissively by 'serious' engineers.",
  "Startups are more likely to succeed with a vibe-driven engineering culture.",
  "AI coding assistants (like Copilot) disrupt a developer's natural coding vibe.",
  "As the software industry matures, there will be less room for vibe-driven development.",
  "Future programming languages will have features designed to enhance the coding 'vibe'.",
  "Interview processes should include exercises that test for 'vibe' and intuition.",
  "Bootcamps and universities should teach 'vibe coding' alongside data structures and algorithms.",
  "The '10x engineer' is simply a developer who is consistently in sync with their project's vibe.",
  "'Vibe coding' will always be a critical part of the craft of software development.",
];

/**
 * Creates a sample survey about Vibe Coding using the LikertSurveyConcept.
 */
async function createVibeCodingSurvey() {
  const [db, client]: [Db, MongoClient] = await getDb();
  try {
    console.log("Database connection established.");
    const surveyConcept = new LikertSurveyConcept(db);
    const owner = "Alice" as ID;
    const title = "Vibe Coding Sentiment Analysis";

    console.log(`Creating survey titled: "${title}" for owner: ${owner}...`);

    const createSurveyResult = await surveyConcept.createSurvey({ title, owner });

    if ("error" in createSurveyResult) {
      console.error("Failed to create survey:", createSurveyResult.error);
      return;
    }

    const { survey: surveyId } = createSurveyResult;
    console.log(`Survey created successfully! ID: ${surveyId}`);
    console.log("Adding questions to the survey...");

    let questionCount = 0;
    for (const stem of vibeCodingQuestions) {
      const addQuestionResult = await surveyConcept.addQuestion({
        stem,
        survey: surveyId,
      });

      if ("error" in addQuestionResult) {
        console.error(
          `Failed to add question "${stem}":`,
          addQuestionResult.error,
        );
        // Continue to next question
      } else {
        questionCount++;
        if (questionCount % 10 === 0) {
          console.log(`Added ${questionCount} of ${vibeCodingQuestions.length} questions...`);
        }
      }
    }

    console.log(`\nFinished adding questions. Total questions added: ${questionCount}`);
    console.log("Vibe Coding survey creation complete.");
  } catch (e) {
    console.error("An unexpected error occurred:", e);
  } finally {
    await client.close();
    console.log("Database connection closed.");
  }
}

// Execute the script
createVibeCodingSurvey();
```

# fix error again: 

still getting an error:

[{
	"resource": "/Users/dnj/Repos/concept_backend_play/src/scripts/createVibeSurvey.ts",
	"owner": "_generated_diagnostic_collection_name_#0",
	"code": "2322",
	"severity": 8,
	"message": "Type '(Db | MongoClient)[]' is not assignable to type '[Db, MongoClient]'.\n  Target requires 2 element(s) but source may have fewer.",
	"source": "deno-ts",
	"startLineNumber": 113,
	"startColumn": 9,
	"endLineNumber": 113,
	"endColumn": 21,
	"origin": "extHost1"
}]


# response:

You are correct, my apologies. The previous fix attempted to solve the problem with a type *annotation*, but the error message indicates that the type returned by `getDb()` is not compatible. TypeScript is inferring a general array type `(Db | MongoClient)[]` instead of a specific tuple `[Db, MongoClient]`.

The correct solution is to use a type *assertion* (also known as a cast) to tell TypeScript that you, the developer, know the precise shape of the returned value. This directly resolves the error.

Here is the corrected file with the updated line:

# file: src/scripts/createVibeSurvey.ts

```typescript
import { Db, MongoClient } from "npm:mongodb";
import { getDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "@concepts/LikertSurvey/LikertSurveyConcept.ts";

/**
 * A list of ~100 Likert-scale questions about "vibe coding".
 * These questions explore the definition, process, tools, team dynamics, outcomes,
 * and personal feelings associated with this development approach.
 */
const vibeCodingQuestions = [
  // --- Definition & Understanding ---
  "I have a clear and consistent definition of 'vibe coding'.",
  "'Vibe coding' is primarily about intuition rather than formal logic.",
  "'Vibe coding' is just a modern term for 'hacking it until it works'.",
  "A project's success can be determined by the 'vibe' of its codebase.",
  "Understanding the 'vibe' of a legacy system is the first step to refactoring it.",
  "You can't teach 'vibe coding'; it's an innate skill.",
  "'Vibe coding' is the opposite of 'enterprise' software development.",
  "Gut feelings about code are usually correct.",
  "Code that 'feels right' is often high-quality code.",
  "'Vibe-driven development' is a legitimate software methodology.",
  "The term 'vibe coding' accurately captures a real phenomenon in software development.",
  "A good 'code vibe' is easily recognizable, even if it's hard to define.",
  "The 'vibe' of code is more about its structure and architecture than its syntax.",

  // --- Process & Methodology ---
  "My best code is written when I'm in a state of flow, or 'in the vibe'.",
  "Strict adherence to Agile or Scrum ceremonies hinders vibe-driven development.",
  "Refactoring based on 'code smells' is a form of vibe coding.",
  "I often start coding without a detailed plan, letting the 'vibe' guide the architecture.",
  "Test-Driven Development (TDD) is incompatible with vibe coding.",
  "The 'right' solution to a problem often reveals itself during the coding process, not before.",
  "I prefer to explore multiple solutions in code rather than on a whiteboard.",
  "When I get stuck, changing my physical environment helps reset my coding vibe.",
  "Pair programming is most effective when both developers share the same 'vibe'.",
  "I rely on the compiler and linter to handle the details so I can focus on the vibe.",
  "Timeboxing tasks is counterproductive to achieving a good coding vibe.",
  "A period of unstructured 'tinkering' is essential for complex problem-solving.",

  // --- Tools & Environment ---
  "An aesthetically pleasing code editor and theme are essential for good vibes.",
  "The right background music significantly improves my coding productivity.",
  "Fast feedback loops (e.g., hot reloading, fast tests) are crucial for maintaining a good coding vibe.",
  "I am more productive when my physical workspace has the right 'vibe'.",
  "The choice of programming language heavily influences the 'vibe' of a project.",
  "A powerful and well-configured machine is critical for a smooth coding vibe.",
  "I feel a strong connection to my preferred set of development tools.",
  "Minimalist tooling and environments are more conducive to vibe coding than complex IDEs.",
  "A cluttered desktop or project directory negatively impacts my coding vibe.",
  "Mechanical keyboards with a satisfying sound/feel contribute to a better coding vibe.",
  "Good noise-canceling headphones are a requirement for entering the 'zone'.",
  "The font I use for coding has a measurable impact on my performance.",

  // --- Team Dynamics & Culture ---
  "A team that 'vibes' together codes better together.",
  "'Vibe coding' is an individual activity that is difficult to scale across a large team.",
  "Code reviews should assess the 'vibe' of the code, not just its functional correctness.",
  "It's more important for a new hire to match the team's 'vibe' than to have specific technical skills.",
  "Disagreements about architecture are often disagreements about 'vibe'.",
  "A team's 'vibe' is its most important asset.",
  "I can tell the 'vibe' of a team just by reading their code.",
  "Asynchronous communication (e.g., Slack, comments) is insufficient for establishing a shared team vibe.",
  "Onboarding a new developer is mostly about getting them in sync with the project's vibe.",
  "A 'vibe mismatch' is a valid reason for a developer not succeeding on a team.",
  "Humor and memes in team communication are vital for a positive coding vibe.",
  "Mandatory in-office days are bad for the development vibe.",

  // --- Outcomes & Quality ---
  "Code produced through 'vibe coding' is often more creative and innovative.",
  "Vibe-coded projects tend to accumulate more technical debt than rigorously planned projects.",
  "The user experience of a product is a direct reflection of the development team's vibe.",
  "Code that has a bad 'vibe' is more likely to contain bugs.",
  "Over-engineering is a sign of a lack of a clear 'vibe' for the project.",
  "The most elegant solutions come from vibe-driven exploration.",
  "Vibe-coded features are often harder for other developers to maintain.",
  "A consistent 'vibe' throughout the codebase is more important than following a strict style guide.",
  "The 'vibe' of the code directly impacts application performance.",
  "Products built with a good vibe feel more 'human' and are more enjoyable to use.",
  "Vibe coding is excellent for prototypes but unsustainable for long-term products.",
  "The 'bus factor' is higher on projects primarily driven by one person's 'vibe'.",

  // --- Personal Feelings & Identity ---
  "I proudly identify as a 'vibe-driven' developer.",
  "Feeling a good 'vibe' while coding is more important to me than following strict guidelines.",
  "When the vibe is off, it is nearly impossible for me to be productive.",
  "I have a deep emotional connection to the code I write.",
  "I sometimes dream about code or solve problems in my sleep.",
  "I feel personally attacked when someone criticizes the 'vibe' of my code.",
  "My mood for the day is heavily influenced by how my coding sessions go.",
  "The feeling of code 'just clicking into place' is why I became a developer.",
  "I experience 'coder's block' that feels similar to writer's block.",
  "I would rather work on a technically simple project with a great vibe than a complex one with a bad vibe.",
  "I am at my happiest when I am deep in the 'coding zone'.",

  // --- Industry Perception & Future ---
  "'Vibe coding' is a skill that will become more valuable with the rise of AI coding assistants.",
  "The term 'vibe coding' is often used dismissively by 'serious' engineers.",
  "Startups are more likely to succeed with a vibe-driven engineering culture.",
  "AI coding assistants (like Copilot) disrupt a developer's natural coding vibe.",
  "As the software industry matures, there will be less room for vibe-driven development.",
  "Future programming languages will have features designed to enhance the coding 'vibe'.",
  "Interview processes should include exercises that test for 'vibe' and intuition.",
  "Bootcamps and universities should teach 'vibe coding' alongside data structures and algorithms.",
  "The '10x engineer' is simply a developer who is consistently in sync with their project's vibe.",
  "'Vibe coding' will always be a critical part of the craft of software development.",
];

/**
 * Creates a sample survey about Vibe Coding using the LikertSurveyConcept.
 */
async function createVibeCodingSurvey() {
  const [db, client] = await getDb() as [Db, MongoClient];
  try {
    console.log("Database connection established.");
    const surveyConcept = new LikertSurveyConcept(db);
    const owner = "Alice" as ID;
    const title = "Vibe Coding Sentiment Analysis";

    console.log(`Creating survey titled: "${title}" for owner: ${owner}...`);

    const createSurveyResult = await surveyConcept.createSurvey({ title, owner });

    if ("error" in createSurveyResult) {
      console.error("Failed to create survey:", createSurveyResult.error);
      return;
    }

    const { survey: surveyId } = createSurveyResult;
    console.log(`Survey created successfully! ID: ${surveyId}`);
    console.log("Adding questions to the survey...");

    let questionCount = 0;
    for (const stem of vibeCodingQuestions) {
      const addQuestionResult = await surveyConcept.addQuestion({
        stem,
        survey: surveyId,
      });

      if ("error" in addQuestionResult) {
        console.error(
          `Failed to add question "${stem}":`,
          addQuestionResult.error,
        );
        // Continue to next question
      } else {
        questionCount++;
        if (questionCount % 10 === 0) {
          console.log(`Added ${questionCount} of ${vibeCodingQuestions.length} questions...`);
        }
      }
    }

    console.log(`\nFinished adding questions. Total questions added: ${questionCount}`);
    console.log("Vibe Coding survey creation complete.");
  } catch (e) {
    console.error("An unexpected error occurred:", e);
  } finally {
    await client.close();
    console.log("Database connection closed.");
  }
}

// Execute the script
createVibeCodingSurvey();
```