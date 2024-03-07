import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',  // La entrada principal
                chart: 'chart.html'  // Otra entrada para chart.html
                // Puedes añadir más entradas si es necesario
            }
        }
    }
});
