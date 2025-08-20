package repository

import (
	"database/sql"
	"time"

	"planify/backend/internal/model"
)

type UserRepository struct {
	DB *sql.DB
}

type Summary struct {
	AssignedCount     int              `json:"assignedCount"`
	CollaboratorCount int              `json:"collaboratorCount"`
	CommentCount      int              `json:"commentCount"`
	ProjectCount      int              `json:"projectCount"`
	RecentActivity    []RecentActivity `json:"recentActivity"`
}

type RecentActivity struct {
	ID        int     `json:"id"`
	Text      string  `json:"text"`
	CreatedAt string  `json:"createdAt"`
	TaskTitle *string `json:"taskTitle"`
}

type LiteProject struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
	DueDate     *string `json:"dueDate"`
}

func defaultAvatar(s string) string {
	if s == "" {
		return "/assets/default-avatar.jpg"
	}
	return s
}

func (r *UserRepository) GetUserByEmail(email string) (*model.User, error) {
	var u model.User
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
	u.Avatar = defaultAvatar(u.Avatar)
	return &u, nil
}

func (r *UserRepository) GetByID(id int) (*model.User, error) {
	var u model.User
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
	u.Avatar = defaultAvatar(u.Avatar)
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
		u.Avatar = defaultAvatar(u.Avatar)
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

func (r *UserRepository) GetSummary(userID int) (*Summary, error) {
	var s Summary

	r.DB.QueryRow("SELECT COALESCE(COUNT(DISTINCT task_id),0) FROM task_assignees WHERE user_id = ?", userID).Scan(&s.AssignedCount)
	r.DB.QueryRow("SELECT COALESCE(COUNT(DISTINCT task_id),0) FROM task_collaborators WHERE user_id = ?", userID).Scan(&s.CollaboratorCount)
	r.DB.QueryRow("SELECT COALESCE(COUNT(*),0) FROM task_comments WHERE user_id = ?", userID).Scan(&s.CommentCount)

	r.DB.QueryRow(`
		SELECT COALESCE(COUNT(DISTINCT p.id),0)
		FROM projects p
		LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
		LEFT JOIN tasks t            ON t.project_id = p.id
		LEFT JOIN task_assignees ta  ON ta.task_id = t.id AND ta.user_id = ?
		LEFT JOIN task_collaborators tc ON tc.task_id = t.id AND tc.user_id = ?
		WHERE pm.user_id IS NOT NULL
		   OR ta.user_id IS NOT NULL
		   OR tc.user_id IS NOT NULL
	`, userID, userID, userID).Scan(&s.ProjectCount)

	rows, err := r.DB.Query(`
		SELECT c.id, c.text, c.created_at, t.title
		FROM task_comments c
		JOIN tasks t ON t.id = c.task_id
		WHERE c.user_id = ?
		ORDER BY c.id DESC
		LIMIT 10
	`, userID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var a RecentActivity
			var created time.Time
			var title sql.NullString
			if err := rows.Scan(&a.ID, &a.Text, &created, &title); err != nil {
				continue
			}
			a.CreatedAt = created.UTC().Format(time.RFC3339)
			if title.Valid {
				v := title.String
				a.TaskTitle = &v
			}
			s.RecentActivity = append(s.RecentActivity, a)
		}
	}
	return &s, nil
}

func (r *UserRepository) GetMyProjects(userID int) ([]LiteProject, error) {
	rows, err := r.DB.Query(`
		SELECT DISTINCT p.id, p.name, p.description, p.due_date
		FROM projects p
		LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
		LEFT JOIN tasks t          ON t.project_id = p.id
		LEFT JOIN task_assignees ta ON ta.task_id = t.id AND ta.user_id = ?
		LEFT JOIN task_collaborators tc ON tc.task_id = t.id AND tc.user_id = ?
		WHERE pm.user_id IS NOT NULL
		   OR ta.user_id IS NOT NULL
		   OR tc.user_id IS NOT NULL
		ORDER BY p.id DESC
		LIMIT 50
	`, userID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []LiteProject
	for rows.Next() {
		var p LiteProject
		var desc, due sql.NullString
		if err := rows.Scan(&p.ID, &p.Name, &desc, &due); err != nil {
			return nil, err
		}
		if desc.Valid {
			v := desc.String
			p.Description = &v
		}
		if due.Valid {
			v := due.String
			p.DueDate = &v
		}
		out = append(out, p)
	}
	return out, nil
}

func (r *UserRepository) GetProjectsByUserID(userID int) ([]LiteProject, error) {
	rows, err := r.DB.Query(`
		SELECT DISTINCT p.id, p.name, p.description, p.due_date
		FROM projects p
		JOIN tasks t ON t.project_id = p.id
		JOIN task_assignees ta ON ta.task_id = t.id
		WHERE ta.user_id = ?
		ORDER BY p.id DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []LiteProject
	for rows.Next() {
		var p LiteProject
		var desc sql.NullString
		var due sql.NullString
		if err := rows.Scan(&p.ID, &p.Name, &desc, &due); err != nil {
			return nil, err
		}
		if desc.Valid {
			v := desc.String
			p.Description = &v
		}
		if due.Valid {
			v := due.String
			p.DueDate = &v
		}
		out = append(out, p)
	}
	return out, nil
}