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

export async function generateProfessorQuiz(professorId) {
  const { data } = await api.post(`/courses/professors/${professorId}/quiz/generate`)
  return data
}

export async function updateProfessorQuizAnswers(professorId, answers) {
  const { data } = await api.patch(`/courses/professors/${professorId}/quiz/answers`, { answers })
  return data
}

export async function deleteProfessorQuiz(professorId) {
  const { data } = await api.delete(`/courses/professors/${professorId}/quiz`)
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
  const { data } = await api.post('/courses', formData)
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

export async function deleteAttachment(courseId, attachmentId) {
  await api.delete(`/courses/${courseId}/attachments/${attachmentId}`)
}

export async function duplicateAttachment(courseId, attachmentId) {
  const { data } = await api.post(`/courses/${courseId}/attachments/${attachmentId}/duplicate`)
  return data
}

export async function deleteSyllabus(courseId) {
  await api.delete(`/courses/${courseId}/syllabus`)
}

/** Path relative to API base for attachment file (used with api.get for auth) */
function getAttachmentFilePath(courseId, attachmentId) {
  return `/courses/${courseId}/attachments/${attachmentId}/file`
}

/** Path relative to API base for syllabus file */
function getSyllabusFilePath(courseId) {
  return `/courses/${courseId}/syllabus/file`
}

/** Fetch attachment with auth and trigger download. Uses link in DOM for reliability. */
export async function downloadAttachment(courseId, attachmentId, filename) {
  const { data } = await api.get(getAttachmentFilePath(courseId, attachmentId), { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'download'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

/** Fetch syllabus with auth and trigger download */
export async function downloadSyllabus(courseId, filename) {
  const { data } = await api.get(getSyllabusFilePath(courseId), { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'syllabus'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

/** Add files to an existing course. formData should have handouts[], past_tests[], notes[] (FileList or File[]) */
export async function addCourseFiles(courseId, formData) {
  const { data } = await api.post(`/courses/${courseId}/files`, formData)
  return data
}

export async function analyzeTest(courseId, testId) {
  const { data } = await api.post(`/courses/${courseId}/tests/${testId}/analyze`)
  return data
}

export async function getTestAnalysis(courseId, testId) {
  const { data } = await api.get(`/courses/${courseId}/tests/${testId}/analysis`)
  return data
}
