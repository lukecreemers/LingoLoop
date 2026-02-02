import { Injectable, Logger } from '@nestjs/common';
import {
  TTSRequest,
  KokoroSpeechRequest,
  KokoroVoice,
  AudioFormat,
} from '../../shared/types/tts.types';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly kokoroBaseUrl: string;

  constructor() {
    // Kokoro-FastAPI default port is 8880
    this.kokoroBaseUrl = process.env.KOKORO_TTS_URL || 'http://localhost:8880';
  }

  /**
   * Generate speech from text using Kokoro TTS
   * Returns the audio as a Buffer
   */
  async generateSpeech(request: TTSRequest): Promise<Buffer> {
    const voice: KokoroVoice = request.voice || 'af_bella';
    const speed = request.speed || 1.0;
    const format: AudioFormat = request.format || 'mp3';

    const kokoroRequest: KokoroSpeechRequest = {
      model: 'kokoro',
      input: request.text,
      voice,
      speed,
      response_format: format,
      stream: false,
    };

    this.logger.debug(`Generating speech for: "${request.text.slice(0, 50)}..."`);

    const response = await fetch(`${this.kokoroBaseUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(kokoroRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Kokoro TTS error: ${response.status} - ${errorText}`);
      throw new Error(`TTS generation failed: ${response.status} ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Stream speech generation (returns a ReadableStream)
   */
  async generateSpeechStream(request: TTSRequest): Promise<ReadableStream<Uint8Array>> {
    const voice: KokoroVoice = request.voice || 'af_bella';
    const speed = request.speed || 1.0;
    const format: AudioFormat = request.format || 'mp3';

    const kokoroRequest: KokoroSpeechRequest = {
      model: 'kokoro',
      input: request.text,
      voice,
      speed,
      response_format: format,
      stream: true,
    };

    this.logger.debug(`Streaming speech for: "${request.text.slice(0, 50)}..."`);

    const response = await fetch(`${this.kokoroBaseUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(kokoroRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Kokoro TTS error: ${response.status} - ${errorText}`);
      throw new Error(`TTS generation failed: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    return response.body;
  }

  /**
   * Get available voices from Kokoro
   */
  async getVoices(): Promise<string[]> {
    try {
      const response = await fetch(`${this.kokoroBaseUrl}/v1/audio/voices`);
      if (!response.ok) {
        this.logger.warn('Could not fetch voices, returning defaults');
        return this.getDefaultVoices();
      }
      const data = await response.json();
      return data.voices || this.getDefaultVoices();
    } catch {
      this.logger.warn('Could not fetch voices, returning defaults');
      return this.getDefaultVoices();
    }
  }

  private getDefaultVoices(): string[] {
    return [
      'af_bella',
      'af_nicole',
      'af_sarah',
      'af_sky',
      'af',
      'am_adam',
      'am_michael',
      'bf_emma',
      'bf_isabella',
      'bm_george',
      'bm_lewis',
    ];
  }

  /**
   * Health check for Kokoro service
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.kokoroBaseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}



