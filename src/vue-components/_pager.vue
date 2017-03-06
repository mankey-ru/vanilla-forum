<template>
	<div class="row pager-wrap"  v-if="current && last>1">
		<div class="col-xs-24 text-center">

			<a class="pager-link" v-on:click="func(1)" v-if="current!==1" v-bind:href="urlbase + 1">
				<i class="glyphicon glyphicon-fast-backward pager-link"></i>
			</a>

			<a class="pager-link" v-on:click="func(current-1)" v-if="current!==1" v-bind:href="urlbase + (current-1)">
				<i class="glyphicon glyphicon-chevron-left pager-link"></i>
			</a>

			<span style="margin: 0 3e">
				<a v-for="n in range" v-on:click="func(n)" class="pager-link" v-bind:class="{'pager-link-current': n===current}"  v-bind:href="urlbase + n">
					{{n}}
				</a>
			</span>

			<a class="pager-link" v-on:click="func(current+1)" v-if="current!==last"  v-bind:href="urlbase + (current+1)">
				<i class="glyphicon glyphicon-chevron-right"></i>
			</a>

			<a class="pager-link" v-on:click="func(last)" v-bind:href="urlbase + last">
				<i class="glyphicon glyphicon-fast-forward pager-link" v-if="current!==last"></i>
			</a>

		</div>
	</div>
</template>

<script>
	var Comp = {
		name: 'pager',
		data: function () {
			return {
				urlbase: `/#${this.$route.path}?pageNum=`
			}
		},
		props: {
			current:{type: Number}, 
			last:	{type: Number},
			depth:	{type: Number, default: 3},
			func:	{type: Function, required: true},
		},
		methods: {
		},
		computed: {
			range: function(){
				var range = [];
				var depth = 3;
				var min = Math.max(1, this.current - this.depth);
				var max = Math.min(this.last, this.current + this.depth);
				for (let i = min; i<=max; i++) {
					range.push(i)
				}
				return range
			},
		},
		destroyed: function () {},		
		beforeUpdate: function() {},
		created: function(){}
	}
	export default Comp;
</script>

<style scoped>
	.pager-wrap {
		margin: 2em 0;
	}
	.pager-link {
		margin: 0 .7em;
		cursor: pointer;
	}
	.pager-link-current:hover {
		text-decoration: none;
	}
	.pager-link-current {
		color: #000;
		font-weight: bold;
		cursor: default;
		font-size: 1.4em;
		vertical-align: sub;
	}
</style>
