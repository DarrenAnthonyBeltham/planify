package repository

import (
	"database/sql"
	"planify/backend/internal/model"
)

type UserRepository struct {
	DB *sql.DB
}

func (r *UserRepository) GetUserByEmail(email string) (*model.User, error) {
	var u model.User
	// avatar may be NULL → coalesce to empty string
	q := `
		SELECT id, name, email, COALESCE(avatar, ''), password, created_at
		FROM users
		WHERE email = ?
	`
	err := r.DB.QueryRow(q, email).Scan(
		&u.ID, &u.Name, &u.Email, &u.Avatar, &u.Password, &u.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) GetByID(id int) (*model.User, error) {
	var u model.User
	// avatar may be NULL → coalesce to empty string
	q := `
		SELECT id, name, email, COALESCE(avatar, ''), password, created_at
		FROM users
		WHERE id = ?
	`
	err := r.DB.QueryRow(q, id).Scan(
		&u.ID, &u.Name, &u.Email, &u.Avatar, &u.Password, &u.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) SearchUsers(query string) ([]model.User, error) {
	var users []model.User
	sqlq := `
		SELECT id, name, email, COALESCE(avatar, '')
		FROM users
		WHERE name LIKE ? OR email LIKE ?
	`
	like := "%" + query + "%"
	rows, err := r.DB.Query(sqlq, like, like)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Avatar); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *UserRepository) GetTasksByUserID(userID int) ([]model.UserTask, error) {
	query := `
		SELECT t.id, t.title, p.id, p.name, s.title, pr.due_date
		FROM tasks t
		JOIN task_assignees ta ON t.id = ta.task_id
		JOIN projects p ON t.project_id = p.id
		JOIN statuses s ON t.status_id = s.id
		LEFT JOIN projects pr ON t.project_id = pr.id
		WHERE ta.user_id = ?
		ORDER BY p.name, t.id
	`
	rows, err := r.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []model.UserTask
	for rows.Next() {
		var task model.UserTask
		if err := rows.Scan(
			&task.ID, &task.Title, &task.ProjectID, &task.ProjectName, &task.StatusName, &task.DueDate,
		); err != nil {
			return nil, err
		}
		tasks = append(tasks, task)
	}
	return tasks, nil
}

func (r *UserRepository) UpdatePasswordHash(id int, hash string) error {
	_, err := r.DB.Exec("UPDATE users SET password = ? WHERE id = ?", hash, id)
	return err
}

func (r *UserRepository) UpdateProfile(id int, name, email string) (*model.User, error) {
	_, err := r.DB.Exec("UPDATE users SET name = ?, email = ? WHERE id = ?", name, email, id)
	if err != nil {
		return nil, err
	}
	return r.GetByID(id)
}

func (r *UserRepository) UpdateAvatar(id int, url string) error {
	_, err := r.DB.Exec("UPDATE users SET avatar = ? WHERE id = ?", url, id)
	return err
}