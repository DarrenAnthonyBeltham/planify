package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"planify/backend/internal/repository"
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

func (h *TaskHandler) GetTaskByID(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}
	task, err := h.Repo.GetByID(taskID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}
	c.JSON(http.StatusOK, task)
}

func (h *TaskHandler) UpdateTaskFields(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}
	var payload struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
		DueDate     *string `json:"dueDate"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}
	if err := h.Repo.UpdateFields(taskID, payload.Title, payload.Description, payload.DueDate); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task fields"})
		return
	}
	td, _ := h.Repo.GetByID(taskID)
	c.JSON(http.StatusOK, td)
}

func (h *TaskHandler) UploadAttachment(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing file"})
		return
	}
	_ = os.MkdirAll("uploads", 0o755)
	stored := strconv.FormatInt(time.Now().UnixNano(), 10) + "_" + filepath.Base(file.Filename)
	if err := c.SaveUploadedFile(file, filepath.Join("uploads", stored)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	id, err := h.Repo.CreateAttachment(taskID, file.Filename, stored, file.Size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record file"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "fileName": file.Filename, "size": file.Size, "url": "/uploads/" + stored})
}

func (h *TaskHandler) ListAttachments(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}
	atts, err := h.Repo.ListAttachments(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list attachments"})
		return
	}
	c.JSON(http.StatusOK, atts)
}

func (h *TaskHandler) AddAssigneeByQuery(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}
	var body struct {
		Query string `json:"query"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query"})
		return
	}
	if err := h.Repo.AddAssigneeByQuery(taskID, body.Query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
		return
	}
	td, _ := h.Repo.GetByID(taskID)
	c.JSON(http.StatusOK, td)
}

func (h *TaskHandler) AddCollaboratorByQuery(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}
	var body struct {
		Query string `json:"query"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query"})
		return
	}
	if err := h.Repo.AddCollaboratorByQuery(taskID, body.Query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
		return
	}
	td, _ := h.Repo.GetByID(taskID)
	c.JSON(http.StatusOK, td)
}

func (h *TaskHandler) AddComment(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}
	var body struct {
		AuthorID *int   `json:"authorId"`
		Text     string `json:"text"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Text == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}
	if err := h.Repo.AddComment(taskID, body.AuthorID, body.Text); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add comment"})
		return
	}
	comments, _ := h.Repo.ListComments(taskID)
	c.JSON(http.StatusCreated, comments)
}

func (h *TaskHandler) ListComments(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}
	comments, err := h.Repo.ListComments(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}
	c.JSON(http.StatusOK, comments)
}
