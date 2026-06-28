# Architettura

`retronet-ui` e' una UI web piccola e separata dagli emulatori. Il suo compito
e' parlare con `retronet-api`, non emulare CPU o distribuire software storico.

```text
browser
  |
  | REST + WebSocket
  v
retronet-api
  |
  v
retronet-cpm/session -> retronet-terminal
```

Il repo contiene:

- `cmd/retronet-ui`: server HTTP Go per asset embeddati
- `internal/site`: handler HTTP, configurazione e controlli sugli asset
- `internal/site/static`: HTML, CSS e JavaScript della UI

## Flusso

1. Il browser carica `retronet-ui`.
2. La UI legge `/config.json` per conoscere l'URL predefinito di `retronet-api`.
3. La UI chiama `GET /health` e `GET /version` sull'API.
4. Con `Nuova`, la UI invia `POST /sessions`.
5. La UI apre `GET /sessions/{id}/ws` come WebSocket.
6. I tasti diventano messaggi JSON `input`.
7. Output, stato e snapshot aggiornano il terminale nel browser.

## Confini

- nessuna dipendenza frontend esterna
- nessun asset storico incluso
- nessun accesso diretto a path host
- nessuna logica CP/M nel browser
- nessuna autenticazione/TLS in v0.1

Il supporto CORS necessario al browser vive in `retronet-api v0.3.0` ed e'
limitato alle origini locali della UI, salvo configurazione esplicita diversa.
