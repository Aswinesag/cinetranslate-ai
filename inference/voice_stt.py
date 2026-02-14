import torch
import sounddevice as sd
import numpy as np
import whisper
from transformers import M2M100Tokenizer, M2M100ForConditionalGeneration, AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel

# ---------------- CONFIG ----------------
BASE_MODEL = "facebook/m2m100_418M"
LORA_PATH = "checkpoints/lora_subtitles"
SAMPLE_RATE = 16000
DURATION = 5  # seconds per recording
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
# --------------------------------------

whisper_model = None
tokenizer = None
model = None


def load_models():
    global whisper_model, tokenizer, model

    print(f"🔥 Loading Whisper model on: {DEVICE}")
    whisper_model = whisper.load_model("base", device=DEVICE)

    print("🔥 Loading translation model with LoRA...")
    tokenizer = M2M100Tokenizer.from_pretrained(BASE_MODEL)

    base_model = M2M100ForConditionalGeneration.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
        device_map="auto"
    )

    try:
        model = PeftModel.from_pretrained(base_model, LORA_PATH)
        print("✅ LoRA adapter loaded successfully.")
    except Exception as e:
        print(f"⚠️ LoRA adapter not found, using base model: {e}")
        model = base_model
    model.eval()

    print("✅ Models loaded successfully.")


def record_audio(duration=DURATION, sample_rate=SAMPLE_RATE):
    print("🎙️ Listening... Speak now")
    audio = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype="float32")
    sd.wait()
    return audio.flatten()


def transcribe_whisper(audio_np):
    audio_np = audio_np.astype(np.float32)   # ✅ FIX: ensure float32
    audio_np = whisper.pad_or_trim(audio_np)
    mel = whisper.log_mel_spectrogram(audio_np).to(DEVICE)

    options = whisper.DecodingOptions(fp16=(DEVICE == "cuda"))
    result = whisper.decode(whisper_model, mel, options)
    return result.text.strip()


def translate_to_malayalam(text: str) -> str:
    inputs = tokenizer(text, return_tensors="pt").to(DEVICE)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            forced_bos_token_id=tokenizer.get_lang_id("ml"),
            max_new_tokens=128
        )

    translated = tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]
    return translated


def voice_translate_once():
    audio = record_audio()
    print("📝 Transcribing...")
    text = transcribe_whisper(audio)

    if not text:
        return None, None

    translated = translate_to_malayalam(text)

    if DEVICE == "cuda":
        torch.cuda.empty_cache()

    return text, translated


def main():
    load_models()
    print("\n🎧 Speak in English. Press Ctrl+C to stop.\n")

    try:
        while True:
            eng, mal = voice_translate_once()

            if not eng:
                print("⚠️ No speech detected.\n")
                continue

            print(f"🗣️ You said: {eng}")
            print(f"🌍 Malayalam: {mal}\n")

    except KeyboardInterrupt:
        print("\n🛑 Stopped by user. Bye!")


if __name__ == "__main__":
    main()