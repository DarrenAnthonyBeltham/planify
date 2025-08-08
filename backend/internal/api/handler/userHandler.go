package handler

import (
	"net/http"
	"planify/backend/internal/repository"
	"strconv"

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

func (h *UserHandler) GetMyTasks(c *gin.Context) {
	var id int
	if v, exists := c.Get("userID"); exists {
		id = v.(int)
	} else if qs := c.Query("userId"); qs != "" {
		parsed, err := strconv.Atoi(qs)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid userId"})
			return
		}
		id = parsed
	} else {
		id = 1
	}
	tasks, err := h.Repo.GetTasksByUserID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}
	c.JSON(http.StatusOK, tasks)
}
