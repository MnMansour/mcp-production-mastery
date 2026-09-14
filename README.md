# Production MCP Agent Architecture

A production-grade, end-to-end implementation of an AI Agent connecting to external tools using the **Model Context Protocol (MCP)**, enforcing **Deterministic Structured Outputs with Zod**, and instrumented with **Langfuse Observability**.

---

## 🏗️ Architecture Overview

```text
┌────────────────┐          Stdio Transport          ┌───────────────────┐
│                │ ◄── 1. tools/list Discovery ───► │                   │
│   MCP Client   │                                  │    MCP Server     │
│  (Agent Loop)  │ ◄── 2. tools/call Execution ───► │  (FastMCP Engine) │
└───────┬────────┘                                  └─────────┬─────────┘
        │                                                     │
        │ 3. LLM Invocations & Structured Outputs             │ Audit Logs
        ▼                                                     ▼
┌────────────────┐                                  ┌───────────────────┐
│   OpenAI API   │                                  │   Target Storage  │
│    (gpt-4o)    │                                  │   / Infrastructure│
└───────┬────────┘                                  └─────────┬─────────┘
        │
        │ 4. Telemetry Spans, Latency & Cost Tracing
        ▼
┌────────────────┐
│    Langfuse    │
│  Observability │
└────────────────┘
```

---

## ⚡ Key Features

* **Model Context Protocol (MCP)**: Implements standard Client-Server decoupled tool discovery and execution over `stdio` transport using standard JSON-RPC 2.0.
* **100% Deterministic JSON Schemas**: Uses OpenAI's `zodResponseFormat` and `zodFunction` helpers to eliminate non-deterministic markdown or missing fields at runtime.
* **Full Observability & Tracing**: Instrument traces, model generations, and tool execution spans via **Langfuse** for latency monitoring and token cost tracking.
* **Modular TypeScript Design**: Built with Modern ES Modules, strict typing, clean separation of concerns, and native execution via `tsx`.
* **Container Ready**: Includes Docker & Docker Compose setup for production deployment.

---

## 📂 Project Structure

```text
mcp-production-mastery/
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── src/
    ├── client.ts             # Main MCP Client agent loop & execution engine
    ├── server.ts             # MCP Server exposing standard operational tools
    ├── config/
    │   └── telemetry.ts      # Centralized Langfuse SDK initialization
    ├── schemas/
    │   └── output.schemas.ts # Zod contracts for agent responses
    └── tools/
        ├── database.tool.ts  # Database mutation tool implementation
        └── ping.tool.ts      # System infrastructure diagnostic tool
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js v18+ 
* npm v9+
* OpenAI API Key
* Langfuse Account Key Pair (Cloud or Self-Hosted)

### Step 1: Clone & Install Dependencies

```bash
git clone [https://github.com/YOUR_USERNAME/mcp-production-mastery.git](https://github.com/YOUR_USERNAME/mcp-production-mastery.git)
cd mcp-production-mastery
npm install
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env` and fill in your API credentials:

```bash
cp .env.example .env
```

### Step 3: Run the Agent

Execute the full client-server loop in development mode:

```bash
# Run the complete agent orchestration loop
npm run start:client
```

To run the standalone MCP server process listening on Stdio:

```bash
npm run start:server
```

---

## 🐳 Docker Deployment

To build and run the MCP Server container using Docker Compose:

```bash
# Build and run server image
docker-compose up --build
```

---

## 🛠️ Modifying & Extending Tools

To add a new operational tool to the MCP Server:

1. Create a new Zod input schema and execution function under `src/tools/`.
2. Register the tool inside `src/server.ts` using `server.tool(...)`.
3. The MCP Client will automatically discover the new tool on launch via `tools/list` without requiring client modifications.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for details.