/**
 * FakeYou API Client
 * Handles communication with FakeYou's voice synthesis service
 */

const FAKEYOU_MODEL_TOKEN = 'r9kwfebrn3fh4p8p835bck6dw';

interface TtsRequestResult {
  success: boolean;
  inference_job_token?: string;
  error?: string;
}

interface TtsStatusResult {
  success: boolean;
  status: 'pending' | 'complete' | 'error';
  audio_url?: string;
  error?: string;
}

interface FakeYouResponse {
  success: boolean;
  status: string;
  inference_job_token?: string;
  jobToken?: string; // Added to handle potential inconsistencies
  state?: {
    status: 'pending' | 'complete' | 'error';
    maybe_public_bucket_wav_audio_path?: string;
  };
  error?: string;
}

class FakeYouClient {
  private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
    try {
      const response = await fetch(`/api/fakeyou${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as FakeYouResponse;
      return data;
    } catch (error) {
      console.error('FakeYou API error:', error);
      throw error;
    }
  }

  async requestTTS(text: string): Promise<TtsRequestResult> {
    try {
      const response = await this.makeRequest('/tts/inference', 'POST', {
        text,
        model_token: FAKEYOU_MODEL_TOKEN,
      });

      if (response.success && response.inference_job_token) {
        return {
          success: true,
          inference_job_token: response.inference_job_token,
        };
      }

      return {
        success: false,
        error: response.error || 'Unknown error occurred',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to request TTS',
      };
    }
  }

  async getTTSStatus(jobToken: string): Promise<TtsStatusResult> {
    try {
      const response = await this.makeRequest(`/tts/job/${jobToken}`);

      if (response.success && response.state) {
        return {
          success: true,
          status: response.state.status,
          audio_url: response.state.maybe_public_bucket_wav_audio_path,
        };
      }

      return {
        success: false,
        status: 'error',
        error: response.error || 'Unknown error occurred',
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to get TTS status',
      };
    }
  }

  async convertSpeechToSpeech(audioBlob: Blob): Promise<TtsRequestResult> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('model_token', FAKEYOU_MODEL_TOKEN);

      const response = await fetch('/api/speech-to-speech', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as FakeYouResponse;

      if (data.success) {
        return {
          success: true,
          inference_job_token: data.jobToken || data.inference_job_token, // Handle potential variations in response
        };
      }

      return {
        success: false,
        error: data.error || 'Unknown error occurred',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to convert speech',
      };
    }
  }
}

export const fakeyouClient = new FakeYouClient();