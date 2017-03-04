import Vue from 'vue';
import VueRouter from 'vue-router';
import routes from './vue-routes.js';
import App from './vue-components/App.vue';
import request from 'superagent';
const apiUrl = require('./api-url.js');

Vue.use(VueRouter);
const router = new VueRouter({
	routes: routes
});

request
	.get(apiUrl + 'commondata')
	.end((err, res) => {
		if (err || !res.body) {
			console.log('Resource "api/commondata" did not responded. Reloading page in 3 sec');
			window.setTimeout(window.location.reload, 3000)
		}
		else {
			// Когда основные данные приехали, стартуем собственно приложение
			new Vue({
				el: '#vue-app',
				router: router,
				render: function (h) {
					return h(App)
				},
				mounted: function () {},
				methods: {},
				data: {
					currentUser: res.body.currentUser ? res.body.currentUser : false
				}
			})
		}
	});

/*
	import VueCordova from 'vue-cordova';
	Vue.use(VueCordova);
	console.log(Vue.cordova);
*/