let adminToken: string | null = null

export const getAdminToken = () => adminToken

export const setAdminToken = (token: string | null) => {
  adminToken = token
}

export const clearAdminToken = () => {
  adminToken = null
}
