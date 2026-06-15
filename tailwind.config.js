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
				'card-gray': 'rgba(235, 245, 255, 0.74)',
				'card-grey': 'rgba(235, 245, 255, 0.82)',
				'light-purple': '#B57BFF',
				'accent-gold': '#E8C77E',
				'accent-gold-soft': '#F3E3BC',
				'surface-1': '#15151E',
				'surface-2': '#1F1F2C',
				hairline: 'rgba(235, 235, 255, 0.08)'
			},
			boxShadow: {
				glow: '0 0 40px -8px rgba(145, 34, 255, 0.45)',
				'glow-lg': '0 10px 60px -12px rgba(145, 34, 255, 0.55)',
				'glow-gold': '0 0 32px -6px rgba(232, 199, 126, 0.35)',
				'card-premium':
					'0 24px 60px -24px rgba(0, 0, 0, 0.85), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
				'inset-hairline': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
			},
			backgroundImage: {
				'gradient-purple': 'linear-gradient(135deg, #A24BFF 0%, #7A18E0 55%, #5B0FB0 100%)',
				'gradient-gold': 'linear-gradient(135deg, #F3E3BC 0%, #E8C77E 45%, #C9A24B 100%)',
				'gradient-heading': 'linear-gradient(180deg, #FFFFFF 0%, #E7E2FF 55%, #B9A9E8 100%)',
				glass: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)'
			},
			transitionTimingFunction: {
				premium: 'cubic-bezier(0.22, 1, 0.36, 1)'
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
