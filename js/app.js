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

function marcarEnlaceActivo() {
    const paginaActual = location.pathname.split("/").pop() || "index.html";
    const enlaces = document.querySelectorAll(".navegacion a");

    enlaces.forEach((enlace) => {
        if (enlace.getAttribute("href") === paginaActual) {
            enlace.classList.add("activo");
        }
    });

    const usuarioGuardado = localStorage.getItem("tutouvg_usuario") || "null";
    const usuario = JSON.parse(usuarioGuardado);
    const chipUsuario = seleccionar("#usuario-chip");

    if (chipUsuario && usuario) {
        chipUsuario.textContent = usuario.nombre;
    }
}

function iniciarLogin() {
    const formulario = seleccionar("#form-login");

    if (!formulario) {
        return;
    }

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const nombre = seleccionar("#nombre").value.trim();
        const rol = seleccionar("input[name='rol']:checked").value;
        const usuario = { nombre, rol };

        localStorage.setItem("tutouvg_usuario", JSON.stringify(usuario));

        if (rol === "tutor") {
            location.href = "panel_tutor.html";
        } else {
            location.href = "buscar_tutores.html";
        }
    });
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

function iniciarPerfil() {
    if (!seleccionar("#nombre-tutor")) {
        return;
    }

    const tutor = obtenerTutorActual();
    const avatar = seleccionar("#avatar-tutor");

    seleccionar("#nombre-tutor").textContent = tutor.nombre;
    avatar.textContent = tutor.iniciales;
    avatar.classList.toggle("alternativo", tutor.color === "alternativo");
    seleccionar("#cursos-tutor").textContent = tutor.cursos.join(" | ");
    seleccionar("#modalidad-tutor").textContent = tutor.modalidad.join(" / ");
    seleccionar("#precio-tutor").textContent = `Q${tutor.precio} por hora`;
    seleccionar("#rating-tutor").textContent = `${tutor.rating} de 5`;

    document.querySelectorAll(".hora").forEach((boton) => {
        boton.addEventListener("click", () => {
            document.querySelectorAll(".hora").forEach((otraHora) => {
                otraHora.classList.remove("seleccionada");
            });

            boton.classList.add("seleccionada");
            localStorage.setItem("tutouvg_hora", boton.dataset.hora);
        });
    });

    seleccionar("#reservar").href = `reservar_tutorias.html?id=${tutor.id}`;
}

function iniciarReserva() {
    const formulario = seleccionar("#form-reserva");

    if (!formulario) {
        return;
    }

    const tutor = obtenerTutorActual();
    const hoy = new Date();

    seleccionar("#reserva-tutor").textContent = tutor.nombre;
    seleccionar("#resumen-tutor").textContent = tutor.nombre;
    seleccionar("#resumen-precio").textContent = `Q${tutor.precio}`;
    seleccionar("#curso").innerHTML = tutor.cursos
        .map((curso) => `<option>${curso}</option>`)
        .join("");

    hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    seleccionar("#fecha").min = hoy.toISOString().split("T")[0];
    seleccionar("#hora").value = localStorage.getItem("tutouvg_hora") || "14:00";

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const nuevaReserva = {
            id: Date.now(),
            tutor: tutor.nombre,
            curso: seleccionar("#curso").value,
            modalidad: seleccionar("#modalidad").value,
            fecha: seleccionar("#fecha").value,
            hora: seleccionar("#hora").value,
            detalles: seleccionar("#detalles").value.trim(),
            precio: tutor.precio,
            estado: "Pendiente"
        };

        guardarReservas([nuevaReserva, ...obtenerReservas()]);
        location.href = "confirmacion.html";
    });
}

function crearFilaHistorial(reserva) {
    return `
        <tr>
            <td>${reserva.tutor}</td>
            <td>${reserva.curso}</td>
            <td>${reserva.fecha}<br><small>${reserva.hora}</small></td>
            <td>${reserva.modalidad}</td>
            <td>
                <span class="estado ${reserva.estado.toLowerCase()}">
                    ${reserva.estado}
                </span>
            </td>
        </tr>
    `;
}

function iniciarHistorial() {
    const cuerpoTabla = seleccionar("#tabla-historial");

    if (!cuerpoTabla) {
        return;
    }

    const reservas = obtenerReservas();

    if (reservas.length > 0) {
        cuerpoTabla.innerHTML = reservas.map(crearFilaHistorial).join("");
    } else {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="vacio">Aún no has reservado tutorías.</div>
                </td>
            </tr>
        `;
    }
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

    let solicitudes = obtenerReservas();

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

    cuerpoTabla.addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-id]");

        if (!boton) {
            return;
        }

        const idSolicitud = Number(boton.dataset.id);
        const solicitud = solicitudes.find((elemento) => elemento.id === idSolicitud);

        if (solicitud) {
            solicitud.estado = boton.dataset.accion;
        }

        const reservasGuardadas = obtenerReservas();
        const reservaOriginal = reservasGuardadas.find((elemento) => {
            return elemento.id === idSolicitud;
        });

        if (reservaOriginal) {
            reservaOriginal.estado = boton.dataset.accion;
            guardarReservas(reservasGuardadas);
        }

        mostrarSolicitudes();
    });

    mostrarSolicitudes();
}

document.addEventListener("DOMContentLoaded", () => {
    marcarEnlaceActivo();
    iniciarLogin();
    iniciarBusqueda();
    iniciarPerfil();
    iniciarReserva();
    iniciarHistorial();
    iniciarPanel();
});