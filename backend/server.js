const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai");
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files
app.use(express.static('frontend'));

// Replace with your existing assistant ID
const assistantId = "asst_qXWkqkMdJP16MuajsmtLuOEm";

app.get("/start", async (req, res) => {
  try {
    const thread = await openai.beta.threads.create();
    return res.json({ thread_id: thread.id });
  } catch (error) {
    console.error('Error creating thread:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post("/chat", async (req, res) => {
  const threadId = req.body.thread_id;
  const message = req.body.message;

  if (!threadId || !message) {
    return res.status(400).json({ error: "Missing thread_id or message" });
  }

  try {
    console.log(`Received message: ${message} for thread ID: ${threadId}`);
    
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });

    const messages = await openai.beta.threads.messages.list(run.thread_id);
    const response = messages.data[0]?.content[0]?.text?.value || "No response";

    return res.json({ response });
  } catch (error) {
    console.error('Error handling chat:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(8080, () => {
  console.log("Server running on port 8080");
});