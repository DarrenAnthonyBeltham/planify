package config

import "time"

var JwtKey = []byte("my_super_secret_key")
var TokenInCookie = false

func AccessTokenTTL() time.Duration { return 48 * time.Hour }