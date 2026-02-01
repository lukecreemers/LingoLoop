export type ModelConfig = {
  provider: 'anthropic' | 'openai' | 'deepseek' | 'google';
  model: string;
  temperature?: number;
};
