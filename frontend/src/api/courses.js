import { api } from './client'

export async function getProfessors() {
  const { data } = await api.get('/courses/professors')
  return data
}

export async function createProfessor(body) {
  const { data } = await api.post('/courses/professors', body)
  return data
}

export async function getProfessor(id) {
  const { data } = await api.get(`/courses/professors/${id}`)
  return data
}

export async function updateProfessor(id, body) {
  const { data } = await api.patch(`/courses/professors/${id}`, body)
  return data
}

export async function getCourses() {
  const { data } = await api.get('/courses')
  return data
}

export async function getCourse(id) {
  const { data } = await api.get(`/courses/${id}`)
  return data
}

export async function createCourse(formData) {
  const { data } = await api.post('/courses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function updateCourse(id, body) {
  const { data } = await api.patch(`/courses/${id}`, body)
  return data
}
