export default {
	methods: {
		gotoProfile: function (author) {
			this.$router.push({
				name: 'user-profile-any',
				params: {
					user_id: author.id
				}
			})
		},
		gotoForum: function (forum) {
			this.$router.push({
				name: 'theme_list',
				params: {
					forum_id: forum.id
				}
			})
		},
		gotoTheme: function (th) {
			this.$router.push({
				name: 'msg_list',
				params: {
					theme_id: th.id
				}
			})
		}
	}
}