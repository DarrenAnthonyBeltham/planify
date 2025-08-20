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

type UserHandler struct {
	Repo *repository.UserRepository
}

func absoluteOrDefault(host, url string) string {
	if url == "" {
		return "http://" + host + "/uploads/default-avatar.jpg"
	}
	if len(url) >= 8 && (url[:7] == "http://" || url[:8] == "https://") {
		return url
	}
	if len(url) >= 9 && url[:9] == "/uploads/" {
		return "http://" + host + url
	}
	return "http://" + host + "/uploads/default-avatar.jpg"
}

func (h *UserHandler) SearchUsers(c *gin.Context) {
	q := c.Query("q")
	if q == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}
	users, err := h.Repo.SearchUsers(q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}
	host := c.Request.Host
	out := make([]gin.H, 0, len(users))
	for _, u := range users {
		out = append(out, gin.H{
			"id":     u.ID,
			"name":   u.Name,
			"email":  u.Email,
			"avatar": absoluteOrDefault(host, u.Avatar),
		})
	}
	c.JSON(http.StatusOK, out)
}

func (h *UserHandler) GetMyTasks(c *gin.Context) {
	uid, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	tasks, err := h.Repo.GetTasksByUserID(uid.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}
	c.JSON(http.StatusOK, tasks)
}

func (h *UserHandler) GetMe(c *gin.Context) {
	uid, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	u, err := h.Repo.GetByID(uid.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":     u.ID,
		"name":   u.Name,
		"email":  u.Email,
		"avatar": absoluteOrDefault(c.Request.Host, u.Avatar),
	})
}

func (h *UserHandler) GetUserByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	u, err := h.Repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":     u.ID,
		"name":   u.Name,
		"email":  u.Email,
		"avatar": absoluteOrDefault(c.Request.Host, u.Avatar),
	})
}

func (h *UserHandler) PatchMe(c *gin.Context) {
	uid, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	var b struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&b); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}
	u, err := h.Repo.UpdateProfile(uid.(int), b.Name, b.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":     u.ID,
		"name":   u.Name,
		"email":  u.Email,
		"avatar": absoluteOrDefault(c.Request.Host, u.Avatar),
	})
}

func (h *UserHandler) UploadAvatar(c *gin.Context) {
	uidV, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	uid := uidV.(int)

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing file"})
		return
	}

	_ = os.MkdirAll("uploads", 0o755)
	stored := strconv.FormatInt(time.Now().UnixNano(), 10) + "_" + filepath.Base(file.Filename)
	if err := c.SaveUploadedFile(file, filepath.Join("uploads", stored)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save"})
		return
	}
	rel := "/uploads/" + stored
	abs := "http://" + c.Request.Host + rel

	if err := h.Repo.UpdateAvatar(uid, abs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist avatar"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"url": abs})
}

func (h *UserHandler) ChangePassword(c *gin.Context) {
	uid, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	var b struct {
		NewPassword string `json:"newPassword"`
		Password    string `json:"password"`
	}
	if err := c.ShouldBindJSON(&b); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}
	pw := b.Password
	if pw == "" {
		pw = b.NewPassword
	}
	if pw == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing password"})
		return
	}
	if err := h.Repo.UpdatePasswordHash(uid.(int), pw); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to change password"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func (h *UserHandler) GetMySummary(c *gin.Context) {
	uid, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	s, err := h.Repo.GetSummary(uid.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch summary"})
		return
	}
	c.JSON(http.StatusOK, s)
}

func (h *UserHandler) GetMyProjects(c *gin.Context) {
	uid, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	list, err := h.Repo.GetMyProjects(uid.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *UserHandler) GetUserSummary(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	s, err := h.Repo.GetSummary(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch summary"})
		return
	}
	c.JSON(http.StatusOK, s)
}

func (h *UserHandler) GetUserProjects(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	list, err := h.Repo.GetMyProjects(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}
	c.JSON(http.StatusOK, list)
}