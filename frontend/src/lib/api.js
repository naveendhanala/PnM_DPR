import axios from 'axios'

const client = axios.create({ baseURL: '/api' })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const login            = (data)        => client.post('/auth/login', data)
export const getMe            = ()            => client.get('/auth/me')

export const getProjects      = ()            => client.get('/projects')
export const createProject    = (data)        => client.post('/projects', data)
export const updateProject    = (id, data)    => client.put(`/projects/${id}`, data)
export const deleteProject    = (id)          => client.delete(`/projects/${id}`)

export const getMachines      = (params)      => client.get('/machines', { params })
export const createMachine    = (data)        => client.post('/machines', data)
export const updateMachine    = (id, data)    => client.put(`/machines/${id}`, data)
export const deleteMachine    = (id)          => client.delete(`/machines/${id}`)

export const getEntries       = (params)      => client.get('/entries', { params })
export const createEntry      = (data)        => client.post('/entries', data)
export const updateEntry      = (id, data)    => client.put(`/entries/${id}`, data)
export const deleteEntry      = (id)          => client.delete(`/entries/${id}`)

export const getUtilization   = (params)      => client.get('/reports/utilization', { params })
export const getSummary       = (params)      => client.get('/reports/summary', { params })

export const getEquipmentTypes   = ()         => client.get('/equipment-types')
export const createEquipmentType = (data)     => client.post('/equipment-types', data)
export const deleteEquipmentType = (id)       => client.delete(`/equipment-types/${id}`)

export const getUsers         = ()            => client.get('/users')
export const createUser       = (data)        => client.post('/users', data)
export const updateUser       = (id, data)    => client.put(`/users/${id}`, data)
export const deleteUser       = (id)          => client.delete(`/users/${id}`)
