package repository

import (
	"database/sql"
)

type TaskRepository struct {
	DB *sql.DB
}

type UpdateTaskPayload struct {
	BoardID  int `json:"boardId"`
	Position int `json:"position"`
}

func (r *TaskRepository) UpdatePosition(taskID int, payload UpdateTaskPayload) error {
	query := "UPDATE tasks SET board_id = ?, position = ? WHERE id = ?"
	_, err := r.DB.Exec(query, payload.BoardID, payload.Position, taskID)
	return err
}