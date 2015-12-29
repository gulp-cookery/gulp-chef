'use strict';

var Sinon = require('sinon');
var expect = require('chai').expect;
var test = require('mocha-cases');

var _ = require('lodash');

var base = process.cwd();

var Configuration = require(base + '/lib/core/configuration');
var ConfigurationRegulator = require(base + '/lib/core/configuration_regulator');

var regulator;

beforeEach(function (done) {
	regulator = Configuration._regulator;
	Configuration._regulator = new ConfigurationRegulator(null, function () {
		return 'production';
	});
	done();
});

afterEach(function (done) {
	Configuration._regulator = regulator;
	done();
});

describe('Core', function () {
	describe('Configuration', function () {
		describe('.getTaskRuntimeInfo()', function () {
			var testCases = [{
				name: 'should accept normal task name',
				value: {
					name: 'build'
				},
				expected: {
					name: 'build'
				}
			}, {
				name: 'should accept task name with space, underscore, dash',
				value: {
					name: '_build the-project'
				},
				expected: {
					name: '_build the-project'
				}
			}, {
				name: 'should accept . prefix and mark task hidden',
				value: {
					name: '.build'
				},
				expected: {
					name: 'build',
					visibility: '.'
				}
			}, {
				name: 'should accept # prefix and mark task undefined',
				value: {
					name: '#build'
				},
				expected: {
					name: 'build',
					visibility: '#'
				}
			}, {
				name: 'should accept ! postfix and mark task available in production mode only',
				value: {
					name: 'build!'
				},
				expected: {
					name: 'build',
					runtime: '!'
				}
			}, {
				name: 'should accept ? postfix and mark task available in development mode only',
				value: {
					name: 'build?'
				},
				expected: {
					name: 'build',
					runtime: '?'
				}
			}, {
				name: 'should throw if invalid name',
				value: {
					name: 'build?!'
				},
				error: Error
			}, {
				name: 'should throw if invalid name',
				value: {
					name: '?build'
				},
				error: Error
			}, {
				name: 'should also accept properties from config',
				value: {
					name: 'build',
					description: 'description',
					order: 999,
					runtime: '!',
					task: 'task',
					visibility: '.'
				},
				expected: {
					name: 'build',
					description: 'description',
					order: 999,
					runtime: '!',
					task: 'task',
					visibility: '.'
				}
			}, {
				name: 'should properties from raw-name override properties from config',
				value: {
					name: '#build?',
					description: 'description',
					order: 999,
					runtime: '!',
					task: 'task',
					visibility: '.'
				},
				expected: {
					name: 'build',
					description: 'description',
					order: 999,
					runtime: '?',
					task: 'task',
					visibility: '#'
				}
			}];

			test(testCases, Configuration.getTaskRuntimeInfo);
		});
		describe('.src()', function () {
			it('should accept path string', function () {
				var actual;

				actual = Configuration.src('src');
				expect(actual).to.deep.equal({
					globs: ['src']
				});
			});
			it('should accept globs', function () {
				var actual;

				actual = Configuration.src('src/**/*.js');
				expect(actual).to.deep.equal({
					globs: ['src/**/*.js']
				});
			});
			it('should accept globs array', function () {
				var actual;

				actual = Configuration.src(['src/**/*.js', 'lib/**/*.js']);
				expect(actual).to.deep.equal({
					globs: ['src/**/*.js', 'lib/**/*.js']
				});
			});
			it('should accept globs object with options', function () {
				var actual;

				actual = Configuration.src({
					globs: '**/*.js',
					options: {
						base: 'src'
					}
				});
				expect(actual).to.deep.equal({
					globs: ['**/*.js'],
					options: {
						base: 'src'
					}
				});
			});
			it('should accept globs object with flat options', function () {
				var actual;

				actual = Configuration.src({
					globs: '**/*.js',
					base: 'src'
				});
				expect(actual).to.deep.equal({
					globs: ['**/*.js'],
					options: {
						base: 'src'
					}
				});
			});
		});
		describe('.dest()', function () {
			it('should accept path string', function () {
				var actual;

				actual = Configuration.dest('dist');
				expect(actual).to.deep.equal({
					path: 'dist'
				});
			});
			it('should accept path object', function () {
				var actual;

				actual = Configuration.dest({
					path: 'dist'
				});
				expect(actual).to.deep.equal({
					path: 'dist'
				});
			});
			it('should accept path object with options', function () {
				var actual;

				actual = Configuration.dest({
					path: 'dist',
					options: {
						cwd: '.'
					}
				});
				expect(actual).to.deep.equal({
					path: 'dist',
					options: {
						cwd: '.'
					}
				});
			});
			it('should accept path object with flat options', function () {
				var actual;

				actual = Configuration.dest({
					path: 'dist',
					cwd: '.'
				});
				expect(actual).to.deep.equal({
					path: 'dist',
					options: {
						cwd: '.'
					}
				});
			});
		});
		describe('.sort()', function () {
			it('should accept empty config', function () {
				var actual;

				actual = Configuration.sort({}, {}, {}, {});
				expect(actual).to.deep.equal({
					taskInfo: {},
					taskConfig: {},
					subTaskConfigs: {}
				});
			});
			it('should always accept src and dest property even schema not defined', function () {
				var config = {
					src: 'src',
					dest: 'dist'
				};
				var actual, original;

				original = _.cloneDeep(config);
				actual = Configuration.sort({}, config, {}, {});
				expect(actual).to.deep.equal({
					taskInfo: {},
					taskConfig: {
						src: {
							globs: ['src']
						},
						dest: {
							path: 'dist'
						}
					},
					subTaskConfigs: {}
				});
				expect(config).to.deep.equal(original);
			});
			it('should only include reservied properties if schema not defined', function () {
				var config = {
					src: 'src',
					dest: 'dist',
					blabla: ['bla', 'bla'],
					foo: false,
					bar: { name: 'bar' }
				};
				var actual, original;

				original = _.cloneDeep(config);
				actual = Configuration.sort({}, config, {}, null);
				expect(actual).to.deep.equal({
					taskInfo: {},
					taskConfig: {
						src: {
							globs: ['src']
						},
						dest: {
							path: 'dist'
						}
					},
					subTaskConfigs: {
						blabla: ['bla', 'bla'],
						foo: false,
						bar: {
							name: 'bar'
						}
					}
				});
				expect(config).to.deep.equal(original);
			});
			it('should throw if parent config not normalized', function () {
				expect(function () {
					Configuration.sort({}, {}, {
						src: 'src'
					}, {});
				}).to.throw(TypeError);
				expect(function () {
					Configuration.sort({}, {}, {
						dest: 'dist'
					}, {});
				}).to.throw(TypeError);
			});
			it('should inherit parent config', function () {
				var config = {
					src: {
						globs: ['src']
					},
					dest: {
						path: 'dist'
					}
				};
				var actual, original;

				original = _.cloneDeep(config);
				actual = Configuration.sort({}, {}, config, {});
				expect(actual).to.deep.equal({
					taskInfo: {},
					taskConfig: {
						src: {
							globs: ['src']
						},
						dest: {
							path: 'dist'
						}
					},
					subTaskConfigs: {}
				});
				expect(config).to.deep.equal(original);
			});
			it('should join parent path config', function () {
				var config = {
					src: ['services/**/*.js', 'views/**/*.js'],
					dest: 'lib'
				};
				var parent = {
					src: {
						globs: ['src']
					},
					dest: {
						path: 'dist'
					}
				};
				var actual, original, originalParent;

				original = _.cloneDeep(config);
				originalParent = _.cloneDeep(parent);
				actual = Configuration.sort({}, config, parent, {});
				expect(actual).to.deep.equal({
					taskInfo: {},
					taskConfig: {
						src: {
							globs: ['src/services/**/*.js', 'src/views/**/*.js']
						},
						dest: {
							path: 'dist/lib'
						}
					},
					subTaskConfigs: {}
				});
				expect(config).to.deep.equal(original);
				expect(parent).to.deep.equal(originalParent);
			});
			it('should put unknown properties to subTaskConfigs', function () {
				var config = {
					src: ['services/**/*.js', 'views/**/*.js'],
					dest: 'lib',
					bundles: {
						entries: ['a', 'b', 'c']
					},
					options: {
						extensions: ['.js', '.ts', '.coffee']
					},
					unknownProperty: 'what?'
				};
				var parent = {
					src: {
						globs: ['src']
					},
					dest: {
						path: 'dist'
					}
				};
				var schema = {
					properties: {
						bundles: {
							properties: {
								entries: {}
							}
						},
						options: {
						}
					}
				};
				var actual, original, originalParent;

				original = _.cloneDeep(config);
				originalParent = _.cloneDeep(parent);
				actual = Configuration.sort({}, config, parent, schema);

				original = _.cloneDeep(config);
				expect(actual).to.deep.equal({
					taskInfo: {},
					taskConfig: {
						src: {
							globs: ['src/services/**/*.js', 'src/views/**/*.js']
						},
						dest: {
							path: 'dist/lib'
						},
						bundles: {
							entries: ['a', 'b', 'c']
						},
						options: {
							extensions: ['.js', '.ts', '.coffee']
						}
					},
					subTaskConfigs: {
						unknownProperty: 'what?'
					}
				});
				expect(config).to.deep.equal(original);
				expect(parent).to.deep.equal(originalParent);
			});
			it('should extract title and description from schema if available', function () {
				var schema = {
					title: 'schema-extractor',
					description: 'extract title and description from schema if available'
				};

				expect(Configuration.sort({}, {}, {}, schema)).to.deep.equal({
					taskInfo: {
						name: 'schema-extractor',
						description: 'extract title and description from schema if available'
					},
					taskConfig: {},
					subTaskConfigs: {}
				});
			});
			it('should normalize config using the given schema', function () {
				var schema = {
					definitions: {
						options: {
							properties: {
								extensions: {
									description: '',
									alias: ['extension'],
									type: 'array',
									items: {
										type: 'string'
									}
								},
								require: {
									description: '',
									alias: ['requires'],
									type: 'array',
									items: {
										type: 'string'
									}
								},
								external: {
									description: '',
									alias: ['externals'],
									type: 'array',
									items: {
										type: 'string'
									}
								},
								plugin: {
									description: '',
									alias: ['plugins'],
									type: 'array',
									items: {
										type: 'string'
									}
								},
								transform: {
									description: '',
									alias: ['transforms'],
									type: 'array',
									items: {
										type: 'string'
									}
								},
								exclude: {
									description: '',
									alias: ['excludes'],
									type: 'array',
									items: {
										type: 'string'
									}
								},
								ignore: {
									description: '',
									alias: ['ignores'],
									type: 'array',
									items: {
										type: 'string'
									}
								},
								shim: {
									description: 'which library to shim?',
									alias: ['shims', 'browserify-shim', 'browserify-shims'],
									type: 'array',
									items: {
										type: 'string'
									}
								},
								sourcemap: {
									description: 'generate sourcemap file or not?',
									alias: ['sourcemaps'],
									enum: [
										'inline', 'external', false
									],
									default: false
								}
							}
						}
					},
					properties: {
						options: {
							description: 'common options for all bundles',
							type: 'object',
							extends: { $ref: '#/definitions/options' }
						},
						bundles: {
							description: '',
							alias: ['bundle'],
							type: 'array',
							items: {
								type: 'object',
								extends: { $ref: '#/definitions/options' },
								properties: {
									file: {
										description: '',
										type: 'string'
									},
									entries: {
										description: '',
										alias: ['entry'],
										type: 'array',
										items: {
											type: 'string'
										}
									},
									options: {
										description: 'options for this bundle',
										type: 'object',
										extends: { $ref: '#/definitions/options' }
									}
								},
								required: ['file', 'entries']
							}
						}
					},
					required: ['bundles']
				};
				var options = {
					extensions: ['.js', '.json', '.jsx', '.es6', '.ts'],
					plugin: ['tsify'],
					transform: ['brfs']
				};
				var config = {
					bundles: [{
						file: 'deps.js',
						entries: [{
							file: 'traceur/bin/traceur-runtime'
						}, {
							file: 'rtts_assert/rtts_assert'
						}, {
							file: 'reflect-propertydata'
						}, {
							file: 'zone.js'
						}],
						require: ['angular2/angular2', 'angular2/router']
					}, {
						file: 'services.js',
						entry: 'services/*/index.js',
						external: ['angular2/angular2', 'angular2/router'],
						options: options
					}, {
						file: 'index.js',
						entry: 'index.js',
						external: './services',
						options: options
					}, {
						file: 'auth.js',
						entry: 'auth/index.js',
						external: './services',
						options: options
					}, {
						file: 'dashboard.js',
						entry: 'dashboard/index.js',
						external: './services',
						options: options
					}]
				};
				var expected = {
					bundles: [{
						file: 'deps.js',
						entries: [{
							file: 'traceur/bin/traceur-runtime'
						}, {
							file: 'rtts_assert/rtts_assert'
						}, {
							file: 'reflect-propertydata'
						}, {
							file: 'zone.js'
						}],
						require: ['angular2/angular2', 'angular2/router']
					}, {
						file: 'services.js',
						entries: ['services/*/index.js'],
						external: ['angular2/angular2', 'angular2/router'],
						options: options
					}, {
						file: 'index.js',
						entries: ['index.js'],
						external: ['./services'],
						options: options
					}, {
						file: 'auth.js',
						entries: ['auth/index.js'],
						external: ['./services'],
						options: options
					}, {
						file: 'dashboard.js',
						entries: ['dashboard/index.js'],
						external: ['./services'],
						options: options
					}]
				};
				var actual, original;

				original = _.cloneDeep(config);
				actual = Configuration.sort({}, config, {}, schema);
				expect(actual).to.deep.equal({
					taskInfo: {},
					taskConfig: expected,
					subTaskConfigs: {
					}
				});
				expect(config).to.deep.equal(original);
			});
		});
		describe('.realize()', function () {
			it('should call resolver function', function () {
				var resolved, values, expected;

				resolved = 'resolver called';
				values = {
					runtime: Sinon.spy(function () {
						return resolved;
					})
				};
				expected = {
					runtime: resolved
				};

				expect(Configuration.realize(values)).to.deep.equal(expected);
				expect(values.runtime.calledWith(values)).to.be.true;
			});
			it('should render template using given values', function () {
				var rootResolver = function () {
					return 'value from rootResolver()';
				};
				var nestResolver = function () {
					return 'value from nestedResolver()';
				};
				var template = 'Hello {{plainValue}}! {{nested.plainValue}}, {{resolver}} and {{nested.resolver}}.';
				var realized = 'Hello World! Inner World, value from rootResolver() and value from nestedResolver().';
				var values = {
					message: template,
					nested: {
						message: template,
						resolver: nestResolver,
						plainValue: 'Inner World'
					},
					resolver: rootResolver,
					plainValue: 'World'
				};
				var expected = {
					message: realized,
					nested: {
						message: realized,
						resolver: nestResolver(),
						plainValue: 'Inner World'
					},
					resolver: rootResolver(),
					plainValue: 'World'
				};
				var actual;

				actual = Configuration.realize(values);
				expect(actual).to.deep.equal(expected);
			});
		});
	});
});
