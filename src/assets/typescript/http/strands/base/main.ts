import { Agent, tool } from "@strands-agents/sdk";
import { loadModel } from "./model/load.js";
import express from "express";
import { z } from "zod";

const PORT = parseInt(process.env.PORT || "8080", 10);

// Define a simple function tool
const addNumbers = tool({
  name: "add_numbers",
  description: "Return the sum of two numbers",
  inputSchema: z.object({ a: z.number(), b: z.number() }),
  callback: (input) => input.a + input.b,
});

const tools = [addNumbers];

let agent: Agent | null = null;

function getOrCreateAgent(): Agent {
  if (!agent) {
    agent = new Agent({
      model: loadModel(),
      tools,
      systemPrompt: "You are a helpful assistant. Use tools when appropriate.",
    });
  }
  return agent;
}

const app = express();

// Health check endpoint (required by AgentCore Runtime)
app.get("/ping", (_, res) =>
  res.json({ status: "Healthy", time_of_last_update: Math.floor(Date.now() / 1000) })
);

// Agent invocation endpoint (required by AgentCore Runtime)
app.post("/invocations", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    const body = new TextDecoder().decode(req.body);
    let prompt: string;
    try {
      prompt = JSON.parse(body)?.prompt ?? body;
    } catch {
      prompt = body;
    }

    const response = await getOrCreateAgent().invoke(prompt);

    // Extract text from response
    const content = (response as any)?.lastMessage?.content;
    if (Array.isArray(content)) {
      const text = content
        .filter((block: any) => block.text)
        .map((block: any) => block.text)
        .join("");
      return res.type("text/plain").send(text);
    }

    return res.type("text/plain").send(JSON.stringify(response));
  } catch (err) {
    console.error("Error processing request:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AgentCore Runtime server listening on port ${PORT}`);
});
