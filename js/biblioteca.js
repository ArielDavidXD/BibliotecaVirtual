// Lógica del modelo: reglas de negocio y persistencia.
const MAX_PRESTAMOS_ACTIVOS = 3;
const DIAS_PRESTAMO = 14;
const CLAVE_ALMACENAMIENTO = "biblioteca";

function obtenerFechaHoyISO() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function sumarDiasFecha(fechaISO, dias) {
    const [anio, mes, dia] = fechaISO.split("-").map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    fecha.setUTCDate(fecha.getUTCDate() + dias);
    return [
        fecha.getUTCFullYear(),
        String(fecha.getUTCMonth() + 1).padStart(2, "0"),
        String(fecha.getUTCDate()).padStart(2, "0")
    ].join("-");
}

function diferenciaDias(fechaInicial, fechaFinal) {
    const [anio1, mes1, dia1] = fechaInicial.split("-").map(Number);
    const [anio2, mes2, dia2] = fechaFinal.split("-").map(Number);
    const inicio = Date.UTC(anio1, mes1 - 1, dia1);
    const final = Date.UTC(anio2, mes2 - 1, dia2);
    return Math.round((final - inicio) / 86400000);
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return "—";
    const [anio, mes, dia] = fechaISO.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit", month: "2-digit", year: "numeric"
    }).format(fecha);
}

function obtenerPrestamoActivo(libro) {
    const idLibro = typeof libro === "object" ? libro.id : libro;
    return prestamos.find(function (prestamo) {
        return String(prestamo.idLibro) === String(idLibro) &&
            prestamo.fechaDevolucion === null;
    }) ?? null;
}

function contarPrestamosActivos() {
    return prestamos.filter(function (prestamo) {
        return prestamo.fechaDevolucion === null;
    }).length;
}

function calcularDiasRetraso(prestamo, fechaReferencia = obtenerFechaHoyISO()) {
    return Math.max(0, diferenciaDias(prestamo.fechaLimite, fechaReferencia));
}

function estaVencido(prestamo) {
    return prestamo.fechaDevolucion === null &&
        prestamo.fechaLimite < obtenerFechaHoyISO();
}

function prestarLibro(idLibro, persona) {
    const libro = libros.find(function (elemento) {
        return String(elemento.id) === String(idLibro);
    });

    if (!libro) return { ok: false, mensaje: "No se encontró el libro." };
    if (libro.coleccion) return { ok: false, mensaje: "Los libros de colección no se pueden prestar." };
    if (obtenerPrestamoActivo(libro)) return { ok: false, mensaje: "Este libro ya tiene un préstamo activo." };
    if (contarPrestamosActivos() >= MAX_PRESTAMOS_ACTIVOS) {
        return { ok: false, mensaje: "Ya hay tres préstamos activos. Devuelve un libro antes de realizar otro préstamo." };
    }

    const nombre = typeof persona === "string" ? persona.trim() : "";
    if (nombre.length < 2 || nombre.length > 40) {
        return { ok: false, campo: "persona", mensaje: "El nombre debe tener entre 2 y 40 caracteres." };
    }

    const hoy = obtenerFechaHoyISO();
    prestamos.push(crearPrestamo({
        idLibro: libro.id,
        persona: nombre,
        fechaPrestamo: hoy,
        fechaLimite: sumarDiasFecha(hoy, DIAS_PRESTAMO),
        fechaDevolucion: null
    }));

    return { ok: true, mensaje: `Préstamo registrado. Fecha límite: ${formatearFecha(sumarDiasFecha(hoy, DIAS_PRESTAMO))}.` };
}

function devolverPrestamo(idPrestamo) {
    const prestamo = prestamos.find(function (elemento) {
        return String(elemento.id) === String(idPrestamo) &&
            elemento.fechaDevolucion === null;
    });

    if (!prestamo) {
        return { ok: false, mensaje: "No se encontró un préstamo activo para devolver." };
    }

    const hoy = obtenerFechaHoyISO();
    const diasRetraso = diferenciaDias(prestamo.fechaLimite, hoy);
    prestamo.fechaDevolucion = hoy;

    const libro = libros.find(function (elemento) {
        return String(elemento.id) === String(prestamo.idLibro);
    });
    const titulo = libro ? libro.titulo : "El libro";
    const aTiempo = diasRetraso <= 0;

    const mensaje = aTiempo
        ? `«${titulo}» se devolvió a tiempo.`
        : `«${titulo}» se devolvió con ${diasRetraso} días de retraso.`;

    return { ok: true, aTiempo, mensaje, prestamo };
}

// Validar y guardar un libro nuevo o editar uno existente.
function guardarLibro(datos, idLibroEdicion = "") {
    const titulo = String(datos.titulo ?? "").trim();
    const autor = String(datos.autor ?? "").trim();
    const anio = Number(datos.anio);
    const genero = String(datos.genero ?? "").trim();
    const comentario = String(datos.comentario ?? "").trim();
    const coleccion = Boolean(datos.coleccion);
    const anioActual = new Date().getFullYear();

    if (titulo.length < 3 || titulo.length > 60) {
        return { ok: false, campo: "titulo", mensaje: "El título debe tener entre 3 y 60 caracteres." };
    }
    if (!autor) {
        return { ok: false, campo: "autor", mensaje: "Debes introducir el nombre del autor." };
    }
    if (!Number.isInteger(anio) || anio < 1000 || anio > anioActual) {
        return { ok: false, campo: "anio", mensaje: `El año debe estar entre 1000 y ${anioActual}.` };
    }
    if (!genero) {
        return { ok: false, campo: "genero", mensaje: "Selecciona un género." };
    }
    if (comentario.length > 120) {
        return { ok: false, campo: "comentario", mensaje: "El comentario no puede superar los 120 caracteres." };
    }

    const duplicado = libros.some(function (libro) {
        const esOtroLibro = String(libro.id) !== String(idLibroEdicion);
        return esOtroLibro &&
            normalizarTexto(libro.titulo) === normalizarTexto(titulo) &&
            normalizarTexto(libro.autor) === normalizarTexto(autor);
    });

    if (duplicado) {
        return { ok: false, campo: "titulo", mensaje: "Ya existe un libro con ese título y ese autor." };
    }

    const libroEdicion = idLibroEdicion === ""
        ? null
        : libros.find(function (libro) {
            return String(libro.id) === String(idLibroEdicion);
        });

    if (idLibroEdicion !== "" && !libroEdicion) {
        return { ok: false, mensaje: "No se encontró el libro que intentas editar." };
    }

    if (libroEdicion && coleccion && obtenerPrestamoActivo(libroEdicion)) {
        return { ok: false, campo: "coleccion", mensaje: "No puedes marcar como colección un libro que tiene un préstamo activo." };
    }

    const datosLimpios = { titulo, autor, anio, genero, comentario, coleccion };

    if (libroEdicion) {
        Object.assign(libroEdicion, datosLimpios);
        return { ok: true, libro: libroEdicion, editado: true, mensaje: "Libro actualizado correctamente." };
    }

    const nuevoLibro = crearLibro({ id: generarIdUnico("l"), ...datosLimpios });
    libros.push(nuevoLibro);
    return { ok: true, libro: nuevoLibro, editado: false, mensaje: "Libro agregado correctamente." };
}

function eliminarLibro(idLibro) {
    const indiceLibro = libros.findIndex(function (libro) {
        return String(libro.id) === String(idLibro);
    });

    if (indiceLibro === -1) return { ok: false, mensaje: "No se encontró el libro." };

    const libro = libros[indiceLibro];
    if (obtenerPrestamoActivo(libro)) {
        return { ok: false, mensaje: "No se puede eliminar un libro con un préstamo activo." };
    }

    libros.splice(indiceLibro, 1);
    for (let i = prestamos.length - 1; i >= 0; i -= 1) {
        if (String(prestamos[i].idLibro) === String(idLibro)) {
            prestamos.splice(i, 1);
        }
    }

    return { ok: true, mensaje: "Libro eliminado correctamente." };
}

function guardarDatos() {
    try {
        localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify({
            libros,
            prestamos,
            preferencias
        }));
        return true;
    } catch (error) {
        console.error("No se pudieron guardar los datos:", error);
        return false;
    }
}

function cargarDatos() {
    try {
        const texto = localStorage.getItem(CLAVE_ALMACENAMIENTO);
        if (texto === null) return;

        const datos = JSON.parse(texto);
        if (!datos || !Array.isArray(datos.libros) || !Array.isArray(datos.prestamos)) {
            console.error("Los datos guardados no tienen el formato esperado. Se usarán los datos iniciales.");
            return;
        }

        const librosCargados = datos.libros.map(function (libro) {
            return crearLibro(libro);
        });
        const idsCargados = new Set(librosCargados.map(function (libro) { return String(libro.id); }));
        const prestamosCargados = datos.prestamos
            .filter(function (prestamo) { return idsCargados.has(String(prestamo.idLibro)); })
            .map(function (prestamo) { return crearPrestamo(prestamo); });

        libros.splice(0, libros.length, ...librosCargados);
        prestamos.splice(0, prestamos.length, ...prestamosCargados);

        if (datos.preferencias && typeof datos.preferencias === "object") {
            preferencias.nombreUsuario = String(datos.preferencias.nombreUsuario ?? "").slice(0, 40);
            preferencias.temaOscuro = Boolean(datos.preferencias.temaOscuro);
            preferencias.ordenCampo = ["titulo", "autor", "anio"].includes(datos.preferencias.ordenCampo)
                ? datos.preferencias.ordenCampo : "titulo";
            preferencias.ordenDireccion = datos.preferencias.ordenDireccion === "desc" ? "desc" : "asc";
        }
    } catch (error) {
        console.error("No se pudieron recuperar los datos guardados:", error);
    }
}

function restablecerBiblioteca() {
    const iniciales = crearDatosIniciales();
    libros.splice(0, libros.length, ...iniciales.libros);
    prestamos.splice(0, prestamos.length, ...iniciales.prestamos);
    preferencias.nombreUsuario = "";
    preferencias.temaOscuro = false;
    preferencias.ordenCampo = "titulo";
    preferencias.ordenDireccion = "asc";
    guardarDatos();
}
