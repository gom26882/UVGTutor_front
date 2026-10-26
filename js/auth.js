
(function() {
    const PAGINAS_ESTUDIANTE = [
        'index.html', 'buscar_tutores.html', 'perfil_tutor.html',
        'reservar_tutorias.html', 'historial.html', 'confirmacion.html'
    ]

    const PAGINAS_TUTOR = [
        'index.html', 'panel_tutor.html', 'perfil_tutor.html',
        'buscar_tutores.html'
    ]

    const usuario = obtenerUsuarioGuardado()

    if (!usuario || !tokenVigente()) {
        cerrarSesion()
        return
    }

    if (!tieneAcceso(usuario)) {
        window.location.replace('index.html')
        return
    }

    mostrarUsuario(usuario)
    ocultarEnlacesNoPermitidos(usuario.rol)
    configurarBotonCerrarSesion()

    function obtenerUsuarioGuardado() {
        try {
            const usuario = JSON.parse(localStorage.getItem('usuario'))
            if (!usuario || !usuario.nombre || !usuario.correo) return null
            if (!['estudiante', 'tutor'].includes(usuario.rol)) return null
            return usuario
        } catch (err) {
            return null
        }
    }

    function tieneAcceso(usuario) {
        const pagina = window.location.pathname.split('/').pop() || 'index.html'
        if (usuario.rol === 'tutor') return PAGINAS_TUTOR.includes(pagina)
        return PAGINAS_ESTUDIANTE.includes(pagina)
    }

    function mostrarUsuario(usuario) {
        const chip = document.getElementById('usuario-chip')
        if (!chip) return

        chip.textContent = usuario.nombre
        chip.title = usuario.correo
    }

    function ocultarEnlacesNoPermitidos(rol) {
        if (rol === 'estudiante') {
            ocultarElementos('a[href="panel_tutor.html"]')
        }

        if (rol === 'tutor') {
            ocultarElementos('a[href="historial.html"]')
            ocultarElementos('a[href^="reservar_tutorias.html"]')
            ocultarElementos('#reservar')
        }
    }

    function ocultarElementos(selector) {
        document.querySelectorAll(selector).forEach(elemento => {
            elemento.style.display = 'none'
        })
    }

    function configurarBotonCerrarSesion() {
        let boton = document.getElementById('btn-cerrar-sesion')
        if (!boton) boton = crearBotonCerrarSesion()
        if (!boton) return

        boton.addEventListener('click', cerrarSesion)
    }

    function crearBotonCerrarSesion() {
        const chip = document.getElementById('usuario-chip')
        if (!chip) return null

        const boton = document.createElement('button')
        boton.id = 'btn-cerrar-sesion'
        boton.type = 'button'
        boton.className = 'boton secundario pequeno'
        boton.textContent = 'Cerrar sesión'
        chip.insertAdjacentElement('afterend', boton)

        return boton
    }

    function cerrarSesion() {
        cerrarSesionLocal()
        window.location.replace('login.html')
    }
})()
