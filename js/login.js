
const formularioLogin = document.getElementById('form-login')
const formularioRegistro = document.getElementById('form-registro')

const pestanaLogin = document.getElementById('tab-login')
const pestanaRegistro = document.getElementById('tab-registro')
const enlaceIrRegistro = document.getElementById('ir-registro')
const enlaceIrLogin = document.getElementById('ir-login')

const inputCorreo = document.getElementById('correo')
const inputContrasena = document.getElementById('contrasena')
const mensajeLogin = document.getElementById('mensaje-login')

const inputNombreRegistro = document.getElementById('registro-nombre')
const inputCorreoRegistro = document.getElementById('registro-correo')
const inputContrasenaRegistro = document.getElementById('registro-contrasena')
const inputConfirmarRegistro = document.getElementById('registro-confirmar')
const mensajeRegistro = document.getElementById('mensaje-registro')
const estadoConfirmacion = document.getElementById('estado-confirmacion')

const requisitosVisuales = {
    longitud: document.getElementById('requisito-longitud'),
    mayuscula: document.getElementById('requisito-mayuscula'),
    minuscula: document.getElementById('requisito-minuscula'),
    numero: document.getElementById('requisito-numero'),
    especial: document.getElementById('requisito-especial')
}

comprobarSesionExistente()
configurarPestanas()
configurarBotonesVisibilidad()
configurarValidacionEnTiempoReal()
configurarCamposRegistro()

formularioLogin.addEventListener('submit', async function(evento) {
    evento.preventDefault()
    limpiarMensaje(mensajeLogin)

    const correo = inputCorreo.value.trim().toLowerCase()
    const contrasena = inputContrasena.value

    if (!validarCorreoInstitucional(correo, mensajeLogin, inputCorreo)) return

    if (!contrasena) {
        mostrarMensaje(mensajeLogin, 'Ingresa tu contraseña.', 'error')
        return
    }

    const boton = formularioLogin.querySelector('button[type="submit"]')
    boton.disabled = true
    boton.textContent = 'Iniciando sesión...'

    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({correo, contrasena})
        })

        const usuario = data.usuario
        const rol = usuario.tipoUsuario.toLowerCase()

        if (!['estudiante', 'tutor'].includes(rol) || !data.token) {
            throw new Error('La respuesta del servidor no es válida')
        }

        const sesion = {
            id: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol,
            fechaInicioSesion: new Date().toISOString()
        }

        localStorage.setItem('token', data.token)
        localStorage.setItem('usuario', JSON.stringify(sesion))

        window.location.replace('index.html')
    } catch (err) {
        mostrarMensaje(mensajeLogin, err.message || 'Error al iniciar sesión', 'error')
    } finally {
        boton.disabled = false
        boton.textContent = 'Iniciar sesión'
    }
})

formularioRegistro.addEventListener('submit', async function(evento) {
    evento.preventDefault()
    limpiarMensaje(mensajeRegistro)

    const nombre = inputNombreRegistro.value.trim()
    const correo = inputCorreoRegistro.value.trim().toLowerCase()
    const contrasena = inputContrasenaRegistro.value
    const confirmarContrasena = inputConfirmarRegistro.value
    const rol = document.querySelector('input[name="rol-registro"]:checked').value

    if (nombre.length < 3) {
        mostrarMensaje(mensajeRegistro, 'Escribe tu nombre completo.', 'error')
        return
    }

    if (!validarCorreoInstitucional(correo, mensajeRegistro, inputCorreoRegistro)) return

    if (!evaluarContrasena(contrasena).esSegura) {
        mostrarMensaje(mensajeRegistro, 'La contraseña no cumple todos los requisitos.', 'error')
        return
    }

    if (contrasena !== confirmarContrasena) {
        mostrarMensaje(mensajeRegistro, 'Las contraseñas no coinciden.', 'error')
        return
    }

    const nuevoUsuario = {
        nombre,
        correo,
        contrasena,
        tipoUsuario: rol === 'tutor' ? 'Tutor' : 'Estudiante'
    }

    if (rol === 'estudiante') {
        nuevoUsuario.carnet = document.getElementById('registro-carnet').value.trim()
    } else {
        nuevoUsuario.experiencia = document.getElementById('registro-experiencia').value.trim()
        nuevoUsuario.precioHora = Number(document.getElementById('registro-precio').value)
        nuevoUsuario.modalidad = document.getElementById('registro-modalidad').value
    }

    const boton = formularioRegistro.querySelector('button[type="submit"]')
    boton.disabled = true
    boton.textContent = 'Creando cuenta...'

    try {
        await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(nuevoUsuario)
        })

        mostrarMensaje(mensajeRegistro, 'Cuenta creada correctamente. Ahora inicia sesión.', 'exito')
        formularioRegistro.reset()
        actualizarRequisitosContrasena('')
        actualizarCoincidenciaContrasenas()
        configurarCamposRegistro()

        setTimeout(() => {
            mostrarFormulario('login')
            inputCorreo.value = correo
            inputContrasena.focus()
        }, 1200)
    } catch (err) {
        mostrarMensaje(mensajeRegistro, err.message || 'Error al registrar usuario', 'error')
    } finally {
        boton.disabled = false
        boton.textContent = 'Crear cuenta'
    }
})

function configurarCamposRegistro() {
    const rol = document.querySelector('input[name="rol-registro"]:checked').value
    const camposEstudiante = document.getElementById('campos-estudiante')
    const camposTutor = document.getElementById('campos-tutor')

    camposEstudiante.hidden = rol !== 'estudiante'
    camposTutor.hidden = rol !== 'tutor'

    camposEstudiante.querySelectorAll('input').forEach(input => {
        input.disabled = rol !== 'estudiante'
    })

    camposTutor.querySelectorAll('input, select').forEach(input => {
        input.disabled = rol !== 'tutor'
    })
}

function configurarPestanas() {
    pestanaLogin.addEventListener('click', () => mostrarFormulario('login'))
    pestanaRegistro.addEventListener('click', () => mostrarFormulario('registro'))

    enlaceIrRegistro.addEventListener('click', evento => {
        evento.preventDefault()
        mostrarFormulario('registro')
    })

    enlaceIrLogin.addEventListener('click', evento => {
        evento.preventDefault()
        mostrarFormulario('login')
    })

    document.querySelectorAll('input[name="rol-registro"]').forEach(input => {
        input.addEventListener('change', configurarCamposRegistro)
    })
}

function mostrarFormulario(formularioActivo) {
    const mostrarLogin = formularioActivo === 'login'

    formularioLogin.hidden = !mostrarLogin
    formularioRegistro.hidden = mostrarLogin

    pestanaLogin.classList.toggle('activa', mostrarLogin)
    pestanaRegistro.classList.toggle('activa', !mostrarLogin)
    pestanaLogin.classList.toggle('secundario', !mostrarLogin)
    pestanaRegistro.classList.toggle('secundario', mostrarLogin)

    pestanaLogin.setAttribute('aria-selected', String(mostrarLogin))
    pestanaRegistro.setAttribute('aria-selected', String(!mostrarLogin))

    limpiarMensaje(mensajeLogin)
    limpiarMensaje(mensajeRegistro)

    if (mostrarLogin) inputCorreo.focus()
    else inputNombreRegistro.focus()
}

function configurarBotonesVisibilidad() {
    document.querySelectorAll('[data-mostrar-contrasena]').forEach(boton => {
        boton.addEventListener('click', function() {
            const input = document.getElementById(boton.dataset.mostrarContrasena)
            const oculta = input.type === 'password'
            input.type = oculta ? 'text' : 'password'
            boton.textContent = oculta ? 'Ocultar' : 'Mostrar'
        })
    })
}

function configurarValidacionEnTiempoReal() {
    inputContrasenaRegistro.addEventListener('input', function() {
        actualizarRequisitosContrasena(inputContrasenaRegistro.value)
        actualizarCoincidenciaContrasenas()
    })

    inputConfirmarRegistro.addEventListener('input', actualizarCoincidenciaContrasenas)
}

function evaluarContrasena(contrasena) {
    const requisitos = {
        longitud: contrasena.length >= 8,
        mayuscula: /[A-Z]/.test(contrasena),
        minuscula: /[a-z]/.test(contrasena),
        numero: /[0-9]/.test(contrasena),
        especial: /[^A-Za-z0-9]/.test(contrasena)
    }

    requisitos.esSegura = Object.values(requisitos).every(Boolean)
    return requisitos
}

function actualizarRequisitosContrasena(contrasena) {
    const requisitos = evaluarContrasena(contrasena)

    Object.keys(requisitosVisuales).forEach(nombre => {
        requisitosVisuales[nombre].classList.toggle('cumplido', requisitos[nombre])
    })
}

function actualizarCoincidenciaContrasenas() {
    const contrasena = inputContrasenaRegistro.value
    const confirmacion = inputConfirmarRegistro.value

    estadoConfirmacion.classList.remove('coincide', 'no-coincide')

    if (!confirmacion) {
        estadoConfirmacion.textContent = ''
        return
    }

    const coincide = contrasena === confirmacion
    estadoConfirmacion.textContent = coincide ? 'Las contraseñas coinciden.' : 'Las contraseñas no coinciden.'
    estadoConfirmacion.classList.add(coincide ? 'coincide' : 'no-coincide')
}

function validarCorreoInstitucional(correo, contenedor, input) {
    if (!correo) {
        mostrarMensaje(contenedor, 'Ingresa tu correo institucional.', 'error')
        input.focus()
        return false
    }

    if (!/^[^\s@]+@uvg\.edu\.gt$/.test(correo)) {
        mostrarMensaje(contenedor, 'Debes utilizar un correo válido @uvg.edu.gt.', 'error')
        input.focus()
        return false
    }

    return true
}

function comprobarSesionExistente() {
    const usuarioTexto = localStorage.getItem('usuario')

    if (!usuarioTexto || !tokenVigente()) {
        cerrarSesionLocal()
        return
    }

    try {
        const usuario = JSON.parse(usuarioTexto)
        if (!['estudiante', 'tutor'].includes(usuario.rol)) throw new Error('Sesión inválida')
        window.location.replace('index.html')
    } catch (err) {
        cerrarSesionLocal()
    }
}

function mostrarMensaje(contenedor, mensaje, tipo) {
    contenedor.textContent = mensaje
    contenedor.classList.remove('mensaje-error', 'mensaje-exito')
    contenedor.classList.add(tipo === 'exito' ? 'mensaje-exito' : 'mensaje-error')
}

function limpiarMensaje(contenedor) {
    contenedor.textContent = ''
    contenedor.classList.remove('mensaje-error', 'mensaje-exito')
}
