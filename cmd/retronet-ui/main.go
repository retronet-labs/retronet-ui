// Comando retronet-ui: serve la UI web statica di RetroNet.
package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/retronet-labs/retronet-ui/internal/site"
)

var version = "dev"

func main() {
	os.Exit(run(os.Args[1:], os.Stdout, os.Stderr))
}

func run(args []string, stdout *os.File, stderr *os.File) int {
	fs := flag.NewFlagSet("retronet-ui", flag.ContinueOnError)
	fs.SetOutput(stderr)
	addr := fs.String("addr", "127.0.0.1:18081", "indirizzo HTTP della UI")
	apiURL := fs.String("api", "http://127.0.0.1:8080", "URL HTTP predefinito di retronet-api")
	check := fs.Bool("check", false, "verifica asset embeddati e termina")
	if err := fs.Parse(args); err != nil {
		return 2
	}
	if *check {
		if err := site.Check(); err != nil {
			fmt.Fprintf(stderr, "check failed: %v\n", err)
			return 1
		}
		fmt.Fprintln(stdout, "check passed")
		return 0
	}
	server := &http.Server{
		Addr:              *addr,
		Handler:           site.Handler(site.Config{Version: version, DefaultAPIURL: *apiURL}),
		ReadHeaderTimeout: 5 * time.Second,
	}
	fmt.Fprintf(stdout, "retronet-ui listening on http://%s\n", *addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		fmt.Fprintf(stderr, "errore server: %v\n", err)
		return 1
	}
	return 0
}
