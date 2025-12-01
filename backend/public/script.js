//const API_BASE = "http://localhost:4000";
const API_BASE = "";


const textInput = document.getElementById("textInput");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");
const versionsBody = document.getElementById("versionsBody");

window.addEventListener("DOMContentLoaded", () => {
  fetchVersions();
});

async function fetchVersions() {
  try {
    const res = await fetch(`${API_BASE}/versions`);
    const data = await res.json();
    renderVersions(data);
  } catch (error) {
    console.error("Error fetching versions:", error);
  }
}

function renderVersions(versions) {
  versionsBody.innerHTML = "";
  const list = [...versions].reverse();

  list.forEach((v) => {
    const tr = document.createElement("tr");

    const added =
      v.addedWords && v.addedWords.length
        ? v.addedWords.join(", ")
        : "—";
    const removed =
      v.removedWords && v.removedWords.length
        ? v.removedWords.join(", ")
        : "—";

    tr.innerHTML = `
      <td>${v.timestamp}</td>
      <td>${v.oldLength}</td>
      <td>${v.newLength}</td>
      <td>${added}</td>
      <td>${removed}</td>
    `;

    versionsBody.appendChild(tr);
  });
}

saveBtn.addEventListener("click", async () => {
  const text = textInput.value;

  statusEl.textContent = "Saving...";

  try {
    const res = await fetch(`${API_BASE}/save-version`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      statusEl.textContent = "Error saving version";
      return;
    }

    await res.json();
    statusEl.textContent = "Saved!";
    await fetchVersions();

    setTimeout(() => {
      statusEl.textContent = "";
    }, 1000);
  } catch (error) {
    console.error("Error saving version:", error);
    statusEl.textContent = "Network error";
  }
});
