const API_URL = 'http://localhost:3641/v1'

const INICIO_POR_ROL = {
    estudiante: 'index.html',
    tutor: 'panel_tutor.html'
}

function cerrarSesionLocal() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    localStorage.removeItem('tutouvg_tutor')
    localStorage.removeItem('tutouvg_fecha')
    localStorage.removeItem('tutouvg_hora')
    localStorage.removeItem('tutouvg_horarioISO')
}

function decodificarToken(token = localStorage.getItem('token')) {
    if (!token) return null

    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const json = decodeURIComponent(
            atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        )
        return JSON.parse(json)
    } catch (err) {
        return null
    }
}

function tokenVigente() {
    const payload = decodificarToken()
    return !!payload && typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()
}

function obtenerSesionDesdeToken() {
    if (!tokenVigente()) return null

    const payload = decodificarToken()
    const rol = String(payload.tipoUsuario || '').toLowerCase()

    if (!['estudiante', 'tutor'].includes(rol)) return null

    return {
        id: payload.uid,
        correo: payload.correo,
        rol,
        expira: new Date(payload.exp * 1000)
    }
}

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token')
    const headers = {'Content-Type': 'application/json', ...options.headers}

    if (token) headers.Authorization = `Bearer ${token}`

    let response

    try {
        response = await fetch(`${API_URL}${endpoint}`, {...options, headers})
    } catch (err) {
        throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el back en el puerto 3641?')
    }

    let data = {}

    try {
        data = await response.json()
    } catch (err) {
        data = {}
    }

    if (response.status === 401 && endpoint !== '/auth/login') {
        cerrarSesionLocal()
        window.location.replace('login.html')
        throw new Error('Tu sesión ha expirado')
    }

    if (!response.ok) {
        const mensaje = data.errors?.map(error => error.msg).join(', ')
        throw new Error(mensaje || data.message || `Error en la petición (${response.status})`)
    }

    return data
}
