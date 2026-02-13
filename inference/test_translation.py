import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, BitsAndBytesConfig
from peft import PeftModel

base_model = "facebook/m2m100_418M"
lora_path = "checkpoints/lora_subtitles"

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.float16,
)

tokenizer = AutoTokenizer.from_pretrained(base_model)

model = AutoModelForSeq2SeqLM.from_pretrained(
    base_model,
    quantization_config=bnb_config,
    device_map="auto"
)

model = PeftModel.from_pretrained(model, lora_path)
model.eval()

tokenizer.src_lang = "en"
tokenizer.tgt_lang = "ml"

text = "I will come tomorrow."

inputs = tokenizer(text, return_tensors="pt").to(model.device)

with torch.no_grad():
    out = model.generate(**inputs, max_new_tokens=64)

print(tokenizer.decode(out[0], skip_special_tokens=True))