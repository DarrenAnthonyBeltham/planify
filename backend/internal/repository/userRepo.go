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
	query := "SELECT id, name, email, password, created_at FROM users WHERE email = ?"
	err := r.DB.QueryRow(query, email).Scan(&u.ID, &u.Name, &u.Email, &u.Password, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) SearchUsers(query string) ([]model.User, error) {
	var users []model.User
	searchQuery := "SELECT id, name, email FROM users WHERE name LIKE ? OR email LIKE ?"
	likeQuery := "%" + query + "%"

	rows, err := r.DB.Query(searchQuery, likeQuery, likeQuery)
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