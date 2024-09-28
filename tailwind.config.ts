import { type Config } from 'tailwindcss'

export default {
	plugins: [],
	content: [
		'src/{routes,islands,components}/**/*.{ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				primary: '#000080',
				secondary: '#2a307f',
				tertiary: '#1c274c',
				quaternary: '#363755',
				white: '#ffffff',
				gray: '#f1f1f1',
				creamson: '#fff0de',
				dim: '#f9f9f9',
				'dim-red': '#8b0000',
				'dim-white': '#ffffffb3',
				'black-200': '#020202',
				'black-300': '#333333',
				'black-400': '#1f1e31',
				'black-500': '#555555',
				'gray-100': '#888888',
			},
		},
		fontFamily: {
			inter: ['Inter', 'Helvetica', 'sans-serif'],
		},
		screens: {
			'2xs': '375px',
			xs: '480px',
			sm: '640px',
			md: '768px',
			lg: '1024px',
			xl: '1280px',
			'2xl': '1536px',
		},
	},
} satisfies Config
