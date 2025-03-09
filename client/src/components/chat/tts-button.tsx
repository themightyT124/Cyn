import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TTSButtonProps {
  text: string;
  className?: string;
}

export function TTSButton({ text, className }: TTSButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synth = window.speechSynthesis;

  const handlePlay = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      synth.cancel();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      // First try custom voice synthesis
      const voiceId = 'default-voice';
      const response = await fetch(`/api/voice/${voiceId}/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        if (audioBlob.size > 0) {
          // Use custom voice
          const audioUrl = URL.createObjectURL(audioBlob);
          if (audioRef.current) {
            audioRef.current.pause();
            URL.revokeObjectURL(audioRef.current.src);
          }

          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          audio.onplay = () => setIsPlaying(true);
          audio.onended = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
          };
          audio.onerror = () => {
            console.error("Custom voice playback failed, falling back to Web Speech API");
            useBrowserTTS();
          };

          await audio.play();
          setIsLoading(false);
          return;
        }
      }

      // Fall back to Web Speech API
      useBrowserTTS();
    } catch (error) {
      console.error("TTS error:", error);
      // Fall back to Web Speech API
      useBrowserTTS();
    }
  };

  const useBrowserTTS = () => {
    try {
      if (!synth) {
        throw new Error("Browser does not support speech synthesis");
      }

      synth.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsPlaying(false);
        setIsLoading(false);
        toast({
          title: "Speech Generation Failed",
          description: "Could not generate speech. Please try again.",
          variant: "destructive"
        });
      };

      synth.speak(utterance);
    } catch (error) {
      console.error("Browser TTS error:", error);
      setIsLoading(false);
      setIsPlaying(false);
      toast({
        title: "Speech Generation Failed",
        description: "Speech synthesis is not supported in your browser.",
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