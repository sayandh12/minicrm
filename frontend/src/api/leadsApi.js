import client from './axiosClient.js'

export const leadsApi = {
  list: (params) => client.get('/leads', { params }).then((r) => r.data),

  get: (id) => client.get(`/leads/${id}`).then((r) => r.data),

  create: (data) => client.post('/leads', data).then((r) => r.data),

  update: (id, data) => client.patch(`/leads/${id}`, data).then((r) => r.data),

  delete: (id) => client.delete(`/leads/${id}`),

  assign: (id, userId) =>
    client.post(`/leads/${id}/assign`, null, { params: { user_id: userId } }).then((r) => r.data),

  convert: (id) => client.post(`/leads/${id}/convert`).then((r) => r.data),

  getActivities: (id) => client.get(`/leads/${id}/activities`).then((r) => r.data),

  addActivity: (id, data) => client.post(`/leads/${id}/activities`, data).then((r) => r.data),

  getFollowUps: () => client.get('/leads/follow-ups').then((r) => r.data),
}
