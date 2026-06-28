# Release v0.2.0

Release dedicata a terminale piu' usabile, upload `.COM` e dashboard.

## Novita'

- dashboard sessioni tramite `GET /sessions`
- lista file del drive A: tramite `GET /sessions/{id}/files`
- upload `.COM` dal browser tramite `POST /sessions/{id}/files`
- doppio click su file `.COM` per eseguire `RUN`
- terminale con cursore evidenziato nello snapshot
- scrollback separato dai byte raw ricevuti
- supporto tasti aggiuntivi: frecce, `Home`, `End`, `Delete`, `Tab`, `Escape`
- controlli UI per aggiornare dashboard e file
- documentazione italiana aggiornata

## Uso

Avviare API aggiornata:

```powershell
cd C:\work\source\retronet-api
go run ./cmd/retronet-api -addr 127.0.0.1:8080
```

Avviare UI:

```powershell
cd C:\work\source\retronet-ui
go run ./cmd/retronet-ui -addr 127.0.0.1:18081
```

Nel browser:

1. premere `Nuova`
2. selezionare un file `.COM`
3. premere `Upload`
4. eseguire `RUN NOME`

## Sicurezza E Licenze

L'upload passa da `retronet-api`, che normalizza il nome CP/M 8.3, accetta solo
`.COM`, applica `-max-file-size` e `-max-files`, e scrive solo nel drive
temporaneo della sessione.

La release non include software storico, ROM, BIOS, BDOS, immagini disco, font
o manuali copiati.

## Verifica

```powershell
gofmt -l .
go test -count=1 ./...
go vet ./...
go run ./cmd/retronet-ui -check
git diff --check
```
