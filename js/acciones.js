// Conexión entre eventos de la interfaz y la lógica de la biblioteca.
let libroSeleccionado = null;
let temporizadorMensaje = null;
let modalesInicializados = false;
let formularioLibroInicializado = false;

function mostrarMensaje(texto, esError = false) {
    const mensaje = document.getElementById("mensaje-global");
    if (!mensaje) return;

    mensaje.textContent = texto;
    mensaje.classList.toggle("mensaje-error", Boolean(esError));
    mensaje.classList.toggle("mensaje-exito", !esError);
    mensaje.hidden = false;

    clearTimeout(temporizadorMensaje);
    temporizadorMensaje = setTimeout(function () {
        mensaje.hidden = true;
    }, 6000);
}

function actualizarInterfaz() {
    guardarDatos();
    renderizarCatalogo();
    renderizarVistaPrestamos();
    if (typeof renderizarResumen === "function") renderizarResumen();
    if (typeof actualizarSaludoUsuario === "function") actualizarSaludoUsuario();
}

function manejarAccionLibro(accion, idLibro) {
    const libro = libros.find(function (elemento) {
        return String(elemento.id) === String(idLibro);
    });

    if (!libro) {
        mostrarMensaje("No se encontró el libro seleccionado.", true);
        return;
    }

    if (accion === "prestar") {
        abrirModalPrestar(libro);
    } else if (accion === "devolver") {
        const prestamo = obtenerPrestamoActivo(libro);
        if (prestamo) devolverDesdeInterfaz(prestamo.id);
        else mostrarMensaje("Este libro no tiene un préstamo activo.", true);
    } else if (accion === "eliminar") {
        abrirModalEliminar(libro);
    } else if (accion === "editar") {
        prepararFormularioEdicion(libro);
        mostrarVista("vista-libro");
    }
}

function devolverDesdeInterfaz(idPrestamo) {
    const resultado = devolverPrestamo(idPrestamo);
    mostrarMensaje(resultado.mensaje, !resultado.ok);
    if (resultado.ok) actualizarInterfaz();
}

// ---------- Modal para préstamos ----------
function abrirModalPrestar(libro) {
    const modal = document.getElementById("modal-prestamo");
    const titulo = document.getElementById("libro-modal-prestamo");
    const campo = document.getElementById("persona-prestamo");
    const error = document.getElementById("error-persona-prestamo");

    if (!modal || !campo || !error) {
        mostrarMensaje("No se pudo abrir el formulario de préstamo.", true);
        return;
    }

    if (libro.coleccion) {
        mostrarMensaje("Los libros de colección no se pueden prestar.", true);
        return;
    }

    libroSeleccionado = libro.id;
    titulo.textContent = `Libro: ${libro.titulo}`;
    campo.value = preferencias.nombreUsuario || "";
    campo.removeAttribute("aria-invalid");
    error.textContent = "";
    modal.showModal();
    campo.focus();
}

function confirmarPrestamo(evento) {
    evento.preventDefault();

    const modal = document.getElementById("modal-prestamo");
    const campo = document.getElementById("persona-prestamo");
    const error = document.getElementById("error-persona-prestamo");

    if (libroSeleccionado === null) {
        modal.close();
        mostrarMensaje("No se ha seleccionado ningún libro.", true);
        return;
    }

    const resultado = prestarLibro(libroSeleccionado, campo.value);
    if (!resultado.ok && resultado.campo === "persona") {
        error.textContent = resultado.mensaje;
        campo.setAttribute("aria-invalid", "true");
        campo.focus();
        return;
    }

    if (!resultado.ok) {
        modal.close();
        mostrarMensaje(resultado.mensaje, true);
        return;
    }

    modal.close();
    mostrarMensaje(resultado.mensaje, false);
    actualizarInterfaz();
}

// ---------- Modal para eliminar libros ----------
function abrirModalEliminar(libro) {
    if (obtenerPrestamoActivo(libro)) {
        mostrarMensaje("No se puede eliminar un libro con un préstamo activo.", true);
        return;
    }

    const modal = document.getElementById("modal-eliminar");
    const texto = document.getElementById("texto-confirmar-eliminar");
    if (!modal || !texto) {
        mostrarMensaje("No se pudo abrir la confirmación de eliminación.", true);
        return;
    }

    libroSeleccionado = libro.id;
    texto.textContent = `¿Eliminar «${libro.titulo}»?`;
    modal.showModal();
}

function confirmarEliminacion(evento) {
    evento.preventDefault();
    if (libroSeleccionado === null) {
        mostrarMensaje("No se ha seleccionado ningún libro.", true);
        return;
    }

    const resultado = eliminarLibro(libroSeleccionado);
    document.getElementById("modal-eliminar").close();
    mostrarMensaje(resultado.mensaje, !resultado.ok);
    if (resultado.ok) actualizarInterfaz();
}

function inicializarModales() {
    if (modalesInicializados) return;

    const modalPrestamo = document.getElementById("modal-prestamo");
    const modalEliminar = document.getElementById("modal-eliminar");
    const formularioPrestamo = document.getElementById("form-prestamo");
    const formularioEliminar = document.getElementById("form-confirmar-eliminar");
    const campoPersona = document.getElementById("persona-prestamo");
    const errorPersona = document.getElementById("error-persona-prestamo");

    if (!modalPrestamo || !modalEliminar || !formularioPrestamo || !formularioEliminar) {
        console.error("No se pudieron inicializar los modales. Comprueba los ID del HTML.");
        return;
    }

    modalesInicializados = true;
    formularioPrestamo.addEventListener("submit", confirmarPrestamo);
    formularioEliminar.addEventListener("submit", confirmarEliminacion);

    document.getElementById("cancelar-prestamo").addEventListener("click", function () {
        modalPrestamo.close();
    });
    document.getElementById("cancelar-eliminar").addEventListener("click", function () {
        modalEliminar.close();
    });

    campoPersona.addEventListener("input", function () {
        errorPersona.textContent = "";
        campoPersona.removeAttribute("aria-invalid");
    });

    [modalPrestamo, modalEliminar].forEach(function (modal) {
        modal.addEventListener("close", function () {
            libroSeleccionado = null;
            campoPersona.removeAttribute("aria-invalid");
            errorPersona.textContent = "";
        });
    });
}

// ---------- Formulario de agregar y editar ----------
function limpiarErroresFormularioLibro() {
    const campos = [
        ["titulo-libro", "error-titulo"],
        ["autor-libro", "error-autor"],
        ["anio-libro", "error-anio"],
        ["genero-libro", "error-genero"],
        ["comentario-libro", "error-comentario"]
    ];

    campos.forEach(function ([idCampo, idError]) {
        const campo = document.getElementById(idCampo);
        const error = document.getElementById(idError);
        if (campo) campo.removeAttribute("aria-invalid");
        if (error) error.textContent = "";
    });

    const mensaje = document.getElementById("mensaje-formulario");
    if (mensaje) mensaje.textContent = "";
}

function actualizarContadorComentario() {
    const campo = document.getElementById("comentario-libro");
    const contador = document.getElementById("contador-comentario");
    if (!campo || !contador) return;
    contador.textContent = `${120 - campo.value.length} caracteres restantes`;
}

function prepararFormularioNuevo() {
    const formulario = document.getElementById("form-libro");
    if (!formulario) return;

    formulario.reset();
    document.getElementById("id-libro-edicion").value = "";
    document.getElementById("titulo-formulario-libro").textContent = "Agregar libro";
    document.getElementById("guardar-libro").textContent = "Guardar libro";
    document.getElementById("cancelar-edicion").hidden = true;
    limpiarErroresFormularioLibro();
    actualizarContadorComentario();
}

function prepararFormularioEdicion(libro) {
    const formulario = document.getElementById("form-libro");
    if (!formulario) {
        mostrarMensaje("No se encontró el formulario de libros.", true);
        return;
    }

    limpiarErroresFormularioLibro();
    document.getElementById("id-libro-edicion").value = String(libro.id);
    document.getElementById("titulo-libro").value = libro.titulo ?? "";
    document.getElementById("autor-libro").value = libro.autor ?? "";
    document.getElementById("anio-libro").value = libro.anio ?? "";
    document.getElementById("genero-libro").value = libro.genero ?? "";
    document.getElementById("comentario-libro").value = libro.comentario ?? "";
    document.getElementById("libro-coleccion").checked = Boolean(libro.coleccion);
    document.getElementById("titulo-formulario-libro").textContent = "Editar libro";
    document.getElementById("guardar-libro").textContent = "Guardar cambios";
    document.getElementById("cancelar-edicion").hidden = false;
    actualizarContadorComentario();
}

function mostrarErrorCampoLibro(campo, mensaje) {
    const elementos = {
        titulo: ["titulo-libro", "error-titulo"],
        autor: ["autor-libro", "error-autor"],
        anio: ["anio-libro", "error-anio"],
        genero: ["genero-libro", "error-genero"],
        comentario: ["comentario-libro", "error-comentario"]
    };

    const ids = elementos[campo];
    if (!ids) {
        const mensajeFormulario = document.getElementById("mensaje-formulario");
        if (mensajeFormulario) mensajeFormulario.textContent = mensaje;
        return;
    }

    const elemento = document.getElementById(ids[0]);
    const error = document.getElementById(ids[1]);
    error.textContent = mensaje;
    elemento.setAttribute("aria-invalid", "true");
    elemento.focus();
}

function guardarLibroDesdeFormulario(evento) {
    evento.preventDefault();
    limpiarErroresFormularioLibro();

    const idEdicion = document.getElementById("id-libro-edicion").value;
    const datos = {
        titulo: document.getElementById("titulo-libro").value,
        autor: document.getElementById("autor-libro").value,
        anio: document.getElementById("anio-libro").value,
        genero: document.getElementById("genero-libro").value,
        comentario: document.getElementById("comentario-libro").value,
        coleccion: document.getElementById("libro-coleccion").checked
    };

    const resultado = guardarLibro(datos, idEdicion);
    if (!resultado.ok) {
        mostrarErrorCampoLibro(resultado.campo, resultado.mensaje);
        return;
    }

    actualizarInterfaz();
    prepararFormularioNuevo();
    mostrarVista("vista-catalogo");
    mostrarMensaje(resultado.mensaje, false);
}

function inicializarFormularioLibro() {
    if (formularioLibroInicializado) return;
    const formulario = document.getElementById("form-libro");
    if (!formulario) {
        console.error("No se encontró el formulario de libros.");
        return;
    }

    formularioLibroInicializado = true;
    document.getElementById("anio-libro").max = String(new Date().getFullYear());
    formulario.addEventListener("submit", guardarLibroDesdeFormulario);
    document.getElementById("comentario-libro").addEventListener("input", actualizarContadorComentario);
    document.getElementById("cancelar-edicion").addEventListener("click", prepararFormularioNuevo);
    actualizarContadorComentario();

    // Escape limpia el formulario si no hay ningún modal abierto.
    document.addEventListener("keydown", function (evento) {
        if (evento.key !== "Escape") return;
        if (document.querySelector("dialog[open]")) return;
        const vistaLibro = document.getElementById("vista-libro");
        if (vistaLibro && !vistaLibro.hidden) {
            prepararFormularioNuevo();
        }
    });
}
