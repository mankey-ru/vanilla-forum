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
							<td>{{user.about}}</td>
						</tr>
						<tr>
							<td>Дата рождения</td>
							<td>{{user.bdate}}</td>
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
	import $ from 'jquery';

	var Comp = {
		name: 'user-profile',
		data: function () {
			return {
				user: false
			}
		},
		methods: {
			getUser: function(){
				var user_id = this.$router.currentRoute.params.user_id;
				if (user_id) {
					var url = Math.random()>.1 ? 'backend-emu/user-info.json' : '';
					$.getJSON(url, {})
					.done((data)=>{
						if (data instanceof Object) {
							this.user = data
						}
					})
					.fail(()=>{
						console.warn('Рандомная (10%) неудача получения. Ждём секунду и пробуем ещё раз.');
						setTimeout(this.getUser, 1000);
					})
					.always(()=>{})
				}
				else {
					this.user = this.$root.$data.currentUser;
				}
			}
		},
		mounted: function(){
			this.getUser();
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
