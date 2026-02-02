import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as express from 'express';
import { TtsService } from './tts.service';
import { TTSRequestDto } from '../../shared/types/tts.dto';
import type { AudioFormat } from '../../shared/types/tts.types';

@Controller('tts')
export class TtsController {
  private readonly logger = new Logger(TtsController.name);

  constructor(private readonly ttsService: TtsService) {}

  /**
   * Generate speech from text
   * POST /tts/speech
   */
  @Post('speech')
  async generateSpeech(
    @Body() request: TTSRequestDto,
    @Res() res: express.Response,
  ): Promise<void> {
    if (!request.text || request.text.trim().length === 0) {
      throw new HttpException('Text is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const format: AudioFormat = request.format || 'mp3';
      const contentType = this.getContentType(format);

      const audioBuffer = await this.ttsService.generateSpeech(request);

      res.set({
        'Content-Type': contentType,
        'Content-Length': audioBuffer.length,
        'Cache-Control': 'no-cache',
      });

      res.send(audioBuffer);
    } catch (error) {
      this.logger.error(`Speech generation failed: ${error}`);
      throw new HttpException(
        `Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get available voices
   * GET /tts/voices
   */
  @Get('voices')
  async getVoices(): Promise<{ voices: string[] }> {
    const voices = await this.ttsService.getVoices();
    return { voices };
  }

  /**
   * Health check for TTS service
   * GET /tts/health
   */
  @Get('health')
  async healthCheck(): Promise<{ status: string; kokoroAvailable: boolean }> {
    const kokoroAvailable = await this.ttsService.isHealthy();
    return {
      status: kokoroAvailable ? 'ok' : 'degraded',
      kokoroAvailable,
    };
  }

  private getContentType(format: AudioFormat): string {
    const contentTypes: Record<AudioFormat, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      opus: 'audio/opus',
      flac: 'audio/flac',
      aac: 'audio/aac',
      pcm: 'audio/pcm',
    };
    return contentTypes[format] || 'audio/mpeg';
  }
}
