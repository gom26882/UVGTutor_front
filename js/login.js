const formularioLogin = document.getElementById("form-login");
const inputCorreo = document.getElementById("correo");
const inputContrasena = document.getElementById("contrasena");
const mensajeLogin = document.getElementById("mensaje-login");

// Si ya existe una sesión válida, envía al usuario a su página según su rol.
const sesionExistenteTexto = localStorage.getItem("usuario");

if (sesionExistenteTexto) {
    try {
        const sesionExistente = JSON.parse(sesionExistenteTexto);
        redirigirSegunRol(sesionExistente.rol);
    } catch (error) {
        localStorage.removeItem("usuario");
    }
}

formularioLogin.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const correo = inputCorreo.value.trim().toLowerCase();
    const contrasena = inputContrasena.value;
    const rolSeleccionado = obtenerRolSeleccionado();

    mensajeLogin.textContent = "";
    mensajeLogin.classList.remove("mensaje-error");

    if (correo === "") {
        mostrarError("Ingresa tu correo institucional.");
        inputCorreo.focus();
        return;
    }

    if (!validarFormatoCorreo(correo)) {
        mostrarError("Ingresa un correo con formato válido.");
        inputCorreo.focus();
        return;
    }

    if (!correo.endsWith("@uvg.edu.gt")) {
        mostrarError("Debes utilizar un correo terminado en @uvg.edu.gt.");
        inputCorreo.focus();
        return;
    }

    if (contrasena === "") {
        mostrarError("Ingresa tu contraseña.");
        inputContrasena.focus();
        return;
    }

    if (contrasena.length < 6) {
        mostrarError("La contraseña debe tener al menos 6 caracteres.");
        inputContrasena.focus();
        return;
    }

    if (!rolSeleccionado) {
        mostrarError("Selecciona si ingresas como estudiante o tutor.");
        return;
    }

    const nombreUsuario = obtenerNombreDesdeCorreo(correo);

    const usuario = {
        nombre: nombreUsuario,
        correo: correo,
        rol: rolSeleccionado,
        fechaInicioSesion: new Date().toISOString()
    };

    localStorage.setItem("usuario", JSON.stringify(usuario));

    redirigirSegunRol(rolSeleccionado);
});

function mostrarError(mensaje) {
    mensajeLogin.textContent = mensaje;
    mensajeLogin.classList.add("mensaje-error");
}

function obtenerRolSeleccionado() {
    const inputRol = document.querySelector('input[name="rol"]:checked');
    return inputRol ? inputRol.value : null;
}

function validarFormatoCorreo(correo) {
    const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return patron.test(correo);
}

function redirigirSegunRol(rol) {
    if (rol === "tutor") {
        window.location.replace("panel_tutor.html");
    } else {
        window.location.replace("index.html");
    }
}

function obtenerNombreDesdeCorreo(correo) {
    const nombreCorreo = correo.split("@")[0];

    const palabras = nombreCorreo
        .replace(/[._-]/g, " ")
        .split(" ")
        .filter(function (palabra) {
            return palabra !== "";
        });

    const palabrasCapitalizadas = palabras.map(function (palabra) {
        return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    });

    return palabrasCapitalizadas.join(" ");
}