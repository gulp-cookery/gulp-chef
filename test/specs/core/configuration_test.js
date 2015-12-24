'use strict';

var Sinon = require('sinon');
var expect = require('chai').expect;
var test = require('mocha-cases');

var base = process.cwd();

var Configuration = require(base + '/lib/core/configuration');
var ConfigurationRegulator = require(base + '/lib/core/configuration_regulator');
var ConfigurationError = require(base + '/lib/core/configuration_error');

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
				value: 'build',
				expected: {
					name: 'build'
				}
			}, {
				name: 'should accept task name with space, underscore, dash',
				value: '_build the-project',
				expected: {
					name: '_build the-project'
				}
			}, {
				name: 'should accept . prefix and mark task hidden',
				value: '.build',
				expected: {
					name: 'build',
					visibility: '.'
				}
			}, {
				name: 'should accept # prefix and mark task undefined',
				value: '#build',
				expected: {
					name: 'build',
					visibility: '#'
				}
			}, {
				name: 'should accept ! postfix and mark task available in production mode only',
				value: 'build!',
				expected: {
					name: 'build',
					runtime: '!'
				}
			}, {
				name: 'should accept ? postfix and mark task available in development mode only',
				value: 'build?',
				expected: {
					name: 'build',
					runtime: '?'
				}
			}, {
				name: 'should throw if invalid name',
				value: 'build?!',
				error: ConfigurationError
			}, {
				name: 'should throw if invalid name',
				value: '?build',
				error: ConfigurationError
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
				var actual;

				actual = Configuration.sort({}, {
					src: 'src',
					dest: 'dist'
				}, {}, {});
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
			});
			it('should accept all properties if schema not defined', function () {
				var actual;

				actual = Configuration.sort({}, {
					src: 'src',
					dest: 'dist',
					blabla: ['bla', 'bla'],
					foo: false,
					bar: { name: 'bar' }
				}, {}, null);
				expect(actual).to.deep.equal({
					taskInfo: {},
					taskConfig: {
						src: {
							globs: ['src']
						},
						dest: {
							path: 'dist'
						},
						blabla: ['bla', 'bla'],
						foo: false,
						bar: {
							name: 'bar'
						}
					},
					subTaskConfigs: {}
				});
			});
			it('should honor schema.type, i.e. accept non-object (array)', function () {
				var actual, config;

				config = [true, 2, '4', function () {}, {}];
				actual = Configuration.sort({}, config, {}, {
					type: 'array'
				});
				expect(actual).to.deep.equal({
					taskInfo: {},
					taskConfig: config,
					subTaskConfigs: {}
				});
			});
			it('should be able to gather non-object (array) to subTaskConfigs', function () {
				var actual, config;

				config = [true, 2, '4', function () {}, {}];
				actual = Configuration.sort({}, config, {}, {
					properties: {}
				});
				expect(actual).to.deep.equal({
					taskInfo: {},
					taskConfig: {},
					subTaskConfigs: config
				});
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
				var actual;

				actual = Configuration.sort({}, {}, {
					src: {
						globs: ['src']
					},
					dest: {
						path: 'dist'
					}
				}, {});
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
			});
			it('should join parent path config', function () {
				var actual;

				actual = Configuration.sort({}, {
					src: ['services/**/*.js', 'views/**/*.js'],
					dest: 'lib'
				}, {
					src: {
						globs: ['src']
					},
					dest: {
						path: 'dist'
					}
				}, {});
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
			});
			it('should be able to specify runtime info in config', function () {
				var actual;

				actual = Configuration.sort({
					name: 'define-runtime-info'
				}, {
					visibility: '.',
					runtime: '!'
				}, {}, {});
				expect(actual).to.deep.equal({
					taskInfo: {
						name: 'define-runtime-info',
						visibility: '.',
						runtime: '!'
					},
					taskConfig: {
					},
					subTaskConfigs: {
					}
				});
			});
			it('should put unknown properties to subTaskConfigs', function () {
				var actual;

				actual = Configuration.sort({}, {
					src: ['services/**/*.js', 'views/**/*.js'],
					dest: 'lib',
					bundles: {
						entries: ['a', 'b', 'c']
					},
					options: {
						extensions: ['.js', '.ts', '.coffee']
					},
					unknownProperty: 'what?'
				}, {
					src: {
						globs: ['src']
					},
					dest: {
						path: 'dist'
					}
				}, {
					properties: {
						bundles: {
							properties: {
								entries: {}
							}
						},
						options: {
						}
					}
				});
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
						io: {
							properties: {
								src: {
									description: '',
									type: 'array'
								},
								dest: {
									description: '',
									type: 'string'
								}
							}
						},
						options: {
							properties: {
								extensions: {
									description: '',
									type: 'array',
									alias: ['extension']
								},
								require: {
									description: '',
									type: 'array',
									alias: ['requires']
								},
								external: {
									description: '',
									type: 'array',
									alias: ['externals']
								},
								plugin: {
									description: '',
									type: 'array',
									alias: ['plugins']
								},
								transform: {
									description: '',
									type: 'array',
									alias: ['transforms']
								},
								exclude: {
									description: '',
									type: 'array',
									alias: ['excludes']
								},
								ignore: {
									description: '',
									type: 'array',
									alias: ['ignores']
								},
								shim: {
									description: '',
									type: 'array',
									alias: ['shims', 'browserify-shim', 'browserify-shims']
								}
							}
						}
					},
					extends: { $ref: '#/definitions/io' },
					properties: {
						options: {
							description: 'common options for all bundles',
							extends: { $ref: '#/definitions/options' },
							type: 'object'
						},
						bundles: {
							description: '',
							alias: ['bundle'],
							type: 'array',
							extends: [
								{ $ref: '#/definitions/io' },
								{ $ref: '#/definitions/options' }
							],
							properties: {
								file: {
									description: '',
									type: 'string'
								},
								entries: {
									description: '',
									alias: ['entry'],
									type: 'array'
								},
								options: {
									extends: { $ref: '#/definitions/options' }
								}
							},
							required: ['file', 'entries']
						}
					},
					required: ['bundles'],
					default: {
						options: {}
					}
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

				expect(Configuration.sort({}, config, {}, schema)).to.deep.equal({
					taskInfo: {},
					taskConfig: expected,
					subTaskConfigs: {
					}
				});
			});
			it('should regulate config with given runtime mode', function () {
				var config = {
					src: 'src',
					dest: 'dist',
					options: {
						debug: false,
						override: false,
						development: {
							sourcemap: 'internal'
						},
						dev: {
							override: true
						},
						production: {
							sourcemap: 'external'
						},
						prod: {
							override: false
						}
					},
					development: {
						src: 'app',
						options: {
							debug: true
						}
					},
					dev: {
						dest: 'build',
						options: {
							override: 'auto'
						},
						settings: {
							expose: 'regulator'
						}
					},
					production: {
						src: 'src',
						options: {
							debug: false
						}
					},
					prod: {
						dest: 'dist',
						options: {
							override: 'smart'
						},
						settings: {
							expose: 'regulator-release'
						}
					}
				};
				var expected = {
					src: {
						globs: ['src']
					},
					dest: {
						path: 'dist'
					},
					options: {
						debug: false,
						override: 'smart',
						sourcemap: 'external'
					},
					settings: {
						expose: 'regulator-release'
					}
				};

				expect(Configuration.sort({}, config, {}, {})).to.deep.equal({
					taskInfo: {},
					taskConfig: expected,
					subTaskConfigs: {
					}
				});
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
