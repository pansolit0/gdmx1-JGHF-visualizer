import { apiConfig } from '../../env/config.js';
import { isSessionValid } from './loginAuth.js';


const SPJG = [1.10, 1.10, 0.90, 0.90, 0.80, 0.70, 0.50];
const SPHF = [30.00, 30.00, 40.00, 15.00, 30.00, 30.00, 40.00];
const SPRO = 1150;



let diferenciasPorcentuales = {jg: [], hf: [], ro: []};


async function solicitarDatos(celda, columnas, elementoJG, elementoHF) {

    const datos = { celda: `celda_${celda}`, columnas };

    try {
        const response = await fetch(apiConfig.datosChart, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        actualizarElementoJG(elementoJG, data.jg, celda);
        actualizarElementoHF(elementoHF, data.hf, celda);

        evaluarYActualizarClases(data, celda - 1);
    } catch (error) {
        console.error('Error al hacer la solicitud:', error);
    }
}


function actualizarElementoJG(elemento, valor, celda) {
    if (elemento) {
        // Truncar el valor a dos decimales sin redondear
        const valorTruncado = Math.trunc(valor * 100) / 100;
        elemento.innerHTML = `<h3>JG: ${valorTruncado.toFixed(2)}<br>-----</br> <span>SP:${SPJG[celda - 1]}</span></h3>`;
    }
}


function actualizarElementoHF(elemento, valor, celda) {
    if (elemento) {
        // Asumiendo que HF debe ser un entero, se mantiene toFixed(0) para HF. Si HF también necesita mostrar decimales, ajusta de manera similar a JG.
        elemento.innerHTML = `<h3>HF:${valor.toFixed(0)} <br>-----</br><span>SP: ${SPHF[celda - 1]}</span></h3>`;
    }
}



let ultimosDatosValidos = {jg: Array(7).fill(0), hf: Array(7).fill(0)};


function caudalJG(data, indiceCelda) {
    if (!data || data.jg === undefined) {
        console.error('Objeto data inválido o propiedad jg no encontrada');
        return; // Puedes decidir devolver un valor predeterminado o manejar el error como mejor te parezca
    }
    const deltaJG = (SPJG[indiceCelda] - data.jg);
    const cmSegJG = (deltaJG * ((3.1416 * 16)));
    const QJG = (cmSegJG) * 36 * SPJG[indiceCelda];
    return QJG.toFixed(0);
}


function generarRecomendacion(diferencia, indiceCelda, tipo, data) {
    if (!isSessionValid()) {
        console.log("Sesión no válida o expirada. No se mostrarán recomendaciones.");
        return;
    }

    const setpoint = tipo === 'jg' ? SPJG[indiceCelda] : SPHF[indiceCelda];
    const recomendacionDiv = document.getElementById(`rec${tipo.toUpperCase()}C${indiceCelda + 1}`);

    let mensaje = "";
    if (tipo === 'jg') {
        if (data.jg < 0) {
            mensaje = `<p class="h5 texto-responsive"><strong>JG no se encuentra disponible en este momento.</strong></p>`;
        } else if (Math.abs(diferencia) > 0.1) {
            mensaje = (data.jg < setpoint) ?
                `<p class="h5 texto-responsive"><strong>ACCIÓN:</strong> Suba el flujo de aire 5% del valor que indica el flujómetro, observe y repita la acción si es necesario.</p>` :
                `<p class="h5 texto-responsive"><strong>ACCIÓN:</strong> Baje el flujo de aire 5% del valor que indica el flujómetro, observe y repita la acción si es necesario.</p>`;
        } else {
            mensaje = `<p class="h5 texto-responsive"><strong>No existen recomendaciones por el momento.</strong></p>`;
        }
    } else if (tipo === 'hf') {
        if (data.hf < 0) {
            mensaje = `<p class="h5 texto-responsive"><strong>HF no se encuentra disponible en este momento.</strong></p>`;
        } else if (Math.abs(diferencia) > 0.1) {
            mensaje = diferencia < 0 ?
                `<p class="h5 texto-responsive"><strong>ACCIÓN:</strong> Abrir las válvulas de dardo recorriendo 5cm, observe y repita la acción si es necesario.</p>` :
                `<p class="h5 texto-responsive"><strong>ACCIÓN:</strong> Cerrar las válvulas de dardo recorriendo 5cm, observe y repita la acción si es necesario.</p>`;
        } else {
            mensaje = `<p class="h5 texto-responsive"><strong>No existen recomendaciones por el momento.</strong></p>`;
        }
    }

    recomendacionDiv.innerHTML = mensaje;

    // Hacer que la recomendación desaparezca después de 2 minutos
    setTimeout(() => {
        if (isSessionValid()) {
            recomendacionDiv.innerHTML = '<p class="h5 texto-responsive"><strong>Esperando Siguiente recomendación</strong></p>';
        }
    }, 60000); // 120000 ms = 2 minutos
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

    const resultadoQJG = caudalJG(data, indiceCelda);

    // Solo pasamos resultadoQJG a generarRecomendacion si la diferencia es mayor al 10%
    if (Math.abs(diferenciaJG) > 0.1) {
        generarRecomendacion(diferenciaJG, indiceCelda, 'jg', data, resultadoQJG);
    } else {
        generarRecomendacion(diferenciaJG, indiceCelda, 'jg', data);
    }
    generarRecomendacion(diferenciaHF, indiceCelda, 'hf', data);
}


function actualizarClase(elemento, diferencia, tipo = '') {
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
    let recomendacionDiv = document.getElementById('recRO'); // Asegúrate de que este elemento existe en tu HTML
    if (!elementoRO || !recomendacionDiv) return;

    const datos = {celda: 'celda_1', columnas: ['ro']};

    fetch(apiConfig.datosChart , {
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
            const valorActualRO = data.ro;
            elementoRO.innerHTML = `<h3>RO: ${(valorActualRO)}<br>-----</br><span>SP: ${SPRO}</h3>`; // Incluido setpoint
            const diferenciaPorcentual = Math.abs(valorActualRO - SPRO) / SPRO;
            const ajuste = (((diferenciaPorcentual * SPRO) * 100) / 2);

            if (diferenciaPorcentual >= 0.1) {
                let accion = valorActualRO > SPRO ? 'cerrar' : 'abrir';
                let mensaje = `<p class="texto-responsive">Recomendación RO: Es recomendable <strong class="h5"><b>${accion}</b></Strong> la palanca un <strong class="h5"><b>${ajuste}%</b></strong>.</p>`;
                recomendacionDiv.innerHTML = mensaje;
            } else {
                recomendacionDiv.innerHTML = '<p class="texto-responsive"><strong> RO: El valor de RO está dentro del rango aceptable.</strong></p>';
            }

            // Temporizador para borrar la recomendación después de 1 minuto
            setTimeout(() => {
                recomendacionDiv.innerHTML = '<p class="texto-responsive"><strong>Esperando siguiente recomendación...</strong></p>';
            }, 60000); // 60000 ms = 1 minuto
        })
        .catch(error => {
            console.error('Error al hacer la solicitud:', error);
        });
}


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

document.addEventListener('DOMContentLoaded', function () {
    let elementoRO = document.getElementById('valor-ro');
    // Inicialización y carga de datos iniciales
    actualizarRO();
    actualizarDatos();
    setInterval(actualizarDatos, 300000); // 60000 milisegundos = 1 minuto

    // Añadir event listeners a los checkboxes
    for (let i = 1; i <= 7; i++) {
        let checkboxJG = document.getElementById(`celda${i}-jg-recomendacion`);
        let checkboxHF = document.getElementById(`celda${i}-hf-recomendacion`);

        checkboxJG?.addEventListener('change', () => manejarCheckbox(i, 'jg'));
        checkboxHF?.addEventListener('change', () => manejarCheckbox(i, 'hf'));
    }

    // Revisar el estado de las recomendaciones al cargar la página
    revisarEstadoRecomendaciones();

    // Escuchar el evento loginExitoso para actualizar los datos automáticamente tras el inicio de sesión
    document.addEventListener('loginExitoso', () => {
        console.log('Usuario autenticado. Actualizando datos...');
        actualizarDatos(); // Llama a tu función para actualizar los datos generales
        actualizarRO();    // Llama a tu función específica para actualizar RO
        // Podrías llamar a cualquier otra función relevante aquí según sea necesario
    });
});


export {
    solicitarDatos,
    actualizarElementoJG,
    actualizarElementoHF,
    caudalJG,
    generarRecomendacion,
    evaluarYActualizarClases,
    actualizarClase,
    actualizarDatos,
    actualizarRO,
    manejarCheckbox,
    revisarEstadoRecomendaciones
};
