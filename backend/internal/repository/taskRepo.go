package repository

import (
	"database/sql"
	"errors"
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
			p.id, p.name,
			s.id, s.title,
			p.due_date,
			t.priority
		FROM tasks t
		JOIN projects p ON p.id = t.project_id
		JOIN statuses s ON s.id = t.status_id
		WHERE t.id = ?
	`, taskID)

	var td model.TaskDetail
	var desc sql.NullString
	var due sql.NullString
	var prio sql.NullString

	if err := row.Scan(
		&td.ID, &td.Title, &desc,
		&td.ProjectID, &td.ProjectName,
		&td.StatusID, &td.StatusName,
		&due,
		&prio,
	); err != nil {
		return nil, err
	}
	if desc.Valid {
		v := desc.String
		td.Description = &v
	}
	if due.Valid {
		v := due.String
		td.DueDate = &v
	}
	if prio.Valid {
		v := prio.String
		td.Priority = &v
	}

	ar, err := r.DB.Query(`
		SELECT u.id, u.name, u.email, COALESCE(u.avatar,'')
		FROM users u
		JOIN task_assignees ta ON ta.user_id = u.id
		WHERE ta.task_id = ?
	`, taskID)
	if err != nil {
		return nil, err
	}
	defer ar.Close()
	for ar.Next() {
		var u model.User
		if err := ar.Scan(&u.ID, &u.Name, &u.Email, &u.Avatar); err != nil {
			return nil, err
		}
		td.Assignees = append(td.Assignees, u)
	}

	cr, err := r.DB.Query(`
		SELECT u.id, u.name, u.email, COALESCE(u.avatar,'')
		FROM users u
		JOIN task_collaborators tc ON tc.user_id = u.id
		WHERE tc.task_id = ?
	`, taskID)
	if err != nil {
		return nil, err
	}
	defer cr.Close()
	for cr.Next() {
		var u model.User
		if err := cr.Scan(&u.ID, &u.Name, &u.Email, &u.Avatar); err != nil {
			return nil, err
		}
		td.Collaborators = append(td.Collaborators, u)
	}

	atts, err := r.ListAttachments(taskID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	td.Attachments = atts

	comms, err := r.ListComments(taskID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	td.Comments = comms

	return &td, nil
}

func (r *TaskRepository) UpdateFields(taskID int, title *string, description *string, dueDate *string, priority *string) error {
	if title != nil {
		if _, err := r.DB.Exec("UPDATE tasks SET title = ? WHERE id = ?", *title, taskID); err != nil {
			return err
		}
	}
	if description != nil {
		if _, err := r.DB.Exec("UPDATE tasks SET description = ? WHERE id = ?", *description, taskID); err != nil {
			return err
		}
	}
	if dueDate != nil {
		if _, err := r.DB.Exec("UPDATE projects p JOIN tasks t ON p.id = t.project_id SET p.due_date = ? WHERE t.id = ?", *dueDate, taskID); err != nil {
			return err
		}
	}
	if priority != nil {
		if _, err := r.DB.Exec("UPDATE tasks SET priority = ? WHERE id = ?", *priority, taskID); err != nil {
			return err
		}
	}
	return nil
}

func (r *TaskRepository) findUserIDByQuery(q string) (int, error) {
	var id int
	err := r.DB.QueryRow("SELECT id FROM users WHERE email = ? OR name = ? LIMIT 1", q, q).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *TaskRepository) AddAssigneeByQuery(taskID int, q string) error {
	uid, err := r.findUserIDByQuery(q)
	if err != nil {
		return err
	}
	_, _ = r.DB.Exec("INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES (?, ?)", taskID, uid)
	return nil
}

func (r *TaskRepository) AddCollaboratorByQuery(taskID int, q string) error {
	uid, err := r.findUserIDByQuery(q)
	if err != nil {
		return err
	}
	_, _ = r.DB.Exec("INSERT IGNORE INTO task_collaborators (task_id, user_id) VALUES (?, ?)", taskID, uid)
	return nil
}

func (r *TaskRepository) CreateAttachment(taskID int, fileName, storedName string, size int64) (int, error) {
	res, err := r.DB.Exec(`
		INSERT INTO attachments (task_id, file_name, stored_name, size)
		VALUES (?, ?, ?, ?)
	`, taskID, fileName, storedName, size)
	if err != nil {
		return 0, err
	}
	id64, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return int(id64), nil
}

func (r *TaskRepository) ListAttachments(taskID int) ([]model.Attachment, error) {
	rows, err := r.DB.Query(`
		SELECT id, file_name, stored_name, size
		FROM attachments
		WHERE task_id = ?
		ORDER BY id DESC
	`, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []model.Attachment
	for rows.Next() {
		var id int
		var name, stored string
		var size int64
		if err := rows.Scan(&id, &name, &stored, &size); err != nil {
			return nil, err
		}
		out = append(out, model.Attachment{
			ID:       id,
			FileName: name,
			Size:     size,
					URL:      "/uploads/" + stored,
		})
	}
	return out, nil
}

func (r *TaskRepository) ListComments(taskID int) ([]model.TaskComment, error) {
	rows, err := r.DB.Query(`
		SELECT
			c.id, c.text, DATE_FORMAT(c.created_at, '%Y-%m-%dT%H:%i:%sZ'),
			u.id, u.name, u.email, COALESCE(u.avatar,'')
		FROM task_comments c
		LEFT JOIN users u ON u.id = c.user_id
		WHERE c.task_id = ?
		ORDER BY c.id DESC
	`, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []model.TaskComment
	for rows.Next() {
		var id int
		var text string
		var created string
		var uid sql.NullInt64
		var name sql.NullString
		var email sql.NullString
		var avatar sql.NullString

		if err := rows.Scan(&id, &text, &created, &uid, &name, &email, &avatar); err != nil {
			return nil, err
		}

		var author *model.TaskCommentAuthor
		if uid.Valid {
			uidVal := int(uid.Int64)
			var nameVal, emailVal, avatarVal string
			if name.Valid {
				nameVal = name.String
			}
			if email.Valid {
				emailVal = email.String
			}
			if avatar.Valid {
				avatarVal = avatar.String
			}
			author = &model.TaskCommentAuthor{
				ID:     &uidVal,
				Name:   &nameVal,
				Email:  &emailVal,
				Avatar: &avatarVal,
			}
		}

		out = append(out, model.TaskComment{
			ID:        id,
			Text:      text,
			CreatedAt: created,
			Author:    author,
		})
	}

	return out, nil
}

func (r *TaskRepository) AddComment(taskID int, userID *int, text string) error {
	if userID != nil {
		_, err := r.DB.Exec("INSERT INTO task_comments (task_id, user_id, text) VALUES (?, ?, ?)", taskID, *userID, text)
		return err
	}
	_, err := r.DB.Exec("INSERT INTO task_comments (task_id, text) VALUES (?, ?)", taskID, text)
	return err
}