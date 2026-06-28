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
- `Upload`: carica un file `.COM` nel drive temporaneo della sessione
- `File`: aggiorna la lista del drive A:
- `Dashboard`: aggiorna sessioni attive e stato servizi
- area terminale: riceve tasti e li inoltra via WebSocket
- doppio click su un file `.COM` nel drive A: prepara ed esegue `RUN`

Comandi utili nella sessione CP/M-like:

```text
HELP
DIR
TYPE <file>
RUN <programma.COM>
EXIT
```

## Caricare Un .COM

1. Premere `Nuova`.
2. Selezionare un file `.COM` nel controllo `Upload .COM`.
3. Premere `Upload`.
4. Controllare che il file compaia in `Drive A:`.
5. Eseguire:

```text
RUN NOME
```

Sono accettati solo nomi CP/M 8.3 con estensione `.COM`. Il file viene caricato
nel drive temporaneo della sessione, non in una directory scelta dal browser.

Caricare solo programmi propri, sintetici o con licenza compatibile.

## Terminale E Scrollback

Il riquadro principale mostra lo snapshot del terminale con cursore evidenziato.
Il riquadro inferiore conserva uno scrollback dei byte raw ricevuti, separato
dallo snapshot: e' utile quando il programma riscrive lo schermo ma vuoi vedere
anche l'output passato.

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
