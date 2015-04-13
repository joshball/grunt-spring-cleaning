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
var path = require('path');
var fs = require('fs');
module.exports = function (grunt) {

    function readLines(stream, func) {
        var remaining = '';

        stream.on('data', function(data) {
            remaining += data;
            var index = remaining.indexOf('\n');
            var last  = 0;
            while (index > -1) {
                var line = remaining.substring(last, index);
                last = index + 1;
                func(line);
                index = remaining.indexOf('\n', last);
            }

            remaining = remaining.substring(last);
        });

        stream.on('end', function() {
            if (remaining.length > 0) {
                func(remaining);
            }
        });
    }

    function readFileByLines(filename, func){
        var stream = fs.createReadStream(filename);
        readLines(stream, func);
    }
    
    function parseHtmlForI18nProperties(html){
        var $ = cheerio.load(html);
        var props = [];
        $('[data-i18n]').each(function(i, elem) {
            var property = $(elem).attr('data-i18n');
            var propArray = property.split(';');
            propArray.forEach(function(prop){
                // strip out any attributes:
                // <a href="#" data-i18n="[title]link_title;link_text"></a>
                // removes [title]
                var index = prop.indexOf(']');
                if(index > 0){
                    if(prop.length <= index){
                        throw new Error('malformed property:'+prop);
                    }
                    props.push(prop.slice(index+1));
                } else {
                    props.push(prop);
                }
            });
        });
        return props;
    }

    function parseJavaScriptForI18nProperties(js){
        var props = [],
            regex = /ns:(\w+)/g,
            match;

        while ((match = regex.exec(js)) !== null)
        {
            props.push(match[0]);
        }
        return props;
    }

    //
    // Creates a list of used properties
    //
    function generatePropertyList(properties){
        return properties.join('\n');
    }

    function doNormProps(properties){
        var obj = {};
        properties.forEach(function(property, index, array){
            var prop = property.replace(/\./g,'_');
            obj[prop] = property;
        });
        return JSON.stringify(obj, undefined, 4);
    }

    function doSpringProps(properties){
        var obj = {};
        properties.forEach(function(property, index, array){
            //console.log('property start:', property)
            var prop = property.replace(/\./g,'_');
            //console.log('property end:', property)
            //console.log('prop:', prop)
            obj[prop] = '#springMessage( \'' + property + '\' )';
        });
        return JSON.stringify(obj, undefined, 4);
    }

    function getAllPropertyFiles(basePropertyFile){
        var propFiles = {};
        propFiles.translations = {};
        var results = grunt.file.expand(basePropertyFile+'*');
        propFiles.translationDir = path.dirname(results[0]);
        results.forEach(function(result){
            var s = result.substring(basePropertyFile.length);
            var l = s.split('.')[0].slice(1);
            if(l){
                propFiles.translations[l] = result;
            } else {
                propFiles.translations.en = result;
            }
        });
        return propFiles;
    }

    function parseTranslationFile(file){
        var text = grunt.file.read(file);
        var lines = text.split('\r\n');
        var keyValues = {};
        //console.log('LINES:', lines);
        lines.forEach(function(line){
            var kvp = line.split('=');
            if(kvp.length === 2){
                keyValues[kvp[0].trim()] = kvp[1].trim();
            }
        });
        return keyValues;
    }

    //
    // Given a set of propertyKeys, translations files, and a mock dir
    // create an i18nResource.LOCALE.js for each
    // Array of i18nresourses:
    // local : { namespace: { } }
    function buildFoundMissingPropObj(propertyKeysArray, propertyFilesData){
        var o = {};

        for(var language in propertyFilesData.translations){
            var propFileInfo = propertyFilesData.translations[language];
            //console.log('Creating language:', language);
            //console.log('file:', propFileInfo);
            var translationFile = parseTranslationFile(propFileInfo);
            //console.log('translationFile:', JSON.stringify(translationFile));
            var translation = {
                language: language,
                file: propFileInfo,
                found: {},
                missing: {}
            };
            /*jshint -W083 */
            propertyKeysArray.forEach(function(nsPropertyKey){
                var propertyKey = nsPropertyKey.split(':')[1];
                var propertyKeyForSpring = propertyKey.replace(/_/g,'.');
                var foundProp = translationFile[propertyKeyForSpring];
                if(foundProp){
                    translation.found[propertyKey] = {springKey: propertyKeyForSpring, value: foundProp};
                } else {
                    translation.missing[propertyKey] = {springKey: propertyKeyForSpring};
                }
            });
            o[language] = translation;
        }
        return o;
    }

    function createMockResources(propertyKeysArray, propertyFilesData){
        var foundMissing = buildFoundMissingPropObj(propertyKeysArray, propertyFilesData);

        var springTemplate = {};

        for(var language in foundMissing){
            var foundJs = {};
            var allJs = {};
            var missingTmpl = {};

            var found = foundMissing[language].found;
            var missing = foundMissing[language].missing;

            for(var propName in found){
                var popValue  = found[propName];
                foundJs[propName] = popValue.value;
                allJs[propName] = popValue.value;
                springTemplate[propName] = '#springMessage( \'' + popValue.springKey + '\' )';
            }
            for(var missingProp in missing){
                var missingPropValue  = missing[missingProp];
                missingTmpl[missingPropValue.springKey] = allJs[missingProp] = 'MISSING PROPERTY MISSING PROPERTY';
                springTemplate[missingProp] = '#springMessage( \'' + missingPropValue.springKey + '\' )';
            }

            console.log('\n foundJs: ', JSON.stringify(foundJs, undefined, 2));
            console.log('\n missingTmpl: ', JSON.stringify(missingTmpl, undefined, 2));
            console.log('\n springTemplate: ', JSON.stringify(springTemplate, undefined, 2));
            console.log('\n allJs: ', JSON.stringify(allJs, undefined, 2));
            return ;
        }
    }

    function copyTranslationFiles(propertyFilesData, copyDir){
        for(var propFile in propertyFilesData.translations){
            var filename = path.basename(propertyFilesData.translations[propFile]);
            var srcPath = path.join(propertyFilesData.translationDir, filename);
            var destPath = path.join(copyDir, filename);
            console.log('Copying:', srcPath, 'to: ', destPath);
            grunt.file.copy(srcPath, destPath);
        }
    }

    function createPropertyKeysArray(propertyKeys){
        var list = [];
        propertyKeys.forEach(function(propertyKey, index, array){
            list.push(propertyKey);
        });
        return list.sort();
    }

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('spring_cleaning', 'A plugin to scrape your html files for spring properties (for i18n) and extract a list of required properties. The list can be converted into a JS object (in a script tag of a velocity page) or to create test data in your spa.', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options();

        // Iterate over all specified file groups.
        this.files.forEach(function (f) {

            var propertyKeys = _(f.src
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
                    var text = grunt.file.read(filepath);
                    if(filepath.indexOf('.js') >= 0){
                        return parseJavaScriptForI18nProperties(text);
                    }
                    else {
                        return parseHtmlForI18nProperties(text);
                    }
                }))
                .flatten()
                .uniq()
                .value();


            var propertyKeysArray = createPropertyKeysArray(propertyKeys);

            var propertyFilesData = getAllPropertyFiles(options.translationFile);

            var mockResourses = createMockResources(propertyKeysArray, propertyFilesData);

            for(var prop in mockResourses){
                var propVal = mockResourses[prop];
                console.log('PROP:', prop);
                console.log('  language:', propVal.language);
                console.log('      file:', propVal.file);
                for(var foundProp in propVal.found){
                    console.log('        foundProp:', foundProp);
                }
                for(var propMissing in propVal.missing){
                    console.log('        missing:', propMissing);
                }
            }
            var destFileString;
            if(options.action === 'gen_prop_list'){
                destFileString = generatePropertyList(propertyKeys);
            }
            else if(options.action === 'norm_props'){
                destFileString = doNormProps(propertyKeys);
            }
            else if(options.action === 'spring_props'){
                destFileString = doSpringProps(propertyKeys);
            }
//            else {
//                grunt.warn.writeln('Unknown action');
//                return;
//            }

            // File work:
            grunt.file.write(path.join(f.dest, 'mock', 'propertiesFile.txt'), propertyKeysArray);
            copyTranslationFiles(propertyFilesData, path.join(f.dest, 'propertiesFiles'));
            //createMockResourceFiles(mockResourses, path.join(f.dest, 'mock'));

            if(destFileString){
                // Write the destination file.
                grunt.file.write(f.dest, destFileString);
                // Print a success message.
                grunt.log.writeln('File "' + f.dest + '" created.');
            }
        });
    });

};
