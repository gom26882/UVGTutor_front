// const tutores = [
//     {
//         id: 1,
//         nombre: "Juan Pérez",
//         iniciales: "JP",
//         cursos: ["Cálculo I", "Física I"],
//         modalidad: ["Virtual", "Presencial"],
//         precio: 100,
//         rating: 4.9,
//         color: ""
//     },
//     {
//         id: 2,
//         nombre: "Andrea López",
//         iniciales: "AL",
//         cursos: ["Programación", "POO"],
//         modalidad: ["Virtual"],
//         precio: 85,
//         rating: 4.8,
//         color: "alternativo"
//     },
//     {
//         id: 3,
//         nombre: "Diego Castillo",
//         iniciales: "DC",
//         cursos: ["Química", "Precálculo"],
//         modalidad: ["Presencial"],
//         precio: 75,
//         rating: 4.7,
//         color: ""
//     }
// ];

const seleccionar = (selector, contexto = document) => {
    return contexto.querySelector(selector);
};

function escaparHTML(valor) {
    return String(valor === undefined || valor === null ? "" : valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

async function obtenerTutoresPorModalidad(modalidad) {
    try {
        let endpoint = '/tutor/'

        if (modalidad) {
            endpoint = `/tutor/modalidad/${modalidad}`
        }

        const data = await apiRequest(endpoint)

        return data.tutores
    } catch (err) {
        console.error(err)
        return []
    }
}

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


const RUTA_LISTAR_TUTORES = "/tutor/getAllTutores";

let tutoresDB = [];

function convertirALista(valor) {
    if (Array.isArray(valor)) return valor;
    if (valor === undefined || valor === null || valor === "") return [];
    return [valor];
}

function normalizarTutorDesdeAPI(tutorOriginal, indice) {
    const tutor = tutorOriginal || {};
    const usuario = tutor.usuario || tutor.user || {};
    const perfil = tutor.perfil || tutor.profile || {};

    const nombre =
        tutor.nombre
        || tutor.name
        || usuario.nombre
        || usuario.name
        || perfil.nombre
        || perfil.name
        || "Tutor";

    const cursosOriginales = convertirALista(
        tutor.cursos
        || tutor.materias
        || tutor.courses
        || perfil.cursos
        || perfil.courses
    );

    const cursosDetalle = cursosOriginales
        .map(function (curso) {
            if (typeof curso === "string") {
                return {
                    id: "",
                    nombre: curso
                };
            }

            return {
                id: curso._id || curso.id || "",
                nombre: curso.nombre || curso.name || ""
            };
        })
        .filter(function (curso) {
            return curso.nombre;
        });

    const cursos = cursosDetalle.map(function (curso) {
        return curso.nombre;
    });

    const modalidad = convertirALista(
        tutor.modalidad
        || tutor.modalidades
        || tutor.modality
        || perfil.modalidad
    )
        .map(function (valor) {
            if (typeof valor === "string") {
                return valor;
            }

            return valor.nombre || valor.name || "";
        })
        .filter(Boolean);

    const precioBruto =
        tutor.precio
        ?? tutor.precioHora
        ?? tutor.price
        ?? tutor.pricePerHour
        ?? perfil.precio
        ?? perfil.precioHora;

    const precio = Number(precioBruto);

    const ratingBruto =
        tutor.rating
        ?? tutor.calificacion
        ?? tutor.promedioCalificacion;

    const rating = Number(ratingBruto);

    const iniciales = nombre
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(function (parte) {
            return parte.charAt(0).toUpperCase();
        })
        .join("") || "T";

    return {
        id:
            tutor.id
            ?? tutor._id
            ?? tutor.usuarioId
            ?? usuario.id
            ?? usuario._id
            ?? String(indice),

        nombre: nombre,
        iniciales: tutor.iniciales || iniciales,
        cursos: cursos,
        cursosDetalle: cursosDetalle,
        modalidad: modalidad,
        experiencia:
            tutor.experiencia
            || tutor.experience
            || perfil.experiencia
            || "",

        precio:
            Number.isFinite(precio) && precio >= 0
                ? precio
                : null,

        rating:
            Number.isFinite(rating) && rating > 0
                ? rating
                : null,

        color: indice % 2 === 1 ? "alternativo" : ""
    };
}

function extraerTutoresDeRespuesta(respuesta) {
    if (Array.isArray(respuesta)) return respuesta;
    if (!respuesta || typeof respuesta !== "object") return [];

    const posiblesListas = [
        respuesta.tutores,
        respuesta.data,
        respuesta.resultados,
        respuesta.results,
        respuesta.usuarios
    ];

    for (const lista of posiblesListas) {
        if (Array.isArray(lista)) return lista;
        if (lista && typeof lista === "object") {
            for (const clave of ["tutores", "items", "results", "data"]) {
                if (Array.isArray(lista[clave])) return lista[clave];
            }
        }
    }

    return [];
}

function crearTarjetaTutor(tutor) {
    const etiquetasCursos = tutor.cursos
        .map((curso) => `<span class="etiqueta">${escaparHTML(curso)}</span>`)
        .join("");
    const etiquetasModalidad = tutor.modalidad
        .map((valor) => `<span class="etiqueta modalidad">${escaparHTML(valor)}</span>`)
        .join("");
    const experiencia = tutor.experiencia
        ? `<p class="subtitulo">${escaparHTML(tutor.experiencia)}</p>`
        : "";
    const calificacion = tutor.rating === null
        ? "Sin calificación"
        : `${escaparHTML(tutor.rating)} de 5`;
    const precio = tutor.precio === null
        ? "Precio no indicado"
        : `Q${escaparHTML(tutor.precio)}/h`;

    return `
        <article class="tarjeta tarjeta-tutor">
            <div class="avatar ${tutor.color}">${escaparHTML(tutor.iniciales)}</div>
            <div>
                <h3>${escaparHTML(tutor.nombre)}</h3>
                <div class="etiquetas">
                    ${etiquetasCursos}
                    ${etiquetasModalidad}
                </div>
                ${experiencia}
                <span class="calificacion">${calificacion}</span>
            </div>
            <div>
                <div class="precio">${precio}</div>
                <a class="boton pequeno" data-tutor-id="${escaparHTML(tutor.id)}" href="perfil_tutor.html?id=${encodeURIComponent(tutor.id)}">
                    Ver perfil
                </a>
            </div>
        </article>
    `;
}
function iniciarBusqueda() {
    const lista = seleccionar("#lista-tutores")
    if (!lista) return

    const texto = seleccionar("#busqueda")
    const curso = seleccionar("#curso")
    const modalidad = seleccionar("#modalidad")
    const precio = seleccionar("#precio")
    const precioMostrado = seleccionar("#precio-valor")
    const contador = seleccionar("#contador")

    let numeroPeticion = 0

    function filtrarTutores() {
        const busqueda = texto.value.trim().toLowerCase()
        const modalidadSeleccionada = modalidad.value.toUpperCase()

        if (precioMostrado) precioMostrado.textContent = `Q${precio.value}`

        const tutoresFiltrados = tutoresDB.filter(tutor => {
            const textoTutor = `${tutor.nombre} ${tutor.cursos.join(" ")} ${tutor.experiencia}`.toLowerCase()
            const coincideTexto = !busqueda || textoTutor.includes(busqueda)
            const coincideCurso = !curso.value || tutor.cursos.includes(curso.value)
            const coincideModalidad = !modalidadSeleccionada || tutor.modalidad.some(valor => valor.toUpperCase() === modalidadSeleccionada)
            const coincidePrecio = tutor.precio === null || tutor.precio <= Number(precio.value)

            return coincideTexto && coincideCurso && coincideModalidad && coincidePrecio
        })

        if (tutoresFiltrados.length > 0) {
            lista.innerHTML = tutoresFiltrados.map(crearTarjetaTutor).join("")
        } else {
            lista.innerHTML = '<div class="vacio">No encontramos tutores con esos filtros.</div>'
        }

        if (contador) contador.textContent = `${tutoresFiltrados.length} ${tutoresFiltrados.length === 1 ? "tutor" : "tutores"}`
    }

    async function cargarTutores() {
        const peticionActual = ++numeroPeticion
        lista.innerHTML = '<div class="vacio">Cargando tutores...</div>'

        try {
            const modalidadSeleccionada = modalidad.value.toUpperCase()
            const endpoint = modalidadSeleccionada
                ? `/tutor/modalidad/${modalidadSeleccionada}`
                : RUTA_LISTAR_TUTORES

            const respuesta = await apiRequest(endpoint)

            if (peticionActual !== numeroPeticion) return

            const listaRecibida = extraerTutoresDeRespuesta(respuesta)
            tutoresDB = listaRecibida.map(normalizarTutorDesdeAPI)

            filtrarTutores()
        } catch (err) {
            if (peticionActual !== numeroPeticion) return

            console.error(err)
            lista.innerHTML = `<div class="vacio">Error al cargar tutores: ${escaparHTML(err.message)}</div>`
            if (contador) contador.textContent = ''
        }
    }

    texto.addEventListener("input", filtrarTutores)
    curso.addEventListener("change", filtrarTutores)
    precio.addEventListener("input", filtrarTutores)

    modalidad.addEventListener("change", cargarTutores)

    const botonBuscar = seleccionar("#btn-buscar")
    if (botonBuscar) botonBuscar.addEventListener("click", filtrarTutores)

    const botonLimpiar = seleccionar("#btn-limpiar")

    if (botonLimpiar) {
        botonLimpiar.addEventListener("click", () => {
            texto.value = ""
            curso.value = ""
            modalidad.value = ""
            precio.value = 150
            cargarTutores()
        })
    }
    lista.addEventListener("click", function (evento) {
    const enlaceTutor = evento.target.closest("[data-tutor-id]");

    if (!enlaceTutor) {
        return;
    }

    const idTutor = enlaceTutor.dataset.tutorId;

    const tutorSeleccionado = tutoresDB.find(function (tutor) {
        return String(tutor.id) === String(idTutor);
    });

    if (tutorSeleccionado) {
        localStorage.setItem(
            "tutouvg_tutor_actual",
            JSON.stringify(tutorSeleccionado)
        );

        localStorage.setItem(
            "tutouvg_tutor",
            String(tutorSeleccionado.id)
        );
    }
});
    cargarTutores()
}

function obtenerTutorActual() {
    const parametros = new URLSearchParams(location.search);

    const idTutor =
        parametros.get("id")
        || localStorage.getItem("tutouvg_tutor");

    let tutorGuardado = null;

    try {
        tutorGuardado = JSON.parse(
            localStorage.getItem("tutouvg_tutor_actual")
        );
    } catch (error) {
        tutorGuardado = null;
    }

    const tutorEnMemoria = tutoresDB.find(function (tutor) {
        return String(tutor.id) === String(idTutor);
    });

    const tutor = tutorEnMemoria || tutorGuardado;

    if (!tutor) {
        return null;
    }

    localStorage.setItem(
        "tutouvg_tutor",
        String(tutor.id)
    );

    localStorage.setItem(
        "tutouvg_tutor_actual",
        JSON.stringify(tutor)
    );

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

            if (evento.target.tagName === "TEXTAREA") {
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

    if (!tutor) {
        alert("No fue posible encontrar al tutor seleccionado.");
        location.href = "buscar_tutores.html";
        return;
    }

    const inputFecha = seleccionar("#fecha");
    const inputHora = seleccionar("#hora");
    const selectCurso = seleccionar("#curso");
    const selectModalidad = seleccionar("#modalidad");
    const botonConfirmar = formulario.querySelector(
        'button[type="submit"]'
    );

    const limites = configurarLimitesDeFecha(inputFecha);

    const fechaGuardada =
        localStorage.getItem("tutouvg_fecha") || "";

    let confirmacionSolicitada = false;

    seleccionar("#reserva-tutor").textContent = tutor.nombre;
    seleccionar("#resumen-tutor").textContent = tutor.nombre;

    seleccionar("#resumen-precio").textContent =
        tutor.precio === null
            ? "No indicado"
            : `Q${tutor.precio}`;

    const cursosDisponibles = tutor.cursosDetalle || [];

    selectCurso.innerHTML = cursosDisponibles
        .filter(function (curso) {
            return curso.id;
        })
        .map(function (curso) {
            return `
                <option value="${escaparHTML(curso.id)}">
                    ${escaparHTML(curso.nombre)}
                </option>
            `;
        })
        .join("");

    if (!selectCurso.options.length) {
        selectCurso.innerHTML =
            '<option value="">No hay cursos disponibles</option>';

        botonConfirmar.disabled = true;
    }

    const modalidadesDisponibles = tutor.modalidad || [];

    if (modalidadesDisponibles.length > 0) {
        selectModalidad.innerHTML = modalidadesDisponibles
            .map(function (modalidad) {
                const valor = String(modalidad).toUpperCase();

                return `
                    <option value="${escaparHTML(valor)}">
                        ${escaparHTML(modalidad)}
                    </option>
                `;
            })
            .join("");
    }

    if (
        fechaGuardada >= limites.fechaMinima
        && fechaGuardada <= limites.fechaMaxima
    ) {
        inputFecha.value = fechaGuardada;
    } else {
        localStorage.removeItem("tutouvg_fecha");
    }

    inputHora.value =
        localStorage.getItem("tutouvg_hora")
        || "14:00";

    inputFecha.addEventListener("change", function () {
        if (inputFecha.value) {
            localStorage.setItem(
                "tutouvg_fecha",
                inputFecha.value
            );
        }
    });

    configurarEnterParaAvanzar(formulario);

    botonConfirmar.addEventListener("click", function () {
        confirmacionSolicitada = true;
    });

    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        if (!confirmacionSolicitada) {
            return;
        }

        confirmacionSolicitada = false;

        const fecha = inputFecha.value;
        const hora = inputHora.value;

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
            `${fecha}T${hora}:00`
        );

        if (
            Number.isNaN(fechaYHoraSeleccionada.getTime())
            || fechaYHoraSeleccionada <= new Date()
        ) {
            alert("Elige una fecha y hora futura.");
            inputHora.focus();
            return;
        }

        const opcionCurso =
            selectCurso.options[selectCurso.selectedIndex];

        const opcionModalidad =
            selectModalidad.options[selectModalidad.selectedIndex];

        const solicitud = {
            tutorId: String(tutor.id),
            cursoId: selectCurso.value,
            fecha: fechaYHoraSeleccionada.toISOString(),
            cantidadHoras: 1,
            modalidad: selectModalidad.value.toUpperCase()
        };

        botonConfirmar.disabled = true;
        botonConfirmar.textContent = "Reservando...";

        try {
            const respuesta = await apiRequest(
                "/tutoria/solicitar",
                {
                    method: "POST",
                    body: JSON.stringify(solicitud)
                }
            );

            const tutoriaCreada = respuesta.tutoria || {};

            const nuevaReserva = {
                id: tutoriaCreada._id || Date.now(),
                tutor: tutor.nombre,
                estudiante: usuario
                    ? usuario.nombre
                    : "Estudiante UVG",

                estudianteCorreo: usuario
                    ? usuario.correo
                    : "",

                curso: opcionCurso
                    ? opcionCurso.textContent.trim()
                    : "",

                modalidad: opcionModalidad
                    ? opcionModalidad.textContent.trim()
                    : solicitud.modalidad,

                fecha: fecha,
                hora: hora,

                detalles: seleccionar("#detalles")
                    .value
                    .trim(),

                precio: tutor.precio,
                estado: "Pendiente"
            };

            const reservasActuales = obtenerReservas();

            guardarReservas([
                nuevaReserva,
                ...reservasActuales
            ]);

            localStorage.removeItem("tutouvg_fecha");
            localStorage.removeItem("tutouvg_hora");

            location.href = "confirmacion.html";
        } catch (error) {
            alert(error.message);

            botonConfirmar.disabled = false;
            botonConfirmar.textContent =
                "Confirmar solicitud";
        }
    });
}

function crearFilaHistorial(reserva) {
    const esCancelable = puedeCancelarReserva(
        reserva
    );

    const accion = esCancelable
        ? `<button class="boton peligro pequeno" data-cancelar-reserva="${reserva.id}">Cancelar tutoría</button>`
        : "Sin acciones";

    let detalleRechazo = "";

    if (reserva.estado === "Rechazada" && reserva.motivoRechazo) {
        detalleRechazo = `
            <br>
            <small>
                <strong>Motivo:</strong> ${escaparHTML(reserva.motivoRechazo)}
                <br>
                <strong>Mensaje del tutor:</strong> ${escaparHTML(reserva.mensajeRechazo)}
            </small>
        `;
    }

    return `
        <tr>
            <td>${escaparHTML(reserva.tutor)}</td>
            <td>${escaparHTML(reserva.curso)}</td>
            <td>
                ${escaparHTML(reserva.fecha)}
                <br>
                <small>${escaparHTML(reserva.hora)}</small>
            </td>
            <td>${escaparHTML(reserva.modalidad)}</td>
            <td>
                <span class="estado ${reserva.estado.toLowerCase()}">
                    ${reserva.estado}
                </span>
                ${detalleRechazo}
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
            <strong>${escaparHTML(reserva.curso)}</strong>
            <span>
                ${escaparHTML(reserva.fecha)} a las
                ${escaparHTML(reserva.hora)} con
                ${escaparHTML(reserva.tutor)}
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
            <td>${escaparHTML(reserva.estudiante || "Estudiante UVG")}</td>
            <td>${escaparHTML(reserva.curso)}</td>
            <td>${escaparHTML(reserva.fecha)}<br><small>${escaparHTML(reserva.hora)}</small></td>
            <td>${escaparHTML(reserva.modalidad)}</td>
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

    const modalRechazo = seleccionar("#modal-rechazo");
    const formularioRechazo = seleccionar("#form-rechazo");
    const motivoRechazo = seleccionar("#motivo-rechazo");
    const mensajeRechazo = seleccionar("#mensaje-rechazo");
    const resumenRechazo = seleccionar("#resumen-rechazo");
    const mensajeErrorRechazo = seleccionar("#mensaje-error-rechazo");

    let idSolicitudRechazo = null;

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

    function aplicarEstado(idSolicitud, nuevoEstado, datosExtra) {
        const extra = datosExtra || {};

        const solicitud = solicitudes.find(function (elemento) {
            return elemento.id === idSolicitud;
        });

        if (solicitud) {
            solicitud.estado = nuevoEstado;
            Object.assign(solicitud, extra);
        }

        const reservasGuardadas = obtenerReservas();

        const reservaOriginal = reservasGuardadas.find(function (elemento) {
            return elemento.id === idSolicitud;
        });

        if (reservaOriginal) {
            reservaOriginal.estado = nuevoEstado;
            Object.assign(reservaOriginal, extra);
            guardarReservas(reservasGuardadas);
        }

        mostrarSolicitudes();
    }

    function abrirModalRechazo(solicitud) {
        idSolicitudRechazo = solicitud.id;

        motivoRechazo.value = "";

        mensajeRechazo.value =
            "Hola " + (solicitud.estudiante || "estudiante")
            + ", lamentablemente no podré realizar esta tutoría. "
            + "Te invito a solicitar otro horario.";

        mensajeErrorRechazo.textContent = "";

        resumenRechazo.innerHTML = `
            <strong>${escaparHTML(solicitud.curso)}</strong>
            <span>
                ${escaparHTML(solicitud.fecha)} a las
                ${escaparHTML(solicitud.hora)} con
                ${escaparHTML(solicitud.estudiante || "Estudiante UVG")}
            </span>
        `;

        modalRechazo.hidden = false;
        document.body.classList.add("sin-scroll");
        motivoRechazo.focus();
    }

    function cerrarModalRechazo() {
        modalRechazo.hidden = true;
        document.body.classList.remove("sin-scroll");
        formularioRechazo.reset();
        mensajeErrorRechazo.textContent = "";
        idSolicitudRechazo = null;
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

            const accion = boton.dataset.accion;

            if (accion === "Rechazada" && modalRechazo) {
                const solicitudARechazar = solicitudes.find(
                    function (elemento) {
                        return elemento.id === idSolicitud;
                    }
                );

                if (solicitudARechazar) {
                    abrirModalRechazo(solicitudARechazar);
                }

                return;
            }

            aplicarEstado(idSolicitud, accion);
        }
    );

    if (modalRechazo) {
        formularioRechazo.addEventListener(
            "submit",
            function (evento) {
                evento.preventDefault();

                const motivo = motivoRechazo.value;
                const mensaje = mensajeRechazo.value.trim();

                if (!motivo) {
                    mensajeErrorRechazo.textContent =
                        "Selecciona una razón para rechazar.";
                    motivoRechazo.focus();
                    return;
                }

                if (mensaje.length < 10) {
                    mensajeErrorRechazo.textContent =
                        "Escribe un mensaje de al menos 10 caracteres.";
                    mensajeRechazo.focus();
                    return;
                }

                aplicarEstado(idSolicitudRechazo, "Rechazada", {
                    motivoRechazo: motivo,
                    mensajeRechazo: mensaje,
                    fechaRechazo: new Date().toISOString()
                });

                cerrarModalRechazo();
            }
        );

        seleccionar("#cerrar-rechazo").addEventListener(
            "click",
            cerrarModalRechazo
        );

        seleccionar("#conservar-solicitud").addEventListener(
            "click",
            cerrarModalRechazo
        );

        modalRechazo.addEventListener(
            "click",
            function (evento) {
                if (evento.target === modalRechazo) {
                    cerrarModalRechazo();
                }
            }
        );

        document.addEventListener(
            "keydown",
            function (evento) {
                if (
                    evento.key === "Escape"
                    && !modalRechazo.hidden
                ) {
                    cerrarModalRechazo();
                }
            }
        );
    }

    mostrarSolicitudes();
}

document.addEventListener("DOMContentLoaded", () => {
    marcarEnlaceActivo();
    iniciarBusqueda();
    iniciarPerfil();
    iniciarReserva();
    iniciarHistorial();
    iniciarPanel();
});
