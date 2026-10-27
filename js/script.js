// Inicio de la aplicación: carga los cuatro fragmentos y conecta las vistas.
const contenedorVistas = document.getElementById("contenedor-vistas");
const enlacesNavegacion = [...document.querySelectorAll("[data-vista]")];
let navegacionInicializada = false;

async function cargarVistas() {
    const archivos = [
        "vistas/vista_catalogo.html",
        "vistas/vista_prestamos.html",
        "vistas/vista_libro.html",
        "vistas/vista_ajustes.html"
    ];

    try {
        const respuestas = await Promise.all(archivos.map(function (archivo) {
            return fetch(archivo);
        }));

        const indiceFallido = respuestas.findIndex(function (respuesta) {
            return !respuesta.ok;
        });
        if (indiceFallido !== -1) {
            throw new Error(`No se pudo cargar ${archivos[indiceFallido]} (HTTP ${respuestas[indiceFallido].status}).`);
        }

        const fragmentos = await Promise.all(respuestas.map(function (respuesta) {
            return respuesta.text();
        }));

        contenedorVistas.replaceChildren();
        fragmentos.forEach(function (fragmento) {
            const plantilla = document.createElement("template");
            // Los fragmentos son archivos HTML propios del proyecto, no datos escritos por usuarios.
            plantilla.innerHTML = fragmento;
            contenedorVistas.append(plantilla.content.cloneNode(true));
        });

        // Cargar el estado antes de generar las tarjetas y los resúmenes.
        cargarDatos();
        prepararNavegacion();
        inicializarModales();
        inicializarVistaCatalogo();
        inicializarVistaPrestamos();
        inicializarFormularioLibro();
        inicializarVistaAjustes();

        aplicarTema();
        actualizarSaludoUsuario();
        renderizarCatalogo();
        renderizarVistaPrestamos();
        renderizarResumen();
        mostrarVista("vista-catalogo");
    } catch (error) {
        console.error("Error al cargar las vistas:", error);
        contenedorVistas.replaceChildren();
        const mensaje = document.createElement("p");
        mensaje.classList.add("mensaje-error");
        mensaje.textContent = "No se pudieron cargar las vistas. Abre index.html desde Live Server y revisa las rutas de la carpeta vistas.";
        contenedorVistas.append(mensaje);
    }
}

function prepararNavegacion() {
    if (navegacionInicializada) return;
    navegacionInicializada = true;

    enlacesNavegacion.forEach(function (enlace) {
        enlace.addEventListener("click", function (evento) {
            evento.preventDefault();
            const idVista = enlace.dataset.vista;
            if (idVista === "vista-libro") prepararFormularioNuevo();
            mostrarVista(idVista);
        });
    });
}

function mostrarVista(idVista) {
    const vistas = document.querySelectorAll(".vista");
    const existeVista = [...vistas].some(function (vista) {
        return vista.id === idVista;
    });

    if (!existeVista) {
        console.warn(`No existe la vista ${idVista}. Comprueba su id en el HTML.`);
        return;
    }

    vistas.forEach(function (vista) {
        vista.hidden = vista.id !== idVista;
    });

    enlacesNavegacion.forEach(function (enlace) {
        const seleccionado = enlace.dataset.vista === idVista;
        if (seleccionado) enlace.setAttribute("aria-current", "page");
        else enlace.removeAttribute("aria-current");
    });
}

cargarVistas();
