const tutores = [
    {
        id: 1,
        nombre: "Juan Pérez",
        iniciales: "JP",
        cursos: ["Cálculo I", "Física I"],
        modalidad: ["Virtual", "Presencial"],
        precio: 100,
        rating: 4.9,
        color: ""
    },
    {
        id: 2,
        nombre: "Andrea López",
        iniciales: "AL",
        cursos: ["Programación", "POO"],
        modalidad: ["Virtual"],
        precio: 85,
        rating: 4.8,
        color: "alternativo"
    },
    {
        id: 3,
        nombre: "Diego Castillo",
        iniciales: "DC",
        cursos: ["Química", "Precálculo"],
        modalidad: ["Presencial"],
        precio: 75,
        rating: 4.7,
        color: ""
    }
];

const seleccionar = (selector, contexto = document) => {
    return contexto.querySelector(selector);
};

function obtenerReservas() {
    const reservasGuardadas = localStorage.getItem("tutouvg_reservas") || "[]";
    return JSON.parse(reservasGuardadas);
}

function guardarReservas(reservas) {
    localStorage.setItem("tutouvg_reservas", JSON.stringify(reservas));
}

function obtenerUsuarioActual() {
    try {
        return JSON.parse(localStorage.getItem("usuario"));
    } catch (error) {
        return null;
    }
}

function marcarEnlaceActivo() {
    const paginaActual = location.pathname.split("/").pop() || "index.html";
    const enlaces = document.querySelectorAll(".navegacion a");

    enlaces.forEach(function (enlace) {
        if (enlace.getAttribute("href") === paginaActual) {
            enlace.classList.add("activo");
        }
    });

    const usuarioGuardado = localStorage.getItem("usuario") || "null";
    const usuario = JSON.parse(usuarioGuardado);
    const chipUsuario = seleccionar("#usuario-chip");

    if (chipUsuario && usuario) {
        chipUsuario.textContent = usuario.nombre;
    }
}

function crearTarjetaTutor(tutor) {
    const etiquetasCursos = tutor.cursos
        .map((curso) => `<span class="etiqueta">${curso}</span>`)
        .join("");

    const etiquetasModalidad = tutor.modalidad
        .map((modalidad) => {
            return `<span class="etiqueta modalidad">${modalidad}</span>`;
        })
        .join("");

    return `
        <article class="tarjeta tarjeta-tutor">
            <div class="avatar ${tutor.color}">${tutor.iniciales}</div>
            <div>
                <h3>${tutor.nombre}</h3>
                <div class="etiquetas">
                    ${etiquetasCursos}
                    ${etiquetasModalidad}
                </div>
                <span class="calificacion">${tutor.rating} de 5</span>
            </div>
            <div>
                <div class="precio">Q${tutor.precio}/h</div>
                <a class="boton pequeno" href="perfil_tutor.html?id=${tutor.id}">
                    Ver perfil
                </a>
            </div>
        </article>
    `;
}

function iniciarBusqueda() {
    const lista = seleccionar("#lista-tutores");

    if (!lista) {
        return;
    }

    const texto = seleccionar("#busqueda");
    const curso = seleccionar("#curso");
    const modalidad = seleccionar("#modalidad");
    const precio = seleccionar("#precio");
    const precioMostrado = seleccionar("#precio-valor");

    function filtrarTutores() {
        const busqueda = texto.value.trim().toLowerCase();
        precioMostrado.textContent = `Q${precio.value}`;

        const tutoresFiltrados = tutores.filter((tutor) => {
            const coincideTexto = !busqueda
                || `${tutor.nombre} ${tutor.cursos.join(" ")}`
                    .toLowerCase()
                    .includes(busqueda);
            const coincideCurso = !curso.value || tutor.cursos.includes(curso.value);
            const coincideModalidad = !modalidad.value
                || tutor.modalidad.includes(modalidad.value);
            const coincidePrecio = tutor.precio <= Number(precio.value);

            return coincideTexto
                && coincideCurso
                && coincideModalidad
                && coincidePrecio;
        });

        if (tutoresFiltrados.length > 0) {
            lista.innerHTML = tutoresFiltrados.map(crearTarjetaTutor).join("");
        } else {
            lista.innerHTML = `
                <div class="vacio">
                    No encontramos tutores con esos filtros. Prueba ampliar tu búsqueda.
                </div>
            `;
        }

        const palabraTutor = tutoresFiltrados.length === 1 ? "tutor" : "tutores";
        seleccionar("#contador").textContent = `${tutoresFiltrados.length} ${palabraTutor}`;
    }

    [texto, curso, modalidad, precio].forEach((control) => {
        control.addEventListener("input", filtrarTutores);
    });

    seleccionar("#btn-buscar").addEventListener("click", filtrarTutores);

    seleccionar("#btn-limpiar").addEventListener("click", () => {
        texto.value = "";
        curso.value = "";
        modalidad.value = "";
        precio.value = 150;
        filtrarTutores();
    });

    filtrarTutores();
}

function obtenerTutorActual() {
    const parametros = new URLSearchParams(location.search);
    const idGuardado = localStorage.getItem("tutouvg_tutor") || 1;
    const idTutor = Number(parametros.get("id") || idGuardado);
    const tutor = tutores.find((elemento) => elemento.id === idTutor) || tutores[0];

    localStorage.setItem("tutouvg_tutor", tutor.id);
    return tutor;
}

function obtenerLimitesDelAnioActual() {
    const hoy = new Date();

    hoy.setMinutes(
        hoy.getMinutes() - hoy.getTimezoneOffset()
    );

    const fechaMinima = hoy
        .toISOString()
        .split("T")[0];

    const anioActual = hoy.getFullYear();
    const fechaMaxima = `${anioActual}-12-31`;

    return {
        fechaMinima: fechaMinima,
        fechaMaxima: fechaMaxima
    };
}

function configurarLimitesDeFecha(inputFecha) {
    const limites = obtenerLimitesDelAnioActual();

    inputFecha.min = limites.fechaMinima;
    inputFecha.max = limites.fechaMaxima;

    if (
        inputFecha.value
        && (
            inputFecha.value < limites.fechaMinima
            || inputFecha.value > limites.fechaMaxima
        )
    ) {
        inputFecha.value = "";
    }

    return limites;
}

function configurarEnterParaAvanzar(formulario) {
    formulario.addEventListener(
        "keydown",
        function (evento) {
            if (evento.key !== "Enter") {
                return;
            }

            evento.preventDefault();

            if (
                evento.target.matches(
                    'button[type="submit"]'
                )
            ) {
                return;
            }

            const campos = Array.from(
                formulario.querySelectorAll(
                    'input:not([type="hidden"]), select, textarea, button[type="submit"]'
                )
            ).filter(
                function (campo) {
                    return (
                        !campo.disabled
                        && campo.offsetParent !== null
                    );
                }
            );

            const posicionActual = campos.indexOf(
                evento.target
            );

            const siguienteCampo = campos[
                posicionActual + 1
            ];

            if (siguienteCampo) {
                siguienteCampo.focus();
            }
        }
    );
}

function iniciarPerfil() {
     if (!seleccionar("#nombre-tutor")) {
        return;
    }

    const tutor = obtenerTutorActual();
    const avatar = seleccionar("#avatar-tutor");
    const inputFechaPerfil = seleccionar(
        "#fecha-perfil"
    );

    const limites = configurarLimitesDeFecha(
        inputFechaPerfil
    );

    const fechaGuardada = localStorage.getItem(
        "tutouvg_fecha"
    ) || "";

    if (
        fechaGuardada >= limites.fechaMinima
        && fechaGuardada <= limites.fechaMaxima
    ) {
        inputFechaPerfil.value = fechaGuardada;
    } else {
        localStorage.removeItem("tutouvg_fecha");
    }

    seleccionar("#nombre-tutor").textContent =
        tutor.nombre;

    avatar.textContent = tutor.iniciales;

    avatar.classList.toggle(
        "alternativo",
        tutor.color === "alternativo"
    );

    seleccionar("#cursos-tutor").textContent =
        tutor.cursos.join(" | ");

    seleccionar("#modalidad-tutor").textContent =
        tutor.modalidad.join(" / ");

    seleccionar("#precio-tutor").textContent =
        `Q${tutor.precio} por hora`;

    seleccionar("#rating-tutor").textContent =
        `${tutor.rating} de 5`;

    inputFechaPerfil.addEventListener(
        "change",
        function () {
            if (inputFechaPerfil.value) {
                localStorage.setItem(
                    "tutouvg_fecha",
                    inputFechaPerfil.value
                );
            } else {
                localStorage.removeItem(
                    "tutouvg_fecha"
                );
            }
        }
    );

    document
        .querySelectorAll(".hora")
        .forEach(
            function (boton) {
                boton.addEventListener(
                    "click",
                    function () {
                        document
                            .querySelectorAll(".hora")
                            .forEach(
                                function (otraHora) {
                                    otraHora.classList.remove(
                                        "seleccionada"
                                    );
                                }
                            );

                        boton.classList.add(
                            "seleccionada"
                        );

                        localStorage.setItem(
                            "tutouvg_hora",
                            boton.dataset.hora
                        );
                    }
                );
            }
        );

    seleccionar("#reservar").href =
        `reservar_tutorias.html?id=${tutor.id}`;
}

function iniciarReserva() {
    const formulario = seleccionar("#form-reserva");

    if (!formulario) {
        return;
    }

    const tutor = obtenerTutorActual();
    const usuario = obtenerUsuarioActual();

    const inputFecha = seleccionar("#fecha");

    const botonConfirmar = formulario.querySelector(
        'button[type="submit"]'
    );

    const limites = configurarLimitesDeFecha(
        inputFecha
    );

    const fechaGuardada = localStorage.getItem(
        "tutouvg_fecha"
    ) || "";

    let confirmacionSolicitada = false;

    seleccionar("#reserva-tutor").textContent =
        tutor.nombre;

    seleccionar("#resumen-tutor").textContent =
        tutor.nombre;

    seleccionar("#resumen-precio").textContent =
        `Q${tutor.precio}`;

    seleccionar("#curso").innerHTML = tutor.cursos
        .map(
            function (curso) {
                return `<option>${curso}</option>`;
            }
        )
        .join("");

    if (
        fechaGuardada >= limites.fechaMinima
        && fechaGuardada <= limites.fechaMaxima
    ) {
        inputFecha.value = fechaGuardada;
    } else {
        localStorage.removeItem("tutouvg_fecha");
    }

    seleccionar("#hora").value =
        localStorage.getItem("tutouvg_hora")
        || "14:00";

    inputFecha.addEventListener(
        "change",
        function () {
            if (inputFecha.value) {
                localStorage.setItem(
                    "tutouvg_fecha",
                    inputFecha.value
                );
            }
        }
    );

    configurarEnterParaAvanzar(formulario);

    botonConfirmar.addEventListener(
        "click",
        function () {
            confirmacionSolicitada = true;
        }
    );

    formulario.addEventListener(
        "submit",
        function (evento) {
            evento.preventDefault();

            if (!confirmacionSolicitada) {
                return;
            }

            confirmacionSolicitada = false;

            const fecha = inputFecha.value;
            const hora = seleccionar("#hora").value;

            if (
                fecha < limites.fechaMinima
                || fecha > limites.fechaMaxima
            ) {
                alert(
                    "Selecciona una fecha válida dentro del año actual."
                );

                inputFecha.focus();
                return;
            }

            const fechaYHoraSeleccionada = new Date(
                `${fecha}T${hora}`
            );

            if (
                fechaYHoraSeleccionada <= new Date()
            ) {
                alert(
                    "Elige una fecha y hora futura."
                );

                seleccionar("#hora").focus();
                return;
            }

            const nuevaReserva = {
                id: Date.now(),
                tutor: tutor.nombre,
                estudiante: usuario
                    ? usuario.nombre
                    : "Estudiante UVG",
                estudianteCorreo: usuario
                    ? usuario.correo
                    : "",
                curso: seleccionar("#curso").value,
                modalidad: seleccionar(
                    "#modalidad"
                ).value,
                fecha: fecha,
                hora: hora,
                detalles: seleccionar(
                    "#detalles"
                ).value.trim(),
                precio: tutor.precio,
                estado: "Pendiente"
            };

            const reservasActuales =
                obtenerReservas();

            guardarReservas([
                nuevaReserva,
                ...reservasActuales
            ]);

            localStorage.removeItem(
                "tutouvg_fecha"
            );

            localStorage.removeItem(
                "tutouvg_hora"
            );

            location.href = "confirmacion.html";
        }
    );
}

function crearFilaHistorial(reserva) {
    const esCancelable = puedeCancelarReserva(
        reserva
    );

    const accion = esCancelable
        ? `<button class="boton peligro pequeno" data-cancelar-reserva="${reserva.id}">Cancelar tutoría</button>`
        : "Sin acciones";

    return `
        <tr>
            <td>${reserva.tutor}</td>
            <td>${reserva.curso}</td>
            <td>
                ${reserva.fecha}
                <br>
                <small>${reserva.hora}</small>
            </td>
            <td>${reserva.modalidad}</td>
            <td>
                <span class="estado ${reserva.estado.toLowerCase()}">
                    ${reserva.estado}
                </span>
            </td>
            <td>${accion}</td>
        </tr>
    `;
}

function puedeCancelarReserva(reserva) {
    const estadosCancelables = [
        "Pendiente",
        "Confirmada"
    ];

    const fechaTutoria = new Date(
        `${reserva.fecha}T${reserva.hora}`
    );

    return (
        estadosCancelables.includes(
            reserva.estado
        )
        && fechaTutoria > new Date()
    );
}

function iniciarHistorial() {
    const cuerpoTabla = seleccionar(
        "#tabla-historial"
    );

    if (!cuerpoTabla) {
        return;
    }

    const usuario = obtenerUsuarioActual();

    const modal = seleccionar(
        "#modal-cancelacion"
    );

    const formularioCancelacion = seleccionar(
        "#form-cancelacion"
    );

    const motivoCancelacion = seleccionar(
        "#motivo-cancelacion"
    );

    const mensajeCancelacion = seleccionar(
        "#mensaje-cancelacion"
    );

    const resumenCancelacion = seleccionar(
        "#resumen-cancelacion"
    );

    const mensajeError = seleccionar(
        "#mensaje-error-cancelacion"
    );

    let idReservaSeleccionada = null;

    function obtenerReservasDelUsuario() {
        return obtenerReservas().filter(
            function (reserva) {
                return (
                    usuario
                    && reserva.estudianteCorreo
                        === usuario.correo
                );
            }
        );
    }

    function mostrarHistorial() {
        const reservas =
            obtenerReservasDelUsuario();

        if (reservas.length > 0) {
            cuerpoTabla.innerHTML = reservas
                .map(crearFilaHistorial)
                .join("");
        } else {
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="vacio">
                            Aún no has reservado tutorías.
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    function abrirModalCancelacion(reserva) {
        idReservaSeleccionada = reserva.id;

        motivoCancelacion.value = "";

        mensajeCancelacion.value =
            "Hola "
            + reserva.tutor
            + ", lamento tener que cancelar nuestra tutoría. "
            + "Espero que podamos coordinar otra oportunidad.";

        mensajeError.textContent = "";

        resumenCancelacion.innerHTML = `
            <strong>${reserva.curso}</strong>
            <span>
                ${reserva.fecha} a las
                ${reserva.hora} con
                ${reserva.tutor}
            </span>
        `;

        modal.hidden = false;

        document.body.classList.add(
            "sin-scroll"
        );

        motivoCancelacion.focus();
    }

    function cerrarModalCancelacion() {
        modal.hidden = true;

        document.body.classList.remove(
            "sin-scroll"
        );

        formularioCancelacion.reset();

        mensajeError.textContent = "";

        idReservaSeleccionada = null;
    }

    cuerpoTabla.addEventListener(
        "click",
        function (evento) {
            const botonCancelar =
                evento.target.closest(
                    "[data-cancelar-reserva]"
                );

            if (!botonCancelar) {
                return;
            }

            const idReserva = Number(
                botonCancelar.dataset
                    .cancelarReserva
            );

            const reserva = obtenerReservas()
                .find(
                    function (elemento) {
                        return (
                            elemento.id
                            === idReserva
                        );
                    }
                );

            if (
                reserva
                && puedeCancelarReserva(reserva)
            ) {
                abrirModalCancelacion(reserva);
            }
        }
    );

    formularioCancelacion.addEventListener(
        "submit",
        function (evento) {
            evento.preventDefault();

            const motivo =
                motivoCancelacion.value;

            const mensaje =
                mensajeCancelacion.value.trim();

            if (!motivo) {
                mensajeError.textContent =
                    "Selecciona una razón para cancelar.";

                motivoCancelacion.focus();

                return;
            }

            if (mensaje.length < 10) {
                mensajeError.textContent =
                    "Escribe un mensaje de disculpa de al menos 10 caracteres.";

                mensajeCancelacion.focus();

                return;
            }

            const todasLasReservas =
                obtenerReservas();

            const reserva =
                todasLasReservas.find(
                    function (elemento) {
                        return (
                            elemento.id
                            === idReservaSeleccionada
                        );
                    }
                );

            if (
                !reserva
                || !puedeCancelarReserva(reserva)
            ) {
                mensajeError.textContent =
                    "Esta tutoría ya no se puede cancelar.";

                return;
            }

            reserva.estado = "Cancelada";

            reserva.motivoCancelacion =
                motivo;

            reserva.mensajeCancelacion =
                mensaje;

            reserva.fechaCancelacion =
                new Date().toISOString();

            guardarReservas(
                todasLasReservas
            );

            cerrarModalCancelacion();

            mostrarHistorial();
        }
    );

    seleccionar(
        "#cerrar-cancelacion"
    ).addEventListener(
        "click",
        cerrarModalCancelacion
    );

    seleccionar(
        "#conservar-tutoria"
    ).addEventListener(
        "click",
        cerrarModalCancelacion
    );

    modal.addEventListener(
        "click",
        function (evento) {
            if (evento.target === modal) {
                cerrarModalCancelacion();
            }
        }
    );

    document.addEventListener(
        "keydown",
        function (evento) {
            if (
                evento.key === "Escape"
                && !modal.hidden
            ) {
                cerrarModalCancelacion();
            }
        }
    );

    mostrarHistorial();
}

function obtenerSolicitudesDeEjemplo() {
    return [
        {
            id: 101,
            tutor: "Juan Pérez",
            curso: "Cálculo I",
            fecha: "2026-09-14",
            hora: "14:00",
            modalidad: "Virtual",
            estado: "Pendiente",
            estudiante: "Sergio García"
        },
        {
            id: 102,
            tutor: "Juan Pérez",
            curso: "Física I",
            fecha: "2026-09-15",
            hora: "15:00",
            modalidad: "Presencial",
            estado: "Confirmada",
            estudiante: "Ángel Tom"
        }
    ];
}

function crearAccionesSolicitud(reserva) {
    if (reserva.estado === "Cancelada") {
        return `
            <button class="boton secundario pequeno" data-id="${reserva.id}" data-ver-cancelacion>
                Ver cancelación
            </button>
        `;
    }

    if (reserva.estado !== "Pendiente") {
        return "Sin acciones";
    }

    return `
        <button class="boton pequeno" data-id="${reserva.id}" data-accion="Confirmada">
            Aceptar
        </button>

        <button class="boton peligro pequeno" data-id="${reserva.id}" data-accion="Rechazada">
            Rechazar
        </button>
    `;
}

function crearFilaSolicitud(reserva) {
    return `
        <tr>
            <td>${reserva.estudiante || "Estudiante UVG"}</td>
            <td>${reserva.curso}</td>
            <td>${reserva.fecha}<br><small>${reserva.hora}</small></td>
            <td>${reserva.modalidad}</td>
            <td>
                <span class="estado ${reserva.estado.toLowerCase()}">
                    ${reserva.estado}
                </span>
            </td>
            <td>${crearAccionesSolicitud(reserva)}</td>
        </tr>
    `;
}

function iniciarPanel() {
    const cuerpoTabla = seleccionar("#tabla-solicitudes");

    if (!cuerpoTabla) {
        return;
    }

    const usuario = obtenerUsuarioActual();
    let solicitudes = obtenerReservas();

    if (usuario) {
        solicitudes = solicitudes.filter((reserva) => {
            return reserva.tutor === usuario.nombre;
        });
    }

    if (solicitudes.length === 0) {
        solicitudes = obtenerSolicitudesDeEjemplo();
    }

    function mostrarSolicitudes() {
        cuerpoTabla.innerHTML = solicitudes.map(crearFilaSolicitud).join("");

        const pendientes = solicitudes.filter((reserva) => {
            return reserva.estado === "Pendiente";
        }).length;

        const confirmadas = solicitudes.filter((reserva) => {
            return reserva.estado === "Confirmada";
        }).length;

        seleccionar("#pendientes").textContent = pendientes;
        seleccionar("#confirmadas").textContent = confirmadas;
    }

    cuerpoTabla.addEventListener(
    "click",
    function (evento) {
        const botonVerCancelacion =
            evento.target.closest(
                "button[data-ver-cancelacion]"
            );

        if (botonVerCancelacion) {
            const idCancelacion = Number(
                botonVerCancelacion.dataset.id
            );

            const reservaCancelada =
                solicitudes.find(
                    function (elemento) {
                        return (
                            elemento.id
                            === idCancelacion
                        );
                    }
                );

            if (reservaCancelada) {
                alert(
                    "Razón: "
                    + reservaCancelada
                        .motivoCancelacion
                    + "\n\nMensaje del estudiante:\n"
                    + reservaCancelada
                        .mensajeCancelacion
                );
            }

            return;
        }

        const boton = evento.target.closest(
            "button[data-id]"
        );

        if (!boton) {
            return;
        }

        const idSolicitud = Number(
            boton.dataset.id
        );

        const solicitud = solicitudes.find(
            function (elemento) {
                return (
                    elemento.id === idSolicitud
                );
            }
        );

        if (solicitud) {
            solicitud.estado =
                boton.dataset.accion;
        }

        const reservasGuardadas =
            obtenerReservas();

        const reservaOriginal =
            reservasGuardadas.find(
                function (elemento) {
                    return (
                        elemento.id
                        === idSolicitud
                    );
                }
            );

        if (reservaOriginal) {
            reservaOriginal.estado =
                boton.dataset.accion;

            guardarReservas(
                reservasGuardadas
            );
        }

        mostrarSolicitudes();
    }
);
}

document.addEventListener("DOMContentLoaded", () => {
    marcarEnlaceActivo();
    iniciarBusqueda();
    iniciarPerfil();
    iniciarReserva();
    iniciarHistorial();
    iniciarPanel();
});