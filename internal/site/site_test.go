package site

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCheck(t *testing.T) {
	if err := Check(); err != nil {
		t.Fatal(err)
	}
}

func TestHandlerServesIndexAndConfig(t *testing.T) {
	handler := Handler(Config{Version: "test", DefaultAPIURL: "http://api.test"})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("index status=%d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "retronet-app") {
		t.Fatalf("index inatteso: %s", rec.Body.String())
	}

	req = httptest.NewRequest(http.MethodGet, "/config.json", nil)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("config status=%d", rec.Code)
	}
	var config Config
	if err := json.NewDecoder(rec.Body).Decode(&config); err != nil {
		t.Fatal(err)
	}
	if config.Version != "test" || config.DefaultAPIURL != "http://api.test" {
		t.Fatalf("config=%+v", config)
	}
}
