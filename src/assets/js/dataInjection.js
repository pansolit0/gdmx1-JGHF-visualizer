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
            if (elementoJG) elementoJG.innerHTML = `JG <br>${data.jg}`;
            if (elementoHF) elementoHF.innerHTML = `HF <br>${data.hf}`;
        })
        .catch(error => {
            console.error('Error al hacer la solicitud:', error);
        });
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
    const datos = { celda: nombreCelda, columnas: ['ro'] }; // Solo estamos interesados en la columna 'ro'

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
            elementoRO.innerHTML = `RO <br>${data.ro}`; // Asegúrate de que 'data.ro' es la propiedad correcta
        })
        .catch(error => {
            console.error('Error al hacer la solicitud:', error);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    let elementoRO = document.getElementById('valor-ro');
    if (elementoRO) {
        solicitarRO('celda_1', elementoRO); // Asegúrate de que 'nombreDeLaCeldaParaRO' sea el nombre correcto
    }
    actualizarDatos(); // Actualizar los datos inmediatamente al cargar la página
    setInterval(actualizarDatos, 600000); // 600000 milisegundos = 10 minutos
});