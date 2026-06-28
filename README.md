# retronet-ui

`retronet-ui` e' la prima interfaccia web dell'ecosistema RetroNet. In v0.2
espone una console browser per sessioni CP/M-like orchestrate da
`retronet-api`, usando REST per creare/chiudere sessioni e WebSocket per input,
output, stato e snapshot terminale. Aggiunge dashboard sessioni, upload sicuro
`.COM`, lista file del drive A: e scrollback separato.

Non include ROM, BIOS, BDOS storico, immagini disco, font storici o asset
proprietari.

## Quick Start

Avviare API:

```powershell
cd C:\work\source\retronet-api
go run ./cmd/retronet-api -addr 127.0.0.1:8080
```

Avviare UI:

```powershell
cd C:\work\source\retronet-ui
go run ./cmd/retronet-ui -addr 127.0.0.1:18081
```

Aprire:

```text
http://127.0.0.1:18081
```

## Verifica

```powershell
gofmt -l .
go test -count=1 ./...
go vet ./...
go run ./cmd/retronet-ui -check
git diff --check
```

## Architettura

- server Go minimale con asset embeddati
- UI HTML/CSS/JavaScript senza dipendenze esterne
- `GET /config.json` per configurazione iniziale
- `GET /health` per controllo locale del server UI
- browser -> `retronet-api` via REST e WebSocket
- upload `.COM` via multipart verso il drive temporaneo della sessione
- dashboard sessioni e lista file tramite endpoint API

## Documentazione

- [Architettura](docs/architettura.md)
- [Guida uso](docs/guida-uso.md)
- [Sicurezza e licenze](docs/sicurezza.md)
- [Release v0.1.0](docs/release-v0.1.0.md)
- [Release v0.2.0](docs/release-v0.2.0.md)

## Licenza

MIT.
