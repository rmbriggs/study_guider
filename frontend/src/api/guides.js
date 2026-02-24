import { api } from './client'

export async function getMyGuides() {
  const { data } = await api.get('/guides')
  return data
}

export async function getGuideOptions() {
  const { data } = await api.get('/guides/options')
  return data
}

export async function getGuide(id) {
  const { data } = await api.get(`/guides/${id}`)
  return data
}

export async function createGuide(formData) {
  const { data } = await api.post('/guides', formData)
  return data
}

/** Create a study guide from a course block's materials (no file upload). */
export async function createGuideFromBlock(body) {
  const { data } = await api.post('/guides/from-block', body)
  return data
}
