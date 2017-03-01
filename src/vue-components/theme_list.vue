<template>
	<div>
		<h2>{{title}}</h2>
		<div v-show="themeList_loading" class="text-center">
			<i class="spin spin-lg"></i>
		</div>
		<table v-show="!themeList_loading" class="table table-striped">
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
					<td>
						<span class="label label-primary" v-if="th.pinned" style="margin-right:.5em">
							<i class="glyphicon glyphicon-pushpin" ></i> Тема прикреплена
						</span>
						<br v-if="th.pinned && th.premoderation"/>
						<span class="label label-primary" v-if="th.premoderation">
							<i class="glyphicon glyphicon-eye-open"></i> Премодерация 
						</span>
					</td>
					<td class="text-center">{{th.cnt_replies}}</td>
					<td class="text-center">{{th.cnt_views}}</td>
					<td style="font-size:.8em;">
						<table>
							<tr>
								<td>Дата</td>
								<td>
									{{th.last_reply.date | dateTimeFormat}}
								</td>
							</tr>
							<tr>
								<td>Автор &#160;</td>
								<td>
									<a href="#" v-on:click.prevent="gotoProfile(th.last_reply_author)">
										{{th.last_reply_author.name}}
									</a>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</tbody>
		</table>
		<div class="row">
			<div class="col-md-9">
				<label>Заголовок</label>
				<input class="form-control" v-model="newTheme.name"/>
			</div>
			<div class="col-md-9">
				<label>Текст</label>
				<input class="form-control" v-model="newTheme._TEMP_firstReply"/>
			</div>
			<div class="col-md-6 text-right">
				<div><label></label></div>
				<i class="spin spin-sm" v-show="newTheme_loading"></i>
				<button class="btn btn-default" v-on:click="theme_create" v-bind:disabled="newTheme_loading || !newTheme.name || !newTheme._TEMP_firstReply">
				Создать тему
				</button>
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
					.post('/api/themes')
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
</style>
