import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
                mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                brand: {
                    50: '#e8f5e9',
                    100: '#c8e6c9',
                    200: '#a5d6a7',
                    300: '#81c784',
                    400: '#4caf50',
                    500: '#2e7d32',
                    600: '#1b5e20',
                    700: '#144a19',
                    800: '#0e3311',
                    900: '#071d09',
                    primary: '#1B5E20',
                    secondary: '#2E7D32',
                    accent: '#F9A825',
                    'accent-hover': '#f57f17',
                },
                status: {
                    hadir: '#2E7D32',
                    terlambat: '#F9A825',
                    duplicate: '#EF6C00',
                    rejected: '#C62828',
                },
                madrasah: {
                    surface: '#FFFFFF',
                    bg: '#F5F5F5',
                    fg: '#212121',
                    muted: '#616161',
                    border: '#E0E0E0',
                }
            },
        },
    },

    plugins: [forms],
};

