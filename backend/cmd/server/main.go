package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"

	"planify/backend/internal/api/handler"
	"planify/backend/internal/api/middleware"
	"planify/backend/internal/repository"
)

func main() {
	dsn := "root:@tcp(127.0.0.1:3306)/planify?parseTime=true"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	projectRepo := &repository.ProjectRepository{DB: db}
	userRepo := &repository.UserRepository{DB: db}
	taskRepo := &repository.TaskRepository{DB: db}

	projectHandler := &handler.ProjectHandler{Repo: projectRepo}
	authHandler := &handler.AuthHandler{UserRepo: userRepo}
	userHandler := &handler.UserHandler{Repo: userRepo}
	taskHandler := &handler.TaskHandler{Repo: taskRepo}
	settingHandler := &handler.SettingsHandler{UserRepo: userRepo}

	r := gin.Default()
	r.StaticFS("/uploads", http.Dir("uploads"))
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		api.POST("/login", authHandler.Login)
		api.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "UP"}) })

		auth := api.Group("")
		auth.Use(middleware.AuthMiddleware())
		{
			auth.GET("/projects", projectHandler.GetAllProjects)
			auth.GET("/projects/:id", projectHandler.GetProjectByID)
			auth.POST("/projects", projectHandler.CreateProject)
			auth.PATCH("/projects/:id/duedate", projectHandler.UpdateProjectDueDate)
			auth.POST("/projects/:id/tasks", taskHandler.CreateTask)

			auth.GET("/users/search", userHandler.SearchUsers)
			auth.GET("/me/tasks", userHandler.GetMyTasks)

			auth.GET("/tasks/:id", taskHandler.GetTaskByID)
			auth.PATCH("/tasks/:id/move", taskHandler.UpdateTaskPosition)
			auth.PATCH("/tasks/:id", taskHandler.UpdateTaskFields)
			auth.POST("/tasks/:id/assignees", taskHandler.AddAssigneeByQuery)
			auth.POST("/tasks/:id/collaborators", taskHandler.AddCollaboratorByQuery)
			auth.GET("/tasks/:id/comments", taskHandler.ListComments)
			auth.POST("/tasks/:id/comments", taskHandler.AddComment)
			auth.GET("/tasks/:id/attachments", taskHandler.ListAttachments)
			auth.POST("/tasks/:id/attachments", taskHandler.UploadAttachment)

			auth.GET("/me", userHandler.GetMe)
			auth.PATCH("/me", userHandler.PatchMe)
			auth.POST("/me/avatar", userHandler.UploadAvatar)
			auth.PATCH("/me/password", userHandler.ChangePassword)
			auth.GET("/me/summary", userHandler.GetMySummary)
			auth.GET("/me/projects", userHandler.GetMyProjects)

			auth.GET("/users/:id", userHandler.GetUserByID)
			auth.GET("/users/:id/summary", userHandler.GetUserSummary)
			auth.GET("/users/:id/projects", userHandler.GetUserProjects)

			auth.GET("/settings", settingHandler.GetSettings)          
			auth.PATCH("/settings", settingHandler.UpdateSettings) 
		}
	}

	fmt.Println("Backend server is running on http://localhost:8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}