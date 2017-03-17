<template>
	<div>
		<br/>
		<br/>
		<div v-show="!user" class="text-center">
			<i class="spin spin-lg"></i>
		</div>
		<div v-show="user">
			<div class="col-md-12 col-xs-24 text-center">
				<img v-bind:src="user.pic" class="f-userpic"/>
			</div>
			<div class="col-md-12 col-xs-24">
				<h2>{{user.name}}</h2>
				<table class="table">
					<tbody>
						<tr>
							<td>О себе</td>
							<td>
								<div v-if="own">
									<input v-model="user.about" class="form-control"/>
								</div>
								<div v-if="!own">
									{{user.about}}
								</div>
							</td>
						</tr>
						<tr>
							<td>Дата рождения</td>
							<td>
								<div v-if="own">
									<input v-model="user.bdate" class="form-control"/>
								</div>
								<div v-if="!own">
									{{user.bdate}}
								</div>
							</td>
						</tr>
						<tr>
							<td>Суммарный рейтинг комментариев пользователя</td>
							<td>{{user.rating_total}}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<script>
	import request from 'superagent';	
	var apiUrl = require('./../api-url.js');

	var Comp = {
		name: 'user-profile',
		data: function () {
			return {
				user: false,
				own: false
			}
		},
		methods: {
			getUser: function(){
				var user_id = this.$router.currentRoute.params.user_id;
				if (user_id) {
					request
						.get(`${apiUrl}user/${user_id}`)
						.end((err, res) => {
							if (err || !res.body) {
								notie.alert({
									type: 'error',
									text: 'Request error'
								});
							}
							else {
								if (res.body instanceof Object) {
									this.user = res.body;
									this.own = this.currentUser._id === res.body._id;
								}
							}
						});				
				}
				else {
					this.user = this.currentUser;
					this.own = true;
				}
			}
		},
		mounted: function(){
			this.getUser();
		},
		computed: {
			currentUser: function(){
				return this.$root.$data.currentUser
			}
		},
		watch: {
		    '$route': 'getUser' // чтобы при смене /#/user-profile/1 на /#/user-profile обовлялся пользователь
		},
		destroyed: function () {},		
		beforeUpdate: function() {},
		created: function(){}
	}
	export default Comp;
</script>

<style scoped>
	.f-userpic {
		max-width:100%;

	}
</style>
