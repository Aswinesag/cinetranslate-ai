import pyttsx3

engine = pyttsx3.init(driverName="sapi5")

def speak(text, lang="ml"):
    print("🗣 Speaking Malayalam...")

    voices = engine.getProperty("voices")

    selected_voice = None
    for voice in voices:
        if "malayalam" in voice.name.lower() or "india" in voice.name.lower():
            selected_voice = voice.id
            break

    if selected_voice:
        engine.setProperty("voice", selected_voice)
    else:
        print("⚠ Malayalam voice not found. Using default voice.")

    engine.setProperty("rate", 165)
    engine.setProperty("volume", 1.0)

    engine.say(text)
    engine.runAndWait()


if __name__ == "__main__":
    speak("നാളെ ഞാൻ വരും.")