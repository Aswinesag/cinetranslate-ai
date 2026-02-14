import os
import tempfile
import numpy as np
import soundfile as sf
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import sys

from inference.voice_stt import load_models, transcribe_whisper, translate_to_malayalam

app = FastAPI(title="CineTranslate AI - Voice API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change later for prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    load_models()


@app.post("/voice-translate")
async def voice_translate(file: UploadFile = File(...)):
    try:
        # Read the uploaded file
        audio_data = await file.read()
        
        # Save to temporary file
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name
        
        wav_path = None
        try:
            # Try to read with soundfile first
            try:
                audio_np, sr = sf.read(tmp_path)
            except Exception as e:
                print(f"soundfile error: {e}, trying ffmpeg conversion")
                
                # If soundfile fails, try converting with ffmpeg
                wav_path = tmp_path.replace(suffix, '.wav')
                try:
                    # Use ffmpeg to convert to wav
                    subprocess.run([
                        'ffmpeg', '-i', tmp_path, 
                        '-ar', '16000',  # Sample rate 16kHz
                        '-ac', '1',      # Mono
                        '-y',            # Overwrite output
                        wav_path
                    ], check=True, capture_output=True)
                    
                    # Read the converted wav file
                    audio_np, sr = sf.read(wav_path)
                except subprocess.CalledProcessError as ffmpeg_error:
                    print(f"ffmpeg error: {ffmpeg_error}")
                    return {
                        "english": "Error: Audio conversion failed. Please try recording again.",
                        "malayalam": "ദയവായി വീണ്ടും റെക്കോർഡ് ചെയ്യുക"
                    }
                except FileNotFoundError:
                    print("ffmpeg not found")
                    return {
                        "english": "Error: Audio processing not available. Please install ffmpeg.",
                        "malayalam": "ഓഡിയോ പ്രോസസ്സിംഗ് ലഭ്യമല്ല. ffmpeg ഇൻസ്റ്റാൾ ചെയ്യുക."
                    }

        finally:
            # Clean up temporary files
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            if wav_path and os.path.exists(wav_path):
                os.remove(wav_path)

        # Convert to mono if needed
        if audio_np.ndim > 1:
            audio_np = np.mean(audio_np, axis=1)

        # Resample to 16kHz if needed (Whisper expects 16kHz)
        if sr != 16000:
            try:
                from scipy import signal
                resampled_length = int(len(audio_np) * 16000 / sr)
                audio_np = signal.resample(audio_np, resampled_length)
            except ImportError:
                # Simple linear interpolation if scipy is not available
                import numpy as np
                x_old = np.linspace(0, 1, len(audio_np))
                x_new = np.linspace(0, 1, int(len(audio_np) * 16000 / sr))
                audio_np = np.interp(x_new, x_old, audio_np)

        # Process with Whisper and translation model
        english_text = transcribe_whisper(audio_np)
        malayalam_text = translate_to_malayalam(english_text)

        return {
            "english": english_text,
            "malayalam": malayalam_text
        }
    
    except Exception as e:
        print(f"Error processing audio: {e}")
        return {
            "english": f"Error: {str(e)}",
            "malayalam": "ദയവായി വീണ്ടും ശ്രമിക്കുക"
        }