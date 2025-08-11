package middleware

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"planify/backend/internal/config"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.GetHeader("Authorization")
		if strings.TrimSpace(h) == "" {
		log.Printf("[auth] missing Authorization header (path=%s %s)", c.Request.Method, c.Request.URL.Path)
		c.JSON(http.StatusUnauthorized, gin.H{"error":"Authorization header is required"})
		c.Abort()
		return
    }
		parts := strings.Fields(h)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			log.Println("[auth] bad Authorization header:", h)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
			return
		}
		tokenStr := parts[1]

		claims := jwt.MapClaims{}
		tok, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return config.JwtKey, nil
		})
		if err != nil || !tok.Valid {
			log.Println("[auth] invalid token:", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}
		if exp, ok := claims["exp"].(float64); ok && time.Now().Unix() > int64(exp) {
			log.Println("[auth] expired token")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token expired"})
			return
		}

		var uid int
		if v, ok := claims["uid"].(float64); ok {
			uid = int(v)
		} else if v, ok := claims["userId"].(float64); ok {
			uid = int(v)
		}
		if uid == 0 {
			log.Println("[auth] no uid in claims:", claims)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}
		c.Set("userID", uid)
		c.Next()
	}
}