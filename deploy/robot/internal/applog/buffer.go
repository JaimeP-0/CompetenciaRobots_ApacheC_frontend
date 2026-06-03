package applog

import (
	"io"
	"os"
	"strings"
	"sync"
	"time"
)

const maxEntries = 800

// Entry is one in-memory log line for the diagnostics feed.
type Entry struct {
	ID    int64  `json:"id"`
	At    string `json:"at"`
	Level string `json:"level"`
	Msg   string `json:"msg"`
}

var (
	mu       sync.RWMutex
	entries  []Entry
	nextID   int64
	utc      = time.UTC
)

func Add(level, msg string) {
	level = strings.ToLower(strings.TrimSpace(level))
	if level == "" {
		level = "info"
	}
	msg = strings.TrimSpace(msg)
	if msg == "" {
		return
	}

	mu.Lock()
	defer mu.Unlock()

	nextID++
	e := Entry{
		ID:    nextID,
		At:    time.Now().In(utc).Format(time.RFC3339),
		Level: level,
		Msg:   msg,
	}
	entries = append(entries, e)
	if len(entries) > maxEntries {
		entries = entries[len(entries)-maxEntries:]
	}
}

// Since returns entries with ID greater than since (newest last).
func Since(since int64) ([]Entry, int64) {
	mu.RLock()
	defer mu.RUnlock()

	out := make([]Entry, 0)
	for _, e := range entries {
		if e.ID > since {
			out = append(out, e)
		}
	}
	last := since
	if len(out) > 0 {
		last = out[len(out)-1].ID
	} else if len(entries) > 0 {
		last = entries[len(entries)-1].ID
	}
	return out, last
}

// All returns a copy of recent entries (newest last).
func All(limit int) []Entry {
	mu.RLock()
	defer mu.RUnlock()
	if limit <= 0 || limit > len(entries) {
		limit = len(entries)
	}
	start := len(entries) - limit
	if start < 0 {
		start = 0
	}
	out := make([]Entry, limit)
	copy(out, entries[start:])
	return out
}

func Clear() {
	mu.Lock()
	defer mu.Unlock()
	entries = entries[:0]
}

type lineWriter struct {
	level string
}

func (lw lineWriter) Write(p []byte) (int, error) {
	line := strings.TrimSpace(string(p))
	if line != "" {
		Add(lw.level, line)
	}
	return os.Stderr.Write(p)
}

// StdLogWriter feeds stderr and the in-memory buffer (level "log").
func StdLogWriter() io.Writer {
	return io.MultiWriter(os.Stderr, lineWriter{level: "log"})
}
