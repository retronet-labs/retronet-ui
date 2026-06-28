# Guida Uso

## Avvio Locale

Avviare `retronet-api`:

```powershell
cd C:\work\source\retronet-api
go run ./cmd/retronet-api -addr 127.0.0.1:8080
```

Avviare `retronet-ui`:

```powershell
cd C:\work\source\retronet-ui
go run ./cmd/retronet-ui -addr 127.0.0.1:18081
```

Aprire il browser su:

```text
http://127.0.0.1:18081
```

## Uso

- `Check`: controlla `retronet-api`
- `Nuova`: crea una sessione CP/M-like temporanea
- `Connetti`: usa l'ID sessione indicato
- `Chiudi`: cancella la sessione
- `Invia`: manda la riga comando al terminale
- area terminale: riceve tasti e li inoltra via WebSocket

Comandi utili nella sessione CP/M-like:

```text
HELP
DIR
TYPE <file>
RUN <programma.COM>
EXIT
```

## API Diversa

Per puntare la UI a una API diversa:

```powershell
go run ./cmd/retronet-ui -api http://127.0.0.1:8080
```

Se la UI gira su una porta diversa da `18081`, aggiornare anche CORS lato API:

```powershell
go run ./cmd/retronet-api -cors-origin "http://127.0.0.1:19000"
```

## Verifica Rapida

```powershell
go run ./cmd/retronet-ui -check
```

`-check` verifica che gli asset embeddati principali siano presenti.
