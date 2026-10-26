
const API_URL = 'http://localhost:3641/v1'

function cerrarSesionLocal() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
}

function tokenVigente() {
    const token = localStorage.getItem('token')
    if (!token) return false

    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()
    } catch (err) {
        return false
    }
}

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token')
    const headers = {'Content-Type': 'application/json', ...options.headers}

    if (token) headers.Authorization = `Bearer ${token}`

    const response = await fetch(`${API_URL}${endpoint}`, {...options, headers})
    const data = await response.json()

    if (response.status === 401 && endpoint !== '/auth/login') {
        cerrarSesionLocal()
        window.location.replace('login.html')
        throw new Error('Tu sesión ha expirado')
    }

    if (!response.ok) {
        const mensaje = data.errors?.map(error => error.msg).join(', ')
        throw new Error(mensaje || data.message || 'Error en la petición')
    }

    return data
}
