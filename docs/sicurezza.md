# Sicurezza E Licenze

`retronet-ui v0.1` e' pensata per laboratorio locale.

## Sicurezza

- non implementa autenticazione
- non configura TLS
- non salva sessioni su disco
- non accetta upload file
- non accede direttamente al filesystem host
- parla solo con `retronet-api`

La separazione dei ruoli resta chiara:

- `retronet-ui`: interfaccia browser
- `retronet-api`: sessioni, drive temporanei, REST e WebSocket
- `retronet-cpm`: ambiente CP/M-like
- `retronet-terminal`: terminale testuale condiviso

## CORS

Il browser richiede CORS per chiamare `retronet-api` da una porta diversa.
`retronet-api v0.3.0` abilita di default solo:

- `http://127.0.0.1:18081`
- `http://localhost:18081`

Per esposizioni non locali servono autenticazione, TLS, quote e una politica
CORS piu' rigorosa.

## Licenze

Il repo non include ROM, BIOS, BDOS storico, immagini disco, font storici,
manuali copiati o asset proprietari. HTML, CSS, JavaScript e codice Go sono
scritti per RetroNet.
