import Vue from 'vue';
import VueRouter from 'vue-router';
import App from './App.vue';
import routes from './_routes.js';

/*import VueCordova from 'vue-cordova';
Vue.use(VueCordova);
console.log(Vue.cordova);*/

Vue.use(VueRouter);
const router = new VueRouter({
	routes: routes
});

window.VUEI = new Vue({
	el: '#vue-app',
	router: router,
	render: function (h) {
		return h(App)
	},
	mounted: function () {},
	methods: {},
	data: {
		currentUser: {
			name: 'Александр Друзь',
			first_name: 'Александр',
			last_name: 'Друзь',
			id: 4,
			online: true,
			rating_total: 244,
			pic: 'userpics/4.png',
			bdate: '12.04.1961',
			about: 'В статье о семи простых способах получить прибавку к заработной плате поиск новой работы я поставил на последнее место. Но часто бывает так, что дальнейшее развитие возможно только после смены работы. Как не упустить шанс и получить действительно классное предложение о работе — об этом я и хочу рассказать. Считаю, что заработная плата — это отображение ценности сотрудника для компании. И каждый человек просто обязан найти себе работу с максимальной заработной платой.'
		}
	}
})