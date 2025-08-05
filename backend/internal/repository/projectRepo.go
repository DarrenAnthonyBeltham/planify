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

func (r *ProjectRepository) GetByID(id int) (map[string]interface{}, error) {
	projectData := make(map[string]interface{})

	var name, description string
	var createdAt sql.NullTime
	query := "SELECT name, description, created_at FROM projects WHERE id = ?"
	err := r.DB.QueryRow(query, id).Scan(&name, &description, &createdAt)
	if err != nil {
		return nil, err
	}
	projectData["id"] = id
	projectData["name"] = name
	projectData["description"] = description
	projectData["createdAt"] = createdAt.Time

	var team []model.User
	memberQuery := `
		SELECT u.id, u.name, u.email 
		FROM users u
		JOIN project_members pm ON u.id = pm.user_id
		WHERE pm.project_id = ?`
	memberRows, err := r.DB.Query(memberQuery, id)
	if err != nil {
		return nil, err
	}
	defer memberRows.Close()
	for memberRows.Next() {
		var user model.User
		if err := memberRows.Scan(&user.ID, &user.Name, &user.Email); err != nil {
			return nil, err
		}
		team = append(team, user)
	}
	projectData["team"] = team

	var columns []map[string]interface{}
	statusQuery := "SELECT id, title FROM statuses ORDER BY position"
	statusRows, err := r.DB.Query(statusQuery)
	if err != nil {
		return nil, err
	}
	defer statusRows.Close()

	tasksByStatus := make(map[int][]map[string]interface{})

	taskQuery := `
		SELECT id, status_id, title, description, position 
		FROM tasks 
		WHERE project_id = ?`
	taskRows, err := r.DB.Query(taskQuery, id)
	if err != nil {
		return nil, err
	}
	defer taskRows.Close()

	for taskRows.Next() {
		var taskID, statusID, position int
		var title, description string
		if err := taskRows.Scan(&taskID, &statusID, &title, &description, &position); err != nil {
			return nil, err
		}

		taskData := map[string]interface{}{
			"id":          taskID,
			"title":       title,
			"description": description,
			"position":    position,
			"assignees":   []model.User{}, 
		}
		tasksByStatus[statusID] = append(tasksByStatus[statusID], taskData)
	}

	for statusRows.Next() {
		var statusID int
		var statusTitle string
		if err := statusRows.Scan(&statusID, &statusTitle); err != nil {
			return nil, err
		}
		
		columnData := map[string]interface{}{
			"id":    statusID,
			"title": statusTitle,
			"tasks": tasksByStatus[statusID],
		}
		columns = append(columns, columnData)
	}
	projectData["columns"] = columns

	return projectData, nil
}

type UpdateDueDatePayload struct {
	DueDate sql.NullString `json:"dueDate"` 
}

func (r *ProjectRepository) UpdateDueDate(projectID int, payload UpdateDueDatePayload) error {
	query := "UPDATE projects SET due_date = ? WHERE id = ?"
	_, err := r.DB.Exec(query, payload.DueDate, projectID)
	return err
}

type CreateProjectPayload struct {
	Name        string         `json:"name" binding:"required"`
	Description string         `json:"description"`
	DueDate     sql.NullString `json:"dueDate"`
	TeamIDs     []int          `json:"teamIds"`
}

func (r *ProjectRepository) Create(payload CreateProjectPayload) (*model.Project, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return nil, err
	}

	query := "INSERT INTO projects (name, description, due_date) VALUES (?, ?, ?)"
	res, err := tx.Exec(query, payload.Name, payload.Description, payload.DueDate)
	if err != nil {
		tx.Rollback()
		return nil, err
	}
	projectID, err := res.LastInsertId()
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	if len(payload.TeamIDs) > 0 {
		stmt, err := tx.Prepare("INSERT INTO project_members (project_id, user_id) VALUES (?, ?)")
		if err != nil {
			tx.Rollback()
			return nil, err
		}
		defer stmt.Close()
		for _, userID := range payload.TeamIDs {
			_, err := stmt.Exec(projectID, userID)
			if err != nil {
				tx.Rollback()
				return nil, err
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	newProject := &model.Project{
		ID:          int(projectID),
		Name:        payload.Name,
		Description: payload.Description,
	}
	return newProject, nil
}