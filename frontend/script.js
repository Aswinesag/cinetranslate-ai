const videoInput = document.getElementById("videoInput");
const preview = document.getElementById("preview");
const processBtn = document.getElementById("processBtn");
const loader = document.getElementById("loader");
const englishText = document.getElementById("englishText");
const malayalamText = document.getElementById("malayalamText");

videoInput.onchange = (e) => {
  const file = e.target.files[0];
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
};

processBtn.onclick = async () => {
  const file = videoInput.files[0];
  if (!file) return alert("Upload a video!");

  loader.style.display = "block";

  const formData = new FormData();
  formData.append("video", file);

  const res = await fetch("http://localhost:5000/process-video", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  englishText.textContent = data.english_text;
  malayalamText.textContent = data.malayalam_text;

  loader.style.display = "none";
};