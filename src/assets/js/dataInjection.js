const SPJG = [1.3, 1.3, 1.0, 1.0, 0.8, 0.6, 0.5];
const SPHF = [5.0, 5.0, 6.0, 7.0, 8.0, 8.0, 10.0];
const SPRO = 1.25;


let diferenciasPorcentuales = { jg: [], hf: [], ro: [] };
console.log(diferenciasPorcentuales)

function truncarADosDecimales(numero) {
    return Math.trunc(numero * 100) / 100;
}

function solicitarDatos(celda, columnas, elementoJG, elementoHF) {
    const datos = { celda: 'celda_' + celda, columnas: columnas };
    fetch(apiConfig.datosChart, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (elementoJG) elementoJG.innerHTML = `<h2>JG: <br>${truncarADosDecimales(data.jg)}</h2>`;
            if (elementoHF) elementoHF.innerHTML = `<h2>HF: <br>${truncarADosDecimales(data.hf)}</h2>`;
            evaluarYActualizarClases(data, celda - 1);
        })
        .catch(error => {
            console.error('Error al hacer la solicitud:', error);
        });
}

function generarRecomendacion(diferencia, indiceCelda, tipo) {
    const setpoint = tipo === 'jg' ? SPJG[indiceCelda] : SPHF[indiceCelda];
    const recomendacionDiv = document.getElementById(`rec${tipo.toUpperCase()}C${indiceCelda + 1}`);
    if (Math.abs(diferencia) > 0.1) { // Si la diferencia absoluta es mayor al 10%
        let mensaje = '';
        const valorActual = tipo === 'jg' ? diferenciasPorcentuales.jg[indiceCelda] * SPJG[indiceCelda] + SPJG[indiceCelda] : diferenciasPorcentuales.hf[indiceCelda] * SPHF[indiceCelda] + SPHF[indiceCelda];
        const diferenciaPorcentual = tipo === 'jg' ? diferenciasPorcentuales.jg[indiceCelda] : diferenciasPorcentuales.hf[indiceCelda];

        let accion = '';
        if (tipo === 'jg') {
            accion = diferenciaPorcentual > 0 ? `JG: abrir las válvulas ${(Math.abs(diferencia)).toFixed(2)}%, dejar salir aire` : `JG: agregar aire ${(Math.abs(diferencia)).toFixed(2)}%`;
            mensaje = `<h5>${accion} para alcanzar SP.</h5>`;
        } else if (tipo === 'hf') {
            accion = diferenciaPorcentual > 0 ? `HF: cerrar válvulas ${(Math.abs(diferencia)).toFixed(2)}%` : `HF: abrir válvulas ${(Math.abs(diferencia)).toFixed(2)}%`;
            mensaje = `<h5>${accion} para alcanzar SP.</h5>`;
        }
        recomendacionDiv.innerHTML = mensaje;
    } else {
        recomendacionDiv.innerHTML = ''; // Limpia la recomendación si la diferencia es <= 10%
    }
}
function evaluarYActualizarClases(data, indiceCelda) {
    const elementoJG = document.getElementById(`celda${indiceCelda + 1}-jg`);
    const elementoHF = document.getElementById(`celda${indiceCelda + 1}-hf`);

    const diferenciaJG = (data.jg - SPJG[indiceCelda]) / SPJG[indiceCelda];
    const diferenciaHF = (data.hf - SPHF[indiceCelda]) / SPHF[indiceCelda];

    diferenciasPorcentuales.jg[indiceCelda] = diferenciaJG;
    diferenciasPorcentuales.hf[indiceCelda] = diferenciaHF;

    actualizarClase(elementoJG, Math.abs(diferenciaJG));
    actualizarClase(elementoHF, Math.abs(diferenciaHF));
    generarRecomendacion(diferenciaJG, indiceCelda, 'jg');
    generarRecomendacion(diferenciaHF, indiceCelda, 'hf');
    console.log("Diferencias porcentuales actualizadas (JG, HF):", diferenciasPorcentuales);
}

function actualizarClase(elemento, diferencia) {
    elemento.classList.remove('btn-danger', 'btn-warning');
    if (diferencia > 0.2) {
        elemento.classList.add('btn-danger');
    } else if (diferencia > 0.1) {
        elemento.classList.add('btn-warning');
    }
}

function actualizarDatos() {
    for (let i = 1; i <= 7; i++) {
        let elementoJG = document.getElementById(`celda${i}-jg`);
        let elementoHF = document.getElementById(`celda${i}-hf`);
        if (elementoJG && elementoHF) {
            solicitarDatos(i, ['jg', 'hf'], elementoJG, elementoHF);
        }
    }
}

function actualizarRO() {
    let elementoRO = document.getElementById('valor-ro');
    if (!elementoRO) return;

    const datos = { celda: 'celda_1', columnas: ['ro'] };

    fetch(apiConfig.datosChart, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            elementoRO.innerHTML = `<h2>RO: <br>${truncarADosDecimales(data.ro)}</h2>`;
            const diferenciaRO = Math.abs(data.ro - SPRO) / SPRO;
            diferenciasPorcentuales.ro[0] = diferenciaRO; // Asumiendo que solo hay un elemento RO
            actualizarClase(elementoRO, diferenciaRO);
        })
        .catch(error => {
            console.error('Error al hacer la solicitud:', error);
        });
}


document.addEventListener('DOMContentLoaded', function() {    let elementoRO = document.getElementById('valor-ro');
    // Inicialización y carga de datos iniciales
    actualizarRO();
    actualizarDatos();
    setInterval(actualizarDatos, 600000); // 600000 milisegundos = 10 minutos

    // Añadir event listeners a los checkboxes
    for (let i = 1; i <= 7; i++) {
        let checkboxJG = document.getElementById(`celda${i}-jg-recomendacion`);
        let checkboxHF = document.getElementById(`celda${i}-hf-recomendacion`);

        checkboxJG?.addEventListener('change', () => manejarCheckbox(i, 'jg'));
        checkboxHF?.addEventListener('change', () => manejarCheckbox(i, 'hf'));
    }

    // Revisar el estado de las recomendaciones al cargar la página
    revisarEstadoRecomendaciones();
    })


function manejarCheckbox(celda, tipo) {
    const checkbox = document.getElementById(`celda${celda}-${tipo}-recomendacion`);
    const recomendacionDiv = document.getElementById(`rec${tipo.toUpperCase()}C${celda}`);

    if (checkbox.checked) {
        recomendacionDiv.innerHTML = ''; // Vaciar recomendación
        const tiempoEspera = 30 * 60 * 1000; // 30 minutos en milisegundos
        const expiracion = new Date().getTime() + tiempoEspera;
        localStorage.setItem(`expiracionRecomendacion${celda}${tipo}`, expiracion.toString());

        // Iniciar temporizador (opcional, dependiendo de si necesitas hacer algo después de 30 minutos)
    }
}
function revisarEstadoRecomendaciones() {
    for (let i = 1; i <= 7; i++) {
        ['jg', 'hf'].forEach(tipo => {
            const expiracion = localStorage.getItem(`expiracionRecomendacion${i}${tipo}`);
            if (expiracion && new Date().getTime() < parseInt(expiracion)) {
                // Todavía estamos dentro del periodo de espera. Podrías optar por deshabilitar el checkbox aquí.
            } else {
                // Periodo de espera concluido. Puedes optar por habilitar el checkbox o borrar la entrada de localStorage.
                localStorage.removeItem(`expiracionRecomendacion${i}${tipo}`);
            }
        });
    }
}
