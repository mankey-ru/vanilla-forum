

<script>
	import mixins from './../vue-mixins.js';
	import notie from 'notie';
	import _ from 'lodash';
	import $ from 'jquery';
	import request from 'superagent';
	window.$ = window.jQuery = $;	// для sceditor
	var scroll = require('scroll');
	var scrollDoc = require('scroll-doc')();

	var editorInstance, $ed, $edWrap;

	export default {
		name: 'forum-card',
		data: function () {
			return {
				msg_rating_threshold: 0,
				title: 'Название темы форума',
				currentUser: this.$root.$data.currentUser,
				msgList: [],
				msgList_loading: true
			}
		},
		methods: {
			msg_unhide: function(msg) {
				msg.unhide = true;
			},
			msg_fetch: function() {
				this.msgList_loading = true;
				$.getJSON('/api/replies/' + this.$route.params.theme_id)
				.done((data)=>{
					this.msgList_loading = false;
					if (data instanceof Array) {
						for (let msg of data) {
							msg.text = editorInstance.fromBBCode(msg.text); // server-side?
							this.msgList.push(getMsg(msg));
						}
					}
				})
				.fail(()=>{
					console.warn('Request error. Will retry after 2 sec.');
					setTimeout(this.msg_fetch, 2000);
				})
				.always(()=>{})
			},
			msg_add: function () {
				var bbcodeVal = editorInstance.val();
				if (!bbcodeVal) {
					return
				}
				editorInstance.readOnly(true);

				// Show reply immediately without waiting for server response
				var newMsg = getMsg({ 
					author: this.currentUser,
					text: editorInstance.fromBBCode(bbcodeVal)
				});
				newMsg.pending_add = true;
				this.msgList.push(newMsg);
				var newMsgSrv = {
					_TEMP_UID4DEL: this.currentUser._id, // TODO sure that should be done at server
					theme_id: this.$route.params.theme_id,
					text: bbcodeVal
				}
				request
					.post('/api/replies')
					.send(newMsgSrv)
					.end((err, res)=>{
						if (err || !res.body) {
							notie.alert('error', 'Ошибка запроса', 3);
							this.msgList.splice(this.msgList.indexOf(newMsg), 1); // Removing previously shown reply
						}
						else {
							notie.alert('success', 'Успех', 3);
							newMsg.pending_add = false;
							// Actualizing some props to server values
							newMsg.date = res.body.date;
							newMsg._id	= res.body._id;
							editorInstance.val('');
						}
						editorInstance.readOnly(false);
					});
			},
			msg_vote: function(msg, val){
				if (val===msg.voted) {
					return
				}
				var ratingBackup = msg.rating;
				var ratingTotalBackup = msg.author.rating_total;
				var votedBackup = msg.voted;
				msg.author.rating_total += val;
				msg.rating += val;
				msg.voted = val;
				msg.pending_vote = true;
				var url = Math.random()>.1 ? 'backend-emu/ok.json' : '';
				$.getJSON(url, {
					msg_id: msg.id,
					username: this.currentUser.name, 
					value: val
				})
				.done((response)=>{
						// получаем из ответа серверный рейтинг msg.rating = responce.rating
					})
				.fail(()=>{
					notie.alert('error', 'Рандомная (10%) неудача отправки. Голос будет откачен.', 3);
					msg.rating = ratingBackup;
					msg.voted = votedBackup;
					msg.author.rating_total = ratingTotalBackup;
				})
				.always(()=>{
					msg.pending_vote = false;
				})
			},
			msg_quote: function(msg){
				var val = editorInstance.val();
				var text = '[b]'+ msg.author.name + ':[/b]\n' + editorInstance.toBBCode(msg.text);
				editorInstance.val(val + '[quote]' + text + '[/quote]');
				goToEd();
			},
			msg_reply: function(msg){
				var val = editorInstance.val();
				editorInstance.val(val + '[b]' + msg.author.name + '[/b], ');
				goToEd();
			}
		},
		mixins: [mixins],
		mounted: function(){
			// API http://www.sceditor.com/api/sceditor/
			require('./../../node_modules/sceditor/minified/jquery.sceditor.bbcode.min.js');
			require('./../../node_modules/sceditor/languages/ru.js');
			$ed = $('#editor-textarea').sceditor({
				plugins: 'bbcode',
				style: 'sceditor/inner-styles.css',
				toolbar: "bold,italic,underline|source|left,center,right,justify|color|bulletlist,orderedlist|quote|image,link,unlink",
				locale: "ru",
				emoticonsEnabled: false,
				enablePasteFiltering: true,
				bbcodeTrim: true,
				width: 1000,
				height: 300, // that value will be replaced (ctrl+f "widthBugFixed") due to plugin bug
				parserOptions: { // http://www.sceditor.com/documentation/options/#parserOptions
					breakBeforeBlock: false,
					breakStartBlock: false
				}//,autoUpdate: true
			});
			$edWrap = $('.f-editor');
			editorInstance = $ed.sceditor('instance');
			editorInstance.bind('keyup', (evt)=>{ //  contextmenu blur
				if (evt.keyCode===13 && evt.ctrlKey===true) {
					this.msg_add();
				}
			})
			this.msg_fetch();
		},
		destroyed: function () {
			editorInstance.destroy()
		},		
		updated: function() {
			if (!editorInstance.widthBugFixed) { // https://github.com/samclarke/SCEditor/issues/315
				editorInstance.width('100%');
				editorInstance.widthBugFixed = true;
			}
		},
		watch: {
			'msgList.length' : function(oldVal, newVal) {
				// Scroll to message if its _id is in query string
				this.$nextTick(function(){
					var replyToScroll = this.$route.query.reply_id;
					if (replyToScroll) {
						var $replyToScroll = $('#reply-id-' + replyToScroll);
						if ($replyToScroll.length!==0) {
							scroll.top(scrollDoc, $replyToScroll.offset().top-50, { duration: 200 })
						}
					}
				})
			}
		}
	}


	function getMsg (arg) {
		arg = arg || {};
		var msg = _.defaultsDeep(arg, {
			id: 0,
			author: {
				name: '',
				id: 0,
				online: false,
				pic: 'userpics/' + (arg.author ? arg.author.id : 1) + '.png',
				rating_total: 0
			},
			text: '',
			voted: 0,
			unhide: false,
			rating: 0,
			pending_add: false,
			pending_vote: false,
			date: new Date().toLocaleString()
		});
		return msg;
	}
	function goToEd() {
		editorInstance.focus();
		scroll.top(scrollDoc, $edWrap.offset().top-50, { duration: 200 })
	}

</script>

<template>
	<div>
		<h2>{{title}}</h2>
		<br/>
		<div v-show="msgList_loading" class="text-center">
			<i class="spin spin-lg"></i>
		</div>
		<div v-show="!msgList_loading">

			<div v-for="msg in msgList" v-bind:id="'reply-id-'+msg._id">
				<div class="row" v-if="msg.rating < msg_rating_threshold  && !msg.unhide">
					<div class="col-sm-24">
						<div class="well well-sm">
							Скрытое сообщение от пользователя {{msg.author.name}} &#160;&#160;
							<a class="btn btn-link" v-on:click.prevent="msg_unhide(msg)">
								Показать
							</a>
						</div>
					</div>
				</div>
				<div class="row f-msg-wrap" v-else="">
					<div class="col-sm-4 col-xs-8">
						<div>
							<a href="/" v-on:click.prevent="gotoProfile(msg.author)"><b>{{msg.author.name}}</b></a> 
						</div> 

						<img v-bind:src="msg.author.pic" class="f-userpic" />

						<p>
							<span class="label label-primary" title="Суммарный рейтинг комментариев пользователя">
								Рейтинг: {{msg.author.rating_total}}
							</span> &#160;
							<small class="label label-success" v-if="msg.author.online">
								онлайн
							</small>
						</p>

						<!-- <button class="btn btn-link">Пожаловаться</button> -->
					</div>
					<div class="col-sm-20 col-xs-16">
						<div class="row f-msg-toolbar-top">
							<div class="col-sm-12">
								<i v-if="msg.pending_add" class="spin f-msg-spin"></i>
								<a v-else="" v-bind:href="'#' + $route.path + '?reply_id=' + msg._id">{{msg.date | dateTimeFormat}}</a>
							</div>
							<div class="col-sm-12 text-right">
							</div>
						</div>
						<div class="f-msg-text-wrap">
							<div class="well" v-html="msg.text"></div>
						</div>
						<div class="row f-msg-toolbar-bottom">
							<div class="col-sm-10 col-xs-24">
								<button v-on:click="msg_vote(msg, -1)" v-bind:disabled="msg.pending_vote" class="btn btn-sm btn-default" v-bind:class="{'active':msg.voted === -1}">
									<!-- <i class="glyphicon glyphicon-minus"></i> -->
									<i class="glyphicon glyphicon-thumbs-down"></i>
								</button>
								<button class="btn btn-sm btn-link">
									<b>{{msg.rating}}</b>
								</button>
								<button v-on:click="msg_vote(msg, 1)" v-bind:disabled="msg.pending_vote" class="btn btn-sm btn-default" v-bind:class="{'active':msg.voted === 1}">
									<!-- <i class="glyphicon glyphicon-plus"></i> -->
									<i class="glyphicon glyphicon-thumbs-up"></i>
								</button>
							</div>
							<div class="col-sm-4 col-xs-24">
								<a v-if="msg.unhide" v-on:click="msg.unhide=false" class="btn btn-link">
									Cкрыть снова
								</a>
							</div>
							<div class="col-sm-10 col-xs-24 text-right">

								<button v-on:click="msg_quote(msg)" class="btn btn-default">
									<i class="glyphicon glyphicon-comment"></i> 
									Цитата
								</button> 
								<button v-on:click="msg_reply(msg)" class="btn btn-default">
									<i class="glyphicon glyphicon-share-alt"></i> 
									Ответ
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="row">
				<div class="col-sm-24">
					<br/><br/>
						Отвечает <b>{{currentUser.name}}</b>
					<br/>
				</div>
			</div>
			<div class="f-editor row">
				<div class="col-sm-24">
					<textarea id="editor-textarea"></textarea>
					<br/>
				</div>
				<div class="col-sm-24 text-right">					
					<button v-on:click="msg_add" class="btn btn-primary btn-lg">
						<i class="glyphicon glyphicon-send"></i>&#160; 
						Отправить
					</button>
					<br/>
					<small><i>Ctrl+enter</i></small> 
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
	.f-msg-text-wrap {
		min-height: 6em;
	}
	.f-msg-wrap {
		padding-bottom: 1em;
		margin-bottom: 1em;
		border-bottom: 1px solid #ddd;
	}
	.f-msg-toolbar-bottom {
		margin-top:1em;
		opacity: .7;
	}
	.f-msg-toolbar-bottom:hover {
		/*opacity: 1;*/
	}
	.f-msg-toolbar-top {
		margin-bottom:1em;
	}
	.f-editor {
		margin-bottom: 1em;
	}
	.f-editor::after {
		content: "";
		display: table;
		clear: both;
	}
	.f-userpic {
		width:100px;
		height: 100px;
		border-radius: 1000px;
		margin: 1em 0;
	}
</style>
