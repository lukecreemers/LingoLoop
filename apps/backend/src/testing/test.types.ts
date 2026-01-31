export type ModelConfig = {
  provider: 'anthropic' | 'openai' | 'deepseek';
  model: string;
  temperature?: number;
};
