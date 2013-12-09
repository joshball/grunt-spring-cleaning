/*
 * grunt-spring-cleaning
 * https://github.com/joshball/grunt-spring-cleaning
 *
 * Copyright (c) 2013 Joshua Ball
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        // Configuration to be run (and then tested).
        spring_cleaning: {
            build_list_props: {
                options: {
                    action: 'list_props'
                },
                src: ['src/tmpl/**/*.tmpl', 'src/views/**/*.html', 'src/index.html'],
                dest: 'build/prop_list.txt'
            },
            build_norm_props: {
                options: {
                    action: 'norm_props'
                },
                src: ['src/tmpl/**/*.tmpl', 'src/views/**/*.html', 'src/index.html'],
                dest: 'build/norm_props.js'
            },
            build_spring_props: {
                options: {
                    action: 'spring_props'
                },
                src: ['src/tmpl/**/*.tmpl', 'src/views/**/*.html', 'src/index.html'],
                dest: 'build/spring_props.js'
            },
            build_js_props: {
                options: {
                    action: 'spring_props'
                },
                src: ['src/tmpl/**/*.tmpl', 'src/views/**/*.html', 'src/index.html'],
                dest: 'build/js_props.js'
            }
        }
    });

    // Actually load this plugin's task(s).
    // replace with this if using the actual plugin:
    // grunt.loadNpmTasks('grunt-spring-cleaning');
    grunt.loadTasks('../tasks');

    // By default, lint and run all tests.
    grunt.registerTask('default', [
        'spring_cleaning:build_list_props',
        'spring_cleaning:build_norm_props',
        'spring_cleaning:build_spring_props',
        'spring_cleaning:build_js_props'
    ]);

};
