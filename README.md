# Obsidian Note-Improvement Agent

A CLI agent that reads a note from an Obsidian vault, analyzes it with an LLM, proposes concrete improvements (typo fixes, missing explanations, clarified author doubts, a Mermaid diagram, wikilinks to other notes), and lets you review and accept or reject each change before anything is written to disk.

## What it does

1. **Indexes the vault** — lists every other note title, so links can be proposed later.
2. **Reads the target note** from disk.
3. **Analyzes it** via an LLM: summary, topics, writing style/tone, whether a Mermaid diagram would help (and which type), and a list of `missingInformation` entries — each tagged as either:
    - `gap`: a concept the note mentions but never explains, or
    - `authorDoubt`: a passage where the author expresses uncertainty (e.g. "in a way", "I think", "but then... ?").
4. **Edits the note**: corrects spelling/formatting, fills in gaps, rewrites doubtful passages _in place_ (rather than bolting an explanation on next to them), adds a Mermaid diagram if useful, adds a `aliases` frontmatter block, and links known vault concepts as `[[Wikilinks]]`.
5. **Reviews the diff**: a second LLM call summarizes what actually changed, as structured JSON.
6. **Builds a proposal** from that diff.
7. **Asks for validation** in the CLI — accept all, reject all, or pick changes individually.
8. **Backs up and writes** the file only after validation.

## LLM providers

The agent is provider-agnostic through `LLMProvider`. Two backends have been used during development:

-   **Ollama (local)** — tested with `qwen3-14b` and `qwen3.5:9b` at various quantization levels (Q4–Q8). Runs fully offline, but a smaller local model needs more guardrails: it doesn't always follow multi-step prompt instructions reliably, especially conflicting ones (e.g. "reformulate in place" vs. its instinct to append a new section).
-   **Groq (cloud)** — tested with `openai/gpt-oss-120b`. Much more reliable at following structured, multi-rule prompts (correct JSON, in-place reformulation, diagram scoping), and fast (Groq's hardware makes even a non-thinking pass take only a few seconds).

You can switch providers via environment variables.

- To use Groq, set:
    - `LLM_PROVIDER=groq`
    - `GROQ_API_KEY`
    - `GROQ_LLM_MODEL` (optional, default is openai/gpt-oss-120b)

- To use a local model supported by Ollama, set:
    - `LLM_PROVIDER=ollama`
    - `OLLAMA_LLM_MODEL` (can be found with command ollama list)

## How to use

1. Install dependencies:
```bash
npm i
```
2. Set your vault path inside .env:
`VAULT_PATH=`
3. Run the script:
```bash
npm run dev -- "<note_path>"
```