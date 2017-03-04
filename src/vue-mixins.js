const moment = require('moment');

export default {
	methods: {
		gotoProfile: function (author) {
			var rt;
			if (author && author._id) {
				rt = {
					name: 'user-profile-any',
					params: {
						user_id: author._id
					}
				}
			}
			else {
				rt = {
					name: 'user-profile-current'
				}
			}
			console.log(rt)
			this.$router.push(rt)
		},
		gotoRegister: function () {
			this.$router.push({
				name: 'user-register'
			})
		},
		gotoForum: function (forum) {
			this.$router.push({
				name: 'theme_list',
				params: {
					forum_id: forum._id
				}
			})
		},
		gotoTheme: function (th) {
			this.$router.push({
				name: 'reply_list',
				params: {
					theme_id: th._id
				}
			})
		}
	},
	filters: {
		dateTimeFormat: function (val) {
			return moment(val).format('MM.DD.YYYY hh:mm');;
		}
	}
}