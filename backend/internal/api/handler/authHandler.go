package handler

import (
	"net/http"
	"os"
	"strings"
	"time"

	"planify/backend/internal/config"
	"planify/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type LoginPayload struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthHandler struct {
	UserRepo *repository.UserRepository
}

func (h *AuthHandler) Login(c *gin.Context) {
	var payload LoginPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request payload"})
		return
	}
	user, err := h.UserRepo.GetUserByEmail(payload.Email)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}
	if strings.HasPrefix(user.Password, "$2") {
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(payload.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
			return
		}
	} else {
		if user.Password != payload.Password {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
			return
		}
		if hash, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost); err == nil {
			_ = h.UserRepo.UpdatePasswordHash(user.ID, string(hash))
		}
	}
	ttl := config.AccessTokenTTL()
	now := time.Now()
	claims := jwt.MapClaims{
		"uid":   user.ID,
		"email": user.Email,
		"iat":   now.Unix(),
		"exp":   now.Add(ttl).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(config.JwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create token"})
		return
	}
	if config.TokenInCookie {
		secure := strings.EqualFold(os.Getenv("COOKIE_SECURE"), "true")
		var sameSite http.SameSite
		switch strings.ToLower(os.Getenv("COOKIE_SAMESITE")) {
		case "strict":
			sameSite = http.SameSiteStrictMode
		case "none":
			sameSite = http.SameSiteNoneMode
		default:
			sameSite = http.SameSiteLaxMode
		}
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     "access_token",
			Value:    signed,
			Path:     "/",
			HttpOnly: true,
			Secure:   secure,
			SameSite: sameSite,
			Domain:   os.Getenv("COOKIE_DOMAIN"),
			Expires:  now.Add(ttl),
			MaxAge:   int(ttl / time.Second),
		})
	}
	c.JSON(http.StatusOK, gin.H{
		"token":       signed,
		"token_type":  "Bearer",
		"expires_in":  int(ttl / time.Second),
		"user_id":     user.ID,
		"email":       user.Email,
	})
}
