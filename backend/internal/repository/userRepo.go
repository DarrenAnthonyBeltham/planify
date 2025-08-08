package repository

import (
	"database/sql"
	"errors"
	"planify/backend/internal/model"
)

type UserRepository struct {
	DB *sql.DB
}

func (r *UserRepository) GetUserByEmail(email string) (*model.User, error) {
	var u model.User
	err := r.DB.QueryRow(
		"SELECT id, name, email, password, created_at FROM users WHERE email = ?",
		email,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Password, &u.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) SearchUsers(query string) ([]model.User, error) {
	var users []model.User
	rows, err := r.DB.Query(
		"SELECT id, name, email FROM users WHERE name LIKE ? OR email LIKE ?",
		"%"+query+"%", "%"+query+"%",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *UserRepository) GetTasksByUserID(userID int) ([]model.UserTask, error) {
	rows, err := r.DB.Query(`
		SELECT
			t.id, t.title,
			p.id, p.name,
			s.title,
			p.due_date
		FROM tasks t
		LEFT JOIN task_assignees ta ON ta.task_id = t.id
		JOIN projects p ON t.project_id = p.id
		JOIN statuses s ON t.status_id = s.id
		WHERE ta.user_id = ? OR ta.user_id IS NULL
		ORDER BY p.name, t.id
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []model.UserTask
	for rows.Next() {
		var task model.UserTask
		var due sql.NullString
		if err := rows.Scan(&task.ID, &task.Title, &task.ProjectID, &task.ProjectName, &task.StatusName, &due); err != nil {
			return nil, err
		}
		if due.Valid {
			v := due.String
			task.DueDate = &v
		} else {
			task.DueDate = nil
		}
		tasks = append(tasks, task)
	}
	return tasks, nil
}

func (r *UserRepository) UpdatePasswordHash(id int, bcryptHash string) error {
	_, err := r.DB.Exec("UPDATE users SET password = ? WHERE id = ?", bcryptHash, id)
	return err
}
