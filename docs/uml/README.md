# UML Diagrams

This folder contains PlantUML sources for the current project architecture and flows.

Quick open:

- `index.html` - one page with all rendered visual diagrams.

Files:

- `backend-architecture.puml` - runtime and component view of the Django + Channels backend.
- `backend-domain-model.puml` - core persistent entities and their relationships.
- `frontend-architecture.puml` - SPA bootstrap, routing, feature, realtime and data access layers.
- `use-cases.puml` - primary actors and supported user scenarios.
- `state-chat-session.puml` - end-to-end chat session state machine.
- `state-message-lifecycle.puml` - message draft, upload, publish, edit and delete lifecycle.

Rendered SVG files:

- `rendered/backend-architecture.svg`
- `rendered/backend-domain-model.svg`
- `rendered/frontend-architecture.svg`
- `rendered/use-cases.svg`
- `rendered/state-chat-session.svg`
- `rendered/state-message-lifecycle.svg`

Typical render command:

```bash
plantuml docs/uml/backend-architecture.puml
```
