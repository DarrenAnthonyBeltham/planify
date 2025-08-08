package repository

import (
	"database/sql"
	"planify/backend/internal/model"
)

type TaskRepository struct {
	DB *sql.DB
}

type UpdateTaskPayload struct {
	StatusID int `json:"statusId"`
	Position int `json:"position"`
}

func (r *TaskRepository) UpdatePosition(taskID int, payload UpdateTaskPayload) error {
	_, err := r.DB.Exec("UPDATE tasks SET status_id = ?, position = ? WHERE id = ?", payload.StatusID, payload.Position, taskID)
	return err
}

func (r *TaskRepository) GetByID(taskID int) (*model.TaskDetail, error) {
	row := r.DB.QueryRow(`
		SELECT
			t.id, t.title, t.description,
			t.project_id, p.name,
			s.id, s.title,
			p.due_date
		FROM tasks t
		JOIN projects p ON t.project_id = p.id
		JOIN statuses s ON t.status_id = s.id
		WHERE t.id = ?
	`, taskID)

	var td model.TaskDetail
	var desc sql.NullString
	var due sql.NullString

	if err := row.Scan(
		&td.ID, &td.Title, &desc,
		&td.ProjectID, &td.ProjectName,
		&td.StatusID, &td.StatusName,
		&due,
	); err != nil {
		return nil, err
	}

	if desc.Valid {
		v := desc.String
		td.Description = &v
	} else {
		td.Description = nil
	}
	if due.Valid {
		v := due.String
		td.DueDate = &v
	} else {
		td.DueDate = nil
	}

	rows, err := r.DB.Query(`
		SELECT u.id, u.name, u.email
		FROM users u
		JOIN task_assignees ta ON ta.user_id = u.id
		WHERE ta.task_id = ?
	`, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assignees []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
			return nil, err
		}
		assignees = append(assignees, u)
	}
	td.Assignees = assignees

	return &td, nil
}
