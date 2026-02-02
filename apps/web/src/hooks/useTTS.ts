import { useRef, useCallback, useState } from "react";

// Voice assignments based on gender/age
// Using: ef_dora (female), em_alex (male), em_santa (elderly male)
export type TTSVoice =
  | "ef_dora"
  | "em_alex"
  | "em_santa"
  | "af_bella"
  | "am_adam";

interface TTSOptions {
  voice?: TTSVoice;
  speed?: number;
  format?: "mp3" | "wav";
}

interface UseTTSReturn {
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

// Cache for audio blobs to avoid re-fetching
const audioCache = new Map<string, Blob>();

function getCacheKey(text: string, voice: string): string {
  return `${voice}:${text}`;
}

export function useTTS(): UseTTSReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const speakIdRef = useRef(0); // Track which speak call is active

  const stop = useCallback(() => {
    // Abort any pending fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Stop and cleanup audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(
    async (text: string, options: TTSOptions = {}) => {
      const voice = options.voice || "ef_dora";
      const speed = options.speed || 1.0;
      const format = options.format || "mp3";

      // Stop any currently playing audio
      stop();
      setError(null);

      // Track this speak call
      const currentSpeakId = ++speakIdRef.current;

      const cacheKey = getCacheKey(text, voice);

      try {
        setIsLoading(true);

        let audioBlob: Blob;

        // Check cache first
        if (audioCache.has(cacheKey)) {
          audioBlob = audioCache.get(cacheKey)!;
        } else {
          // Create abort controller for this request
          abortControllerRef.current = new AbortController();

          // Fetch from API
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/tts/speech`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text,
                voice,
                speed,
                format,
              }),
              signal: abortControllerRef.current.signal,
            }
          );

          // Check if this speak call is still active
          if (currentSpeakId !== speakIdRef.current) {
            return; // A newer speak call has started
          }

          if (!response.ok) {
            throw new Error(`TTS failed: ${response.status}`);
          }

          audioBlob = await response.blob();
          audioCache.set(cacheKey, audioBlob);
        }

        // Check again if this speak call is still active
        if (currentSpeakId !== speakIdRef.current) {
          return;
        }

        setIsLoading(false);

        // Create audio element and play
        const url = URL.createObjectURL(audioBlob);
        currentUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          if (currentSpeakId === speakIdRef.current) {
            setIsPlaying(false);
          }
          if (currentUrlRef.current === url) {
            URL.revokeObjectURL(url);
            currentUrlRef.current = null;
          }
        };

        audio.onerror = () => {
          if (currentSpeakId === speakIdRef.current) {
            setError("Failed to play audio");
            setIsPlaying(false);
          }
        };

        setIsPlaying(true);
        await audio.play();
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        if (currentSpeakId === speakIdRef.current) {
          setIsLoading(false);
          setIsPlaying(false);
          setError(err instanceof Error ? err.message : "TTS failed");
          console.error("TTS error:", err);
        }
      }
    },
    [stop]
  );

  return { speak, stop, isPlaying, isLoading, error };
}

// Helper to determine voice based on character attributes
export function getVoiceForCharacter(character: {
  gender: "male" | "female" | "other";
  age: "child" | "teen" | "adult" | "elderly";
}): TTSVoice {
  // User's preferred voices: ef_dora, em_alex, em_santa
  if (character.gender === "female") {
    return "ef_dora";
  }

  if (character.gender === "male") {
    if (character.age === "elderly") {
      return "em_santa";
    }
    return "em_alex";
  }

  // 'other' gender - alternate between voices
  return "ef_dora";
}

// Check if audio is already cached
export function isAudioCached(text: string, voice: TTSVoice): boolean {
  return audioCache.has(getCacheKey(text, voice));
}

// Preload TTS for messages with progress callback
export async function preloadTTS(
  messages: { text: string; voice: TTSVoice }[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  
  // Filter out already cached messages
  const toLoad = messages.filter(
    ({ text, voice }) => !audioCache.has(getCacheKey(text, voice))
  );
  
  if (toLoad.length === 0) {
    onProgress?.(messages.length, messages.length);
    return;
  }

  let loaded = messages.length - toLoad.length;
  onProgress?.(loaded, messages.length);

  // Load all in parallel
  await Promise.allSettled(
    toLoad.map(async ({ text, voice }) => {
      const cacheKey = getCacheKey(text, voice);
      
      try {
        const response = await fetch(`${apiUrl}/tts/speech`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice, speed: 1.0, format: "mp3" }),
        });

        if (response.ok) {
          const blob = await response.blob();
          audioCache.set(cacheKey, blob);
          loaded++;
          onProgress?.(loaded, messages.length);
        }
      } catch {
        // Silently fail preload but still count as processed
        loaded++;
        onProgress?.(loaded, messages.length);
      }
    })
  );
}

