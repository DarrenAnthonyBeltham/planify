package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"time"

	"planify/backend/internal/api/handler"
	"planify/backend/internal/repository"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
)

func main() {
	dsn := "root:@tcp(127.0.0.1:3306)/planify?parseTime=true"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Failed to open database connection:", err)
	}
	defer db.Close()
	db.Ping()

	fmt.Println("Successfully connected to the MySQL database!")

	projectRepo := &repository.ProjectRepository{DB: db}
	projectHandler := &handler.ProjectHandler{Repo: projectRepo}

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, 
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := router.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "UP"}) })
		api.GET("/projects", projectHandler.GetAllProjects)
	}

	fmt.Println("Backend server is running on http://localhost:8080")
	router.Run(":8080")
}