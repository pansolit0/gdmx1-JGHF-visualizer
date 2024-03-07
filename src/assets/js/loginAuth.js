// loginAuth.js
import { apiConfig } from '../../env/config.js';

document.addEventListener('DOMContentLoaded', function() {
    restoreSession();

    // Verificar si el botón de login existe antes de agregar el manejador de eventos
    const botonLogin = document.querySelector('#boton-login');
    if (botonLogin) {
        botonLogin.addEventListener('click', function() {
            let username = document.querySelector('#user-input').value;
            let password = document.querySelector('#password-input').value;
            login(username, password);
        });
    } else {
        console.error('El botón de login no se encontró en el documento.');
    }

    // Verificar si el botón de cerrar sesión existe antes de agregar el manejador de eventos
    const botonCerrarSesion = document.querySelector('#boton-cerrar-sesion');
    if (botonCerrarSesion) {
        botonCerrarSesion.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    } else {
        console.error('El botón de cerrar sesión no se encontró en el documento.');
    }
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
                const expirationTime = new Date().getTime() + (12 * 60 * 60 * 1000); // 12 horas
                saveLoginState(data, expirationTime);
                document.querySelector('section').style.display = 'none';
                document.getElementById('contenido-restringido').style.display = 'block';

                // Emitir evento personalizado tras inicio de sesión exitoso
                document.dispatchEvent(new CustomEvent('loginExitoso', {
                    detail: { mensaje: 'Usuario autenticado' }
                }));


            } else {
                alert('Error de autenticación: No se recibió el token.');
            }
        } else {
            // Manejar otros estados de respuesta
        }
    } catch (error) {
        console.error('Error al intentar login:', error);
    }
}

function saveLoginState(data, expirationTime) {
    localStorage.setItem('loginState', JSON.stringify({
        isLogged: true,
        token: data.authUser,
        expires: expirationTime
    }));
}

function restoreSession() {
    const loginState = JSON.parse(localStorage.getItem('loginState'));
    const sectionElement = document.querySelector('section');
    const contenidoRestringidoElement = document.getElementById('contenido-restringido');

    if (loginState && new Date().getTime() < loginState.expires) {
        // Ocultar la sección de login si existe
        if (sectionElement) sectionElement.style.display = 'none';
        // Mostrar contenido restringido si existe
        if (contenidoRestringidoElement) contenidoRestringidoElement.style.display = 'block';
    } else {
        // Mostrar la sección de login si existe
        if (sectionElement) sectionElement.style.display = 'block';
        // Ocultar contenido restringido si existe
        if (contenidoRestringidoElement) contenidoRestringidoElement.style.display = 'none';
    }
}


function isSessionValid() {
    const loginState = JSON.parse(localStorage.getItem('loginState'));
    return loginState && new Date().getTime() < loginState.expires;
}

function logout() {
    // Eliminar el estado de inicio de sesión de localStorage
    localStorage.removeItem('loginState');

    // Emitir evento personalizado tras cierre de sesión exitoso
    document.dispatchEvent(new CustomEvent('logoutExitoso', {
        detail: { mensaje: 'Sesión cerrada' }
    }));

    // Este console.log posiblemente no se mostrará si la redirección se ejecuta correctamente
    console.log('Sesión cerrada exitosamente');

    // Redirigir al usuario a la página de inicio de sesión
    // Se utiliza setTimeout para asegurarnos de que el evento de cierre de sesión y el log se ejecuten antes de la redirección
    setTimeout(() => {
        window.location.href = './index.html'; // Asegúrate de que esta es la URL correcta
    }, 100); // Retraso de 100ms
}



export {
    logout,
    isSessionValid,
    restoreSession,
    login,
    saveLoginState
};
