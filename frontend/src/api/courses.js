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

/** Returns the syllabus file URL for a course (requires auth) */
export function getSyllabusFileUrl(courseId) {
  const base = api.defaults.baseURL || ''
  return `${base}/courses/${courseId}/syllabus/file`
}

/** Fetch attachment file with auth and open in new tab (for PDF etc.) */
export async function openAttachmentFile(courseId, attachmentId) {
  const { data } = await api.get(getAttachmentFileUrl(courseId, attachmentId), { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  window.open(url, '_blank', 'noopener')
}

/** Fetch attachment with auth and trigger download */
export async function downloadAttachment(courseId, attachmentId, filename) {
  const { data } = await api.get(getAttachmentFileUrl(courseId, attachmentId), { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'download'
  a.click()
  URL.revokeObjectURL(url)
}

/** Fetch syllabus with auth and open in new tab */
export async function openSyllabusFile(courseId) {
  const { data } = await api.get(getSyllabusFileUrl(courseId), { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  window.open(url, '_blank', 'noopener')
}

/** Fetch syllabus with auth and trigger download */
export async function downloadSyllabus(courseId, filename) {
  const { data } = await api.get(getSyllabusFileUrl(courseId), { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'syllabus'
  a.click()
  URL.revokeObjectURL(url)
}

/** Add files to an existing course. formData should have handouts[], past_tests[], notes[] (FileList or File[]) */
export async function addCourseFiles(courseId, formData) {
  const { data } = await api.post(`/courses/${courseId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
