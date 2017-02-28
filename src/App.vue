<template>
	<div>
		<!-- <div class="f-navbar">
			<router-link v-bind:to="rt.path" v-html="rt._title" v-for="rt in routes" v-if="!rt._hidden" class="btn btn-default" v-bind:disabled="rt._disabled" active-class="active"></router-link>
		</div> -->
		<div class="row">
			<div class="col-xs-12">
				<button v-on:click="$router.push('/')" class="btn btn-link">
					ЛОГО
				</button>
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

<script>
	import routes from './_routes.js';

	export default {
		name: 'AppRoot',
		data: function () {
			return {
				routes: routes,
				currentUser: this.$root.currentUser,
				breadcrumbs: {}
			}
		},
		methods: {
			goto_profile: function(){
				this.$router.push('/user-profile')
			}
		}
	}
</script>

<style>
	.f-navbar {
		padding-top: 1em;
	}
	.f-navbar .btn {
		margin-right: 1em;
	}
</style>
