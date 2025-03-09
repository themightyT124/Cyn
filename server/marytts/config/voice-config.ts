/**
 * MaryTTS Voice Configuration
 * Handles voice training settings and parameters
 */

export interface VoiceTrainingConfig {
  // Voice identification
  voiceId: string;
  name: string;
  description?: string;
  
  // Training parameters
  samplingRate: number;
  frameSize: number;
  hopSize: number;
  
  // Feature extraction
  features: {
    useMfcc: boolean;
    useF0: boolean;
    useProsody: boolean;
  };
  
  // Training settings
  epochs: number;
  batchSize: number;
  learningRate: number;
}

export const defaultVoiceConfig: VoiceTrainingConfig = {
  voiceId: "custom_voice_1",
  name: "Custom Voice",
  description: "Custom trained voice model",
  samplingRate: 22050,
  frameSize: 1024,
  hopSize: 256,
  features: {
    useMfcc: true,
    useF0: true,
    useProsody: true
  },
  epochs: 100,
  batchSize: 32,
  learningRate: 0.001
};

export function validateConfig(config: Partial<VoiceTrainingConfig>): VoiceTrainingConfig {
  return {
    ...defaultVoiceConfig,
    ...config
  };
}
