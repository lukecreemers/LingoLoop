/**
 * TTS (Text-to-Speech) types for Kokoro-FastAPI integration
 * @see https://github.com/remsky/Kokoro-FastAPI
 */

// Available Kokoro voices
export type KokoroVoice =
  | 'af_bella'
  | 'af_nicole'
  | 'af_sarah'
  | 'af_sky'
  | 'af'
  | 'am_adam'
  | 'am_michael'
  | 'bf_emma'
  | 'bf_isabella'
  | 'bm_george'
  | 'bm_lewis';

// Supported audio formats
export type AudioFormat = 'mp3' | 'wav' | 'opus' | 'flac' | 'aac' | 'pcm';

// Request to generate speech
export interface TTSRequest {
  /** Text to convert to speech */
  text: string;
  /** Voice to use (default: af_bella) */
  voice?: KokoroVoice;
  /** Speech speed multiplier (default: 1.0) */
  speed?: number;
  /** Output format (default: mp3) */
  format?: AudioFormat;
  /** Whether to stream the response */
  stream?: boolean;
}

// Internal request format for Kokoro API (OpenAI-compatible)
export interface KokoroSpeechRequest {
  model: 'kokoro';
  input: string;
  voice: string;
  speed?: number;
  response_format?: AudioFormat;
  stream?: boolean;
}

// Response with word-level timestamps (from /dev/captioned_speech)
export interface CaptionedSpeechResponse {
  audio: string; // base64 encoded
  timestamps: WordTimestamp[];
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}



