const moment = require('moment');

export default {
	methods: {
		gotoProfile: function (author) {
			this.$router.push({
				name: 'user-profile-any',
				params: {
					user_id: author._id
				}
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
			return moment('1970-01-01T00:00:00.000Z').format('MM.DD.YYYY h:mm:ss');;
		}
	}
}