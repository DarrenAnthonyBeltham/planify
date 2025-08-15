package model

type UserTask struct {
	ID               int      `json:"id"`
	Title            string   `json:"title"`
	ProjectID        int      `json:"projectId"`
	ProjectName      string   `json:"projectName"`
	StatusName       string   `json:"statusName"`
	DueDate          *string  `json:"dueDate"`
	Priority         *string  `json:"priority"`
	CommentsCount    int      `json:"commentsCount"`
	AttachmentsCount int      `json:"attachmentsCount"`
}

type Attachment struct {
	ID       int    `json:"id"`
	FileName string `json:"fileName"`
	Size     int64  `json:"size"`
	URL      string `json:"url"`
}

type TaskCommentAuthor struct {
	ID     *int    `json:"id"`
	Name   *string `json:"name"`
	Email  *string `json:"email"`
	Avatar *string `json:"avatar"`
}

type TaskComment struct {
	ID        int               `json:"id"`
	Text      string            `json:"text"`
	CreatedAt string            `json:"createdAt"`
	Author    *TaskCommentAuthor `json:"author"`
}

type TaskDetail struct {
	ID            int           `json:"id"`
	Title         string        `json:"title"`
	Description   *string       `json:"description"`
	ProjectID     int           `json:"projectId"`
	ProjectName   string        `json:"projectName"`
	StatusID      int           `json:"statusId"`
	StatusName    string        `json:"statusName"`
	DueDate       *string       `json:"dueDate"`
	Priority      *string       `json:"priority"`
	Assignees     []User        `json:"assignees"`
	Collaborators []User        `json:"collaborators"`
	Attachments   []Attachment  `json:"attachments"`
	Comments      []TaskComment `json:"comments"`
}