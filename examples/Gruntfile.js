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
            options: {
                translationFile: 'translations/messages',
                namespaces: ['ns']
            },
            build:{
                src: ['src/tmpl/**/*.tmpl', 'src/views/**/*.html', 'src/index.html', 'src/**/*.js'],
                dest: 'build'
            }
        }
    });

    // Actually load this plugin's task(s).
    // replace with this if using the actual plugin:
    // grunt.loadNpmTasks('grunt-spring-cleaning');
    grunt.loadTasks('../tasks');

    //
    // Run spring_cleaning with params:
    //  namespaces - list of namespaces
    //  defaultPropertiesFile - location of the properties file to use
    //  translationsSuffix - _Country (i.e. _es)
    // Generates:
    //  buildDir/propertiesFiles/[allPropFilesUsed]
    //  buildDir/mock/propertiesfile.txt (creates txt file with properties
    //  buildDir/mock/i18nResources.LOCALE.json
    //  buildDir/mock/i18nResources.LOCALE.js
    //  buildDir/spring/i18nResources.tmpl
    //  buildDir/missingTranslations/missing.LOCALE.properties
    //
    //  1. Parse your project and look for all 18n properties: assumes 'namespace:' (i.e ns:)
    //      parameter (namespaces to find [ns])
    //      looks for all strings with ns: in them. builds object: {ns: [properties]
    //      {ns: ['ok-button','main_tmpl_text',...]}
    //  2. Generate a file of all used keys (
    //      buildDir/keyList.json
    //      buildDir/propList.json
    //  3.

    // By default, lint and run all tests.
    grunt.registerTask('default', [
        'spring_cleaning:build'
    ]);

};
