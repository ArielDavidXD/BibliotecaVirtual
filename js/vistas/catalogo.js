// Vista del catálogo: filtros, ordenamiento y generación de tarjetas.
let contenedorLibros = null;
let contadorLibros = null;
let campoBusqueda = null;
let botonesEstado = [];
let selectorGenero = null;
let selectorOrdenCampo = null;
let selectorOrdenDireccion = null;
let estadoSeleccionado = "todos";
let catalogoInicializado = false;

function crearElemento(etiqueta, texto = "", clase = "") {
    const elemento = document.createElement(etiqueta);
    elemento.textContent = texto;
    if (clase) elemento.classList.add(clase);
    return elemento;
}

function crearTarjetaLibro(libro) {
    const tarjeta = document.createElement("article");
    tarjeta.classList.add("tarjeta-libro");

    const prestamoActivo = obtenerPrestamoActivo(libro);
    let estado;

    if (libro.coleccion) {
        estado = "De colección";
        tarjeta.classList.add("libro-coleccion");
    } else if (prestamoActivo) {
        estado = "Prestado";
        tarjeta.classList.add("libro-prestado");
    } else {
        estado = "Disponible";
        tarjeta.classList.add("libro-disponible");
    }

    tarjeta.append(
        crearElemento("h3", libro.titulo),
        crearElemento("p", `Autor: ${libro.autor}`),
        crearElemento("p", `Año: ${libro.anio}`),
        crearElemento("p", `Género: ${libro.genero}`),
        crearElemento("p", `Estado: ${estado}`, "estado-libro")
    );

    if (libro.comentario) {
        tarjeta.append(crearElemento("p", `Comentario: ${libro.comentario}`));
    }

    if (prestamoActivo) {
        tarjeta.append(
            crearElemento("p", `Prestado a ${prestamoActivo.persona}`),
            crearElemento("p", `Devolver antes del ${formatearFecha(prestamoActivo.fechaLimite)}`)
        );
        if (estaVencido(prestamoActivo)) {
            const retraso = calcularDiasRetraso(prestamoActivo);
            tarjeta.append(crearElemento("span", `Vencido · ${retraso} ${retraso === 1 ? "día" : "días"} de retraso`, "etiqueta-vencido"));
        }
    } else if (libro.coleccion) {
        tarjeta.append(crearElemento("span", "Consulta en sala", "etiqueta-coleccion"));
    }

    const acciones = document.createElement("div");
    acciones.classList.add("acciones-libro");

    const botonPrincipal = document.createElement("button");
    botonPrincipal.type = "button";
    botonPrincipal.textContent = prestamoActivo
        ? "Devolver"
        : (libro.coleccion ? "No prestable" : "Prestar");
    botonPrincipal.dataset.accion = prestamoActivo ? "devolver" : "prestar";
    botonPrincipal.dataset.libroId = String(libro.id);
    if (libro.coleccion && !prestamoActivo) {
        botonPrincipal.disabled = true;
        botonPrincipal.setAttribute("aria-label", `${libro.titulo}: ejemplar de colección, no prestable`);
    }

    const botonEditar = document.createElement("button");
    botonEditar.type = "button";
    botonEditar.textContent = "Editar";
    botonEditar.dataset.accion = "editar";
    botonEditar.dataset.libroId = String(libro.id);

    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.textContent = "Eliminar";
    botonEliminar.dataset.accion = "eliminar";
    botonEliminar.dataset.libroId = String(libro.id);

    acciones.append(botonPrincipal, botonEditar, botonEliminar);
    tarjeta.append(acciones);
    return tarjeta;
}

function actualizarOpcionesGenero() {
    if (!selectorGenero) return;

    const valorAnterior = selectorGenero.value || "todos";
    while (selectorGenero.options.length > 1) {
        selectorGenero.remove(1);
    }

    const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });
    const generos = [...new Set(libros.map(function (libro) { return libro.genero; }))]
        .sort(collator.compare);

    generos.forEach(function (genero) {
        const opcion = document.createElement("option");
        opcion.value = genero;
        opcion.textContent = genero;
        selectorGenero.append(opcion);
    });

    selectorGenero.value = generos.includes(valorAnterior) ? valorAnterior : "todos";
}

function obtenerLibrosFiltrados() {
    const texto = normalizarTexto(campoBusqueda ? campoBusqueda.value : "");
    const generoSeleccionado = selectorGenero ? selectorGenero.value : "todos";
    const librosFiltrados = libros.filter(function (libro) {
        const textoLibro = normalizarTexto(`${libro.titulo} ${libro.autor}`);
        const coincideBusqueda = textoLibro.includes(texto);
        const prestamoActivo = obtenerPrestamoActivo(libro);

        let coincideEstado = true;
        if (estadoSeleccionado === "disponibles") {
            coincideEstado = !libro.coleccion && !prestamoActivo;
        } else if (estadoSeleccionado === "prestados") {
            coincideEstado = Boolean(prestamoActivo);
        }

        const coincideGenero = generoSeleccionado === "todos" || libro.genero === generoSeleccionado;
        return coincideBusqueda && coincideEstado && coincideGenero;
    });

    const campo = selectorOrdenCampo ? selectorOrdenCampo.value : preferencias.ordenCampo;
    const direccion = selectorOrdenDireccion ? selectorOrdenDireccion.value : preferencias.ordenDireccion;
    const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

    // Ordenamos una copia; el array original de libros permanece intacto.
    librosFiltrados.sort(function (a, b) {
        let comparacion;
        if (campo === "anio") {
            comparacion = Number(a.anio) - Number(b.anio);
        } else {
            comparacion = collator.compare(String(a[campo] ?? ""), String(b[campo] ?? ""));
        }
        return direccion === "desc" ? -comparacion : comparacion;
    });

    return librosFiltrados;
}

function renderizarCatalogo() {
    if (!contenedorLibros || !contadorLibros || !campoBusqueda) return;

    actualizarOpcionesGenero();
    contenedorLibros.replaceChildren();
    const librosFiltrados = obtenerLibrosFiltrados();

    librosFiltrados.forEach(function (libro) {
        contenedorLibros.append(crearTarjetaLibro(libro));
    });

    if (librosFiltrados.length === 0) {
        contenedorLibros.append(crearElemento("p", "No se encontraron libros con esos criterios."));
    }

    contadorLibros.textContent = `Mostrando ${librosFiltrados.length} de ${libros.length} libros`;
}

function restablecerFiltrosCatalogo() {
    estadoSeleccionado = "todos";
    if (campoBusqueda) campoBusqueda.value = "";
    if (selectorGenero) selectorGenero.value = "todos";

    botonesEstado.forEach(function (boton) {
        const seleccionado = boton.dataset.estado === "todos";
        boton.classList.toggle("boton_activo", seleccionado);
        boton.classList.toggle("boton", !seleccionado);
        boton.setAttribute("aria-pressed", String(seleccionado));
    });

    if (selectorOrdenCampo) selectorOrdenCampo.value = preferencias.ordenCampo;
    if (selectorOrdenDireccion) selectorOrdenDireccion.value = preferencias.ordenDireccion;
    renderizarCatalogo();
}

function inicializarVistaCatalogo() {
    if (catalogoInicializado) return;

    contenedorLibros = document.getElementById("contenedor-libros");
    contadorLibros = document.getElementById("contador-libros");
    campoBusqueda = document.getElementById("busqueda");
    botonesEstado = [...document.querySelectorAll("[data-estado]")];
    selectorGenero = document.getElementById("filtro-genero");
    selectorOrdenCampo = document.getElementById("orden-campo");
    selectorOrdenDireccion = document.getElementById("orden-direccion");

    if (!contenedorLibros || !contadorLibros || !campoBusqueda) {
        console.error("No se pudo inicializar el catálogo; comprueba los identificadores del HTML.");
        return;
    }

    catalogoInicializado = true;
    selectorOrdenCampo.value = preferencias.ordenCampo;
    selectorOrdenDireccion.value = preferencias.ordenDireccion;

    campoBusqueda.addEventListener("input", renderizarCatalogo);

    contenedorLibros.addEventListener("click", function (evento) {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton || boton.disabled) return;
        manejarAccionLibro(boton.dataset.accion, boton.dataset.libroId);
    });

    botonesEstado.forEach(function (boton) {
        boton.addEventListener("click", function () {
            estadoSeleccionado = boton.dataset.estado;
            botonesEstado.forEach(function (otroBoton) {
                const seleccionado = otroBoton.dataset.estado === estadoSeleccionado;
                otroBoton.classList.toggle("boton_activo", seleccionado);
                otroBoton.classList.toggle("boton", !seleccionado);
                otroBoton.setAttribute("aria-pressed", String(seleccionado));
            });
            renderizarCatalogo();
        });
    });

    selectorGenero.addEventListener("change", renderizarCatalogo);
    selectorOrdenCampo.addEventListener("change", function () {
        preferencias.ordenCampo = selectorOrdenCampo.value;
        guardarDatos();
        renderizarCatalogo();
    });
    selectorOrdenDireccion.addEventListener("change", function () {
        preferencias.ordenDireccion = selectorOrdenDireccion.value;
        guardarDatos();
        renderizarCatalogo();
    });

    renderizarCatalogo();
}
