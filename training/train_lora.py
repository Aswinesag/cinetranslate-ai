import torch
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, DataCollatorForSeq2Seq, Trainer, TrainingArguments
from peft import LoraConfig, get_peft_model, TaskType

MODEL_NAME = "facebook/m2m100_418M"
DATA_PATH = "data/subtitles/en_ml_subtitles.txt"

#Load dataset from txt
def load_pairs(path):
    src, tgt = [], []
    with open(path, encoding="utf-8") as f:
        for line in f:
            en, ml = line.strip().split("\t")
            src.append(en)
            tgt.append(ml)
    return {"translation": [{"en": s, "ml": t} for s, t in zip(src, tgt)]}

data = load_pairs(DATA_PATH)

#Convert to HF dataset
from datasets import Dataset
dataset = Dataset.from_list(data["translation"]).train_test_split(test_size=0.05)
from transformers import M2M100Tokenizer

tokenizer = M2M100Tokenizer.from_pretrained(MODEL_NAME)
tokenizer.src_lang = "en"
tokenizer.tgt_lang = "ml"
model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16,
    device_map="auto"
)

# Apply LoRA
lora_config = LoraConfig(
    task_type=TaskType.SEQ_2_SEQ_LM,
    r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    target_modules=["q_proj", "v_proj"]
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

def preprocess(batch):
    inputs = tokenizer(
        batch["en"],
        truncation=True,
        padding="max_length",
        max_length=128
    )

    labels = tokenizer(
        text_target=batch["ml"],
        truncation=True,
        padding="max_length",
        max_length=128
    )

    inputs["labels"] = labels["input_ids"]
    return inputs

tokenized = dataset.map(preprocess, batched=True, remove_columns=["en", "ml"])

args = TrainingArguments(
    output_dir="checkpoints/lora_subtitles",
    per_device_train_batch_size=1,
    per_device_eval_batch_size=1,
    save_strategy="steps",
    logging_steps=50,
    save_steps=500,
    num_train_epochs=1,
    fp16=True,
    report_to="none"
)

trainer = Trainer(
    model=model,
    args=args,
    train_dataset=tokenized["train"],
    eval_dataset=tokenized["test"],
    data_collator=DataCollatorForSeq2Seq(tokenizer, model=model),
)

trainer.train()
model.save_pretrained("checkpoints/lora_subtitles")
tokenizer.save_pretrained("checkpoints/lora_subtitles")