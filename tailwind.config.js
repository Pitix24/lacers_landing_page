/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Fondo base — mate, oscuro, sin reflejos (bandeja de máquina)
        canvas: {
          DEFAULT: '#0B0D0F',
          deep: '#121417',
        },
        // Tarjetas, paneles de servicio y HUD flotante
        'surface-card': {
          DEFAULT: '#171A1E',
          deep: '#1E2227',
        },
        // Líneas de división, bordes técnicos y gridlines de calibración
        metal: {
          DEFAULT: '#282C34',
          deep: '#33383F',
        },
        // Acento primario: botones, tags "//", estados activos, spindle
        'accent-red': {
          DEFAULT: '#DC2626',
          light: '#EF4444',
        },
        // Estado nominal: WhatsApp, "NOMINAL // EN TOLERANCIA"
        'accent-green': '#10B981',
        // Texto
        main: '#FFFFFF',
        muted: '#9CA3AF',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '2px',
        md: '3px',
        lg: '4px',
      },
      boxShadow: {
        'glow-red': '0 0 16px rgba(220, 38, 38, 0.35)',
        'glow-red-lg': '0 0 24px rgba(220, 38, 38, 0.55)',
        panel: '0 8px 32px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(#DC2626 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '24px 24px',
      },
    },
  },
  plugins: [],
}
