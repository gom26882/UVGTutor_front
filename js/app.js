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

function pintarAvatar(elemento, fotoPerfil, nombre = "Usuario") {
    if (!elemento) return;

    if (fotoPerfil) {
        elemento.innerHTML = `
            <img
                src="${escaparHTML(fotoPerfil)}"
                alt="Fotografía de ${escaparHTML(nombre)}"
            >
        `;

        return;
    }

    elemento.textContent = String(nombre)
        .trim()
        .charAt(0)
        .toUpperCase() || "U";
}
function crearAvatarMiniatura(persona, nombrePredeterminado = "Usuario") {
    const nombre = persona?.nombre || nombrePredeterminado;

    if (persona?.fotoPerfil) {
        return `
            <div class="avatar avatar-miniatura">
                <img
                    src="${escaparHTML(persona.fotoPerfil)}"
                    alt="Fotografía de ${escaparHTML(nombre)}"
                >
            </div>
        `;
    }

    const inicial = nombre
        .trim()
        .charAt(0)
        .toUpperCase() || "U";

    return `
        <div class="avatar avatar-miniatura">
            ${escaparHTML(inicial)}
        </div>
    `;
}

function comprimirFotoPerfil(archivo) {
    return new Promise((resolve, reject) => {
        const formatosPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!formatosPermitidos.includes(archivo.type)) {
            reject(new Error("Selecciona una imagen JPG, PNG o WEBP."));
            return;
        }

        if (archivo.size > 5 * 1024 * 1024) {
            reject(new Error("La imagen original no puede superar 5 MB."));
            return;
        }

        const lector = new FileReader();

        lector.addEventListener("error", () => {
            reject(new Error("No se pudo leer la fotografía."));
        });

        lector.addEventListener("load", () => {
            const imagen = new Image();

            imagen.addEventListener("error", () => {
                reject(new Error("El archivo seleccionado no es una imagen válida."));
            });

            imagen.addEventListener("load", () => {
                const medidaOrigen = Math.min(
                    imagen.naturalWidth,
                    imagen.naturalHeight
                );

                const origenX = (
                    imagen.naturalWidth - medidaOrigen
                ) / 2;

                const origenY = (
                    imagen.naturalHeight - medidaOrigen
                ) / 2;

                const canvas = document.createElement("canvas");

                canvas.width = 400;
                canvas.height = 400;

                const contexto = canvas.getContext("2d");

                contexto.drawImage(
                    imagen,
                    origenX,
                    origenY,
                    medidaOrigen,
                    medidaOrigen,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                const fotografiaComprimida = canvas.toDataURL(
                    "image/webp",
                    0.78
                );

                if (fotografiaComprimida.length > 700000) {
                    reject(new Error("No se pudo reducir suficientemente la fotografía."));
                    return;
                }

                resolve(fotografiaComprimida);
            });

            imagen.src = lector.result;
        });

        lector.readAsDataURL(archivo);
    });
}

const ESTADOS_TUTORIA = {
    PENDIENTE: { texto: "Pendiente", clase: "pendiente" },
    ACEPTADA: { texto: "Confirmada", clase: "confirmada" },
    RECHAZADA: { texto: "Rechazada", clase: "rechazada" },
    CANCELADA: { texto: "Cancelada", clase: "cancelada" },
    COMPLETADA: { texto: "Completada", clase: "completada" }
};

function telefonoValido(telefono) {
    return /^\d{8}$/.test(telefono);
}

function crearContacto(persona, rolDeLaPersona) {
    const telefono = persona?.telefono;
    if (!telefono) return "";

    let digitos = telefono.replace(/\D/g, "");
    if (digitos.length === 8) digitos = "502" + digitos;

    const nombre = (persona.nombre || "").split(" ")[0];
    const textoWhatsApp = encodeURIComponent(`Hola ${nombre}, te escribo por nuestra tutoría en Tuto UVG.`);

    return `
        <div class="contacto">
            <span class="contacto-titulo">Contacto del ${rolDeLaPersona}</span>
            <span class="contacto-telefono">${escaparHTML(telefono)}</span>
            <div class="contacto-acciones">
                <a class="boton pequeno" href="https://wa.me/${digitos}?text=${textoWhatsApp}" target="_blank" rel="noopener">WhatsApp</a>
                <a class="boton secundario pequeno" href="tel:+${digitos}">Llamar</a>
            </div>
        </div>
    `;
}

function crearEtiquetaEstado(estado) {
    const info = ESTADOS_TUTORIA[estado] || { texto: estado, clase: "" };
    return `<span class="estado ${info.clase}">${escaparHTML(info.texto)}</span>`;
}

function formatearModalidad(modalidad) {
    const texto = String(modalidad || "").toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString("es-GT", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric"
    });
}

function formatearHora(fecha) {
    return new Date(fecha).toLocaleTimeString("es-GT", {
        hour: "2-digit", minute: "2-digit", hour12: false
    });
}

function obtenerUsuarioActual() {
    try {
        return JSON.parse(localStorage.getItem("usuario"));
    } catch (error) {
        return null;
    }
}

function mostrarMensajeEn(contenedor, texto, tipo) {
    if (!contenedor) return;
    contenedor.textContent = texto || "";
    contenedor.classList.remove("mensaje-error", "mensaje-exito");
    if (texto) contenedor.classList.add(tipo === "exito" ? "mensaje-exito" : "mensaje-error");
}

let catalogoCursosCache = null;

async function obtenerCatalogoCursos() {
    if (!catalogoCursosCache) {
        const respuesta = await apiRequest("/curso/getAllCursos");
        catalogoCursosCache = (respuesta.cursos || [])
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }
    return catalogoCursosCache;
}

async function cargarOpcionesCursos(select, opciones = {}) {
    if (!select) return;

    const { valor = "_id", textoTodos = "Selecciona un curso", excluir = [] } = opciones;

    try {
        const cursos = await obtenerCatalogoCursos();
        const seleccionado = select.value;

        select.innerHTML = `<option value="">${escaparHTML(textoTodos)}</option>` + cursos
            .filter(curso => !excluir.includes(curso._id))
            .map(curso => `<option value="${escaparHTML(curso[valor])}">${escaparHTML(curso.nombre)} (${escaparHTML(curso.codigo)})</option>`)
            .join("");

        select.value = seleccionado;
    } catch (err) {
        console.error(err);
    }
}

function abrirModal(modal) {
    modal.hidden = false;
    document.body.classList.add("sin-scroll");
}

function cerrarModal(modal) {
    modal.hidden = true;
    document.body.classList.remove("sin-scroll");
}

function configurarCierreModal(modal, botonesCerrar, alCerrar) {
    botonesCerrar.filter(Boolean).forEach(boton => boton.addEventListener("click", alCerrar));

    modal.addEventListener("click", evento => {
        if (evento.target === modal) alCerrar();
    });

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape" && !modal.hidden) alCerrar();
    });
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

        fotoPerfil:
            tutor.fotoPerfil
            || usuario.fotoPerfil
            || perfil.fotoPerfil
            || "",

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
        .map((valor) => `<span class="etiqueta modalidad">${escaparHTML(formatearModalidad(valor))}</span>`)
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

    const avatarTutor = tutor.fotoPerfil
        ? `
            <div class="avatar ${tutor.color}">
                <img
                    src="${escaparHTML(tutor.fotoPerfil)}"
                    alt="Fotografía de ${escaparHTML(tutor.nombre)}"
                >
            </div>
        `
        : `
            <div class="avatar ${tutor.color}">
                ${escaparHTML(tutor.iniciales)}
            </div>
        `;

    return `
        <article class="tarjeta tarjeta-tutor">
            ${avatarTutor}
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

    function actualizarBarraPrecio() {
        const minimo = Number(precio.min);
        const maximo = Number(precio.max);
        const valor = Number(precio.value);
        const porcentaje = ((valor - minimo) / (maximo - minimo)) * 100;

        precio.style.setProperty("--progreso", `${porcentaje}%`);

        if (precioMostrado) {
            precioMostrado.textContent = `Q${valor}`;
        }
    }

    const contador = seleccionar("#contador")

    let numeroPeticion = 0

    cargarOpcionesCursos(curso, { valor: 'nombre', textoTodos: 'Todos los cursos' })

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
    precio.addEventListener("input", () => {
        actualizarBarraPrecio();
        filtrarTutores();
    });

    modalidad.addEventListener("change", cargarTutores)

    const botonBuscar = seleccionar("#btn-buscar")
    if (botonBuscar) botonBuscar.addEventListener("click", filtrarTutores)

    const botonLimpiar = seleccionar("#btn-limpiar")

    if (botonLimpiar) {
        botonLimpiar.addEventListener("click", () => {
            texto.value = "";
            curso.value = "";
            modalidad.value = "";
            precio.value = precio.max;

            actualizarBarraPrecio();
            cargarTutores();
        });
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
    actualizarBarraPrecio()
    cargarTutores()
}


async function obtenerTutorActual() {
    const parametros = new URLSearchParams(window.location.search)
    const idTutor = parametros.get('id') || localStorage.getItem('tutouvg_tutor')

    if (!idTutor) {
        throw new Error('No se seleccionó ningún tutor')
    }

    const respuesta = await apiRequest(`/tutor/${idTutor}`)
    const tutor = respuesta.tutor

    if (!tutor) {
        throw new Error('Tutor no encontrado')
    }

    localStorage.setItem('tutouvg_tutor', tutor._id)

    return tutor

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

async function iniciarPerfil() {
    if (!seleccionar('#nombre-tutor')) return

    const nombre = seleccionar('#nombre-tutor')
    const avatar = seleccionar('#avatar-tutor')
    const cursos = seleccionar('#cursos-tutor')
    const modalidad = seleccionar('#modalidad-tutor')
    const precio = seleccionar('#precio-tutor')
    const experiencia = seleccionar('#experiencia-tutor')
    const etiquetas = seleccionar('#etiquetas-cursos')
    const fechaInput = seleccionar('#fecha-perfil')
    const horariosContenedor = seleccionar('#horarios-tutor')
    const botonReservar = seleccionar('#reservar')

    botonReservar.style.pointerEvents = 'none'
    botonReservar.setAttribute('aria-disabled', 'true')

    try {
        const tutor = await obtenerTutorActual()

        nombre.textContent = tutor.nombre
        pintarAvatar(
            avatar,
            tutor.fotoPerfil,
            tutor.nombre
        )
        cursos.textContent = tutor.cursos.map(curso => curso.nombre).join(' | ') || 'Sin cursos'
        modalidad.textContent = formatearModalidad(tutor.modalidad)
        precio.textContent = `Q${tutor.precioHora} por hora`
        experiencia.textContent = tutor.experiencia
        seleccionar('#rating-tutor').textContent = 'Sin calificación'

        etiquetas.innerHTML = tutor.cursos.map(curso => {
            return `<span class="etiqueta">${escaparHTML(curso.nombre)}</span>`
        }).join('')

        const horarios = tutor.horariosDisponibles
            .map(horario => new Date(horario))
            .filter(horario => !Number.isNaN(horario.getTime()) && horario > new Date())
            .sort((a, b) => a - b)

        const fechasDisponibles = [...new Set(horarios.map(horario => {
            const anio = horario.getFullYear()
            const mes = String(horario.getMonth() + 1).padStart(2, '0')
            const dia = String(horario.getDate()).padStart(2, '0')
            return `${anio}-${mes}-${dia}`
        }))]

        const hoy = new Date()
        const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
        fechaInput.min = fechaHoy

        function mostrarHorarios() {
            const fecha = fechaInput.value
            horariosContenedor.innerHTML = ''

            const horariosDelDia = horarios.filter(horario => {
                const anio = horario.getFullYear()
                const mes = String(horario.getMonth() + 1).padStart(2, '0')
                const dia = String(horario.getDate()).padStart(2, '0')
                return `${anio}-${mes}-${dia}` === fecha
            })

            if (horariosDelDia.length === 0) {
                horariosContenedor.innerHTML = '<p class="subtitulo">No hay horarios disponibles para esta fecha.</p>'
                botonReservar.style.pointerEvents = 'none'
                botonReservar.setAttribute('aria-disabled', 'true')
                return
            }

            botonReservar.style.pointerEvents = 'none'
            botonReservar.setAttribute('aria-disabled', 'true')

            horariosDelDia.forEach(horario => {
                const boton = document.createElement('button')
                boton.type = 'button'
                boton.className = 'hora'
                boton.textContent = horario.toLocaleTimeString('es-GT', {hour: '2-digit', minute: '2-digit', hour12: false})

                boton.addEventListener('click', () => {
                    horariosContenedor.querySelectorAll('.hora').forEach(elemento => {
                        elemento.classList.remove('seleccionada')
                    })

                    boton.classList.add('seleccionada')
                    localStorage.setItem('tutouvg_fecha', fecha)
                    localStorage.setItem('tutouvg_hora', boton.textContent)
                    localStorage.setItem('tutouvg_horarioISO', horario.toISOString())

                    botonReservar.style.pointerEvents = ''
                    botonReservar.removeAttribute('aria-disabled')
                })

                horariosContenedor.appendChild(boton)
            })
        }

        fechaInput.addEventListener('change', () => {
            localStorage.removeItem('tutouvg_fecha')
            localStorage.removeItem('tutouvg_hora')
            localStorage.removeItem('tutouvg_horarioISO')
            mostrarHorarios()
        })

        if (fechasDisponibles.length > 0) {
            fechaInput.value = fechasDisponibles[0]
            mostrarHorarios()
        } else {
            fechaInput.disabled = true
            horariosContenedor.innerHTML = '<p class="subtitulo">Este tutor no tiene horarios futuros disponibles.</p>'
        }

        botonReservar.href = `reservar_tutorias.html?id=${encodeURIComponent(tutor._id)}`
    } catch (err) {
        console.error(err)
        nombre.textContent = 'No se pudo cargar el tutor'
        horariosContenedor.textContent = err.message
    }
}


async function iniciarReserva() {
    const formulario = seleccionar('#form-reserva')
    if (!formulario) return

    const inputFecha = seleccionar('#fecha')
    const inputHora = seleccionar('#hora')
    const inputCurso = seleccionar('#curso')
    const inputModalidad = seleccionar('#modalidad')
    const inputHoras = seleccionar('#cantidad-horas')
    const inputDetalles = seleccionar('#detalles')
    const mensaje = seleccionar('#mensaje-reserva')
    const boton = formulario.querySelector('button[type="submit"]')

    boton.disabled = true

    try {
        const tutor = await obtenerTutorActual()

        seleccionar('#reserva-tutor').textContent = tutor.nombre
        seleccionar('#resumen-tutor').textContent = tutor.nombre
        seleccionar('#resumen-precio').textContent = `Q${tutor.precioHora}`
        seleccionar('#volver-perfil').href = `perfil_tutor.html?id=${encodeURIComponent(tutor._id)}`

        inputModalidad.value = tutor.modalidad
        inputModalidad.disabled = true

        inputCurso.innerHTML = '<option value="">Selecciona un curso</option>'

        tutor.cursos.forEach(curso => {
            const opcion = document.createElement('option')
            opcion.value = curso._id
            opcion.textContent = curso.nombre
            inputCurso.appendChild(opcion)
        })

        const horarios = tutor.horariosDisponibles
            .map(valor => new Date(valor))
            .filter(fecha => !Number.isNaN(fecha.getTime()) && fecha > new Date())
            .sort((a, b) => a - b)

        const fechaLocal = fecha => {
            const anio = fecha.getFullYear()
            const mes = String(fecha.getMonth() + 1).padStart(2, '0')
            const dia = String(fecha.getDate()).padStart(2, '0')
            return `${anio}-${mes}-${dia}`
        }

        inputFecha.min = fechaLocal(new Date())

        function cargarHoras() {
            inputHora.innerHTML = '<option value="">Selecciona un horario</option>'

            horarios.filter(fecha => fechaLocal(fecha) === inputFecha.value).forEach(fecha => {
                const opcion = document.createElement('option')
                opcion.value = fecha.toISOString()
                opcion.textContent = fecha.toLocaleTimeString('es-GT', {hour: '2-digit', minute: '2-digit', hour12: false})
                inputHora.appendChild(opcion)
            })
        }

        function horasSeguidasDesde(inicioISO) {
            const disponibles = new Set(horarios.map(fecha => fecha.getTime()))
            let horas = 0
            let actual = new Date(inicioISO).getTime()

            while (disponibles.has(actual)) {
                horas++
                actual += 60 * 60 * 1000
            }

            return horas
        }

        function actualizarMaximoHoras() {
            const ayuda = seleccionar('#ayuda-horas')

            if (!inputHora.value) {
                inputHoras.removeAttribute('max')
                if (ayuda) ayuda.textContent = ''
                return
            }

            const maximo = Math.max(1, horasSeguidasDesde(inputHora.value))
            inputHoras.max = maximo

            if (Number(inputHoras.value) > maximo) inputHoras.value = maximo

            if (ayuda) {
                const inicio = new Date(inputHora.value)
                const fin = new Date(inicio.getTime() + maximo * 60 * 60 * 1000)
                ayuda.textContent = maximo === 1
                    ? 'Desde esta hora el tutor tiene 1 hora disponible.'
                    : `Desde esta hora puedes reservar hasta ${maximo} horas seguidas (hasta las ${formatearHora(fin)}).`
            }

            actualizarTotal()
        }

        function actualizarTotal() {
            const horas = Number(inputHoras.value)
            const total = horas >= 1 ? tutor.precioHora * horas : 0
            seleccionar('#resumen-total').textContent = `Q${total}`
        }

        inputFecha.addEventListener('change', () => { cargarHoras(); actualizarMaximoHoras() })
        inputHora.addEventListener('change', actualizarMaximoHoras)
        inputHoras.addEventListener('input', actualizarTotal)

        const horarioGuardado = localStorage.getItem('tutouvg_horarioISO')

        if (horarioGuardado && horarios.some(fecha => fecha.toISOString() === horarioGuardado)) {
            inputFecha.value = fechaLocal(new Date(horarioGuardado))
            cargarHoras()
            inputHora.value = horarioGuardado
        } else if (horarios.length > 0) {
            inputFecha.value = fechaLocal(horarios[0])
            cargarHoras()
        }

        actualizarMaximoHoras()

        actualizarTotal()

        if (!tutor.cursos.length || !horarios.length) {
            mensaje.textContent = 'Este tutor necesita tener cursos y horarios disponibles para recibir solicitudes.'
            boton.disabled = true
            return
        }

        boton.disabled = false

        formulario.addEventListener('submit', async function(evento) {
            evento.preventDefault()
            mensaje.textContent = ''

            const cantidadHoras = Number(inputHoras.value)

            if (!inputCurso.value || !inputHora.value || !Number.isInteger(cantidadHoras) || cantidadHoras < 1) {
                mensaje.textContent = 'Selecciona un curso, un horario y una cantidad de horas válida.'
                return
            }

            if (new Date(inputHora.value) <= new Date()) {
                mensaje.textContent = 'El horario seleccionado ya pasó.'
                return
            }

            const maximoHoras = horasSeguidasDesde(inputHora.value)

            if (cantidadHoras > maximoHoras) {
                mensaje.textContent = `Desde ese horario el tutor solo tiene ${maximoHoras} hora(s) seguida(s). Reduce la cantidad o elige otra hora.`
                return
            }

            boton.disabled = true
            boton.textContent = 'Enviando solicitud...'

            try {
                await apiRequest('/tutoria/solicitar', {
                    method: 'POST',
                    body: JSON.stringify({
                        tutorId: tutor._id,
                        cursoId: inputCurso.value,
                        fecha: inputHora.value,
                        cantidadHoras,
                        modalidad: tutor.modalidad,
                        detalles: inputDetalles ? inputDetalles.value.trim() : ''
                    })
                })

                localStorage.removeItem('tutouvg_fecha')
                localStorage.removeItem('tutouvg_hora')
                localStorage.removeItem('tutouvg_horarioISO')
                localStorage.setItem('tutouvg_confirmacion_tutor', tutor.nombre || 'tu tutor')

                window.location.href = 'confirmacion.html'

            } catch (err) {
                mensaje.textContent = err.message || 'No se pudo solicitar la tutoría.'
                boton.disabled = false
                boton.textContent = 'Confirmar solicitud'
            }
        })
    } catch (err) {
        console.error(err)
        mensaje.textContent = err.message || 'No se pudo cargar la información del tutor.'
        boton.disabled = true
    }
}

function tutoriaEsCancelable(tutoria) {
    return ["PENDIENTE", "ACEPTADA"].includes(tutoria.estado)
        && new Date(tutoria.fecha) > new Date();
}

function crearDetalleMotivos(tutoria, rolQueMira) {
    let detalle = "";

    if (tutoria.estado === "RECHAZADA" && (tutoria.motivoRechazo || tutoria.mensajeRechazo)) {
        detalle = `
            <br>
            <small>
                ${tutoria.motivoRechazo ? `<strong>Motivo:</strong> ${escaparHTML(tutoria.motivoRechazo)}<br>` : ""}
                ${tutoria.mensajeRechazo ? `<strong>Mensaje del tutor:</strong> ${escaparHTML(tutoria.mensajeRechazo)}` : ""}
            </small>
        `;
    }

    if (tutoria.estado === "CANCELADA" && (tutoria.motivoCancelacion || tutoria.mensajeCancelacion)) {
        const quien = tutoria.canceladaPor === "Tutor" ? "tutor" : "estudiante";
        const propia = (rolQueMira === "estudiante" && quien === "estudiante")
            || (rolQueMira === "tutor" && quien === "tutor");

        detalle = `
            <br>
            <small>
                <strong>Cancelada por ${propia ? "ti" : "el " + quien}</strong><br>
                ${tutoria.motivoCancelacion ? `<strong>Motivo:</strong> ${escaparHTML(tutoria.motivoCancelacion)}<br>` : ""}
                ${tutoria.mensajeCancelacion ? `<strong>Mensaje:</strong> ${escaparHTML(tutoria.mensajeCancelacion)}` : ""}
            </small>
        `;
    }

    return detalle;
}

function crearFilaHistorial(tutoria) {
    const accion = tutoriaEsCancelable(tutoria)
        ? `<button class="boton peligro pequeno" data-cancelar-reserva="${escaparHTML(tutoria._id)}">Cancelar tutoría</button>`
        : "Sin acciones";

    return `
        <tr>
            <td>
    <div class="persona-tabla">
        ${crearAvatarMiniatura(tutoria.tutor, "Tutor UVG")}

        <div>
            <strong>
                ${escaparHTML(tutoria.tutor?.nombre || "Tutor UVG")}
            </strong>
        </div>
    </div>
</td>
            <td>
                ${escaparHTML(tutoria.curso?.nombre || "Curso")}
                <br>
                <small>${escaparHTML(tutoria.cantidadHoras)} h · Q${escaparHTML(tutoria.precioTotal)}</small>
            </td>
            <td>
                ${escaparHTML(formatearFecha(tutoria.fecha))}
                <br>
                <small>${escaparHTML(formatearHora(tutoria.fecha))}</small>
            </td>
            <td>${escaparHTML(formatearModalidad(tutoria.modalidad))}</td>
            <td>
                ${crearEtiquetaEstado(tutoria.estado)}
                ${crearDetalleMotivos(tutoria, "estudiante")}
                ${crearContacto(tutoria.tutor, "tutor")}
            </td>
            <td>${accion}</td>
        </tr>
    `;
}

function iniciarHistorial() {
    const cuerpoTabla = seleccionar("#tabla-historial");
    if (!cuerpoTabla) return;

    const modal = seleccionar("#modal-cancelacion");
    const formularioCancelacion = seleccionar("#form-cancelacion");
    const motivoCancelacion = seleccionar("#motivo-cancelacion");
    const mensajeCancelacion = seleccionar("#mensaje-cancelacion");
    const resumenCancelacion = seleccionar("#resumen-cancelacion");
    const mensajeError = seleccionar("#mensaje-error-cancelacion");
    const botonConfirmar = formularioCancelacion.querySelector('button[type="submit"]');

    let tutorias = [];
    let idSeleccionada = null;

    function mostrarFilaUnica(html) {
        cuerpoTabla.innerHTML = `<tr><td colspan="6"><div class="vacio">${html}</div></td></tr>`;
    }

    async function cargarHistorial() {
        mostrarFilaUnica("Cargando tus tutorías...");

        try {
            const respuesta = await apiRequest("/tutoria/estudiante");
            tutorias = respuesta.tutorias || [];

            if (tutorias.length > 0) {
                cuerpoTabla.innerHTML = tutorias.map(crearFilaHistorial).join("");
            } else {
                mostrarFilaUnica('Aún no has reservado tutorías. <a href="index.html">Busca un tutor</a>.');
            }
        } catch (err) {
            console.error(err);
            mostrarFilaUnica(`Error al cargar tus tutorías: ${escaparHTML(err.message)}`);
        }
    }

    function abrirModalCancelacion(tutoria) {
        idSeleccionada = tutoria._id;
        const nombreTutor = tutoria.tutor?.nombre || "tutor";

        motivoCancelacion.value = "";
        mensajeCancelacion.value =
            "Hola " + nombreTutor
            + ", lamento tener que cancelar nuestra tutoría. "
            + "Espero que podamos coordinar otra oportunidad.";
        mensajeError.textContent = "";

        resumenCancelacion.innerHTML = `
            <strong>${escaparHTML(tutoria.curso?.nombre || "Tutoría")}</strong>
            <span>
                ${escaparHTML(formatearFecha(tutoria.fecha))} a las
                ${escaparHTML(formatearHora(tutoria.fecha))} con
                ${escaparHTML(nombreTutor)}
            </span>
        `;

        abrirModal(modal);
        motivoCancelacion.focus();
    }

    function cerrarModalCancelacion() {
        cerrarModal(modal);
        formularioCancelacion.reset();
        mensajeError.textContent = "";
        idSeleccionada = null;
    }

    cuerpoTabla.addEventListener("click", evento => {
        const botonCancelar = evento.target.closest("[data-cancelar-reserva]");
        if (!botonCancelar) return;

        const tutoria = tutorias.find(elemento => elemento._id === botonCancelar.dataset.cancelarReserva);

        if (tutoria && tutoriaEsCancelable(tutoria)) {
            abrirModalCancelacion(tutoria);
        }
    });

    formularioCancelacion.addEventListener("submit", async evento => {
        evento.preventDefault();

        const motivo = motivoCancelacion.value;
        const mensaje = mensajeCancelacion.value.trim();

        if (!motivo) {
            mensajeError.textContent = "Selecciona una razón para cancelar.";
            motivoCancelacion.focus();
            return;
        }

        if (mensaje.length < 10) {
            mensajeError.textContent = "Escribe un mensaje de disculpa de al menos 10 caracteres.";
            mensajeCancelacion.focus();
            return;
        }

        botonConfirmar.disabled = true;

        try {
            await apiRequest(`/tutoria/cancelar/${idSeleccionada}`, {
                method: "PUT",
                body: JSON.stringify({ motivo, mensaje })
            });

            cerrarModalCancelacion();
            await cargarHistorial();
        } catch (err) {
            mensajeError.textContent = err.message || "No se pudo cancelar la tutoría.";
        } finally {
            botonConfirmar.disabled = false;
        }
    });

    configurarCierreModal(
        modal,
        [seleccionar("#cerrar-cancelacion"), seleccionar("#conservar-tutoria")],
        cerrarModalCancelacion
    );

    cargarHistorial();
}

function tutoriaYaTermino(tutoria) {
    return new Date(tutoria.fecha).getTime() + tutoria.cantidadHoras * 60 * 60 * 1000 <= Date.now();
}

function crearAccionesSolicitud(tutoria) {
    const id = escaparHTML(tutoria._id);

    if (tutoria.estado === "PENDIENTE") {
        if (new Date(tutoria.fecha) <= new Date()) {
            return `<button class="boton secundario pequeno" data-id="${id}" data-accion="rechazar">Rechazar (vencida)</button>`;
        }

        return `
            <button class="boton pequeno" data-id="${id}" data-accion="aceptar">Aceptar</button>
            <button class="boton peligro pequeno" data-id="${id}" data-accion="rechazar">Rechazar</button>
        `;
    }

    if (tutoria.estado === "ACEPTADA") {
        if (tutoriaYaTermino(tutoria)) {
            return `<button class="boton pequeno" data-id="${id}" data-accion="completar">Marcar completada</button>`;
        }

        if (new Date(tutoria.fecha) > new Date()) {
            return `<button class="boton peligro pequeno" data-id="${id}" data-accion="cancelar">Cancelar</button>`;
        }

        return "En curso";
    }

    return "Sin acciones";
}

function crearFilaSolicitud(tutoria) {
    const estudiante = tutoria.estudiante || {};
    const detalles = tutoria.detalles
        ? `<br><small><strong>Detalles:</strong> ${escaparHTML(tutoria.detalles)}</small>`
        : "";

    return `
        <tr>
            <td>
                <div class="persona-tabla">
                    ${crearAvatarMiniatura(estudiante, "Estudiante UVG")}

                    <div>
                        <strong>
                            ${escaparHTML(estudiante.nombre || "Estudiante UVG")}
                        </strong>

                        ${estudiante.carnet
                            ? `<br><small>Carné ${escaparHTML(estudiante.carnet)}</small>`
                            : ""}
                    </div>
                </div>
            </td>
            <td>
                ${escaparHTML(tutoria.curso?.nombre || "Curso")}
                <br>
                <small>${escaparHTML(tutoria.cantidadHoras)} h · Q${escaparHTML(tutoria.precioTotal)}</small>
                ${detalles}
            </td>
            <td>${escaparHTML(formatearFecha(tutoria.fecha))}<br><small>${escaparHTML(formatearHora(tutoria.fecha))}</small></td>
            <td>${escaparHTML(formatearModalidad(tutoria.modalidad))}</td>
            <td>
                ${crearEtiquetaEstado(tutoria.estado)}
                ${crearDetalleMotivos(tutoria, "tutor")}
                ${crearContacto(estudiante, "estudiante")}
            </td>
            <td>${crearAccionesSolicitud(tutoria)}</td>
        </tr>
    `;
}

function iniciarPanel() {
    const cuerpoTabla = seleccionar("#tabla-solicitudes");
    if (!cuerpoTabla) return;

    const saludo = seleccionar("#saludo-tutor");
    const mensajePanel = seleccionar("#mensaje-panel");
    const modalRechazo = seleccionar("#modal-rechazo");
    const formularioRechazo = seleccionar("#form-rechazo");
    const motivoRechazo = seleccionar("#motivo-rechazo");
    const mensajeRechazo = seleccionar("#mensaje-rechazo");
    const resumenRechazo = seleccionar("#resumen-rechazo");
    const mensajeErrorRechazo = seleccionar("#mensaje-error-rechazo");
    const tituloModal = seleccionar("#titulo-rechazo");
    const eyebrowModal = modalRechazo.querySelector(".eyebrow");
    const botonConfirmarModal = formularioRechazo.querySelector('button[type="submit"]');
    const modalAceptada = seleccionar("#modal-tutoria-aceptada");
    const tituloAceptada = seleccionar("#titulo-tutoria-aceptada");
    const detalleAceptada = seleccionar("#detalle-tutoria-aceptada");
    const contactoAceptada = seleccionar("#contacto-tutoria-aceptada");

    let solicitudes = [];
    let idSeleccionada = null;
    let modoModal = "rechazar";

    if (window.PERFIL_USUARIO && saludo) {
        window.PERFIL_USUARIO.then(perfil => {
            if (perfil?.nombre) saludo.textContent = `Hola, ${perfil.nombre.split(" ")[0]}`;

            if (perfil && (!perfil.cursos?.length || !perfil.horariosDisponibles?.some(h => new Date(h) > new Date()))) {
                mostrarMensajeEn(
                    mensajePanel,
                    "Para que los estudiantes puedan reservarte necesitas al menos un curso y un horario futuro. Configúralos en \"Mi perfil de tutor\".",
                    "error"
                );
            } else if (perfil && !perfil.telefono) {
                mostrarMensajeEn(
                    mensajePanel,
                    "Agrega tu teléfono en \"Mi perfil de tutor\" para que tus estudiantes puedan contactarte cuando aceptes una tutoría.",
                    "error"
                );
            }
        });
    }

    function mostrarFilaUnica(html) {
        cuerpoTabla.innerHTML = `<tr><td colspan="6"><div class="vacio">${html}</div></td></tr>`;
    }

    function actualizarMetricas() {
        const contar = estado => solicitudes.filter(tutoria => tutoria.estado === estado).length;

        seleccionar("#pendientes").textContent = contar("PENDIENTE");
        seleccionar("#confirmadas").textContent = contar("ACEPTADA");

        const completadas = seleccionar("#completadas");
        if (completadas) completadas.textContent = contar("COMPLETADA");
    }

    function mostrarSolicitudes() {
        // Pendientes primero, luego por fecha más próxima
        const orden = { PENDIENTE: 0, ACEPTADA: 1, COMPLETADA: 2, RECHAZADA: 3, CANCELADA: 4 };
        const ordenadas = [...solicitudes].sort((a, b) =>
            (orden[a.estado] - orden[b.estado]) || (new Date(a.fecha) - new Date(b.fecha))
        );

        if (ordenadas.length > 0) {
            cuerpoTabla.innerHTML = ordenadas.map(crearFilaSolicitud).join("");
        } else {
            mostrarFilaUnica("Aún no tienes solicitudes. Cuando un estudiante te reserve aparecerá aquí.");
        }

        actualizarMetricas();
    }

    async function cargarSolicitudes() {
        mostrarFilaUnica("Cargando solicitudes...");

        try {
            const respuesta = await apiRequest("/tutoria/tutor");
            solicitudes = respuesta.tutorias || [];
            mostrarSolicitudes();
        } catch (err) {
            console.error(err);
            mostrarFilaUnica(`Error al cargar solicitudes: ${escaparHTML(err.message)}`);
        }
    }

    async function ejecutarAccion(id, accion, cuerpo) {
        await apiRequest(`/tutoria/${accion}/${id}`, {
            method: "PUT",
            body: cuerpo ? JSON.stringify(cuerpo) : undefined
        });
        await cargarSolicitudes();
    }

    function abrirModalMotivo(solicitud, modo) {
        modoModal = modo;
        idSeleccionada = solicitud._id;
        const nombre = solicitud.estudiante?.nombre || "estudiante";

        if (modo === "cancelar") {
            eyebrowModal.textContent = "Cancelar tutoría";
            tituloModal.textContent = "Avísale al estudiante por qué cancelas";
            botonConfirmarModal.textContent = "Confirmar cancelación";
            mensajeRechazo.value = "Hola " + nombre
                + ", lamentablemente debo cancelar nuestra tutoría. "
                + "Te invito a reservar otro horario.";
        } else {
            eyebrowModal.textContent = "Rechazar solicitud";
            tituloModal.textContent = "Cuéntale al estudiante qué ocurrió";
            botonConfirmarModal.textContent = "Confirmar rechazo";
            mensajeRechazo.value = "Hola " + nombre
                + ", lamentablemente no podré realizar esta tutoría. "
                + "Te invito a solicitar otro horario.";
        }

        motivoRechazo.value = "";
        mensajeErrorRechazo.textContent = "";

        resumenRechazo.innerHTML = `
            <strong>${escaparHTML(solicitud.curso?.nombre || "Tutoría")}</strong>
            <span>
                ${escaparHTML(formatearFecha(solicitud.fecha))} a las
                ${escaparHTML(formatearHora(solicitud.fecha))} con
                ${escaparHTML(nombre)}
            </span>
        `;

        abrirModal(modalRechazo);
        motivoRechazo.focus();
    }

    function cerrarModalMotivo() {
        cerrarModal(modalRechazo);
        formularioRechazo.reset();
        mensajeErrorRechazo.textContent = "";
        idSeleccionada = null;
    }

    function mostrarTutoriaAceptada(solicitud) {
        const estudiante = solicitud.estudiante || {};
        const nombre = estudiante.nombre || "el estudiante";

        tituloAceptada.textContent = `Tutoría para ${nombre} aceptada`;

        detalleAceptada.textContent = `${solicitud.curso?.nombre || "Tutoría"} · ${formatearFecha(solicitud.fecha)} a las ${formatearHora(solicitud.fecha)}`;

        contactoAceptada.innerHTML =
            crearContacto(estudiante, "estudiante") ||
            '<p class="subtitulo">El estudiante todavía no agregó un teléfono de contacto.</p>';

        abrirModal(modalAceptada);
    }

    cuerpoTabla.addEventListener("click", async evento => {
        const boton = evento.target.closest("button[data-id]");
        if (!boton) return;

        const solicitud = solicitudes.find(elemento => elemento._id === boton.dataset.id);
        if (!solicitud) return;

        const accion = boton.dataset.accion;

        if (accion === "rechazar" || accion === "cancelar") {
            abrirModalMotivo(solicitud, accion);
            return;
        }

        boton.disabled = true;
        mostrarMensajeEn(mensajePanel, "");

        try {
            await ejecutarAccion(solicitud._id, accion);
            if (accion === "aceptar") {
                mostrarTutoriaAceptada(solicitud);
            }
            mostrarMensajeEn(
                mensajePanel,
                accion === "aceptar" ? "Tutoría aceptada. El horario se marcó como ocupado." : "Tutoría marcada como completada.",
                "exito"
            );
        } catch (err) {
            mostrarMensajeEn(mensajePanel, err.message, "error");
            boton.disabled = false;
        }
    });

    formularioRechazo.addEventListener("submit", async evento => {
        evento.preventDefault();

        const motivo = motivoRechazo.value;
        const mensaje = mensajeRechazo.value.trim();

        if (!motivo) {
            mensajeErrorRechazo.textContent = "Selecciona una razón.";
            motivoRechazo.focus();
            return;
        }

        if (mensaje.length < 10) {
            mensajeErrorRechazo.textContent = "Escribe un mensaje de al menos 10 caracteres.";
            mensajeRechazo.focus();
            return;
        }

        botonConfirmarModal.disabled = true;

        try {
            const modo = modoModal;
            await ejecutarAccion(idSeleccionada, modo, { motivo, mensaje });
            cerrarModalMotivo();
            mostrarMensajeEn(mensajePanel, modo === "cancelar" ? "Tutoría cancelada." : "Solicitud rechazada.", "exito");
        } catch (err) {
            mensajeErrorRechazo.textContent = err.message;
        } finally {
            botonConfirmarModal.disabled = false;
        }
    });

    configurarCierreModal(
        modalRechazo,
        [seleccionar("#cerrar-rechazo"), seleccionar("#conservar-solicitud")],
        cerrarModalMotivo
    );

    configurarCierreModal(
        modalAceptada,
        [seleccionar("#cerrar-tutoria-aceptada")],
        () => cerrarModal(modalAceptada)
    );

    cargarSolicitudes();
}

function iniciarConfirmacion() {
    const nombreTutor = seleccionar("#confirmacion-nombre-tutor");

    if (!nombreTutor) {
        return;
    }

    nombreTutor.textContent =
        localStorage.getItem("tutouvg_confirmacion_tutor") ||
        "tu tutor";

    localStorage.removeItem("tutouvg_confirmacion_tutor");
}

function iniciarFormularioCuenta(perfil) {
    const formulario = seleccionar("#form-cuenta");
    if (!formulario) return;

    const nombre = seleccionar("#cuenta-nombre");
    const correo = seleccionar("#cuenta-correo");
    const mensaje = seleccionar("#mensaje-cuenta");
    const boton = formulario.querySelector('button[type="submit"]');

    const telefono = seleccionar("#cuenta-telefono");

    const inputFoto = seleccionar("#cuenta-foto");
    const avatarCuenta =
        seleccionar("#cuenta-avatar")
        || seleccionar("#estudiante-avatar");

    let fotoPerfil = perfil.fotoPerfil || "";

    pintarAvatar(
        avatarCuenta,
        fotoPerfil,
        perfil.nombre
    );

    if (telefono) {
        telefono.addEventListener("input", () => {
            telefono.value = telefono.value
                .replace(/\D/g, "")
                .slice(0, 8);
        });
    }

    if (inputFoto) {
        inputFoto.addEventListener("change", async () => {
            const archivo = inputFoto.files?.[0];

            if (!archivo) return;

            mostrarMensajeEn(mensaje, "");

            try {
                fotoPerfil = await comprimirFotoPerfil(archivo);

                pintarAvatar(
                    avatarCuenta,
                    fotoPerfil,
                    nombre.value || perfil.nombre
                );

                mostrarMensajeEn(
                    mensaje,
                    "Fotografía lista. Presiona Guardar cambios.",
                    "exito"
                );
            } catch (err) {
                inputFoto.value = "";
                mostrarMensajeEn(mensaje, err.message, "error");
            }
        });
    }
    nombre.value = perfil.nombre || "";
    correo.value = perfil.correo || "";
    if (telefono) telefono.value = perfil.telefono || "";

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();
        mostrarMensajeEn(mensaje, "");

        const nuevoCorreo = correo.value.trim().toLowerCase();

        if (nombre.value.trim().length < 3) {
            mostrarMensajeEn(mensaje, "Escribe tu nombre completo.", "error");
            return;
        }

        if (!/^[^\s@]+@uvg\.edu\.gt$/.test(nuevoCorreo)) {
            mostrarMensajeEn(mensaje, "Debes utilizar un correo válido @uvg.edu.gt.", "error");
            return;
        }

        const nuevoTelefono = telefono
            ? telefono.value.replace(/\D/g, "")
            : undefined;

        if (nuevoTelefono && !telefonoValido(nuevoTelefono)) {
            mostrarMensajeEn(
                mensaje,
                "El teléfono debe contener exactamente 8 números.",
                "error"
            );
            return;
        }

        boton.disabled = true;

        try {
            const respuesta = await apiRequest("/user/updateUser", {
                method: "PUT",
                body: JSON.stringify({
                    nombre: nombre.value.trim(),
                    correo: nuevoCorreo,
                    telefono: nuevoTelefono,
                    fotoPerfil
                })
            });

            const usuarioActualizado = respuesta.usuario;
            const usuarioCache = obtenerUsuarioActual() || {};

            fotoPerfil = usuarioActualizado.fotoPerfil || fotoPerfil;

            pintarAvatar(
                avatarCuenta,
                fotoPerfil,
                usuarioActualizado.nombre
            );

            usuarioCache.nombre = usuarioActualizado.nombre;
            usuarioCache.correo = usuarioActualizado.correo;
            usuarioCache.telefono = usuarioActualizado.telefono;
            usuarioCache.fotoPerfil = fotoPerfil;

            localStorage.setItem(
                "usuario",
                JSON.stringify(usuarioCache)
            );

            const chip = seleccionar("#usuario-chip");

            if (chip) {
                chip.textContent = usuarioActualizado.nombre;
            }

            mostrarMensajeEn(mensaje, "Datos de la cuenta actualizados.", "exito");
        } catch (err) {
            mostrarMensajeEn(mensaje, err.message, "error");
        } finally {
            boton.disabled = false;
        }
    });
}

function iniciarGestorCursos({ cursosIniciales, rutaAgregar, rutaEliminar }) {
    const contenedor = seleccionar("#mis-cursos");
    const select = seleccionar("#select-curso");
    const botonAgregar = seleccionar("#btn-agregar-curso");
    const mensaje = seleccionar("#mensaje-cursos");

    let cursos = cursosIniciales || [];

    function pintar() {
        contenedor.innerHTML = cursos.length
            ? cursos.map(curso => `
                <span class="etiqueta etiqueta-removible">
                    ${escaparHTML(curso.nombre)}
                    <button type="button" data-quitar-curso="${escaparHTML(curso._id)}" aria-label="Quitar ${escaparHTML(curso.nombre)}">×</button>
                </span>
            `).join("")
            : '<p class="subtitulo">Todavía no tienes cursos.</p>';

        cargarOpcionesCursos(select, { excluir: cursos.map(curso => curso._id) });
    }

    async function agregar(cursoId) {
        mostrarMensajeEn(mensaje, "");
        const respuesta = await apiRequest(rutaAgregar(cursoId), { method: "POST" });
        cursos = (respuesta.tutor || respuesta.estudiante).cursos;
        pintar();
    }

    botonAgregar.addEventListener("click", async () => {
        if (!select.value) {
            mostrarMensajeEn(mensaje, "Selecciona un curso del catálogo.", "error");
            return;
        }

        botonAgregar.disabled = true;

        try {
            await agregar(select.value);
            mostrarMensajeEn(mensaje, "Curso agregado.", "exito");
        } catch (err) {
            mostrarMensajeEn(mensaje, err.message, "error");
        } finally {
            botonAgregar.disabled = false;
        }
    });

    contenedor.addEventListener("click", async evento => {
        const boton = evento.target.closest("[data-quitar-curso]");
        if (!boton) return;

        boton.disabled = true;

        try {
            const respuesta = await apiRequest(rutaEliminar(boton.dataset.quitarCurso), { method: "DELETE" });
            cursos = (respuesta.tutor || respuesta.estudiante).cursos;
            pintar();
            mostrarMensajeEn(mensaje, "Curso eliminado.", "exito");
        } catch (err) {
            mostrarMensajeEn(mensaje, err.message, "error");
            boton.disabled = false;
        }
    });

    pintar();

    return { agregar };
}

async function iniciarGestionTutor() {
    const formularioTutor = seleccionar("#form-perfil-tutor");
    if (!formularioTutor) return;

    let perfil;

    try {
        perfil = (await apiRequest("/user/getUser")).usuario;
    } catch (err) {
        mostrarMensajeEn(seleccionar("#mensaje-perfil-tutor"), err.message, "error");
        return;
    }

    iniciarFormularioCuenta(perfil);

    const experiencia = seleccionar("#tutor-experiencia");
    const precio = seleccionar("#tutor-precio");
    const modalidad = seleccionar("#tutor-modalidad");
    const mensajeTutor = seleccionar("#mensaje-perfil-tutor");

    experiencia.value = perfil.experiencia || "";
    precio.value = perfil.precioHora ?? "";
    modalidad.value = perfil.modalidad || "VIRTUAL";

    formularioTutor.addEventListener("submit", async evento => {
        evento.preventDefault();
        mostrarMensajeEn(mensajeTutor, "");

        if (!experiencia.value.trim()) {
            mostrarMensajeEn(mensajeTutor, "Describe tu experiencia.", "error");
            return;
        }

        if (precio.value === "" || Number(precio.value) < 0) {
            mostrarMensajeEn(mensajeTutor, "Ingresa un precio por hora válido.", "error");
            return;
        }

        const boton = formularioTutor.querySelector('button[type="submit"]');
        boton.disabled = true;

        try {
            await apiRequest("/tutor/profile", {
                method: "PUT",
                body: JSON.stringify({
                    experiencia: experiencia.value.trim(),
                    precioHora: Number(precio.value),
                    modalidad: modalidad.value
                })
            });
            mostrarMensajeEn(mensajeTutor, "Perfil de tutor actualizado.", "exito");
        } catch (err) {
            mostrarMensajeEn(mensajeTutor, err.message, "error");
        } finally {
            boton.disabled = false;
        }
    });

    const gestorCursos = iniciarGestorCursos({
        cursosIniciales: perfil.cursos,
        rutaAgregar: id => `/tutor/curso/${id}`,
        rutaEliminar: id => `/tutor/curso/${id}`
    });

    const formularioNuevoCurso = seleccionar("#form-nuevo-curso");
    const mensajeCursos = seleccionar("#mensaje-cursos");

    formularioNuevoCurso.addEventListener("submit", async evento => {
        evento.preventDefault();

        const codigo = seleccionar("#nuevo-curso-codigo").value.trim().toUpperCase();
        const nombre = seleccionar("#nuevo-curso-nombre").value.trim();

        if (!codigo || !nombre) {
            mostrarMensajeEn(mensajeCursos, "Escribe el código y el nombre del curso.", "error");
            return;
        }

        try {
            const respuesta = await apiRequest("/curso/addCurso", {
                method: "POST",
                body: JSON.stringify({ codigo, nombre })
            });

            catalogoCursosCache = null;
            await gestorCursos.agregar(respuesta.curso._id);
            formularioNuevoCurso.reset();
            mostrarMensajeEn(mensajeCursos, "Curso creado y agregado a tu perfil.", "exito");
        } catch (err) {
            mostrarMensajeEn(mensajeCursos, err.message, "error");
        }
    });

    iniciarCalendarioHorarios(perfil.horariosDisponibles || []);
}

const HORAS_AGENDA = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

function claveDia(fecha) {
    const d = new Date(fecha);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

async function iniciarCalendarioHorarios(horariosIniciales) {
    const grid = seleccionar("#calendario-grid");
    const tituloMes = seleccionar("#mes-actual");
    const gridHoras = seleccionar("#horas-grid");
    const tituloDia = seleccionar("#dia-seleccionado");
    const listaHorarios = seleccionar("#lista-horarios");
    const mensaje = seleccionar("#mensaje-horarios");
    const botonAnterior = seleccionar("#mes-anterior");
    const botonSiguiente = seleccionar("#mes-siguiente");

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mesMinimo = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const mesMaximo = new Date(hoy.getFullYear(), hoy.getMonth() + 3, 1);

    let horarios = horariosIniciales.map(h => new Date(h));
    let reservados = [];
    let mesVisible = new Date(mesMinimo);
    let diaSeleccionado = null;
    let ocupado = false;

    try {
        const { tutorias = [] } = await apiRequest("/tutoria/tutor");
        reservados = tutorias
            .filter(t => t.estado === "ACEPTADA" && tutoriaYaTermino(t) === false)
            .flatMap(t => Array.from({ length: Number(t.cantidadHoras) || 1 }, (_, i) => ({
                fecha: new Date(new Date(t.fecha).getTime() + i * 60 * 60 * 1000),
                estudiante: t.estudiante?.nombre || "Estudiante",
                inicio: i === 0
            })));
    } catch (err) {
        console.error(err);
    }

    const mismoInstante = (a, b) => a.getTime() === b.getTime();
    const estaReservado = fecha => reservados.some(r => mismoInstante(r.fecha, fecha));
    const futuros = () => horarios
        .filter(h => h > new Date() && !estaReservado(h))
        .sort((a, b) => a - b);

    function contarPorDia(lista) {
        const conteo = {};
        lista.forEach(fecha => {
            const clave = claveDia(fecha);
            conteo[clave] = (conteo[clave] || 0) + 1;
        });
        return conteo;
    }

    function pintarCalendario() {
        const anio = mesVisible.getFullYear();
        const mes = mesVisible.getMonth();

        const textoMes = mesVisible.toLocaleDateString("es-GT", { month: "long", year: "numeric" });
        tituloMes.textContent = textoMes.charAt(0).toUpperCase() + textoMes.slice(1);
        botonAnterior.disabled = mesVisible <= mesMinimo;
        botonSiguiente.disabled = mesVisible >= mesMaximo;

        const disponiblesPorDia = contarPorDia(futuros());
        const reservadosPorDia = contarPorDia(reservados.filter(r => r.inicio).map(r => r.fecha));

        const desfase = (new Date(anio, mes, 1).getDay() + 6) % 7;
        const diasEnMes = new Date(anio, mes + 1, 0).getDate();

        let html = "";
        for (let i = 0; i < desfase; i++) html += '<span class="dia vacio-dia"></span>';

        for (let dia = 1; dia <= diasEnMes; dia++) {
            const fecha = new Date(anio, mes, dia);
            const clave = claveDia(fecha);
            const pasado = fecha < hoy;
            const clases = ["dia"];

            if (pasado) clases.push("pasado");
            if (fecha.getTime() === hoy.getTime()) clases.push("hoy");
            if (diaSeleccionado && clave === claveDia(diaSeleccionado)) clases.push("seleccionado");

            const puntos =
                (disponiblesPorDia[clave] ? '<i class="punto disponible"></i>' : "") +
                (reservadosPorDia[clave] ? '<i class="punto reservado"></i>' : "");

            html += `
                <button type="button" class="${clases.join(" ")}" data-dia="${dia}" ${pasado ? "disabled" : ""}
                    title="${disponiblesPorDia[clave] || 0} disponibles">
                    <span>${dia}</span>
                    <span class="puntos">${puntos}</span>
                </button>
            `;
        }

        grid.innerHTML = html;
    }

    function pintarHoras() {
        if (!diaSeleccionado) {
            tituloDia.textContent = "Selecciona un día";
            gridHoras.innerHTML = '<p class="subtitulo">Toca un día del calendario para elegir tus horas.</p>';
            return;
        }

        const texto = diaSeleccionado.toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" });
        tituloDia.textContent = texto.charAt(0).toUpperCase() + texto.slice(1);

        gridHoras.innerHTML = HORAS_AGENDA.map(hora => {
            const fecha = new Date(diaSeleccionado);
            fecha.setHours(hora, 0, 0, 0);

            const reserva = reservados.find(r => mismoInstante(r.fecha, fecha));
            const activo = horarios.some(h => mismoInstante(h, fecha));
            const pasada = fecha <= new Date();
            const etiqueta = `${String(hora).padStart(2, "0")}:00`;

            if (reserva) {
                return `<button type="button" class="slot reservado" disabled title="Reservado por ${escaparHTML(reserva.estudiante)}">${etiqueta}<small>${reserva.inicio ? "Reservado" : "En tutoría"}</small></button>`;
            }

            return `
                <button type="button" class="slot ${activo ? "activo" : ""} ${activo && ultimaHoraAgregada === fecha.getTime() ? "recien" : ""}" data-hora="${hora}" ${pasada ? "disabled" : ""}>
                    ${etiqueta}<small>${pasada ? "Pasó" : activo ? "Disponible" : "Libre"}</small>
                </button>
            `;
        }).join("");
    }

    function pintarLista() {
        const lista = futuros();

        if (!lista.length) {
            listaHorarios.innerHTML = '<p class="subtitulo">No tienes horarios futuros. Agrega al menos uno para recibir solicitudes.</p>';
            return;
        }

        const porDia = {};
        lista.forEach(fecha => {
            const dia = formatearFecha(fecha);
            (porDia[dia] = porDia[dia] || []).push(fecha);
        });

        listaHorarios.innerHTML = Object.entries(porDia).map(([dia, fechas]) => `
            <div class="dia-horarios">
                <strong>${escaparHTML(dia)}</strong>
                <div class="horarios">
                    ${fechas.map(fecha => `
                        <span class="hora hora-removible">
                            ${escaparHTML(formatearHora(fecha))}
                            <button type="button" data-quitar-horario="${fecha.toISOString()}" aria-label="Quitar horario">×</button>
                        </span>
                    `).join("")}
                </div>
            </div>
        `).join("");
    }

    function animarEntrada(elemento) {
        elemento.classList.remove("entrando");
        void elemento.offsetWidth;
        elemento.classList.add("entrando");
        clearTimeout(elemento._timerEntrada);
        elemento._timerEntrada = setTimeout(() => elemento.classList.remove("entrando"), 700);
    }

    let ultimaHoraAgregada = null;

    function pintarTodo() {
        pintarCalendario();
        pintarHoras();
        pintarLista();
    }

    async function alternarHorario(fecha, agregar) {
        if (ocupado) return;
        ocupado = true;
        mostrarMensajeEn(mensaje, "");

        try {
            const respuesta = await apiRequest("/tutor/horario", {
                method: agregar ? "POST" : "DELETE",
                body: JSON.stringify({ horario: fecha.toISOString() })
            });

            horarios = (respuesta.tutor.horariosDisponibles || []).map(h => new Date(h));
            ultimaHoraAgregada = agregar ? fecha.getTime() : null;
            pintarTodo();
        } catch (err) {
            mostrarMensajeEn(mensaje, err.message, "error");
        } finally {
            ocupado = false;
        }
    }

    grid.addEventListener("click", evento => {
        const boton = evento.target.closest("[data-dia]");
        if (!boton || boton.disabled) return;

        diaSeleccionado = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), Number(boton.dataset.dia));
        ultimaHoraAgregada = null;
        pintarCalendario();
        pintarHoras();
        animarEntrada(gridHoras);
    });

    gridHoras.addEventListener("click", evento => {
        const boton = evento.target.closest("[data-hora]");
        if (!boton || boton.disabled) return;

        const fecha = new Date(diaSeleccionado);
        fecha.setHours(Number(boton.dataset.hora), 0, 0, 0);

        boton.disabled = true;
        alternarHorario(fecha, !boton.classList.contains("activo"));
    });

    listaHorarios.addEventListener("click", evento => {
        const boton = evento.target.closest("[data-quitar-horario]");
        if (!boton) return;

        boton.disabled = true;
        alternarHorario(new Date(boton.dataset.quitarHorario), false);
    });

    botonAnterior.addEventListener("click", () => {
        mesVisible = new Date(mesVisible.getFullYear(), mesVisible.getMonth() - 1, 1);
        pintarCalendario();
        animarEntrada(grid);
    });

    botonSiguiente.addEventListener("click", () => {
        mesVisible = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 1);
        pintarCalendario();
        animarEntrada(grid);
    });

    pintarTodo();
}

async function iniciarPerfilEstudiante() {
    if (!seleccionar("#perfil-estudiante")) return;

    let perfil;

    try {
        perfil = (await apiRequest("/user/getUser")).usuario;
    } catch (err) {
        mostrarMensajeEn(seleccionar("#mensaje-cuenta"), err.message, "error");
        return;
    }

    seleccionar("#estudiante-carnet").textContent = perfil.carnet || "—";

    iniciarFormularioCuenta(perfil);

    iniciarGestorCursos({
        cursosIniciales: perfil.cursos,
        rutaAgregar: id => `/estudiante/${perfil.id}/addCurso/${id}`,
        rutaEliminar: id => `/estudiante/${perfil.id}/deleteCurso/${id}`
    });

    try {
        const { tutorias = [] } = await apiRequest("/tutoria/estudiante");
        const contar = estado => tutorias.filter(tutoria => tutoria.estado === estado).length;

        seleccionar("#est-pendientes").textContent = contar("PENDIENTE");
        seleccionar("#est-confirmadas").textContent = contar("ACEPTADA");
        seleccionar("#est-completadas").textContent = contar("COMPLETADA");
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!window.ACCESO_PERMITIDO) return;

    iniciarBusqueda();
    iniciarPerfil();
    iniciarReserva();
    iniciarHistorial();
    iniciarPanel();
    iniciarConfirmacion();

    iniciarGestionTutor();
    iniciarPerfilEstudiante();
});