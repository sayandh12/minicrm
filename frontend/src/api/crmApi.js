import client from './axiosClient.js'

export const crmApi = {
  listCustomers: (params) => client.get('/customers', { params }).then((r) => r.data),

  getCustomer: (id) => client.get(`/customers/${id}`).then((r) => r.data),
  createCustomer: (data) => client.post('/customers', data).then((r) => r.data),

  updateCustomer: (id, data) => client.patch(`/customers/${id}`, data).then((r) => r.data),

  deleteCustomer: (id) => client.delete(`/customers/${id}`),

  getActivities: (id) => client.get(`/customers/${id}/activities`).then((r) => r.data),

  addActivity: (id, data) =>
    client.post(`/customers/${id}/activities`, data).then((r) => r.data),
}
