package repository

import (
	"database/sql"
	"planify/backend/internal/model"
)

type ProjectRepository struct {
	DB *sql.DB
}

func (r *ProjectRepository) GetAll() ([]model.Project, error) {
	rows, err := r.DB.Query("SELECT id, name, description, created_at FROM projects")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []model.Project
	for rows.Next() {
		var p model.Project
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.CreatedAt); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}

	return projects, nil
}