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

export async function getCourseMaterials(courseId) {
  const { data } = await api.get(`/courses/${courseId}/materials`)
  return data
}

export async function createTest(courseId, body) {
  const { data } = await api.post(`/courses/${courseId}/tests`, body)
  return data
}

export async function updateTest(courseId, testId, body) {
  const { data } = await api.patch(`/courses/${courseId}/tests/${testId}`, body)
  return data
}

export async function deleteTest(courseId, testId) {
  await api.delete(`/courses/${courseId}/tests/${testId}`)
}

export async function updateAttachment(courseId, attachmentId, body) {
  const { data } = await api.patch(`/courses/${courseId}/attachments/${attachmentId}`, body)
  return data
}

/** Returns the attachment file URL for same-origin fetch with auth (use in window.open after blob fetch or trigger download) */
export function getAttachmentFileUrl(courseId, attachmentId) {
  const base = api.defaults.baseURL || ''
  return `${base}/courses/${courseId}/attachments/${attachmentId}/file`
}

/** Fetch attachment file with auth and open in new tab (for PDF etc.) */
export async function openAttachmentFile(courseId, attachmentId) {
  const { data } = await api.get(getAttachmentFileUrl(courseId, attachmentId), { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  window.open(url, '_blank', 'noopener')
}
