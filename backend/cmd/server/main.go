package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"planify/backend/internal/api/handler"
	"planify/backend/internal/repository"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
)

func main() {
	dsn := "root:@tcp(127.0.0.1:3306)/planify?parseTime=true"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	db.Ping()

	fmt.Println("Successfully connected to the MySQL database!")

	projectRepo := &repository.ProjectRepository{DB: db}
	userRepo := &repository.UserRepository{DB: db}
	taskRepo := &repository.TaskRepository{DB: db}

	projectHandler := &handler.ProjectHandler{Repo: projectRepo}
	authHandler := &handler.AuthHandler{UserRepo: userRepo}
	userHandler := &handler.UserHandler{Repo: userRepo}
	taskHandler := &handler.TaskHandler{Repo: taskRepo}

	router := gin.Default()

	router.StaticFS("/uploads", http.Dir("uploads"))

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := router.Group("/api")
	{
		api.POST("/login", authHandler.Login)
		api.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "UP"}) })

		api.GET("/projects", projectHandler.GetAllProjects)
		api.GET("/projects/:id", projectHandler.GetProjectByID)
		api.POST("/projects", projectHandler.CreateProject)
		api.PATCH("/projects/:id/duedate", projectHandler.UpdateProjectDueDate)

		api.GET("/users/search", userHandler.SearchUsers)
		api.GET("/me/tasks", userHandler.GetMyTasks)

		api.GET("/tasks/:id", taskHandler.GetTaskByID)
		api.PATCH("/tasks/:id", taskHandler.UpdateTaskFields)
		api.PATCH("/tasks/:id/move", taskHandler.UpdateTaskPosition)

		api.POST("/tasks/:id/assignees", taskHandler.AddAssigneeByQuery)
		api.POST("/tasks/:id/collaborators", taskHandler.AddCollaboratorByQuery)

		api.GET("/tasks/:id/comments", taskHandler.ListComments)
		api.POST("/tasks/:id/comments", taskHandler.AddComment)

		api.POST("/tasks/:id/attachments", taskHandler.UploadAttachment)
		api.GET("/tasks/:id/attachments", taskHandler.ListAttachments)
	}

	fmt.Println("Backend server is running on http://localhost:8080")
	router.Run(":8080")
}