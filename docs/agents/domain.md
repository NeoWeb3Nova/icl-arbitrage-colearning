# Domain Docs

## Before exploring, read these

- `CONTEXT.md` at the repository root, when present and relevant.
- `docs/adr/`, when present and relevant.

If these files do not exist, proceed without creating them upfront.

## File structure

This is a single-context repository:

```text
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

## Domain vocabulary

Use the terminology defined in `CONTEXT.md` when present. If a required
concept is missing, note the gap instead of inventing conflicting terms.

## ADR conflicts

If an implementation contradicts an existing ADR, surface the conflict
explicitly before proceeding.
