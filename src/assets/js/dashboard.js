var options = {
  series: [{
    data: data.slice()
  }],
  chart: {
    id: 'realtime',
    height: 350,
    type: 'line',
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        speed: 1000
      }
    },
    toolbar: {
      show: false
    },
    zoom: {
      enabled: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth'
  },
  title: {
    text: 'Dynamic Updating Chart',
    align: 'left'
  },
  markers: {
    size: 0
  },
  xaxis: {
    type: 'datetime',
    range: XAXISRANGE,
  },
  yaxis: {
    max: 100
  },
  legend: {
    show: false
  },
};

var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();

window.setInterval(function () {
  fetch(apiConfig.datosChart)
      .then(response => response.json())
      .then(newData => {
        // Supongamos que 'newData' es un arreglo de objetos que se ajusta a la estructura de tu gráfico
        // Aquí puedes necesitar algún procesamiento de datos si la estructura no coincide exactamente

        chart.updateSeries([{
          data: newData
        }]);
      })
      .catch(error => {
        console.error('Error al actualizar los datos del gráfico:', error);
      });
}, 1000)