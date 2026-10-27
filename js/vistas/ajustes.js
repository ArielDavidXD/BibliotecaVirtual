// Vista de resumen y ajustes de usuario.
let ajustesInicializados = false;

function actualizarSaludoUsuario() {
    const saludo = document.getElementById("saludo-usuario");
    if (!saludo) return;

    const nombre = String(preferencias.nombreUsuario ?? "").trim();
    saludo.textContent = nombre ? `Hola, ${nombre}` : "";
    saludo.hidden = !nombre;
}

function aplicarTema() {
    document.body.classList.toggle("tema-oscuro", Boolean(preferencias.temaOscuro));
    const boton = document.getElementById("boton-tema");
    if (boton) {
        boton.textContent = preferencias.temaOscuro
            ? "Activar tema claro"
            : "Activar tema oscuro";
        boton.setAttribute("aria-pressed", String(Boolean(preferencias.temaOscuro)));
    }
}

function renderizarResumen() {
    const total = document.getElementById("total-libros");
    const disponibles = document.getElementById("libros-disponibles");
    const prestados = document.getElementById("libros-prestados");
    const vencidos = document.getElementById("libros-vencidos");
    const contenedorGeneros = document.getElementById("resumen-generos");

    if (!total || !disponibles || !prestados || !vencidos || !contenedorGeneros) return;

    const activos = prestamos.filter(function (prestamo) {
        return prestamo.fechaDevolucion === null;
    });
    const cantidadDisponibles = libros.filter(function (libro) {
        return !libro.coleccion && !obtenerPrestamoActivo(libro);
    }).length;
    const cantidadVencidos = activos.filter(estaVencido).length;

    total.textContent = String(libros.length);
    disponibles.textContent = String(cantidadDisponibles);
    prestados.textContent = String(activos.length);
    vencidos.textContent = String(cantidadVencidos);

    contenedorGeneros.replaceChildren();
    const conteoGeneros = new Map();
    libros.forEach(function (libro) {
        conteoGeneros.set(libro.genero, (conteoGeneros.get(libro.genero) ?? 0) + 1);
    });

    if (conteoGeneros.size === 0) {
        contenedorGeneros.append(crearElemento("p", "Todavía no hay libros para resumir."));
        return;
    }

    const lista = document.createElement("ul");
    const collator = new Intl.Collator("es", { sensitivity: "base" });
    [...conteoGeneros.entries()].sort(function (a, b) {
        return collator.compare(a[0], b[0]);
    }).forEach(function ([genero, cantidad]) {
        const item = document.createElement("li");
        item.textContent = `${genero}: ${cantidad} ${cantidad === 1 ? "libro" : "libros"}`;
        lista.append(item);
    });
    contenedorGeneros.append(lista);
}

function mostrarMensajeAjustes(texto, esError = false) {
    const elemento = document.getElementById("mensaje-ajustes");
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.classList.toggle("mensaje-error", esError);
    elemento.classList.toggle("mensaje-exito", !esError);
}

function inicializarVistaAjustes() {
    if (ajustesInicializados) return;

    const formulario = document.getElementById("form-ajustes");
    const campoNombre = document.getElementById("nombre-usuario");
    const botonTema = document.getElementById("boton-tema");
    const botonRestablecer = document.getElementById("restablecer-biblioteca");
    const modalRestablecer = document.getElementById("modal-restablecer");
    const confirmarRestablecer = document.getElementById("confirmar-restablecer");
    const cancelarRestablecer = document.getElementById("cancelar-restablecer");

    if (!formulario || !campoNombre || !botonTema || !botonRestablecer || !modalRestablecer || !confirmarRestablecer || !cancelarRestablecer) {
        console.error("No se pudo inicializar la vista de ajustes. Comprueba sus identificadores.");
        return;
    }

    ajustesInicializados = true;
    campoNombre.value = preferencias.nombreUsuario || "";
    aplicarTema();
    actualizarSaludoUsuario();

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
        const nombre = campoNombre.value.trim();

        if (nombre.length > 0 && (nombre.length < 2 || nombre.length > 40)) {
            mostrarMensajeAjustes("El nombre debe tener entre 2 y 40 caracteres, o dejarse vacío.", true);
            campoNombre.focus();
            return;
        }

        preferencias.nombreUsuario = nombre;
        guardarDatos();
        actualizarSaludoUsuario();
        mostrarMensajeAjustes(nombre ? "Nombre guardado correctamente." : "Se eliminó el nombre de usuario.");
    });

    botonTema.addEventListener("click", function () {
        preferencias.temaOscuro = !preferencias.temaOscuro;
        aplicarTema();
        guardarDatos();
    });

    botonRestablecer.addEventListener("click", function () {
        modalRestablecer.showModal();
    });
    cancelarRestablecer.addEventListener("click", function () {
        modalRestablecer.close();
    });
    confirmarRestablecer.addEventListener("click", function () {
        restablecerBiblioteca();
        modalRestablecer.close();
        campoNombre.value = "";
        aplicarTema();
        actualizarSaludoUsuario();
        restablecerFiltrosCatalogo();
        actualizarInterfaz();
        mostrarMensajeAjustes("La biblioteca volvió a sus datos iniciales.");
        mostrarMensaje("Biblioteca restablecida correctamente.", false);
    });

    renderizarResumen();
}
