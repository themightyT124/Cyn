import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fakeyouClient } from "@/lib/fakeyou-client";

interface TTSButtonProps {
  text: string;
  className?: string;
}

export function TTSButton({ text, className }: TTSButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      // Request TTS generation
      const ttsRequest = await fakeyouClient.requestTTS(text);

      if (!ttsRequest.success || !ttsRequest.inference_job_token) {
        throw new Error(ttsRequest.error || 'Failed to start TTS generation');
      }

      // Poll for completion
      const checkStatus = async (jobToken: string) => {
        const status = await fakeyouClient.getTTSStatus(jobToken);

        if (status.success && status.status === 'complete' && status.audio_url) {
          // Create and play audio
          if (audioRef.current) {
            audioRef.current.pause();
          }

          const audio = new Audio(status.audio_url);
          audioRef.current = audio;

          audio.onplay = () => setIsPlaying(true);
          audio.onended = () => setIsPlaying(false);
          audio.onerror = () => {
            setIsPlaying(false);
            toast({
              title: "Playback Error",
              description: "Failed to play the generated audio.",
              variant: "destructive"
            });
          };

          await audio.play();
          setIsLoading(false);
        } else if (status.status === 'pending') {
          // Check again in 1 second
          setTimeout(() => checkStatus(jobToken), 1000);
        } else {
          throw new Error(status.error || 'Failed to generate audio');
        }
      };

      await checkStatus(ttsRequest.inference_job_token);
    } catch (error) {
      console.error("TTS error:", error);
      setIsLoading(false);
      setIsPlaying(false);
      toast({
        title: "Speech Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate speech.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={handlePlay}
      title={isPlaying ? "Stop speaking" : "Speak text"}
      disabled={!text || isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Volume2 className={`h-4 w-4 ${isPlaying ? 'text-green-500' : ''}`} />
      )}
    </Button>
  );
}