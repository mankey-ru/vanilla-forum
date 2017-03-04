<template>
	<div>
		<br />
		<br />
		<br />
		<br />
		<div class="row">
			<form v-on:submit.prevent="register_submit">
				<div class="col-md-18 col-md-offset-5 col-xs-24">
					<div class="row form-group">
						<div class="col-xs-18">
							<label>Name</label>
							<input v-model="nu.name" class="form-control" />
						</div>
						<div class="col-xs-6"></div>
					</div>
					<div class="row form-group">
						<div class="col-xs-18">
							<label>Email</label>
							<input v-model="nu.email" class="form-control" />
						</div>
						<div class="col-xs-6">
							<div><label>&#160;</label></div>
							<i v-show="nu.email_pending" class="spin spin-sm"></i>
							<div v-show="nu.email_unique" class="color-good">
								<i class="glyphicon glyphicon-ok-circle"></i>
								Not available
							</div>
							<div v-show="nu.email_exists" class="color-bad">
								<i class="glyphicon glyphicon-ban-circle"></i>
								Available
							</div>
							<div v-show="email_invalid===true" class="color-bad">
								<i class="glyphicon glyphicon-ban-circle"></i>
								Invalid format
							</div>
						</div>
					</div>
					<div class="row form-group">
						<div class="col-xs-18">
							<label>Password</label>
							<input v-if="!nu.password_visible" type="password" v-model="nu.password" class="form-control" />
							<input v-if="nu.password_visible" type="text" v-model="nu.password" class="form-control" />
						</div>
						<div class="col-xs-6">
							<div><label>&#160;</label></div>
							<i v-show="!nu.password_visible" v-on:click="nu.password_visible = !nu.password_visible" class="glyphicon glyphicon-eye-open"></i>
							<i v-show="nu.password_visible" v-on:click="nu.password_visible = !nu.password_visible" class="glyphicon glyphicon-eye-close"></i>
						</div>
					</div>
					<div class="row form-group" v-bind:class="{opa: nu.password_visible}">
						<div class="col-xs-18">
							<label>Confirm password</label>
							<input v-model="nu.password_confirm" v-bind:disabled="nu.password_visible" class="form-control" type="password"/>
						</div>
						<div class="col-xs-6" v-show="!nu.password_visible">
							<div><label>&#160;</label></div>
							<div v-show="password_match===true" class="color-good">
								<i class="glyphicon glyphicon-ok-circle"></i>
								Match
							</div>
							<div v-show="password_match===false" class="color-bad">
								<i class="glyphicon glyphicon-ban-circle"></i>
								Not match
							</div>
						</div>
					</div>
					<div>
						<div class="col-xs-18 text-right">
							<button type="submit" class="btn btn-primary" v-bind:disabled="form_invalid">Submit</button>
						</div>
						<div class="col-xs-6">
							<i v-if="nu.submit_pending" class="spin spin-sm"></i>
						</div>
					</div>
				</div>
			</form>
		</div>
	</div>
</template>

<script>
	import request from 'superagent';
	import notie from 'notie';
	import mixins from './../vue-mixins.js';

	var apiUrl = require('./../api-url.js');
	var emailRe = new RegExp("^([0-9a-zA-Z_]([-.\\w]*[0-9a-zA-Z_-])*@([0-9a-zA-Z][-\\w]*[0-9a-zA-Z]\\.)+[a-zA-Z]{2,9})$");

	var Comp = {
		name: 'user-profile',
		data: function () {
			return {
				nu: { // NewUser
					name: '',
					email: '',
					email_pending: false,
					email_unique: false,
					email_exists: false,
					password: '',
					password_confirm: '',
					password_visible: false,
					submit_pending: false
				}
			}
		},
		methods: {
			register_submit: function(){
				var nu = this.nu;
				if (this.password_match===false) {
					return
				}
				nu.submit_pending = true;
				request
					.post(apiUrl + 'auth/reg')
					.send(nu)
					.end((err, res)=>{
							if (err || !res.body) {
								notie.alert({
									type: 'error', 
									text: res.body.error || 'Registration failed'
								});
							}
							else {
								notie.alert({
									type: 'success', 
									text:'Registration succeeded', 
									time: 1
								});
								this.$root.currentUser = res.body;
								this.gotoProfile(); 
							}
							nu.submit_pending = false;
						});
			}
		},
		mixins: [mixins],
		computed: {
			password_match: function(){
				var nu = this.nu;
				if (nu.password_visible || (!nu.password && !nu.password_confirm)) {
					// if pwd is visible or at least one of passwords is empty
					// then do nothing
					return null
				}
				return nu.password===nu.password_confirm
			},
			form_invalid: function(){
				var match_invalid = this.password_match===false; // if value is null then form is OK (see password_match)
				return match_invalid || !this.nu.password || this.email_invalid
			},
			email_invalid: function(){
				if (!this.nu.email) {
					return null
				}
				return !emailRe.test(this.nu.email);
			}
		},
		destroyed: function () {},		
		beforeUpdate: function() {},
		created: function(){}
	}
	export default Comp;
</script>

<style scoped>
	.glyphicon {
		font-size: 2em;
		vertical-align: middle;
		cursor: pointer;
	}
	.color-good {
		color: #5cb85c; /* taken from btn-success */
	}
	.color-bad {
		color: #c9302c; /* taken from btn-danger */
	}
	.color-good, .color-bad {
		font-weight: bold;
	}
</style>
