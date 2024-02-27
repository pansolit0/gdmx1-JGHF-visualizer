document.querySelector('#boton-login').addEventListener('click', function() {
    let username = document.querySelector('#user-input').value; // Considera cambiar el id a algo más genérico como #username-input
    let password = document.querySelector('#password-input').value;
    login(username, password);

});

async function login(username, password) {
    try {
        const response = await fetch('http://localhost:3000/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username, // Cambiado de email a username
                password: password,
            }),
        });

        const data = await response.json();

        if (data.success) {
            // Logica de éxito
        } else {
            alert('Login fallido: usuario o contraseña incorrectos.');
        }
    } catch (error) {
        console.error('Error al intentar login:', error);
    }
}
