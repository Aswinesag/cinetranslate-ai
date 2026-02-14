import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel

BASE_MODEL = "google/mt5-small"   # or your actual base model
LORA_PATH = "checkpoints/lora_subtitles"

device = "cuda" if torch.cuda.is_available() else "cpu"

tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
base_model = AutoModelForSeq2SeqLM.from_pretrained(
    BASE_MODEL,
    device_map="auto",
    torch_dtype=torch.float16 if device == "cuda" else torch.float32
)

model = PeftModel.from_pretrained(base_model, LORA_PATH)
model.eval()

def translate_en_to_ml(text: str) -> str:
    inputs = tokenizer(text, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=128
        )

    return tokenizer.decode(outputs[0], skip_special_tokens=True)


if __name__ == "__main__":
    while True:
        text = input("Enter English: ")
        print("Malayalam:", translate_en_to_ml(text))