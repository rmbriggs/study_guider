import { api } from './client'

export async function getMyGuides() {
  const { data } = await api.get('/guides')
  return data
}

export async function getGuide(id) {
  const { data } = await api.get(`/guides/${id}`)
  return data
}

export async function createGuide(formData) {
  const { data } = await api.post('/guides', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
