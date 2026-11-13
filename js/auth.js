(function() {
    const PAGINAS_ESTUDIANTE = [
        'index.html', 'buscar_tutores.html', 'perfil_tutor.html',
        'reservar_tutorias.html', 'historial.html', 'confirmacion.html',
        'perfil_estudiante.html'
    ]

    const PAGINAS_TUTOR = [
        'panel_tutor.html', 'gestion_tutor.html'
    ]

    const NAVEGACION = {
        estudiante: [
            { href: 'index.html', texto: 'Explorar' },
            { href: 'historial.html', texto: 'Mis tutorías' },
            { href: 'perfil_estudiante.html', texto: 'Mi perfil' }
        ],
        tutor: [
            { href: 'panel_tutor.html', texto: 'Panel' },
            { href: 'gestion_tutor.html', texto: 'Mi perfil de tutor' }
        ]
    }

    window.ACCESO_PERMITIDO = false
    if (typeof obtenerSesionDesdeToken !== 'function') {
        console.error('auth.js: falta <script src="js/api.js"></script> ANTES de auth.js en esta página')
        document.body.insertAdjacentHTML('afterbegin',
            '<p style="padding:16px;background:#5a1a1a;color:#fff;margin:0">' +
            'Error de configuración: esta página no carga <b>js/api.js</b> antes de <b>js/auth.js</b>.</p>')
        return
    }
    document.body.style.visibility = 'hidden'
    setTimeout(() => { document.body.style.visibility = '' }, 1500)

    const sesion = obtenerSesionDesdeToken()

    if (!sesion) {
        cerrarSesion()
        return
    }

    if (!tieneAcceso(sesion.rol)) {
        window.location.replace(INICIO_POR_ROL[sesion.rol])
        return
    }

    window.ACCESO_PERMITIDO = true
    window.SESION = sesion

    construirNavegacion(sesion.rol)
    mostrarUsuario(obtenerUsuarioCacheado())
    configurarBotonCerrarSesion()

    document.body.style.visibility = ''
    window.PERFIL_USUARIO = apiRequest('/user/getUser')
        .then(respuesta => {
            const perfil = respuesta.usuario
            guardarUsuarioEnCache(perfil, sesion.rol)
            mostrarUsuario(perfil)
            return perfil
        })
        .catch(err => {
            console.error(err)
            return obtenerUsuarioCacheado()
        })

    function paginaActual() {
        return window.location.pathname.split('/').pop() || 'index.html'
    }

    function tieneAcceso(rol) {
        const pagina = paginaActual()
        if (rol === 'tutor') return PAGINAS_TUTOR.includes(pagina)
        if (rol === 'estudiante') return PAGINAS_ESTUDIANTE.includes(pagina)
        return false
    }

    function obtenerUsuarioCacheado() {
        try {
            return JSON.parse(localStorage.getItem('usuario'))
        } catch (err) {
            return null
        }
    }

    function guardarUsuarioEnCache(perfil, rol) {
        if (!perfil) return

        localStorage.setItem('usuario', JSON.stringify({
            id: perfil.id,
            nombre: perfil.nombre,
            correo: perfil.correo,
            rol
        }))
    }

    function construirNavegacion(rol) {
        const encabezado = document.querySelector('.encabezado')
        if (!encabezado) return

        const marca = encabezado.querySelector('.marca')
        if (marca) marca.setAttribute('href', INICIO_POR_ROL[rol])

        let nav = encabezado.querySelector('.navegacion')

        if (!nav) {
            nav = document.createElement('nav')
            nav.className = 'navegacion'
            marca ? marca.insertAdjacentElement('afterend', nav) : encabezado.prepend(nav)
        }

        const pagina = paginaActual()

        nav.innerHTML = NAVEGACION[rol].map(enlace => {
            const activo = enlace.href === pagina ? ' class="activo"' : ''
            return `<a href="${enlace.href}"${activo}>${enlace.texto}</a>`
        }).join('')
        if (rol === 'tutor') {
            document.querySelectorAll('a[href^="reservar_tutorias.html"], #reservar').forEach(ocultar)
        }
    }

    function ocultar(elemento) {
        elemento.style.display = 'none'
    }

    function mostrarUsuario(usuario) {
        const chip = document.getElementById('usuario-chip')
        if (!chip || !usuario) return

        chip.textContent = usuario.nombre || (sesion.rol === 'tutor' ? 'Tutor UVG' : 'Estudiante UVG')
        chip.title = `${usuario.correo || ''} · ${sesion.rol === 'tutor' ? 'Tutor' : 'Estudiante'}`
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

        const contenedor = document.createElement('div')
        contenedor.className = 'zona-usuario'
        chip.replaceWith(contenedor)
        contenedor.appendChild(chip)

        const boton = document.createElement('button')
        boton.id = 'btn-cerrar-sesion'
        boton.type = 'button'
        boton.className = 'boton secundario pequeno'
        boton.textContent = 'Cerrar sesión'
        contenedor.appendChild(boton)

        return boton
    }

    function cerrarSesion() {
        cerrarSesionLocal()
        window.location.replace('login.html')
    }
})()
