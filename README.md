# Agentic BI Portal

Production-grade documentation and interactive demo for an AI-powered Business Intelligence agent that orchestrates Power BI and Snowflake through natural language.

## Pages

| Page | Description |
|:---|:---|
| [Home](index.html) | Landing page with architecture overview and pipeline summary |
| [Architecture](architecture.html) | Five-layer system design with SVG diagrams |
| [Orchestration](orchestration.html) | Backend service pipeline — classify, route, build, execute |
| [Tools & MCP](tools.html) | MCP tool catalog with configuration and usage examples |
| [Governance](governance.html) | Auth, validation, policy engine, audit trail |
| [Routing & Metadata](routing.html) | Semantic routing, glossary, few-shot examples |
| [Chat](chat.html) | Interactive mock chat interface with AI responses |

## Architecture Summary

```
User → Chat UI → Orchestration API → Tool Layer (MCP) → Data Sources → Presentation
                                          ↓
                                  Power BI · Snowflake
```

The system classifies user intent, routes to the optimal data source, builds validated queries (DAX or SQL), executes them with governance checks, and returns formatted results.

## Tech Stack

- **Frontend:** Static HTML / CSS / JavaScript (no frameworks)
- **Fonts:** Inter, JetBrains Mono (Google Fonts)
- **Theme:** Dark mode (#090c10 background, #58a6ff accent)
- **Deployment:** GitHub Pages

## Local Development

```bash
# Clone the repo
git clone https://github.com/ynktoofast-toofurious/gameintel.git
cd gameintel

# Serve locally (any static server works)
npx serve .
# or
python -m http.server 8000
```

Open `http://localhost:8000` in your browser.

## License

MIT
