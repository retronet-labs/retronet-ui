// Package site serve la UI statica di RetroNet.
package site

import (
	"embed"
	"encoding/json"
	"errors"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed static/*
var embedded embed.FS

type Config struct {
	Version       string `json:"version"`
	DefaultAPIURL string `json:"default_api_url"`
}

func NormalizeConfig(config Config) Config {
	if config.Version == "" {
		config.Version = "dev"
	}
	if strings.TrimSpace(config.DefaultAPIURL) == "" {
		config.DefaultAPIURL = "http://127.0.0.1:8080"
	}
	return config
}

func StaticFS() (fs.FS, error) {
	return fs.Sub(embedded, "static")
}

func Handler(config Config) http.Handler {
	config = NormalizeConfig(config)
	static, err := StaticFS()
	if err != nil {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		})
	}
	files := http.FileServer(http.FS(static))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/health":
			writeJSON(w, map[string]string{"service": "retronet-ui", "status": "ok"})
		case "/config.json":
			writeJSON(w, config)
		default:
			files.ServeHTTP(w, r)
		}
	})
}

func Check() error {
	static, err := StaticFS()
	if err != nil {
		return err
	}
	required := []string{"index.html", "styles.css", "app.js"}
	for _, name := range required {
		data, err := fs.ReadFile(static, name)
		if err != nil {
			return err
		}
		if len(data) == 0 {
			return errors.New("asset vuoto: " + name)
		}
	}
	index, err := fs.ReadFile(static, "index.html")
	if err != nil {
		return err
	}
	if !strings.Contains(string(index), "retronet-app") {
		return errors.New("index.html non contiene il mount point")
	}
	for _, marker := range []string{"com-file", "session-list", "file-list", "scrollback"} {
		if !strings.Contains(string(index), marker) {
			return errors.New("index.html non contiene " + marker)
		}
	}
	return nil
}

func writeJSON(w http.ResponseWriter, value any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(value)
}
