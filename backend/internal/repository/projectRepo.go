package repository

import (
	"database/sql"
	"planify/backend/internal/model"
	"strings"
)

type ProjectRepository struct {
	DB *sql.DB
}

func (r *ProjectRepository) GetAll() ([]model.Project, error) {
	rows, err := r.DB.Query(`SELECT id, name, description, created_at FROM projects`)
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
	var dueDate sql.NullString
	err := r.DB.QueryRow(
		`SELECT name, description, due_date, created_at FROM projects WHERE id = ?`,
		id,
	).Scan(&name, &description, &dueDate, &createdAt)
	if err != nil {
		return nil, err
	}

	projectData["id"] = id
	projectData["name"] = name
	projectData["description"] = description
	if createdAt.Valid {
		projectData["createdAt"] = createdAt.Time
	} else {
		projectData["createdAt"] = nil
	}
	if dueDate.Valid {
		projectData["due_date"] = dueDate.String
	} else {
		projectData["due_date"] = nil
	}

	var team []model.User
	memberRows, err := r.DB.Query(`
		SELECT u.id, u.name, u.email
		FROM users u
		JOIN project_members pm ON u.id = pm.user_id
		WHERE pm.project_id = ?`, id)
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

	statusRows, err := r.DB.Query(`SELECT id, title FROM statuses ORDER BY position`)
	if err != nil {
		return nil, err
	}
	defer statusRows.Close()

	tasksByStatus := make(map[int][]map[string]interface{})

	taskRows, err := r.DB.Query(`
		SELECT id, status_id, title, description, COALESCE(position, 0)
		FROM tasks
		WHERE project_id = ?`, id)
	if err != nil {
		return nil, err
	}
	defer taskRows.Close()

	for taskRows.Next() {
		var taskID, statusID, position int
		var title string
		var desc sql.NullString
		if err := taskRows.Scan(&taskID, &statusID, &title, &desc, &position); err != nil {
			return nil, err
		}
		var descVal string
		if desc.Valid {
			descVal = desc.String
		}
		taskData := map[string]interface{}{
			"id":          taskID,
			"title":       title,
			"description": descVal,
			"position":    position,
			"assignees":   []model.User{},
		}
		tasksByStatus[statusID] = append(tasksByStatus[statusID], taskData)
	}

	var columns []map[string]interface{}
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
	DueDate *string `json:"dueDate"`
}

func (r *ProjectRepository) UpdateDueDate(projectID int, payload UpdateDueDatePayload) error {
	var arg interface{}
	if payload.DueDate != nil && strings.TrimSpace(*payload.DueDate) != "" {
		arg = *payload.DueDate
	} else {
		arg = nil
	}
	_, err := r.DB.Exec(`UPDATE projects SET due_date = ? WHERE id = ?`, arg, projectID)
	return err
}

type CreateProjectPayload struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	DueDate     *string `json:"dueDate"`
	TeamIDs     []int   `json:"teamIds"`
}

func (r *ProjectRepository) Create(payload CreateProjectPayload) (*model.Project, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return nil, err
	}

	var due interface{}
	if payload.DueDate != nil && strings.TrimSpace(*payload.DueDate) != "" {
		due = *payload.DueDate
	} else {
		due = nil
	}

	res, err := tx.Exec(
		`INSERT INTO projects (name, description, due_date) VALUES (?, ?, ?)`,
		payload.Name, payload.Description, due,
	)
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
		stmt, err := tx.Prepare(`INSERT INTO project_members (project_id, user_id) VALUES (?, ?)`)
		if err != nil {
			tx.Rollback()
			return nil, err
		}
		defer stmt.Close()
		for _, userID := range payload.TeamIDs {
			if _, err := stmt.Exec(projectID, userID); err != nil {
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