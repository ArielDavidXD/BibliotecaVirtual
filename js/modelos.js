// Funciones para crear identificadores y objetos con una estructura consistente.
let contadorIdentificadores = 0;

function generarIdUnico(prefijo) {
    contadorIdentificadores += 1;
    return `${prefijo}-${Date.now()}-${contadorIdentificadores}`;
}

function crearLibro(datos) {
    return {
        id: datos.id ?? generarIdUnico("libro"),
        titulo: String(datos.titulo ?? "").trim(),
        autor: String(datos.autor ?? "").trim(),
        anio: Number(datos.anio),
        genero: String(datos.genero ?? "Otro"),
        coleccion: Boolean(datos.coleccion),
        comentario: String(datos.comentario ?? "").slice(0, 120)
    };
}

function crearPrestamo(datos) {
    return {
        id: datos.id ?? generarIdUnico("prestamo"),
        idLibro: datos.idLibro,
        persona: String(datos.persona ?? "").trim(),
        fechaPrestamo: datos.fechaPrestamo,
        fechaLimite: datos.fechaLimite,
        fechaDevolucion: datos.fechaDevolucion ?? null
    };
}

// Normaliza texto para buscar o comparar ignorando tildes y mayúsculas.
function normalizarTexto(texto) {
    return String(texto ?? "")
        .trim()
        .toLocaleLowerCase("es")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}
