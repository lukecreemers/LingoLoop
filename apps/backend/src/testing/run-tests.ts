/**
 * Prompt Testing Runner
 *
 * Usage: npm run test:prompts -- fib
 */

import 'dotenv/config';
import { PromptTester, PromptTestConfig } from './prompt-tester';
import { FIB_TEST_CONFIG } from './cases/fill-in-blanks.cases';
import { WIB_TEST_CONFIG } from './cases/write-in-blanks.cases';
import { WMM_TEST_CONFIG } from './cases/word-meaning-match.cases';
import { TM_TEST_CONFIG } from './cases/translation-marking.cases';
import { TG_TEST_CONFIG } from './cases/translation-generation.cases';
import { SG_TEST_CONFIG } from './cases/story-generation.cases';

// ============================================================================
// REGISTER FEATURES HERE
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FEATURES: Record<string, PromptTestConfig<any, any>> = {
  fib: FIB_TEST_CONFIG,
  wib: WIB_TEST_CONFIG,
  wmm: WMM_TEST_CONFIG,
  tm: TM_TEST_CONFIG,
  tg: TG_TEST_CONFIG,
  sg: SG_TEST_CONFIG,
};

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const featureKey = process.argv[2];

  if (!featureKey || !FEATURES[featureKey]) {
    console.error('\n❌ Specify a feature:\n');
    console.log('   npm run test:prompts -- <feature>\n');
    console.log('Available:');
    Object.keys(FEATURES).forEach((f) => console.log(`   • ${f}`));
    console.log('');
    process.exit(1);
  }

  const tester = new PromptTester(FEATURES[featureKey]);
  await tester.run();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
