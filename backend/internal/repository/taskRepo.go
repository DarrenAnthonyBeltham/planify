package repository

import (
	"database/sql"
)

type TaskRepository struct {
	DB *sql.DB
}

type UpdateTaskPayload struct {
	StatusID int `json:"statusId"`
	Position int `json:"position"`
}

func (r *TaskRepository) UpdatePosition(taskID int, payload UpdateTaskPayload) error {
	query := "UPDATE tasks SET status_id = ?, position = ? WHERE id = ?"
	_, err := r.DB.Exec(query, payload.StatusID, payload.Position, taskID)
	return err
}