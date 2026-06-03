package applog

import (
	"fmt"
	"net/http"
	"runtime/debug"
	"time"
)

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (sw *statusWriter) WriteHeader(code int) {
	sw.status = code
	sw.ResponseWriter.WriteHeader(code)
}

// RequestMiddleware records each HTTP request and flags 4xx/5xx responses.
func RequestMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(sw, r)
		elapsed := time.Since(start)
		line := fmt.Sprintf("%s %s -> %d (%s)", r.Method, r.URL.Path, sw.status, elapsed)
		switch {
		case sw.status >= 500:
			Add("error", line)
		case sw.status >= 400:
			Add("warn", line)
		default:
			Add("info", line)
		}
	})
}

// RecoverMiddleware catches panics and logs them without crashing the process.
func RecoverMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				Add("error", fmt.Sprintf("panic %s %s: %v\n%s", r.Method, r.URL.Path, rec, debug.Stack()))
				http.Error(w, "internal server error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
