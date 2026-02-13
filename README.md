# CineTranslate AI 🎬🧠

AI-powered video subtitle translation system using:
- Whisper (speech-to-text)
- Transformers (NMT)
- LoRA fine-tuning
- CUDA acceleration

## Features
- Subtitle translation
- Custom LoRA fine-tuned model
- GPU inference
- Modular pipeline (STT → Translate → Subtitles)

## Setup

```bash
git clone https://github.com/your-username/CineTranslate-AI.git
cd CineTranslate-AI
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt