/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./www/**/*.{html,js}', './www/css/src/**/*.css'],
    theme: {
        extend: {
            colors: {
                /** Teal marca (CTAs, acentos) */
                marine: '#1B8C7A',
                navy: '#1E3A8A',
                graphite: '#374151',
                mist: '#E5E7EB',
                snow: '#FFFFFF',
                accent: '#2563EB'
            }
        }
    },
    plugins: []
};
