/**
 * FakeYou API Client
 * Handles communication with FakeYou's voice synthesis service
 */

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

export class FakeYouClient {
  private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
    try {
      const response = await fetch(`${FAKEYOU_API_BASE}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('FakeYou API error:', error);
      throw error;
    }
  }

  async requestTTS(text: string): Promise<TtsRequestResult> {
    try {
      const response = await this.makeRequest('/tts/inference', 'POST', {
        tts_model_token: FAKEYOU_MODEL_TOKEN,
        inference_text: text,
      });

      if (response.success) {
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

      if (response.success) {
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
      // Convert audio to base64
      const buffer = await audioBlob.arrayBuffer();
      const base64Audio = Buffer.from(buffer).toString('base64');

      const response = await this.makeRequest('/tts/voice-conversion', 'POST', {
        tts_model_token: FAKEYOU_MODEL_TOKEN,
        audio_base64: base64Audio,
      });

      if (response.success) {
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
}

export const fakeyouClient = new FakeYouClient();
