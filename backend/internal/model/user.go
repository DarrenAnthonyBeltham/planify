package model

import "time"

type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	Avatar    string    `json:"avatar"`
	CreatedAt time.Time `json:"createdAt"`
}

type UserSettings struct {
	UserID                 int    `json:"userId"`
	NotificationsAssign    bool   `json:"notificationsAssign"`
	NotificationsDueDate   bool   `json:"notificationsDueDate"`
	NotificationsComments  bool   `json:"notificationsComments"`
	AppearanceTheme        string `json:"appearanceTheme"`
}