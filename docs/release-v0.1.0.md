# Release v0.1.0

Prima release di `retronet-ui`.

## Novita'

- server Go `cmd/retronet-ui`
- asset UI embeddati
- endpoint locale `/health`
- endpoint locale `/config.json`
- UI browser per `retronet-api`
- creazione sessione CP/M-like via REST
- collegamento WebSocket a sessione esistente
- terminale browser con input tastiera, comando rapido, output e snapshot
- stato API/sessione/socket visibile
- Dockerfile e CI
- documentazione italiana

## Uso

```powershell
cd C:\work\source\retronet-api
go run ./cmd/retronet-api -addr 127.0.0.1:8080
```

```powershell
cd C:\work\source\retronet-ui
go run ./cmd/retronet-ui -addr 127.0.0.1:18081
```

Aprire:

```text
http://127.0.0.1:18081
```

## Limiti

- niente autenticazione/TLS
- niente upload file
- niente xterm.js o framework frontend
- niente asset storici
- UI pensata per laboratorio locale

## Verifica

```powershell
gofmt -l .
go test -count=1 ./...
go vet ./...
go run ./cmd/retronet-ui -check
git diff --check
```
