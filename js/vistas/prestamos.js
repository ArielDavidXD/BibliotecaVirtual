// Vista de préstamos activos e historial.
let listaPrestamosActivos = null;
let listaHistorialPrestamos = null;
let mensajePrestamos = null;
let elementoSinActivos = null;
let elementoSinDevueltos = null;
let contadorPrestamos = null;
let prestamosInicializados = false;

function crearTarjetaPrestamoActivo(prestamo) {
    const tarjeta = document.createElement("article");
    tarjeta.classList.add("tarjeta-prestamo");

    const libro = libros.find(function (elemento) {
        return String(elemento.id) === String(prestamo.idLibro);
    });
    if (!libro) return null;

    tarjeta.append(
        crearElemento("h3", libro.titulo),
        crearElemento("p", `Prestado a: ${prestamo.persona}`),
        crearElemento("p", `Fecha del préstamo: ${formatearFecha(prestamo.fechaPrestamo)}`),
        crearElemento("p", `Fecha límite: ${formatearFecha(prestamo.fechaLimite)}`)
    );

    if (estaVencido(prestamo)) {
        tarjeta.classList.add("prestamo-vencido");
        const dias = calcularDiasRetraso(prestamo);
        tarjeta.append(crearElemento("p", `Vencido por ${dias} ${dias === 1 ? "día" : "días"}.`, "etiqueta-vencido"));
    } else {
        tarjeta.append(crearElemento("p", "Dentro del plazo", "estado-a-tiempo"));
    }

    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = "Devolver";
    boton.dataset.accion = "devolver-prestamo";
    boton.dataset.prestamoId = String(prestamo.id);
    tarjeta.append(boton);
    return tarjeta;
}

function crearTarjetaPrestamoHistorial(prestamo) {
    const tarjeta = document.createElement("article");
    tarjeta.classList.add("tarjeta-prestamo", "prestamo-devuelto");

    const libro = libros.find(function (elemento) {
        return String(elemento.id) === String(prestamo.idLibro);
    });
    if (!libro) return null;

    const retraso = Math.max(0, diferenciaDias(prestamo.fechaLimite, prestamo.fechaDevolucion));
    const resultado = retraso > 0
        ? `Devuelto con ${retraso} ${retraso === 1 ? "día" : "días"} de retraso.`
        : "Devuelto a tiempo.";

    tarjeta.append(
        crearElemento("h3", libro.titulo),
        crearElemento("p", `Prestado a: ${prestamo.persona}`),
        crearElemento("p", `Fecha del préstamo: ${formatearFecha(prestamo.fechaPrestamo)}`),
        crearElemento("p", `Fecha de devolución: ${formatearFecha(prestamo.fechaDevolucion)}`),
        crearElemento("p", `Fecha límite: ${formatearFecha(prestamo.fechaLimite)}`),
        crearElemento("p", resultado, retraso > 0 ? "estado-retraso" : "estado-a-tiempo")
    );
    return tarjeta;
}

function renderizarVistaPrestamos() {
    if (!listaPrestamosActivos || !listaHistorialPrestamos) return;

    listaPrestamosActivos.replaceChildren();
    listaHistorialPrestamos.replaceChildren();

    const activos = prestamos
        .filter(function (prestamo) { return prestamo.fechaDevolucion === null; })
        .slice()
        .sort(function (a, b) { return a.fechaLimite.localeCompare(b.fechaLimite); });

    const historial = prestamos
        .filter(function (prestamo) { return prestamo.fechaDevolucion !== null; })
        .slice()
        .sort(function (a, b) {
            return b.fechaDevolucion.localeCompare(a.fechaDevolucion) ||
                b.fechaPrestamo.localeCompare(a.fechaPrestamo);
        });

    activos.forEach(function (prestamo) {
        const tarjeta = crearTarjetaPrestamoActivo(prestamo);
        if (tarjeta) listaPrestamosActivos.append(tarjeta);
    });

    historial.forEach(function (prestamo) {
        const tarjeta = crearTarjetaPrestamoHistorial(prestamo);
        if (tarjeta) listaHistorialPrestamos.append(tarjeta);
    });

    elementoSinActivos.hidden = activos.length > 0;
    elementoSinDevueltos.hidden = historial.length > 0;
    contadorPrestamos.textContent = String(activos.length);
}

function inicializarVistaPrestamos() {
    if (prestamosInicializados) return;

    listaPrestamosActivos = document.getElementById("lista-prestamos-activos");
    listaHistorialPrestamos = document.getElementById("lista-historial-prestamos");
    mensajePrestamos = document.getElementById("mensaje-prestamos");
    elementoSinActivos = document.getElementById("sin-prestamos-activos");
    elementoSinDevueltos = document.getElementById("sin-prestamos-devueltos");
    contadorPrestamos = document.getElementById("contador-prestamos");

    if (!listaPrestamosActivos || !listaHistorialPrestamos || !elementoSinActivos || !elementoSinDevueltos || !contadorPrestamos) {
        console.error("No se pudo inicializar la vista de préstamos; comprueba sus identificadores.");
        return;
    }

    prestamosInicializados = true;
    listaPrestamosActivos.addEventListener("click", function (evento) {
        const boton = evento.target.closest('button[data-accion="devolver-prestamo"]');
        if (!boton) return;
        devolverDesdeInterfaz(boton.dataset.prestamoId);
    });

    renderizarVistaPrestamos();
}
