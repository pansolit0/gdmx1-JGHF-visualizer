const SPJG = [1.30, 1.30, 1.00, 1.00, 0.80, 0.60, 0.50];
const SPHF = [5.00, 5.00, 6.00, 7.00, 8.00, 8.00, 10.00];
const SPRO = 1.25;


let diferenciasPorcentuales = { jg: [], hf: [], ro: [] };

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
            if (elementoJG) elementoJG.innerHTML = `<h3>JG: <br>${truncarADosDecimales(data.jg)}</h3>`;
            if (elementoHF) elementoHF.innerHTML = `<h3>HF: <br>${truncarADosDecimales(data.hf)}</h3>`;
            evaluarYActualizarClases(data, celda - 1);
        })
        .catch(error => {
            console.error('Error al hacer la solicitud:', error);
        });
}



function generarRecomendacion(diferencia, indiceCelda, tipo , data) {


    // Definir el setpoint basado en el tipo.
    const setpoint = tipo === 'jg' ? SPJG[indiceCelda] : SPHF[indiceCelda];

    // Obtener el elemento del DOM donde se mostrará la recomendación.
    const recomendacionDiv = document.getElementById(`rec${tipo.toUpperCase()}C${indiceCelda + 1}`);

    // Comprobar si la diferencia es mayor al 10%.
    if (Math.abs(diferencia) > 0.1) {
        // Obtener el valor actual a partir de la diferencia porcentual y el setpoint.
        const valorActual = tipo === 'jg'  ?
            diferenciasPorcentuales.jg[indiceCelda] * SPJG[indiceCelda] + SPJG[indiceCelda] : diferenciasPorcentuales.hf[indiceCelda] * SPHF[indiceCelda] + SPHF[indiceCelda];

        // Calcular el porcentaje de cambio necesario respecto al setpoint.
        const porcentajeCambio = (Math.abs(diferencia*100)).toFixed(0);

        // Definir la acción a tomar basada en si el valor actual es mayor o menor que el setpoint.
        const accion = valorActual > setpoint ?
            `Disminuir` : `Incrementar`;

        // Construir el mensaje con la acción a tomar, el porcentaje de cambio y el setpoint.
        const mensaje = `<p><strong class="h5"><b>${tipo.toUpperCase()}:${accion}</b></strong> el valor un <strong class="h5"><b>${porcentajeCambio}%</b></strong> para llegar a Setpoint: <strong class="h5"><b>${setpoint}</b></strong></p>`;

        // Establecer el mensaje en el div de recomendación.
        recomendacionDiv.innerHTML = mensaje;
    } else {
        // Si la diferencia es menor o igual al 10%, no hay recomendaciones.
        recomendacionDiv.innerHTML = '<b>No existen recomendaciones por el momento</b>';
    }
}


function caudalJG(data, indiceCelda) {
    if (!data || data.jg === undefined) {
        console.error('Objeto data inválido o propiedad jg no encontrada');
        return; // Puedes decidir devolver un valor predeterminado o manejar el error como mejor te parezca
    }
    const deltaJG = (SPJG[indiceCelda] - data.jg );
    const cmSegJG = (deltaJG * ((3.1416 * 16 )) ) ;
    const QJG = (cmSegJG ) * 36 * SPJG[indiceCelda] ;
    return QJG.toFixed(0);
}


function evaluarYActualizarClases(data, indiceCelda) {
    const elementoJG = document.getElementById(`celda${indiceCelda + 1}-jg`);
    const elementoHF = document.getElementById(`celda${indiceCelda + 1}-hf`);

    const diferenciaJG = (data.jg - SPJG[indiceCelda]) / SPJG[indiceCelda];
    const diferenciaHF = (data.hf - SPHF[indiceCelda]) / SPHF[indiceCelda];

    // Almacenar las diferencias porcentuales
    diferenciasPorcentuales.jg[indiceCelda] = diferenciaJG;
    diferenciasPorcentuales.hf[indiceCelda] = diferenciaHF;

    // Actualizar clases basado en las diferencias
    actualizarClase(elementoJG, Math.abs(diferenciaJG));
    actualizarClase(elementoHF, Math.abs(diferenciaHF));

    // Generar recomendaciones
    generarRecomendacion(diferenciaJG, indiceCelda, 'jg');
    generarRecomendacion(diferenciaHF, indiceCelda, 'hf');

    // Llamar a caudalJG y almacenar el resultado en una nueva variable
    const resultadoQJG = caudalJG(data, indiceCelda);

    // Aquí puedes usar resultadoQJG para lo que necesites
    console.log(`El resultado de QJG para la celda ${indiceCelda} es: ${resultadoQJG}`);
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
            const valorActualRO = data.ro;
            elementoRO.innerHTML = `<h2>RO: <br>${truncarADosDecimales(valorActualRO)}</h2>`;
            const diferenciaPorcentual = Math.abs(valorActualRO - SPRO) / SPRO;
            const ajuste = truncarADosDecimales(((diferenciaPorcentual * SPRO)*100)/2 ); // Calcula el ajuste como la mitad de la diferencia porcentual

            // Evalúa si la variación porcentual es mayor o igual a 0.1 (10%)
            if (diferenciaPorcentual >= 0.1) {
                let accion = valorActualRO > SPRO ? 'cerrar' : 'abrir';
                let mensaje = `<p>Recomendación RO: Es recomendable <strong class="h5"><b>${accion}</b></Strong> la palanca un <strong class="h5"><b>${ajuste}%</b></strong>.</p>`;
                recomendacionDiv.innerHTML = mensaje;
            } else {
                recomendacionDiv.innerHTML = '<p>Recomendación RO: El valor de RO está dentro del rango aceptable.</p>';
            }

            // Opcional: actualizarClase(elementoRO, diferenciaPorcentual);
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
