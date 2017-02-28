import Vue from 'vue';
import VueRouter from 'vue-router';
import App from './App.vue';
import routes from './_routes.js';

/*
	import VueCordova from 'vue-cordova';
	Vue.use(VueCordova);
	console.log(Vue.cordova);
*/

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
		currentUser: window.VANILLA_FORUM_CURRENT_USER
	}
})