import { api } from './client'

export function getAdminUsers() {
  return api.get('/admin/users').then((res) => res.data)
}

export function deleteUser(userId) {
  return api.delete(`/admin/users/${userId}`).then((res) => res.data)
}
