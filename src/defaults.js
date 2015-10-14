module.exports = {
	// TODO: should dest be default?
	config: {
		dest: 'dist'
	},
	consumes: [
		// task
		'depends', 'task', 'options',
		// runtime
		'name', 'hidden', 'runtime',
		// src
		'base', 'cwd', 'src',
		// dest
		'dest', 'file', 'flatten'
	]
};
