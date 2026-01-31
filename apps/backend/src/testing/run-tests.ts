/**
 * Prompt Testing Runner
 *
 * Usage: npm run test:prompts -- fib
 */

import 'dotenv/config';
import { PromptTester } from './prompt-tester';
import { FIB_TEST_CONFIG } from './cases/fill-in-blanks.cases';

// ============================================================================
// REGISTER FEATURES HERE
// ============================================================================

const FEATURES = {
  fib: FIB_TEST_CONFIG,
  // Add more:
  // listening: LISTENING_TEST_CONFIG,
};

type FeatureKey = keyof typeof FEATURES;

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const featureKey = process.argv[2] as FeatureKey;

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
