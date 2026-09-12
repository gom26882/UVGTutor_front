(function () {
    const usuarioGuardadoTexto = localStorage.getItem("usuario");

    if (!usuarioGuardadoTexto) {
        window.location.replace("login.html");
        return;
    }

    let usuario;

    try {
        usuario = JSON.parse(usuarioGuardadoTexto);

        if (!usuario || !usuario.correo || !usuario.rol) {
            throw new Error("Sesión incompleta");
        }
    } catch (error) {
        localStorage.removeItem("usuario");
        window.location.replace("login.html");
        return;
    }

    mostrarUsuarioEnChip(usuario);
    configurarBotonCerrarSesion();

    function mostrarUsuarioEnChip(usuario) {
        const usuarioChip = document.getElementById("usuario-chip");

        if (usuarioChip) {
            usuarioChip.textContent = usuario.nombre;
            usuarioChip.title = usuario.correo;
        }
    }

    function configurarBotonCerrarSesion() {
        const botonCerrarSesion = document.getElementById("btn-cerrar-sesion");

        if (botonCerrarSesion) {
            botonCerrarSesion.addEventListener("click", function () {
                localStorage.removeItem("usuario");
                window.location.replace("login.html");
            });
        }
    }
})();