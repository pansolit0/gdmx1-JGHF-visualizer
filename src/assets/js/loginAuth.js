document.addEventListener('DOMContentLoaded', function() {
    restoreSession();
    document.querySelector('#boton-login').addEventListener('click', function() {
        let username = document.querySelector('#user-input').value;
        let password = document.querySelector('#password-input').value;
        login(username, password);
    });
});

async function login(username, password) {
    try {
        const response = await fetch(apiConfig.authLogin, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
            }),
        });

        if (response.ok) {
            const data = await response.json();

            if (data.authUser) {
                // Calcular tiempo de expiración (12 horas a partir de ahora)
                const expirationTime = new Date().getTime() + 12 * 60 * 60 * 1000;

                // Guardar el estado de la sesión en localStorage
                saveLoginState(data, expirationTime);

                // Actualizar la UI según el estado de la sesión
                document.querySelector('section').style.display = 'none';
                document.getElementById('contenido-restringido').style.display = 'block';

                console.log('Login exitoso:', data);
            } else {
                alert('Error de autenticación: No se recibió el token.');
            }
        } else if (response.status === 401) {
            alert('Login fallido: usuario o contraseña incorrectos.');
        } else if (response.status === 404) {
            alert('Usuario no encontrado.');
        } else {
            console.error('Error al realizar el login:', response.statusText);
        }
    } catch (error) {
        console.error('Error al intentar login:', error);
    }
}

function saveLoginState(data, expirationTime) {
    localStorage.setItem('loginState', JSON.stringify({
        isLogged: true,
        token: data.authUser,
        expires: expirationTime,
        displayLogin: 'none', // Ocultar login
        displayContent: 'block' // Mostrar contenido restringido
    }));
}

function restoreSession() {
    const loginState = JSON.parse(localStorage.getItem('loginState'));
    if (loginState && new Date().getTime() < loginState.expires) {
        // La sesión es válida, ajustar la UI según el estado guardado
        document.querySelector('section').style.display = loginState.displayLogin;
        document.getElementById('contenido-restringido').style.display = loginState.displayContent;
    } else {
        // La sesión ha expirado o no existe, ajustar la UI para mostrar el login
        document.querySelector('section').style.display = 'block';
        document.getElementById('contenido-restringido').style.display = 'none';
        if (loginState) localStorage.removeItem('loginState'); // Limpiar estado si existía
    }
}
