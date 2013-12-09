/*
 * grunt-spring-cleaning
 * https://github.com/joshball/grunt-spring-cleaning
 *
 * Copyright (c) 2013 Joshua Ball
 * Licensed under the MIT license.
 */

'use strict';

var cheerio = require('cheerio');
var _ = require('lodash');
module.exports = function (grunt) {

    function parseForI18nProperties(html){
        var $ = cheerio.load(html);
        var props = [];
        $('[data-i18n]').each(function(i, elem) {
            var property = $(elem).attr('data-i18n');
            props.push(property);
        });
        return props;
    };

    function doListProps(properties){
        return properties.join('\n');
    }

    function doNormProps(properties){
        var obj = {};
        properties.forEach(function(property, index, array){
            var prop = property.replace(/\./,'_');
            obj[prop] = property;
        });
        return JSON.stringify(obj, undefined, 4);
    }

    function doSpringProps(properties){
        var obj = {};
        properties.forEach(function(property, index, array){
            var prop = property.replace(/\./,'_');
            obj[prop] = '#springMessage( \'' + property + '\' )';
        });
        return JSON.stringify(obj, undefined, 4);
    }

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('spring_cleaning', 'A plugin to scrape your html files for spring properties (for i18n) and extract a list of required properties. The list can be converted into a JS object (in a script tag of a velocity page) or to create test data in your spa.', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            action: 'list_props'
        });

        // Iterate over all specified file groups.
        this.files.forEach(function (f) {

            var src = f.src
                .filter(function (filepath) {
                    // Warn on and remove invalid source files (if nonull was set).
                    if (!grunt.file.exists(filepath)) {
                        grunt.log.warn('Source file "' + filepath + '" not found.');
                        return false;
                    } else {
                        return true;
                    }
                })
                .map(function (filepath) {
                    var html = grunt.file.read(filepath);
                    return parseForI18nProperties(html);
                });

            var uniqueSrc = _(src).flatten().uniq().value();

            var destFileString = undefined;
            if(options.action == 'list_props'){
                destFileString = doListProps(uniqueSrc);
            }
            else if(options.action == 'norm_props'){
                destFileString = doNormProps(uniqueSrc);
            }
            else if(options.action == 'spring_props'){
                destFileString = doSpringProps(uniqueSrc);
            }
            else {
                grunt.warn.writeln('Unknown action');
                return;
            }

            if(destFileString){
                // Write the destination file.
                grunt.file.write(f.dest, destFileString);
                // Print a success message.
                grunt.log.writeln('File "' + f.dest + '" created.');
            }
        });
    });

};
