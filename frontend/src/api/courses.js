import { api } from './client'

export async function getProfessors() {
  const { data } = await api.get('/courses/professors')
  return data
}

export async function createProfessor(body) {
  const { data } = await api.post('/courses/professors', body)
  return data
}

export async function getCourses() {
  const { data } = await api.get('/courses')
  return data
}

export async function createCourse(formData) {
  const { data } = await api.post('/courses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
