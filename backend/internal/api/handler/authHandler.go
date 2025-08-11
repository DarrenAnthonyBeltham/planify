package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"planify/backend/internal/config"
	"planify/backend/internal/repository"
)

type LoginPayload struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthHandler struct {
	UserRepo *repository.UserRepository
}

func (h *AuthHandler) Login(c *gin.Context) {
	var p LoginPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	u, err := h.UserRepo.GetUserByEmail(p.Email)
	if err != nil || u == nil || u.Password != p.Password {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	now := time.Now()
	ttl := config.AccessTokenTTL()
	claims := jwt.MapClaims{
		"uid":   u.ID,         
		"email": u.Email,
		"iat":   now.Unix(),
		"exp":   now.Add(ttl).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(config.JwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":      signed,
		"token_type": "Bearer",
		"expires_in": int(ttl / time.Second),
		"user_id":    u.ID,
		"email":      u.Email,
	})
}
