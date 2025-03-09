import fetch from 'node-fetch';

const FAKEYOU_MODEL_TOKEN = 'r9kwfebrn3fh4p8p835bck6dw';
const FAKEYOU_API_BASE = 'https://api.fakeyou.com/v1';

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
  inference_job_token?: string;
  state?: {
    status: 'pending' | 'complete' | 'error';
    maybe_public_bucket_wav_audio_path?: string;
  };
  error?: string;
}

class FakeYouClient {
  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<FakeYouResponse> {
    try {
      const response = await fetch(`${FAKEYOU_API_BASE}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
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

  async convertSpeechToSpeech(audioBlob: Buffer): Promise<TtsRequestResult> {
    try {
      // Convert buffer to base64
      const base64Audio = audioBlob.toString('base64');

      const response = await this.makeRequest('/tts/voice-conversion', 'POST', {
        tts_model_token: FAKEYOU_MODEL_TOKEN,
        audio_base64: base64Audio,
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
        error: error instanceof Error ? error.message : 'Failed to convert speech',
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
}

export default new FakeYouClient();
