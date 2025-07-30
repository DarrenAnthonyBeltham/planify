package handler

import (
	"net/http"
	"planify/backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type ProjectHandler struct {
	Repo *repository.ProjectRepository
}

func (h *ProjectHandler) GetAllProjects(c *gin.Context) {
	projects, err := h.Repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}

	c.JSON(http.StatusOK, projects)
}