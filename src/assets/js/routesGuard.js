import { isSessionValid } from './loginAuth.js';

document.addEventListener('DOMContentLoaded', function() {
    // Verifica inmediatamente si la sesión es válida al cargar cualquier página
    // Esto es útil especialmente para páginas como chart.html que requieren autenticación
    if (!isSessionValid() && window.location.pathname.endsWith('/chart.html')) {
        window.location.href = './index.html'; // Redirige al login si la sesión no es válida
        return; // Previene la ejecución del resto del script
    }

    protectLinks();
});

function protectLinks() {
    const protectedLinks = document.querySelectorAll('a[data-protected="true"]');
    protectedLinks.forEach(link => {
        link.addEventListener('click', handleProtectedLinkClick);
    });
}

function handleProtectedLinkClick(e) {
    e.preventDefault();

    if (isSessionValid()) {
        window.location.href = e.target.getAttribute('href');
    } else {
        alert('Por favor, inicia sesión para acceder a esta página.');
        window.location.href = './gdmx-1/gdmx1/index.html';
    }
}
