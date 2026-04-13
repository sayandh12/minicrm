import client from './axiosClient.js'

export const hrmApi = {
  // Employees
  listEmployees: (params) => client.get('/employees', { params }).then((r) => r.data),

  getEmployee: (id) => client.get(`/employees/${id}`).then((r) => r.data),

  getMyProfile: () => client.get('/employees/me').then((r) => r.data),

  createEmployee: (data) => client.post('/employees', data).then((r) => r.data),

  updateEmployee: (id, data) => client.patch(`/employees/${id}`, data).then((r) => r.data),

  deleteEmployee: (id) => client.delete(`/employees/${id}`),

  // Leaves
  listLeaves: (params) => client.get('/leaves', { params }).then((r) => r.data),

  myLeaves: () => client.get('/leaves/my-leaves').then((r) => r.data),

  getPendingLeaves: () => client.get('/leaves/pending').then((r) => r.data),

  applyLeave: (data) => client.post('/leaves', data).then((r) => r.data),

  reviewLeave: (id, data) => client.patch(`/leaves/${id}/review`, data).then((r) => r.data),

  cancelLeave: (id) => client.delete(`/leaves/${id}`).then((r) => r.data),
}
