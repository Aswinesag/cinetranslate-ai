# CineTranslate AI 🎬🧠

**CineTranslate AI** is an advanced voice-to-voice translation system capable of transcribing English speech and translating it into Malayalam with high accuracy. It leverages state-of-the-art AI models including **OpenAI Whisper** for transcription and a **LoRA fine-tuned M2M100** model for translation, wrapped in a modern, neon-themed React interface.

![CineTranslate UI](https://via.placeholder.com/800x450?text=CineTranslate+AI+Preview)

## 🚀 Key Features

-   **🎙️ Real-time Voice Translation**: Speak in English and get instant Malayalam translations.
-   **🧠 LoRA Fine-Tuned Model**: Uses a custom-trained Low-Rank Adaptation (LoRA) adapter on `facebook/m2m100_418M` for domain-specific translation accuracy.
-   **⚡ High Performance**: Optimized for CUDA-accelerated GPU inference.
-   **🎨 Modern Cyberpunk UI**: A stunning, responsive dark-mode interface built with React, TailwindCSS, and Framer Motion.
-   **🔊 Audio Visualization**: Real-time waveform feedback and interactive glowing elements.
-   **📂 Smart Audio Handling**: Prioritizes `WAV` format for lossless processing, with `FFmpeg` fallback for compatibility.

## 🛠️ Technical Architecture

The core pipeline consists of three stages:
1.  **Speech-to-Text (STT)**: `openai/whisper-base` converts input audio into English text.
2.  **Neural Machine Translation (NMT)**: The text is passed through a **LoRA-fine-tuned M2M100** model to generate Malayalam text.
3.  **Frontend Display**: The results are streamed to the React frontend.

### 🧠 LoRA Fine-Tuning Details
We fine-tuned the massive **M2M100 (418M)** model using **PEFT (Parameter-Efficient Fine-Tuning)** techniques to achieve high performance with lower resource usage.

-   **Base Model**: `facebook/m2m100_418M`
-   **Method**: LoRA (Low-Rank Adaptation)
-   **Rank (r)**: 8
-   **Alpha**: 16
-   **Dropout**: 0.05
-   **Target Modules**: `q_proj`, `v_proj` (Attention layers)
-   **Dataset**: Specialized English-Malayalam subtitle pairs.

## 💻 Tech Stack

-   **Frontend**: React, Vite, TailwindCSS v4, Framer Motion, Lucide React.
-   **Backend**: FastAPI, Uvicorn.
-   **AI/ML**: PyTorch, Hugging Face Transformers, PEFT, OpenAI Whisper.
-   **Audio**: SoundFile, FFmpeg, NumPy.

## Setup

```bash
git clone https://github.com/your-username/CineTranslate-AI.git
cd CineTranslate-AI
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt