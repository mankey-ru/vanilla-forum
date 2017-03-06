<script>
	const apiUrl = require('./../api-url.js');
	import mixins from './../vue-mixins.js';
	import routes from './../vue-routes.js';
	import request from 'superagent';
	import notie from 'notie';

	export default {
		name: 'AppRoot',
		data: function () {
			return {
				routes: routes,
				signIn: {
					email: '',
					password: '',
					pending: false
				},
				signOut_pending: false
			}
		},
		methods: {
			signIn_submit: function(){
				if (!this.signIn_valid) {
					return
				}
				this.signIn.pending = true;
				request
				.post(apiUrl + 'auth/in')
				.send({
					username: this.signIn.email,
					password: this.signIn.password
				})
				.end((err, res)=>{
					if (err || !res.body) {
						notie.alert({ type: 'error', text: 'Request error' })
					}
					else if (!res.body.user) {
						notie.alert({ type: 'warning', text: 'Email/password combination not found. Please try again.' })
					}
					else {
						notie.alert({ type: 'success', text: 'Success', time: 1 })
						this.$root.currentUser = res.body.user;
					}
					this.signIn.pending = false;
				});
			},
			signOut: function(){
				this.signOut_pending = true;
				request
				.post(apiUrl + 'auth/out')
				.end((err, res)=>{
					if (err || !res.body) {
						notie.alert({ type: 'error', text: 'Request error' })
					}
					else if (res.body.user) {
						notie.alert({ type: 'warning', text: 'Signout failed' })
					}
					else {
						notie.alert({ type: 'success', text: 'Success', time: 1 })
						this.$root.currentUser = false;
					}
					this.signOut_pending = false;
				});
			}
		},
		mixins: [mixins],
		computed: {
			signIn_valid: function(){
				return this.signIn.email && this.signIn.password
			},
			currentUser: function(){
				return this.$root.currentUser
			}
		}
	}
</script>


<template>
	<div>
		<!-- <div class="f-navbar">
			<router-link v-bind:to="rt.path" v-html="rt._title" v-for="rt in routes" v-if="!rt._hidden" class="btn btn-default" v-bind:disabled="rt._disabled" active-class="active"></router-link>
		</div> -->
		<div class="row header">
			<div class="col-xs-7">
				<span v-on:click="$router.push('/')" style="font-size: 3em;cursor: pointer;">
					<i class="glyphicon glyphicon-equalizer"></i>&#160;LOGO
				</span>
			</div>
			<div class="col-xs-17">
				<div v-if="currentUser" class="text-right">
					<button v-on:click="gotoProfile" class="btn btn-default">
						<i class="glyphicon glyphicon-user"></i> {{currentUser.name}}
					</button>
					<button v-on:click="signOut" class="btn btn-default">
						<i v-show="signOut_pending" class="spin"></i> 
						<i v-show="!signOut_pending" class="glyphicon glyphicon-log-out"></i> 
						Log out
					</button>
				</div>
				<div v-if="!currentUser">
					<form v-on:submit.prevent="signIn_submit">
						<div class="row">
							<div class="col-xs-6 col-xs-offset-4">
								<label>Email</label>
								<input name="email" type="email" class="form-control" v-model="signIn.email"/>
							</div>
							<div class="col-xs-6">
								<label>Password</label>
								<input name="password" class="form-control" v-model="signIn.password" type="password"/>
							</div>
							<div class="col-xs-4">
								<div><label>&#160;</label></div>
								<button class="btn btn-primary" v-bind:disabled="!signIn_valid || signIn.pending" type="submit">
									<i v-show="signIn.pending" class="spin"></i> 
									<i v-show="!signIn.pending" class="glyphicon glyphicon-log-in"></i> 
									Log in
								</button>
							</div>
							<div class="col-xs-4 text-right">
								<div><label>&#160;</label></div>
								<button class="btn btn-primary" v-on:click.prevent="gotoRegister" v-bind:disabled="signIn.pending" type="button">
									Register
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>					
		</div>
		<router-view></router-view>
	</div>
</template>



<style>
	.header {margin-bottom: 2em;}
</style>

