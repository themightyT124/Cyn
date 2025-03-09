import sys
import torch
from TTS.utils.synthesizer import Synthesizer
from pathlib import Path

def synthesize_text(model_path: str, text: str, output_path: str):
    try:
        # Initialize synthesizer with the trained model
        synthesizer = Synthesizer(
            model_path=str(Path(model_path) / "model.pth"),
            config_path=str(Path(model_path) / "config.json"),
        )
        
        # Generate speech
        wav = synthesizer.tts(text)
        
        # Save the audio
        synthesizer.save_wav(wav, output_path)
        print(f"Successfully synthesized text to {output_path}")
        
    except Exception as e:
        print(f"Error during synthesis: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: synthesize.py <model_dir> <text> <output_file>", file=sys.stderr)
        sys.exit(1)
        
    model_dir = sys.argv[1]
    text = sys.argv[2]
    output_file = sys.argv[3]
    
    synthesize_text(model_dir, text, output_file)
