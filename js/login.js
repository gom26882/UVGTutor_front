const formularioLogin = document.getElementById("form-login");
const formularioRegistro = document.getElementById("form-registro");

const pestanaLogin = document.getElementById("tab-login");
const pestanaRegistro = document.getElementById("tab-registro");
const enlaceIrRegistro = document.getElementById("ir-registro");
const enlaceIrLogin = document.getElementById("ir-login");

const inputCorreo = document.getElementById("correo");
const inputContrasena = document.getElementById("contrasena");
const mensajeLogin = document.getElementById("mensaje-login");

const inputNombreRegistro = document.getElementById("registro-nombre");
const inputCorreoRegistro = document.getElementById("registro-correo");
const inputContrasenaRegistro = document.getElementById("registro-contrasena");
const inputConfirmarRegistro = document.getElementById("registro-confirmar");
const mensajeRegistro = document.getElementById("mensaje-registro");
const estadoConfirmacion = document.getElementById("estado-confirmacion");

const requisitosVisuales = {
    longitud: document.getElementById("requisito-longitud"),
    mayuscula: document.getElementById("requisito-mayuscula"),
    minuscula: document.getElementById("requisito-minuscula"),
    numero: document.getElementById("requisito-numero"),
    especial: document.getElementById("requisito-especial")
};

comprobarSesionExistente();
configurarPestanas();
configurarBotonesVisibilidad();
configurarValidacionEnTiempoReal();

formularioLogin.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limpiarMensaje(mensajeLogin);

    const correo = inputCorreo.value.trim().toLowerCase();
    const contrasena = inputContrasena.value;
    const rolSeleccionado = obtenerRolSeleccionado("rol");

    if (!validarCorreoInstitucional(correo, mensajeLogin, inputCorreo)) {
        return;
    }

    if (contrasena === "") {
        mostrarMensaje(mensajeLogin, "Ingresa tu contraseña.", "error");
        inputContrasena.focus();
        return;
    }

    const usuarios = obtenerUsuarios();

    const usuarioEncontrado = usuarios.find(function (usuario) {
        return usuario.correo === correo;
    });

    if (!usuarioEncontrado) {
        mostrarMensaje(
            mensajeLogin,
            "No existe una cuenta con ese correo. Primero debes registrarte.",
            "error"
        );

        inputCorreo.focus();
        return;
    }

    if (usuarioEncontrado.contrasena !== contrasena) {
        mostrarMensaje(mensajeLogin, "La contraseña es incorrecta.", "error");
        inputContrasena.focus();
        return;
    }

    if (usuarioEncontrado.rol !== rolSeleccionado) {
        mostrarMensaje(
            mensajeLogin,
            "Esta cuenta está registrada como " + usuarioEncontrado.rol + ".",
            "error"
        );

        return;
    }

    iniciarSesion(usuarioEncontrado);
});

formularioRegistro.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limpiarMensaje(mensajeRegistro);

    const nombre = inputNombreRegistro.value.trim();
    const correo = inputCorreoRegistro.value.trim().toLowerCase();
    const contrasena = inputContrasenaRegistro.value;
    const confirmarContrasena = inputConfirmarRegistro.value;
    const rolSeleccionado = obtenerRolSeleccionado("rol-registro");

    if (nombre.length < 3) {
        mostrarMensaje(mensajeRegistro, "Escribe tu nombre completo.", "error");
        inputNombreRegistro.focus();
        return;
    }

    if (!validarCorreoInstitucional(correo, mensajeRegistro, inputCorreoRegistro)) {
        return;
    }

    const requisitos = evaluarContrasena(contrasena);

    if (!requisitos.esSegura) {
        mostrarMensaje(
            mensajeRegistro,
            "La contraseña todavía no cumple todos los requisitos.",
            "error"
        );

        inputContrasenaRegistro.focus();
        return;
    }

    if (contrasena !== confirmarContrasena) {
        mostrarMensaje(mensajeRegistro, "Las contraseñas no coinciden.", "error");
        inputConfirmarRegistro.focus();
        return;
    }

    const usuarios = obtenerUsuarios();

    const correoYaRegistrado = usuarios.some(function (usuario) {
        return usuario.correo === correo;
    });

    if (correoYaRegistrado) {
        mostrarMensaje(
            mensajeRegistro,
            "Ya existe una cuenta registrada con ese correo.",
            "error"
        );

        inputCorreoRegistro.focus();
        return;
    }

    const nuevoUsuario = {
        id: Date.now(),
        nombre: nombre,
        correo: correo,
        contrasena: contrasena,
        rol: rolSeleccionado,
        fechaRegistro: new Date().toISOString()
    };

    usuarios.push(nuevoUsuario);
    guardarUsuarios(usuarios);

    mostrarMensaje(
        mensajeRegistro,
        "Cuenta creada correctamente. Ahora puedes iniciar sesión.",
        "exito"
    );

    formularioRegistro.reset();
    actualizarRequisitosContrasena("");
    actualizarCoincidenciaContrasenas();

    setTimeout(function () {
        mostrarFormulario("login");
        inputCorreo.value = correo;
        inputContrasena.focus();
    }, 1200);
});

function configurarPestanas() {
    pestanaLogin.addEventListener("click", function () {
        mostrarFormulario("login");
    });

    pestanaRegistro.addEventListener("click", function () {
        mostrarFormulario("registro");
    });

    enlaceIrRegistro.addEventListener("click", function (evento) {
        evento.preventDefault();
        mostrarFormulario("registro");
    });

    enlaceIrLogin.addEventListener("click", function (evento) {
        evento.preventDefault();
        mostrarFormulario("login");
    });
}

function mostrarFormulario(formularioActivo) {
    const mostrarLogin = formularioActivo === "login";

    formularioLogin.hidden = !mostrarLogin;
    formularioRegistro.hidden = mostrarLogin;

    pestanaLogin.classList.toggle("activa", mostrarLogin);
    pestanaRegistro.classList.toggle("activa", !mostrarLogin);

    pestanaLogin.classList.toggle("secundario", !mostrarLogin);
    pestanaRegistro.classList.toggle("secundario", mostrarLogin);

    pestanaLogin.setAttribute("aria-selected", String(mostrarLogin));
    pestanaRegistro.setAttribute("aria-selected", String(!mostrarLogin));

    limpiarMensaje(mensajeLogin);
    limpiarMensaje(mensajeRegistro);

    if (mostrarLogin) {
        inputCorreo.focus();
    } else {
        inputNombreRegistro.focus();
    }
}

function configurarBotonesVisibilidad() {
    const botones = document.querySelectorAll("[data-mostrar-contrasena]");

    botones.forEach(function (boton) {
        boton.addEventListener("click", function () {
            const idInput = boton.dataset.mostrarContrasena;
            const input = document.getElementById(idInput);
            const estaOculta = input.type === "password";

            if (estaOculta) {
                input.type = "text";
                boton.textContent = "Ocultar";
            } else {
                input.type = "password";
                boton.textContent = "Mostrar";
            }
        });
    });
}

function configurarValidacionEnTiempoReal() {
    inputContrasenaRegistro.addEventListener("input", function () {
        actualizarRequisitosContrasena(inputContrasenaRegistro.value);
        actualizarCoincidenciaContrasenas();
    });

    inputConfirmarRegistro.addEventListener("input", function () {
        actualizarCoincidenciaContrasenas();
    });
}

function evaluarContrasena(contrasena) {
    const requisitos = {
        longitud: contrasena.length >= 8,
        mayuscula: /[A-Z]/.test(contrasena),
        minuscula: /[a-z]/.test(contrasena),
        numero: /[0-9]/.test(contrasena),
        especial: /[^A-Za-z0-9]/.test(contrasena)
    };

    requisitos.esSegura = (
        requisitos.longitud
        && requisitos.mayuscula
        && requisitos.minuscula
        && requisitos.numero
        && requisitos.especial
    );

    return requisitos;
}

function actualizarRequisitosContrasena(contrasena) {
    const requisitos = evaluarContrasena(contrasena);

    Object.keys(requisitosVisuales).forEach(function (nombreRequisito) {
        const elemento = requisitosVisuales[nombreRequisito];
        const requisitoCumplido = requisitos[nombreRequisito];

        elemento.classList.toggle("cumplido", requisitoCumplido);
    });
}

function actualizarCoincidenciaContrasenas() {
    const contrasena = inputContrasenaRegistro.value;
    const confirmacion = inputConfirmarRegistro.value;

    estadoConfirmacion.classList.remove("coincide", "no-coincide");

    if (confirmacion === "") {
        estadoConfirmacion.textContent = "";
        return;
    }

    if (contrasena === confirmacion) {
        estadoConfirmacion.textContent = "Las contraseñas coinciden.";
        estadoConfirmacion.classList.add("coincide");
    } else {
        estadoConfirmacion.textContent = "Las contraseñas no coinciden.";
        estadoConfirmacion.classList.add("no-coincide");
    }
}

function validarCorreoInstitucional(correo, contenedorMensaje, input) {
    if (correo === "") {
        mostrarMensaje(contenedorMensaje, "Ingresa tu correo institucional.", "error");
        input.focus();
        return false;
    }

    const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!patronCorreo.test(correo)) {
        mostrarMensaje(contenedorMensaje, "Ingresa un correo con formato válido.", "error");
        input.focus();
        return false;
    }

    if (!correo.endsWith("@uvg.edu.gt")) {
        mostrarMensaje(
            contenedorMensaje,
            "Debes utilizar un correo terminado en @uvg.edu.gt.",
            "error"
        );

        input.focus();
        return false;
    }

    return true;
}

function obtenerRolSeleccionado(nombreGrupo) {
    const inputRol = document.querySelector(
        'input[name="' + nombreGrupo + '"]:checked'
    );

    return inputRol ? inputRol.value : null;
}

function obtenerUsuarios() {
    const usuariosGuardados = localStorage.getItem("usuarios");

    if (!usuariosGuardados) {
        return [];
    }

    try {
        const usuarios = JSON.parse(usuariosGuardados);
        return Array.isArray(usuarios) ? usuarios : [];
    } catch (error) {
        localStorage.removeItem("usuarios");
        return [];
    }
}

function guardarUsuarios(usuarios) {
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function iniciarSesion(usuarioRegistrado) {
    const sesion = {
        id: usuarioRegistrado.id,
        nombre: usuarioRegistrado.nombre,
        correo: usuarioRegistrado.correo,
        rol: usuarioRegistrado.rol,
        fechaInicioSesion: new Date().toISOString()
    };

    localStorage.setItem("usuario", JSON.stringify(sesion));
    redirigirSegunRol(sesion.rol);
}

function comprobarSesionExistente() {
    const sesionExistenteTexto = localStorage.getItem("usuario");

    if (!sesionExistenteTexto) {
        return;
    }

    try {
        const sesionExistente = JSON.parse(sesionExistenteTexto);
        redirigirSegunRol(sesionExistente.rol);
    } catch (error) {
        localStorage.removeItem("usuario");
    }
}

function mostrarMensaje(contenedor, mensaje, tipo) {
    contenedor.textContent = mensaje;
    contenedor.classList.remove("mensaje-error", "mensaje-exito");

    if (tipo === "exito") {
        contenedor.classList.add("mensaje-exito");
    } else {
        contenedor.classList.add("mensaje-error");
    }
}

function limpiarMensaje(contenedor) {
    contenedor.textContent = "";
    contenedor.classList.remove("mensaje-error", "mensaje-exito");
}

function redirigirSegunRol(rol) {
    if (rol === "tutor") {
        window.location.replace("panel_tutor.html");
    } else {
        window.location.replace("index.html");
    }
}