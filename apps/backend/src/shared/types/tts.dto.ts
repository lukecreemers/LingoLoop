import type { KokoroVoice, AudioFormat } from './tts.types';

export class TTSRequestDto {
  text!: string;
  voice?: KokoroVoice;
  speed?: number;
  format?: AudioFormat;
  stream?: boolean;
}



