import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "{{ name }}", version: "0.1.0" });

server.tool("add_numbers", "Add two numbers together", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
  content: [{ type: "text", text: String(a + b) }],
}));

server.tool("multiply_numbers", "Multiply two numbers together", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
  content: [{ type: "text", text: String(a * b) }],
}));

server.tool("greet_user", "Greet a user by name", { name: z.string() }, async ({ name }) => ({
  content: [{ type: "text", text: `Hello, ${name}! Nice to meet you.` }],
}));

const transport = new StdioServerTransport();
await server.connect(transport);
