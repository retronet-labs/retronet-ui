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
6. La dashboard legge `GET /sessions` e `GET /sessions/{id}/files`.
7. L'upload `.COM` usa `POST /sessions/{id}/files`.
8. I tasti diventano messaggi JSON `input`.
9. Output, stato e snapshot aggiornano il terminale nel browser.

## Terminale Browser

La v0.2 mantiene un terminale nativo HTML/CSS/JS:

- snapshot principale con cursore evidenziato
- scrollback separato dei byte raw ricevuti
- invio di tasti stampabili, `Enter`, `Backspace`, `Tab`, `Escape`, frecce,
  `Home`, `End`, `Delete` e controlli `Ctrl+C/D/L/Q`

Non usa ancora `xterm.js`: questo mantiene la release senza dipendenze frontend
esterne e rende piu' semplice l'audit licenze. `xterm.js` resta una valutazione
futura se serviranno emulazione terminale piu' completa e prestazioni superiori.

## Confini

- nessuna dipendenza frontend esterna
- nessun asset storico incluso
- nessun accesso diretto a path host
- nessuna logica CP/M nel browser
- upload limitato a `.COM` e delegato ai controlli di `retronet-api`
- nessuna autenticazione/TLS in v0.1

Il supporto CORS necessario al browser vive in `retronet-api v0.3.0` ed e'
limitato alle origini locali della UI, salvo configurazione esplicita diversa.
