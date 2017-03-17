import Vue from 'vue';
import App from './vue-components/App.vue';
import request from 'superagent';
import router from './vue-router.js';
const apiUrl = require('./api-url.js');


request
	.get(apiUrl + 'commondata')
	.end((err, res) => {
		if (err || !res.body) {
			console.log('Resource "api/commondata" did not responded. Reloading page in 3 sec');
			window.setTimeout(window.location.reload, 3000)
		}
		else {
			new Vue({
				el: '#vue-app',
				router,
				render: (h) => h(App),
				data: {
					currentUser: res.body.currentUser ? res.body.currentUser : false
				}
			})
		}
	});