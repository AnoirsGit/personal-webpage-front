/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				transparent: 'transparent',
				current: 'currentColor',
				white: '#ffffff',
				'deep-dark-bg': '#0D0D13',
				dark: '#1B1B25',
				'text-1': '#8A8AAB',
				'dark-grey': '#2d2d39',
				'main-purple': '#9122FF',
				'main-dark-purple': '#6600cc',
				'card-gray': 'rgba(235, 245, 255, 0.5)',
				'card-grey': 'rgba(235, 245, 255, 0.8)'
			},
			spacing: {
				0.75: '0.1875rem',
				96: '24rem',
				104: '26rem',
				112: '28rem',
				120: '30rem',
				128: '32rem',
				136: '34rem',
				144: '36rem',
				152: '38rem',
				160: '40rem',
				168: '42rem',
				176: '44rem',
				184: '46rem',
				192: '48rem',
				200: '50rem',
				208: '52rem',
				216: '54rem',
				224: '56rem',
				232: '58rem',
				240: '60rem',
				248: '62rem',
				256: '64rem',
				264: '66rem',
				272: '68rem',
				280: '70rem',
				288: '72rem',
				296: '74rem',
				304: '76rem',
				312: '78rem',
				320: '80rem',
				328: '82rem',
				336: '84rem',
				344: '86rem',
				352: '88rem',
				360: '90rem'
			},
			zIndex: {
				0: '0',
				10: '10',
				20: '20',
				30: '30',
				40: '40',
				50: '50',
				60: '60',
				70: '70',
				80: '80',
				90: '90',
				100: '100',
				edge: '40',
				node: '50',
				tooltip: '55',
				max: '999'
			},
			fontSize: {
				xxs: '0.625rem'
			},
			aspectRatio: {
				'16/9': '16 / 9',
				'9/20': '9 / 20',
				'9/16': '9 / 16',
				'4/3': '4 / 3',
				'3/2': '3 / 2'
			}
		}
	},
	plugins: []
};
