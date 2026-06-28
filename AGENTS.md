# AGENTS

## Obiettivo

Mantenere `retronet-ui`: interfaccia web didattica per usare sessioni RetroNet
tramite `retronet-api`.

## Regole

- Documentazione pubblica in italiano.
- Commit piccoli e atomici.
- Nessuna ROM, BIOS, BDOS, immagine disco, font storico, manuale copiato o asset
  proprietario incluso.
- Preferire zero dipendenze frontend finche' la UI resta piccola.
- La UI deve restare un client: non deve incorporare emulatori o materiale
  storico.

## Gate

```powershell
gofmt -l .
go test -count=1 ./...
go vet ./...
go run ./cmd/retronet-ui -check
git diff --check
```
