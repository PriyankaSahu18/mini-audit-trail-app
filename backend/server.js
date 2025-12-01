const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const path = require("path"); 

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, "public")));


let versions = [];
let lastSavedText = "";

// format timestamp as "YYYY-MM-DD HH:MM"
function formatTimestamp(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    " " +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

function tokenizeWords(text) {
  return text
    .split(/[^\p{L}\p{N}']+/u)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

function getCounts(words) {
  const counts = Object.create(null);
  for (const w of words) {
    counts[w] = (counts[w] || 0) + 1;
  }
  return counts;
}

function diffWords(oldText, newText) {
  const oldWords = tokenizeWords(oldText);
  const newWords = tokenizeWords(newText);

  const oldCounts = getCounts(oldWords);
  const newCounts = getCounts(newWords);

  const addedWords = [];
  const removedWords = [];

  for (const w of Object.keys(newCounts)) {
    const delta = newCounts[w] - (oldCounts[w] || 0);
    for (let i = 0; i < Math.max(0, delta); i++) {
      addedWords.push(w);
    }
  }

  for (const w of Object.keys(oldCounts)) {
    const delta = oldCounts[w] - (newCounts[w] || 0);
    for (let i = 0; i < Math.max(0, delta); i++) {
      removedWords.push(w);
    }
  }

  return {
    addedWords,
    removedWords,
    oldWordsCount: oldWords.length,
    newWordsCount: newWords.length,
  };
}

app.post("/save-version", (req, res) => {
  const newText =
    typeof req.body.text === "string" ? req.body.text : "";

  const diff = diffWords(lastSavedText, newText);

  const oldLength = lastSavedText.length;
  const newLength = newText.length;

  const versionEntry = {
    id: uuidv4(),
    timestamp: formatTimestamp(new Date()),
    addedWords: diff.addedWords,
    removedWords: diff.removedWords,
    oldLength,
    newLength,
    wordChangesSummary: {
      oldWordsCount: diff.oldWordsCount,
      newWordsCount: diff.newWordsCount,
    },
  };

  versions.push(versionEntry);
  lastSavedText = newText;

  return res.status(201).json(versionEntry);
});

app.get("/versions", (req, res) => {
  return res.json(versions);
});

// Serve index.html for any other route (frontend)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
