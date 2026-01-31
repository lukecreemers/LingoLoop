import { ChatAnthropic } from '@langchain/anthropic';
import { FIBOutput, FIBOutputSchema } from '../../shared';
import { Injectable } from '@nestjs/common';

const testPrompt = `Create a "Fill in the Blank" exercise for a beginner-to-intermediate Spanish student.

Topic: Irregular Present Tense Verbs (e.g., tener, ir, hacer, ser).
Requirement: The sentence should be a natural, conversational sentence. It must contain exactly 2 blanks.
Distractors: Provide 4 distractor words. These should be "near-misses"—like the same verb conjugated for the wrong person, or a similar-sounding verb.
Non fill in blank words to potentially include in sentence: Desarrollar, Alrededor, Aprovechar, Cotidiano, Soportar, Rio, Bosque, Actual, Extraño.
Try and use atleast one of these words maybe more, but only if they fit naturally.


Output Format: You must return a JSON object that strictly adheres to the following structure:

instruction: A short instruction in English.

segments: An array of text and blank objects.

distractors: An array of 4 incorrect strings.

fullSentence: The full sentence with the blanks filled in.

hint: A brief clue about the verbs being used.`;

@Injectable()
export class FillInBlanksService {
  private llm: ChatAnthropic;

  constructor() {
    this.llm = new ChatAnthropic({
      model: 'claude-3-5-haiku-latest',
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async createQuestion(): Promise<FIBOutput> {
    const structuredLlm = this.llm.withStructuredOutput(FIBOutputSchema);
    const response = await structuredLlm.invoke(testPrompt);
    return response;
  }
}
