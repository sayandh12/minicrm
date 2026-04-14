import client from './axiosClient.js'

export const authApi = {
  login: (email, password) =>
    client.post('/auth/login', { email, password }).then((r) => r.data),

  refresh: (refresh_token) =>
    client.post('/auth/refresh', { refresh_token }).then((r) => r.data),

  me: () => client.get('/auth/me').then((r) => r.data),

  updateMe: (data) => client.patch('/auth/me', data).then((r) => r.data),

  createUser: (data) => client.post('/auth/users', data).then((r) => r.data),

  listUsers: (params) => client.get('/auth/users', { params }).then((r) => r.data),

  updateUser: (id, data) => client.patch(`/auth/users/${id}`, data).then((r) => r.data),
}
