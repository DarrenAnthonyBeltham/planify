package handler

import (
	"database/sql"
	"net/http"
	"planify/backend/internal/repository"
	"strconv"

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

func (h *ProjectHandler) GetProjectByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}
	project, err := h.Repo.GetByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, project)
}

func (h *ProjectHandler) UpdateProjectDueDate(c *gin.Context) {
	projectID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}
	var payload repository.UpdateDueDatePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}
	if err := h.Repo.UpdateDueDate(projectID, payload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update due date"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Due date updated successfully"})
}

func (h *ProjectHandler) CreateProject(c *gin.Context) {
	var payload repository.CreateProjectPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}
	project, err := h.Repo.Create(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
		return
	}
	c.JSON(http.StatusCreated, project)
}