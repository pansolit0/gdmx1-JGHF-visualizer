const SPJG = [1.3, 1.3, 1.0, 1.0, 0.8, 0.6, 0.5];
const SPHF = [5.0, 5.0, 6.0, 7.0, 8.0, 8.0, 10.0];

let diferenciasPorcentuales = { jg: [], hf: [] };

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
            if (elementoJG) elementoJG.innerHTML = `JG: <br>${truncarADosDecimales(data.jg)}`;
            if (elementoHF) elementoHF.innerHTML = `HF: <br>${truncarADosDecimales(data.hf)}`;
            evaluarYActualizarClases(data, celda - 1);
        })
        .catch(error => {
            console.error('Error al hacer la solicitud:', error);
        });
}

function evaluarYActualizarClases(data, indiceCelda) {
    const elementoJG = document.getElementById(`celda${indiceCelda + 1}-jg`);
    const elementoHF = document.getElementById(`celda${indiceCelda + 1}-hf`);

    const diferenciaJG = Math.abs(data.jg - SPJG[indiceCelda]) / SPJG[indiceCelda];
    const diferenciaHF = Math.abs(data.hf - SPHF[indiceCelda]) / SPHF[indiceCelda];

    diferenciasPorcentuales.jg[indiceCelda] = diferenciaJG;
    diferenciasPorcentuales.hf[indiceCelda] = diferenciaHF;

    actualizarClase(elementoJG, diferenciaJG);
    actualizarClase(elementoHF, diferenciaHF);
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
function solicitarRO(nombreCelda, elementoRO) {
    const datos = { celda: nombreCelda, columnas: ['ro'] };

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
            elementoRO.innerHTML = `RO <br>${truncarADosDecimales(data.ro)}`;
        })
        .catch(error => {
            console.error('Error al hacer la solicitud:', error);
        });
}
document.addEventListener('DOMContentLoaded', function() {    let elementoRO = document.getElementById('valor-ro');
    if (elementoRO) {
        solicitarRO('celda_1', elementoRO);
    }

    actualizarDatos();
    setInterval(actualizarDatos, 600000); // 600000 milisegundos = 10 minutos
});
