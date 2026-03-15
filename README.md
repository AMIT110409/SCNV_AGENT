# SCNV Agent — Supply Chain Network Visibility Agent

AI-powered multi-agent system that classifies, optimizes, and acts on Stock Transfer Orders (STOs) in real-time.

## Architecture

- **5 Layers**: Perception → Agent Core → Memory → Tools → Action
- **5 Agents**: Orchestrator, SCM Analyst, Optimizer, Process Mining (pluggable), Communication (dual-mode)
- **A2A Protocol**: Structured inter-agent communication via orchestrator hub

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn backend.main:app --reload

# Run classification on synthetic data
python -m tools.run_classification
```

## Project Structure

```
scnv-agent/
├── backend/          # FastAPI backend
├── agents/           # LangGraph agents
├── tools/            # Shared deterministic tools
├── frontend/         # React + Vite
├── data/synthetic/   # Phase 1 demo data
├── memory/           # pgvector + Neo4j
├── tests/            # Test suite
└── docs/             # Architecture documents
```

## Configuration

Set `CELONIS_ENABLED=true` to activate the Process Mining Agent (requires Celonis license).

## Docs

- `docs/SCNV_Agent_Final_Architecture.docx` — Full architecture
- `docs/SCNV_Agent_Implementation_Plan.docx` — Phased plan
- `docs/SCNV_Agent_Solution.docx` — Business solution doc
