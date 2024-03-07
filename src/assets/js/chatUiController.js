const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

let userMessage = null; // Variable to store user's message
let hasUserInteracted = false; // Flag to check if the user has interacted
const inputInitHeight = chatInput.scrollHeight;

const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi;
};

const handleUserResponse = () => {
    userMessage = chatInput.value.trim();
    if (!userMessage) return;

    if (!hasUserInteracted) {
        displayWelcomeMessages();
        hasUserInteracted = true;
    } else {
        // Process the user's message here
    }

    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);
};

const displayWelcomeMessages = () => {
    const welcomeMessages = [
        "Hola como estás 👋, tengo acceso a dos preguntas específicas por el momento.",
        "Puedes preguntar por 1 'porcentaje de una celda de un dato específico de jg, hf, ro de un día' o 2 'Dato específico (jg, hf o ro) de una celda'."
    ];

    welcomeMessages.forEach((msg, index) => {
        setTimeout(() => {
            chatbox.appendChild(createChatLi(msg, "incoming"));
            chatbox.scrollTo(0, chatbox.scrollHeight);
        }, 600 * (index + 1)); // Delay messages to simulate typing
    });
};

chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
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
