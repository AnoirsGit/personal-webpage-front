/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				transparent: 'transparent',
				current: 'currentColor',
				white: '#ffffff',
				'main-blue': '#000C1D'
			},
			spacing: {
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
				320: '80rem'
			}
		}
	},
	plugins: []
};
