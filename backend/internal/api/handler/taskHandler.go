package handler

import (
	"net/http"
	"planify/backend/internal/repository"
	"strconv"

	"github.com/gin-gonic/gin"
)

type TaskHandler struct {
	Repo *repository.TaskRepository
}

func (h *TaskHandler) UpdateTaskPosition(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var payload repository.UpdateTaskPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if err := h.Repo.UpdatePosition(taskID, payload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task position"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task position updated successfully"})
}