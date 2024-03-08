import { apiConfig } from '../../env/config.js';

document.addEventListener('DOMContentLoaded', function () {
const socket = io(apiConfig.api);
const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

const SPJG = [1.10, 1.10, 0.90, 0.90, 0.80, 0.70, 0.50];
const SPHF = [30.00, 30.00, 40.00, 15.00, 30.00, 30.00, 40.00];
const SPRO = 1150;



let userMessage = null;
let userInteractionCount = 0;
const inputInitHeight = chatInput.scrollHeight;


const data = {};

const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    let chatContent = className === "outgoing" ? `<p>${message}</p>` : `<span class="material-symbols-outlined">smart_toy</span><p>${message}</p>`;
    chatLi.innerHTML = chatContent;
    return chatLi;
};

const parseUserResponse = (message) => {
    const responseParts = message.split(',').map(part => part.trim());
    // Cambiando la validación para el nuevo formato de fecha YYYY/MM/DD
    if (responseParts.length === 3 && /^celda_[1-7]$/.test(responseParts[0]) && /^(jg|hf|ro)$/.test(responseParts[1]) && /^\d{4}\/\d{2}\/\d{2}$/.test(responseParts[2])) {
        data.celda = responseParts[0];
        data.metrica = responseParts[1];
        // No necesitamos cambiar el orden de los componentes de la fecha aquí porque ya está en el formato correcto
        data.fecha = responseParts[2];
        return `${data.celda}, ${data.metrica}, ${data.fecha}`;
    }
    return "Por favor, sigue el formato 'celda_#, jg/hf/ro, yyyy/mm/dd'. Intenta de nuevo.";
};

const handleUserResponse = () => {
    userMessage = chatInput.value.trim();
    if (!userMessage) return;

    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    userInteractionCount++;

    if (userInteractionCount === 1) {
        // Combina la solicitud de datos específicos del primer fragmento con el mensaje específico del segundo fragmento
        const specificMessage = "bien, ingresa la celda, el tipo de dato (jg, hf o ro) y la fecha en formato Año/Mes/Día. Por ejemplo: 'celda_5, jg, 2024/03/07'";
        setTimeout(() => {
            chatbox.appendChild(createChatLi(specificMessage, "incoming"));
            chatbox.scrollTo(0, chatbox.scrollHeight);
        }, 1000);
    } else if (userInteractionCount === 2) {
        // Combina la lógica de procesamiento del segundo mensaje de ambos fragmentos
        // Asume la existencia de la función parseUserResponse, que debe procesar la respuesta del usuario adecuadamente
        const responseMessage = parseUserResponse(userMessage);
        setTimeout(() => {
            chatbox.appendChild(createChatLi(responseMessage, "incoming"));
            chatbox.scrollTo(0, chatbox.scrollHeight);
            
            // Agregamos la lógica de emisión al servidor del segundo fragmento, asegurándonos de incluir todos los pasos necesarios
            if (data.celda && data.metrica && data.fecha) {
                const [day, month, year] = data.fecha.split('/');
                data.fecha = `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
                socket.emit('solicitarDatosGrafico', data);
                askForAnotherPercentage()
            }
        }, 1000);
    } else if (userInteractionCount === 3) {
        // Manejar la lógica adicional para el tercer mensaje, si es necesario
        handleAdditionalRequest();
    }

    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;
};


function askForAnotherPercentage() {
    setTimeout(() => {
        chatbox.appendChild(createChatLi("¿Necesitas otro porcentaje? Responde 'sí' para continuar o 'no' para terminar.", "incoming"));
        chatbox.scrollTo(0, chatbox.scrollHeight);
        // Resetear el contador de interacciones para permitir una nueva pregunta
        userInteractionCount = 2; // Se ajusta para mantener la lógica de interacción adecuada
    }, 1000);
}



function handleAdditionalRequest() {
    if (userMessage.toLowerCase() === 'sí' || userMessage.toLowerCase() === 'si') {
        // Reiniciar el contador de interacciones para comenzar de nuevo
        userInteractionCount = 0;
        setTimeout(() => {
            chatbox.appendChild(createChatLi("Si necesitas otro porcentaje vuelveme a escribir.", "incoming"));
            chatbox.scrollTo(0, chatbox.scrollHeight);
        }, 1000);
    } else if (userMessage.toLowerCase() === 'no') {
        // Mensaje de despedida pero preparando para reiniciar el chat
        setTimeout(() => {
            chatbox.appendChild(createChatLi("Adiós y muchas gracias, vuelve pronto se despide Isprotec.", "incoming"));
            chatbox.scrollTo(0, chatbox.scrollHeight);
            // Reiniciar el contador de interacciones para permitir una nueva conversación
            userInteractionCount = 0;
        }, 1000);
    }
}

// Eventos de Socket.IO para recibir datos
socket.on('datosGrafico', (responseData) => {
    if (Array.isArray(responseData) && responseData.length > 0) {
        let sum = 0;
        let count = 0; // Contador para la cantidad de elementos que contribuyen al promedio
        let messageToShow = 'Datos recibidos:<br>';

        let metricaParaPromediar = data.metrica; // 'jg', 'hf' o 'ro', determinado dinámicamente
        let celda = parseInt(data.celda.replace('celda_', '')); // Extraer el número de la celda
        let setpoint;

        if (metricaParaPromediar === 'jg') {
            setpoint = SPJG[celda - 1];
        } else if (metricaParaPromediar === 'hf') {
            setpoint = SPHF[celda - 1];
        } else if (metricaParaPromediar === 'ro') {
            setpoint = SPRO; // SPRO es único para todas las celdas
        }

        responseData.forEach((data, index) => {
            if(data[metricaParaPromediar] !== undefined) {
                const metricValue = parseFloat(data[metricaParaPromediar]);
                if (!isNaN(metricValue)) {
                    sum += metricValue;
                    count++;
                }
            }

            const metricas = Object.keys(data).filter(key => key !== 'fecha_registro').map(key => `${key}: ${parseFloat(data[key]).toFixed(2)}`).join(', ');
            const fecha = new Date(data.fecha_registro).toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

            messageToShow += `${index + 1}. Métrica: ${metricaParaPromediar.toUpperCase()} - Valor: ${parseFloat(data[metricaParaPromediar]).toFixed(2)} | Fecha de registro: ${fecha}\n`;
        });

        chatbox.appendChild(createChatLi(messageToShow, "incoming"));
        chatbox.scrollTo(0, chatbox.scrollHeight);

        // Calcular el promedio
        const average = count > 0 ? (sum / count).toFixed(2) : "No disponible";
        const fechaPromedio = responseData.length > 0 ? new Date(responseData[0].fecha_registro).toISOString().substring(0, 10) : "No disponible";
        const promedioMsg = `El valor del promedio de ${metricaParaPromediar} de la celda ${celda} de la fecha ${fechaPromedio} es ${average}.`;

        // Mostrar el mensaje del promedio
        chatbox.appendChild(createChatLi(promedioMsg, "incoming"));
        chatbox.scrollTo(0, chatbox.scrollHeight);

        // Calcular la variación y mostrar en un nuevo mensaje
        if (count > 0) { // Asegurar que tenemos datos para evitar dividir por cero
            const variacion = ((average - setpoint) / setpoint) * 100;
            const variacionMsg = `El porcentaje de variación respecto al setpoint es ${variacion.toFixed(2)}% de la celda ${celda}.`;

            // Mostrar el mensaje de la variación
            chatbox.appendChild(createChatLi(variacionMsg, "incoming"));
            chatbox.scrollTo(0, chatbox.scrollHeight);
        }
    } else {
        chatbox.appendChild(createChatLi("No se recibieron datos válidos o suficientes para calcular el promedio.", "incoming"));
        chatbox.scrollTo(0, chatbox.scrollHeight);
    }
    
});




socket.on('errorDatos', (errorData) => {
    const errorMessage = `Error: ${errorData.error}`;
    chatbox.appendChild(createChatLi(errorMessage, "incoming"));
    chatbox.scrollTo(0, chatbox.scrollHeight);
});

// Eventos del DOM
chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleUserResponse();
    }
});

sendChatBtn.addEventListener("click", handleUserResponse);
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));

// ... any other code that might be there
}); 
