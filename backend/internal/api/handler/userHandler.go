package handler

import (
	"net/http"
	"planify/backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	Repo *repository.UserRepository
}

func (h *UserHandler) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	users, err := h.Repo.SearchUsers(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}

	c.JSON(http.StatusOK, users)
}