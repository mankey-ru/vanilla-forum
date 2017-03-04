<template>
	<div>
		<h2>{{title}}</h2>
		<i v-show="themeList_loading" class="spin spin-lg spin-global"></i>
		<div v-show="!themeList_loading">
			<table class="table table-striped">
				<thead>
					<tr>
						<td></td>
						<td></td>
						<td class="text-center">Ответы</td>
						<td class="text-center">Просмотры</td>
						<td>Последнее сообщение</td>
					</tr>
				</thead>
				<tbody>
					<tr v-for="th in themeList" v-bind:class="{'info':th.pinned}">
						<td>
							<a href="#" v-on:click.prevent="gotoTheme(th)">{{th.name}}</a>
						</td>
						<td class="nwr">
							<span title="Тема прикреплена" class="label label-primary" v-if="th.pinned" style="margin-right:.5em">
								<i class="glyphicon glyphicon-pushpin"></i> 
							</span>
							<br v-if="th.pinned && th.premoderation"/>
							<span title="Тема премодерируется" class="label label-primary" v-if="th.premoderation">
								<i class="glyphicon glyphicon-eye-open"></i>  
							</span>
						</td>
						<td class="text-center">{{th.cnt_replies}}</td>
						<td class="text-center">{{th.cnt_views}}</td>
						<td class="th-list-lastcol">
							<div class="nwr">
							{{th.last_reply.date | dateTimeFormat}}
							</div>

							<a href="#" v-on:click.prevent="gotoProfile(th.last_reply_author)">
								{{th.last_reply_author.name}}
							</a>
						</td>
					</tr>
				</tbody>
			</table>
			<br />
			<br />
			<div class="row">
				<div class="col-md-9">
					<label>Заголовок</label>
					<input class="form-control" v-model="newTheme.name"/>
				</div>
				<div class="col-md-9">
					<label>Текст</label>
					<input class="form-control" v-model="newTheme._TEMP_firstReply"/>
				</div>
				<div class="col-md-1 text-right">
					<label>&#160;</label>
					<br/>
					<i class="spin spin-sm" v-show="newTheme_loading"></i>
				</div>
				<div class="col-md-5 text-right">
					<label>&#160;</label>
					<button class="btn btn-primary btn-block" v-on:click="theme_create" v-bind:disabled="newTheme_readyToCreate">
						Создать тему
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	import _ from 'lodash';
	import notie from 'notie';
	import request from 'superagent';
	import mixins from './../vue-mixins.js';
	export default {
		name: 'theme_list',
		data: function () {
			return {
				title: 'Список тем форума «Обо всём»',
				themeList: [],
				themeList_loading: true,
				newTheme: {
					name: '',
					_TEMP_firstReply: ''
				},
				newTheme_loading: false
			}
		},
		methods: {
			theme_fetch: function() {
				this.themeList_loading = true;
				$.getJSON('/api/themes', {})
				.done((data)=>{
					this.themeList_loading = false;
					if (data instanceof Array) {
						for (let th of data) {
							this.themeList.push(getTheme(th));
						}
					}
				})
				.fail(()=>{
					console.warn('Request error. Will retry after 2 sec.');
					setTimeout(this.theme_fetch, 2000);
				})
				.always(()=>{})
			},
			theme_create: function(){
				this.newTheme_loading = true;
				this.newTheme._TEMP_UID4DEL = this.$root.currentUser._id; // TODO определять на сервере конечно
				request
				.post(apiUrl + 'themes')
				.send(this.newTheme)
				.end((err, res)=>{
					console.log(err, res)
					if (err || !res.body) {
						notie.alert('error', 'Ошибка запроса', 3);
					}
					else {
						notie.alert('success', 'Тема создана', 3);
						var newTheme = res.body.newTheme;
							// Adding same props as aggregate/$lookup does when GETting /api/themes
							// Actually showing new row is unnecessary, so its just a PoC
							newTheme.last_reply = res.body.newReply;
							newTheme.last_reply_author = this.$root.currentUser;
							newTheme.author = this.$root.currentUser;
							this.themeList.push(newTheme);
							this.gotoTheme(newTheme);
						}
						this.newTheme_loading = false;
					});
			}
		},
		mixins: [mixins], 
		computed: {
			newTheme_readyToCreate: function(){
				return this.newTheme_loading || !this.newTheme.name || !this.newTheme._TEMP_firstReply
			}
		},
		mounted: function(){
			this.theme_fetch();
		},
		destroyed: function () {},		
		beforeUpdate: function() {},
		created: function(){}
	}

	function getTheme(arg) {
		return arg;
	}
	

</script>

<style>
	.th-list-lastcol, .th-list-lastcol a {
		
	}
</style>
