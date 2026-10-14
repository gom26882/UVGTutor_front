(function () {
    const PAGINAS_ESTUDIANTE = [
        "index.html",
        "buscar_tutores.html",
        "perfil_tutor.html",
        "reservar_tutorias.html",
        "historial.html",
        "confirmacion.html"
    ];

    const PAGINAS_TUTOR = [
        "panel_tutor.html",
        "perfil_tutor.html",
        "buscar_tutores.html"
    ];

    const usuario = obtenerUsuarioGuardado();

    if (!usuario) {
        redirigirAlLogin();
        return;
    }

    if (!tieneAcceso(usuario)) {
        redirigirSegunRol(usuario.rol);
        return;
    }

    mostrarUsuario(usuario);
    ocultarEnlacesNoPermitidos(usuario.rol);
    configurarBotonCerrarSesion();

    function obtenerUsuarioGuardado() {
        const usuarioGuardadoTexto = localStorage.getItem("usuario");

        if (!usuarioGuardadoTexto) {
            return null;
        }

        try {
            const usuarioGuardado = JSON.parse(usuarioGuardadoTexto);

            if (
                !usuarioGuardado
                || !usuarioGuardado.nombre
                || !usuarioGuardado.correo
                || !usuarioGuardado.rol
            ) {
                throw new Error("La sesión está incompleta.");
            }

            if (
                usuarioGuardado.rol !== "estudiante"
                && usuarioGuardado.rol !== "tutor"
            ) {
                throw new Error("El rol del usuario no es válido.");
            }

            return usuarioGuardado;
        } catch (error) {
            localStorage.removeItem("usuario");
            return null;
        }
    }

    function obtenerPaginaActual() {
        const partesRuta = window.location.pathname.split("/");
        const paginaActual = partesRuta.pop();

        return paginaActual || "index.html";
    }

    function tieneAcceso(usuarioActual) {
        const paginaActual = obtenerPaginaActual();

        if (usuarioActual.rol === "tutor") {
            return PAGINAS_TUTOR.includes(paginaActual);
        }

        if (usuarioActual.rol === "estudiante") {
            return PAGINAS_ESTUDIANTE.includes(paginaActual);
        }

        return false;
    }

    function mostrarUsuario(usuarioActual) {
        const usuarioChip = document.getElementById("usuario-chip");

        if (!usuarioChip) {
            return;
        }

        usuarioChip.textContent = usuarioActual.nombre;
        usuarioChip.title = usuarioActual.correo;
    }

    function ocultarEnlacesNoPermitidos(rol) {
        if (rol === "estudiante") {
            ocultarElementos('a[href="panel_tutor.html"]');
        }

        if (rol === "tutor") {
            ocultarElementos('a[href="historial.html"]');
            ocultarElementos('a[href="reservar_tutorias.html"]');
        }
    }

    function ocultarElementos(selector) {
        const elementos = document.querySelectorAll(selector);

        elementos.forEach(function (elemento) {
            elemento.style.display = "none";
        });
    }

    function configurarBotonCerrarSesion() {
        let botonCerrarSesion = document.getElementById(
            "btn-cerrar-sesion"
        );

        if (!botonCerrarSesion) {
            botonCerrarSesion = crearBotonCerrarSesion();
        }

        if (!botonCerrarSesion) {
            return;
        }

        botonCerrarSesion.addEventListener(
            "click",
            function () {
                localStorage.removeItem("usuario");
                window.location.replace("login.html");
            }
        );
    }

    function crearBotonCerrarSesion() {
        const usuarioChip = document.getElementById(
            "usuario-chip"
        );

        if (!usuarioChip) {
            return null;
        }

        const boton = document.createElement("button");

        boton.id = "btn-cerrar-sesion";
        boton.type = "button";
        boton.className = "boton secundario pequeno";
        boton.textContent = "Cerrar sesión";

        usuarioChip.insertAdjacentElement(
            "afterend",
            boton
        );

        return boton;
    }

    function redirigirAlLogin() {
        window.location.replace("login.html");
    }

    function redirigirSegunRol(rol) {
        if (rol === "tutor") {
            window.location.replace("panel_tutor.html");
        } else {
            window.location.replace("index.html");
        }
    }
})();