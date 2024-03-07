import { apiConfig } from '../../env/config.js';

let chartInstance = null;
// Definición de setpoints para JG y HF
let setpointsJG = [1.10, 1.10, 0.90, 0.90, 0.80, 0.70, 0.50];
let setpointsHF = [30.00, 30.00, 40.00, 15.00, 30.00, 30.00, 40.00];
let setpoints = setpointsJG; // Setpoints iniciales
let intervalId;
let currentCelda = 'celda_1';
let currentMetrica = 'jg'; // Métrica inicial

async function obtenerDatos(celda, rangoHoras = 24) {
    // La métrica actual se usa para decidir si se debe obtener 'jg' o 'hf'
    const metrica = currentMetrica;

    const response = await fetch(apiConfig.llenarGraficos, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            celda: celda,
            metrica: metrica, // Enviamos 'metrica' en lugar de 'columnas'
            rangoHoras: rangoHoras
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Nos aseguramos de usar la métrica correcta para el eje Y
    return data.map(d => ({
        x: new Date(d.fecha_registro).getTime(),
        y: d[metrica]
    }));
}
async function obtenerDatosTabla(celda, columnas, rangoHoras = 24) {
    const response = await fetch(apiConfig.llenarTabla, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            celda: celda,
            columnas: columnas,
            rangoHoras: rangoHoras
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function actualizarTabla(celda) {
    const columnas = ['jg', 'hf', 'ro', 'sb', 'eg', 'fecha_registro'];
    const datos = await obtenerDatosTabla(celda, columnas);
    const datosInvertidos = datos.reverse();

    const tbody = document.querySelector(".table tbody");
    tbody.innerHTML = '';
    datosInvertidos.forEach(dato => {
        const fila = `<tr>
            <td>${dato.jg}</td>
            <td>${dato.hf}</td>
            <td>${dato.ro}</td>
            <td>${new Date(dato.fecha_registro).toLocaleDateString()}</td>
        </tr>`;
        tbody.innerHTML += fila;
    });
}

async function inicializarGrafico(celda, rangoHoras = 24) {
    currentCelda = celda;
    const numeroCelda = parseInt(celda.split('_')[1], 10);
    // Se añade la métrica actual al título del gráfico
    document.getElementById('chartTitle').innerText = `Celda ${numeroCelda} - ${currentMetrica.toUpperCase()}`;

    const datos = await obtenerDatos(celda, rangoHoras);
    const setpoint = currentMetrica === 'jg' ? setpointsJG[numeroCelda - 1] : setpointsHF[numeroCelda - 1];
    const datosSetpoint = datos.length ? datos.map(d => ({ x: d.x, y: setpoint })) : [];

    const options = {
        series: [{
            name: currentMetrica.toUpperCase(),
            data: datos
        }, {
            name: 'Setpoint',
            data: datosSetpoint
        }],
        chart: {
            type: 'line',
            height: 550,
            animations: {
                enabled: true
            }
        },
        xaxis: {
            type: 'datetime'
        },
        title: {
            text: `Datos de las últimas ${rangoHoras} horas para celda ${numeroCelda}`
        },
        stroke: {
            width: [2, 2]
        },
        markers: {
            size: [4, 0]
        },
        tooltip: {
            shared: true,
            intersect: false
        },
        legend: {
            show: true
        }
    };

    const chartContainer = document.querySelector("#chart");
    if (chartInstance) {
        chartInstance.updateOptions(options);
    } else {
        chartInstance = new ApexCharts(chartContainer, options);
        chartInstance.render();
    }

    clearInterval(intervalId);
    intervalId = setInterval(() => {
        inicializarGrafico(currentCelda, parseInt(document.getElementById('timeRangeSelector').value, 10));
    }, 60000); // 60000 ms = 1 minuto
}

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const celdaText = this.textContent.trim();
            const celdaId = `celda_${celdaText.split(' ')[1]}`;
            const rangoSeleccionado = parseInt(document.getElementById('timeRangeSelector').value, 10);
            inicializarGrafico(celdaId, rangoSeleccionado);
            actualizarTabla(celdaId);
        });
    });

    const debouncedActualizar = debounce((celda, rangoSeleccionado) => {
        inicializarGrafico(celda, rangoSeleccionado);
        actualizarTabla(celda);
    });

    document.getElementById('timeRangeSelector').addEventListener('change', function() {
        const rangoSeleccionado = parseInt(this.value, 10);
        debouncedActualizar(currentCelda, rangoSeleccionado);
    });

    document.getElementById('btnJG').addEventListener('click', function() {
        currentMetrica = 'jg';
        setpoints = setpointsJG;
        inicializarGrafico(currentCelda, parseInt(document.getElementById('timeRangeSelector').value, 10));
        actualizarTabla(currentCelda);
    });

    document.getElementById('btnHF').addEventListener('click', function() {
        currentMetrica = 'hf';
        setpoints = setpointsHF;
        inicializarGrafico(currentCelda, parseInt(document.getElementById('timeRangeSelector').value, 10));
        actualizarTabla(currentCelda);
    });

    const rangoInicial = parseInt(document.getElementById('timeRangeSelector').value, 10);
    inicializarGrafico(currentCelda, rangoInicial);
    actualizarTabla(currentCelda);
});

export {
    debounce,
    obtenerDatos,
    obtenerDatosTabla,
    inicializarGrafico,
    actualizarTabla
};
