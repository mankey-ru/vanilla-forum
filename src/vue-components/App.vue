<script>
	import routes from './../vue-routes.js';

	export default {
		name: 'AppRoot',
		data: function () {
			return {
				routes: routes,
				currentUser: this.$root.currentUser
			}
		},
		methods: {
			goto_profile: function(){
				this.$router.push('/user-profile')
			}
		}
	}
</script>


<template>
	<div>
		<!-- <div class="f-navbar">
			<router-link v-bind:to="rt.path" v-html="rt._title" v-for="rt in routes" v-if="!rt._hidden" class="btn btn-default" v-bind:disabled="rt._disabled" active-class="active"></router-link>
		</div> -->
		<div class="row">
			<div class="col-xs-12">
				<span v-on:click="$router.push('/')" style="font-size: 3em;cursor: pointer;">
					<i class="glyphicon glyphicon-equalizer"></i> LOGO
				</span>
			</div>
			<div class="col-xs-12 text-right">
				<button v-on:click="goto_profile" class="btn btn-default">
					<i class="glyphicon glyphicon-user"></i> {{currentUser.name}}
				</button>
			</div>
		</div>
		<router-view></router-view>
	</div>
</template>



<style>
	.f-navbar {
		padding-top: 1em;
	}
	.f-navbar .btn {
		margin-right: 1em;
	}
</style>

