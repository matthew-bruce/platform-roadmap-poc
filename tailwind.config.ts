import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rm: {
          red: '#DA202A',
          charcoal: '#1F2430',
          slate: '#4A5568',
          mist: '#EEF2F7',
          steel: '#A0AEC0',
          ice: '#F8FAFC',
          plum: '#6B46C1',
          teal: '#0F766E'
        }
      },
      boxShadow: {
        soft: '0 12px 40px -18px rgba(31,36,48,.28)'
      }
    }
  },
  plugins: []
};

export default config;
