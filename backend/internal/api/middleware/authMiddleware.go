package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"planify/backend/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)


func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenStr string

		if h := c.GetHeader("Authorization"); strings.HasPrefix(strings.ToLower(h), "bearer ") {
			tokenStr = strings.TrimSpace(h[7:])
		}
		if tokenStr == "" && config.TokenInCookie {
			if cookie, err := c.Cookie("access_token"); err == nil {
				tokenStr = cookie
			}
		}

		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return config.JwtKey, nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if v, ok := claims["uid"].(float64); ok {
				c.Set("userID", int(v))
			}
			if v, ok := claims["email"].(string); ok {
				c.Set("email", v)
			}
		}

		c.Next()
	}
}
