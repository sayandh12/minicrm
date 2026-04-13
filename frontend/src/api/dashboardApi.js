import client from './axiosClient.js'

export const dashboardApi = {
  getSummary: () => client.get('/dashboard/summary').then((r) => r.data),
}
