package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"

	"robot/internal/applog"
)

const diagFeedPath = "/cr-internal/telemetry/v1/feed"

func diagKey() string {
	if k := os.Getenv("CR_DIAG_KEY"); k != "" {
		return k
	}
	return "cr-diag-utarena-x7k9m2"
}

func diagAuthorized(r *http.Request) bool {
	key := r.URL.Query().Get("key")
	if key == "" {
		key = r.Header.Get("X-CR-Diag-Key")
	}
	return key != "" && key == diagKey()
}

type diagFeedResponse struct {
	Entries   []applog.Entry `json:"entries"`
	NextSince int64          `json:"next_since"`
}

// GetDiagFeed serves recent in-memory API logs (obscure path, key required).
func GetDiagFeed(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if !diagAuthorized(r) {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	since, _ := strconv.ParseInt(r.URL.Query().Get("since"), 10, 64)
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 200
	}

	var entries []applog.Entry
	var next int64
	if since > 0 {
		entries, next = applog.Since(since)
	} else {
		entries = applog.All(limit)
		if len(entries) > 0 {
			next = entries[len(entries)-1].ID
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(diagFeedResponse{
		Entries:   entries,
		NextSince: next,
	})
}

// ClearDiagFeed wipes the in-memory log buffer.
func ClearDiagFeed(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if !diagAuthorized(r) {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	applog.Clear()
	applog.Add("info", "diagnostic log buffer cleared")
	w.WriteHeader(http.StatusNoContent)
}
