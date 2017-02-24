import user_profile from './user-profile.vue';

import forum_group_list from './theme_list.vue'; // под замену
import forum_list from './theme_list.vue'; // под замену
import theme_list from './theme_list.vue'; // под замену
import msg_list from './msg_list.vue';



export default [
	// Профайлы
	{
		name: 'user-profile-current',
		path: '/user-profile',
		component: user_profile
	}, {
		name: 'user-profile-any',
		path: '/user-profile/:user_id',
		component: user_profile
	},
	// 1. Список групп форумов
	{
		path: '/forum_group_list',
		alias: '/',
		name: 'forum_group_list',
		component: forum_group_list
	},
	// 2. Список форумов конкретной группы
	{
		path: '/forum_list/:forum_group_id',
		name: 'forum_list',
		component: forum_list
	},
	// 3. Список тем конкретного форума
	{
		path: '/theme_list/:forum_id',
		name: 'theme_list',
		component: theme_list
	},
	// 4. Список сообщений конкретной темы
	{
		path: '/msg_list/:theme_id',
		name: 'msg_list',
		component: msg_list
	},
	// 404
	{
		path: '*',
		_hidden: true,
		component: {
			template: `
			<h1 class="text-center"><br/><br/><br/><br/>Ой-вэй, страница не найдена</h1>
			`
		}
	}
]