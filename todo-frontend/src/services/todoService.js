const API_URL = 'http://localhost:5000/api/todos';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export const fetchTodos = async () => {
    const response = await fetch(API_URL, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch todos');
    return response.json();
};

export const createTodo = async (todoData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(todoData)
    });
    if (!response.ok) throw new Error('Failed to create todo');
    return response.json();
};

export const updateTodo = async (id, todoData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(todoData)
    });
    if (!response.ok) throw new Error('Failed to update todo');
    return response.json();
};

export const deleteTodo = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to delete todo');
    return response.json();
};

export const toggleTodo = async (id) => {
    const response = await fetch(`${API_URL}/toggle/${id}`, {
        method: 'PATCH',
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to toggle todo');
    return response.json();
};

export const deleteAttachment = async (todoId, attachmentId) => {
    const response = await fetch(`${API_URL}/${todoId}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to delete attachment');
    return response.json();
}; 