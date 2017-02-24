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
						<a href="#" v-on:click.prevent="gotoTheme(th)">{{th.title}}</a>
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
								<td colspan="2">{{th.last_msg.date}}</td>
							</tr>
							<tr>
								<td>Тема</td>
								<td>
									<a href="#" v-on:click.prevent="gotoTheme(th.last_msg.theme)">
										{{th.last_msg.theme.name}}
									</a>
								</td>
							</tr>
							<tr>
								<td>Автор &#160;</td>
								<td>
									<a href="#" v-on:click.prevent="gotoProfile(th.last_msg.author)">
										{{th.last_msg.author.name}}
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

<script>
	import _ from 'lodash';
	import mixins from './_mixins.js';
	export default {
		name: 'theme_list',
		data: function () {
			return {
				title: 'Список тем форума «Обо всём»',
				themeList: [],
				themeList_loading: true
			}
		},
		methods: {
			theme_fetch: function() {
				this.themeList_loading = true;
				var url = Math.random()>.1 ? 'backend-emu/theme-list.json' : '';
				$.getJSON(url, {})
				.done((data)=>{
					this.themeList_loading = false;
					if (data instanceof Array) {
						for (let th of data) {
							this.themeList.push(getTheme(th));
						}
					}
				})
				.fail(()=>{
					console.warn('Рандомная (10%) неудача отправки. Ждём секунду и пробуем ещё раз.');
					setTimeout(this.theme_fetch, 1000);
				})
				.always(()=>{})
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
