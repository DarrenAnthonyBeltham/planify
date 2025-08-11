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

	r := gin.Default()

	// serve uploaded avatars/files
	r.StaticFS("/uploads", http.Dir("uploads"))

	// CORS for Vite dev server
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
			// projects
			auth.GET("/projects", projectHandler.GetAllProjects)
			auth.GET("/projects/:id", projectHandler.GetProjectByID)
			auth.POST("/projects", projectHandler.CreateProject)
			auth.PATCH("/projects/:id/duedate", projectHandler.UpdateProjectDueDate)

			// users/tasks for current user
			auth.GET("/users/search", userHandler.SearchUsers)
			auth.GET("/me/tasks", userHandler.GetMyTasks)

			// tasks
			auth.GET("/tasks/:id", taskHandler.GetTaskByID)
			auth.PATCH("/tasks/:id/move", taskHandler.UpdateTaskPosition)
			auth.PATCH("/tasks/:id", taskHandler.UpdateTaskFields)
			auth.POST("/tasks/:id/assignees", taskHandler.AddAssigneeByQuery)
			auth.POST("/tasks/:id/collaborators", taskHandler.AddCollaboratorByQuery)
			auth.GET("/tasks/:id/comments", taskHandler.ListComments)
			auth.POST("/tasks/:id/comments", taskHandler.AddComment)
			auth.GET("/tasks/:id/attachments", taskHandler.ListAttachments)
			auth.POST("/tasks/:id/attachments", taskHandler.UploadAttachment)

			// profile
			auth.GET("/me", userHandler.GetMe)
			auth.PATCH("/me", userHandler.PatchMe)
			auth.POST("/me/avatar", userHandler.UploadAvatar)
			auth.PATCH("/me/password", userHandler.ChangePassword)
		}
	}

	fmt.Println("Backend server is running on http://localhost:8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
