FROM --platform=linux/arm64 public.ecr.aws/docker/library/node:22-slim

WORKDIR /app

RUN useradd -m -o -u 1000 bedrock_agentcore

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY --chown=bedrock_agentcore:bedrock_agentcore . .
RUN npm run build && npm prune --omit=dev

USER bedrock_agentcore

# AgentCore Runtime service contract ports
# 8080: HTTP Mode
# 8000: MCP Mode
# 9000: A2A Mode
EXPOSE 8080 8000 9000

CMD ["node", "dist/{{entrypoint}}.js"]
