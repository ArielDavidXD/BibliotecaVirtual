// Los datos iniciales se calculan con respecto al día de ejecución,
// para que las fechas de ejemplo no queden desfasadas con el tiempo.
function fechaInicialRelativa(diasDesdeHoy) {
    const fecha = new Date();
    fecha.setHours(12, 0, 0, 0);
    fecha.setDate(fecha.getDate() + diasDesdeHoy);

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function crearDatosIniciales() {
    const librosIniciales = [
        { id: "l1", titulo: "El principito", autor: "Antoine de Saint-Exupéry", anio: 1943, genero: "Clásico", coleccion: false, comentario: "Una historia sobre la amistad y la imaginación." },
        { id: "l2", titulo: "Cien años de soledad", autor: "Gabriel García Márquez", anio: 1967, genero: "Novela", coleccion: false, comentario: "Una novela fundamental de la literatura latinoamericana." },
        { id: "l3", titulo: "Breve historia del tiempo", autor: "Stephen Hawking", anio: 1988, genero: "Ciencia", coleccion: false, comentario: "Introducción a ideas sobre el universo." },
        { id: "l4", titulo: "Don Quijote de la Mancha", autor: "Miguel de Cervantes", anio: 1605, genero: "Clásico", coleccion: false, comentario: "Edición de lectura para conocer el clásico." },
        { id: "l5", titulo: "Cosmos", autor: "Carl Sagan", anio: 1980, genero: "Ciencia", coleccion: false, comentario: "Un recorrido por el universo y la ciencia." },
        { id: "l6", titulo: "La sombra del viento", autor: "Carlos Ruiz Zafón", anio: 2001, genero: "Novela", coleccion: false, comentario: "Misterio ambientado en Barcelona." },
        { id: "l7", titulo: "Diccionario de mitología", autor: "Edición de biblioteca", anio: 1998, genero: "Historia", coleccion: true, comentario: "Ejemplar de consulta: no se presta." },
        { id: "l8", titulo: "Atlas histórico ilustrado", autor: "Edición de biblioteca", anio: 2012, genero: "Historia", coleccion: true, comentario: "Atlas de colección para consulta en sala." }
    ].map(crearLibro);

    const prestamosIniciales = [
        // Activo y vencido: la fecha límite quedó 11 días antes de hoy.
        crearPrestamo({
            id: "p1", idLibro: "l2", persona: "Ana Pérez",
            fechaPrestamo: fechaInicialRelativa(-25),
            fechaLimite: fechaInicialRelativa(-11),
            fechaDevolucion: null
        }),
        // Activo y todavía dentro del plazo.
        crearPrestamo({
            id: "p2", idLibro: "l3", persona: "Luis Gómez",
            fechaPrestamo: fechaInicialRelativa(-5),
            fechaLimite: fechaInicialRelativa(9),
            fechaDevolucion: null
        }),
        // Devuelto a tiempo: fecha de devolución anterior a la fecha límite.
        crearPrestamo({
            id: "p3", idLibro: "l4", persona: "Marta Díaz",
            fechaPrestamo: fechaInicialRelativa(-18),
            fechaLimite: fechaInicialRelativa(-4),
            fechaDevolucion: fechaInicialRelativa(-5)
        }),
        // Devuelto tarde: 8 días después de la fecha límite.
        crearPrestamo({
            id: "p4", idLibro: "l5", persona: "Pedro León",
            fechaPrestamo: fechaInicialRelativa(-30),
            fechaLimite: fechaInicialRelativa(-16),
            fechaDevolucion: fechaInicialRelativa(-8)
        })
    ];

    return {
        libros: librosIniciales,
        prestamos: prestamosIniciales
    };
}

const datosDeArranque = crearDatosIniciales();
let libros = datosDeArranque.libros;
let prestamos = datosDeArranque.prestamos;

// Preferencias que también se guardan en localStorage.
let preferencias = {
    nombreUsuario: "",
    temaOscuro: false,
    ordenCampo: "titulo",
    ordenDireccion: "asc"
};
