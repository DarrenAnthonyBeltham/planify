package config

import (
	"log"
	"os"
	"strings"
	"time"
)

var (
	JwtKey        = []byte(getenv("JWT_SECRET", "change_me_in_env"))
	TokenInCookie = strings.EqualFold(os.Getenv("TOKEN_IN_COOKIE"), "true")
	accessTokenTTL = parseDuration(getenv("ACCESS_TOKEN_TTL", "48h"))
)

func AccessTokenTTL() time.Duration { return accessTokenTTL }

func getenv(k, def string) string {
	if v := strings.TrimSpace(os.Getenv(k)); v != "" {
		return v
	}
	return def
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		log.Printf("WARN: invalid ACCESS_TOKEN_TTL=%q, defaulting to 48h", s)
		return 48 * time.Hour
	}
	return d
}
