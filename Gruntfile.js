module.exports = function(grunt)
{
    require('jit-grunt')(grunt);

    grunt.initConfig
    ({
        pkg: grunt.file.readJSON('package.json'),
        
        concat:
        {
            options:
            {
                separator: ';'
            },
            app:
            {
                files:
                {
                    'js/coolbox-0.1.0.min.js' : ['js/src/**/*.js']
                }
            }
        },
        uglify:
        {
            options:
            {
                compress:
                {
            		sequences: true,
            		dead_code: true,
            		conditionals: true,
            		booleans: true,
            		unused: true,
            		if_return: true,
            		join_vars: true,
            		drop_console: true
            	},
            	preserveComments: 'some'
            },
            OS:
            {
                files:
                {
                    'js/coolbox-0.1.0.min.js': ['js/coolbox-0.1.0.min.js']
                }
            }
        },
        watch:
        {
            scripts:
            {
                files: ['js/src/**/*.js'],
                tasks: ['concat', 'uglify'],
                options:
                {
                    nospawn: true
                }
            }
        }
    });

    grunt.registerTask('default', ['concat', 'uglify', 'watch']);
};
