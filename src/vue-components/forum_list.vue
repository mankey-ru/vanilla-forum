

<script>
	import _ from 'lodash';
	import mixins from './../vue-mixins.js';
	export default {
		name: 'forum-card',
		data: function () {
			return {
				title: 'Форумы ОАО «РЖД»',
				forumList: [],
				forumList_loading: true
			}
		},
		methods: {
			forum_fetch: function() {
				this.forumList_loading = true;
				var url = Math.random()>.1 ? 'backend-emu/forum-list.json' : '';
				$.getJSON(url, {})
				.done((data)=>{
					this.forumList_loading = false;
					if (data instanceof Array) {
						for (let forum of data) {
							this.forumList.push(getForum(forum));
						}
					}
				})
				.fail(()=>{
					console.warn('Рандомная (10%) неудача отправки. Ждём секунду и пробуем ещё раз.');
					setTimeout(this.forum_fetch, 1000);
				})
				.always(()=>{})
			}
		},
		mixins: [mixins],
		mounted: function(){
			this.forum_fetch();
		},
		destroyed: function () {},		
		beforeUpdate: function() {},
		created: function(){}
	}

	function getForum(arg) {
		return arg;
	}
</script>

<template>
	<div>
		<h2>{{title}}</h2>
		<div v-show="forumList_loading" class="text-center">
			<i class="spin spin-lg"></i>
		</div>
		<table v-show="!forumList_loading" class="table table-striped">
			<thead>
				<tr>
					<td></td>
					<td></td>
					<td>Последнее сообщение</td>
				</tr>
			</thead>
			<tbody>
				<tr v-for="forum in forumList" v-bind:class="{'info':forum.pinned}">
					<td>
						<a href="#" v-on:click.prevent="gotoForum(forum)">{{forum.title}}</a>
					</td>
					<td>
						<span class="label label-primary" v-if="forum.pinned" style="margin-right:.5em">
							<i class="glyphicon glyphicon-pushpin" ></i> Прикреплён
						</span>
						<span class="label label-primary" v-if="forum.premoderation">
							<i class="glyphicon glyphicon-eye-open"></i> Премодерация
						</span>
					</td>
					<td style="font-size:.8em;">
						<table>
							<tr>
								<td colspan="2">{{forum.last_msg.date}}</td>
							</tr>
							<tr>
								<td>Тема</td>
								<td>
									<a href="#" v-on:click.prevent="gotoTheme(forum.last_msg.theme)">
										{{forum.last_msg.theme.name}}
									</a>
								</td>
							</tr>
							<tr>
								<td>Автор</td>
								<td>
									<a href="#" v-on:click.prevent="gotoProfile(forum.last_msg.author)">
										{{forum.last_msg.author.name}}
									</a>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<style>
</style>
