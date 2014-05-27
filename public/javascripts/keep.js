(function () {

	console.log('app js');

	var app = angular.module('keep', ['ngRoute', 'ngSanitize', 'ngAnimate', 'ui.bootstrap', 'keep.util']);

	var CONFIG = {};

	CONFIG.ARCHIVE_NOTES_KEY = 'keep-notes';

	function unescapeHTML(str) {
		return str.replace(/\&lt;/g, '<')
			.replace(/\&gt;/g, '>')
			.replace(/\&quot;/g, '"')
			.replace(/\&#039;/g, "'")
			.replace(/\&amp;/g, '&');
		/*return str.replace(/&/g, "&amp;")
                   .replace(/</g, "&lt;")
                   .replace(/>/g, "&gt;")
                   .replace(/"/g, "&quot;")
                   .replace(/'/g, "&#039;");*/
	};

	app.config(function ($routeProvider, $locationProvider) {

		$locationProvider.html5Mode(true);
		$routeProvider.when('/home', {
			templateUrl: '/templates/keep',
			controller: 'view'
		})
			.when('/about', {
				templateUrl: '/templates/about'
			})
			.when('/share/:id', {
				templateUrl: '/templates/keep',
				controller: 'view'
			})
			.otherwise({
				redirectTo: '/home'
			});
	});

	app.directive('masonry', function () {
		var NGREPEAT_SOURCE_RE = '<!-- ngRepeat: ((.*) in ((.*?)( track by (.*))?)) -->';
		return {
			compile: function (element, attrs) {
				// auto add animation to brick element
				var animation = attrs.ngAnimate || "'masonry'";
				var $brick = element.children();
				$brick.attr('ng-animate', animation);

				// generate item selector (exclude leaving items)
				var type = $brick.prop('tagName');
				var itemSelector = type + ":not([class$='-leave-active'])";

				//console.log(itemSelector);

				return function (scope, element, attrs) {
					var options = angular.extend({
						itemSelector: itemSelector
					}, scope.$eval(attrs.masonry));

					// try to infer model from ngRepeat
					if (!options.model) {
						var ngRepeatMatch = element.html().match(NGREPEAT_SOURCE_RE);
						if (ngRepeatMatch) {
							options.model = ngRepeatMatch[4];
						}
					}

					// initial animation
					element.addClass('masonry');

					// Wait inside directives to render
					setTimeout(function () {
						element.masonry(options);

						//console.log('masonry');

						element.on("$destroy", function () {
							element.masonry('destroy')
						});

						if (options.model) {
							scope.$apply(function () {
								scope.$watchCollection(options.model, function (_new, _old) {
									if (_new == _old) return;

									// Wait inside directives to render
									setTimeout(function () {
										element.masonry("reload");
									});
									setTimeout(function () {
										element.masonry("reload");
									}, 100);
									setTimeout(function () {
										element.masonry("reload");
									}, 200);
								});
							});
						}
					});
				};
			}
		};
	});

	app.filter('reverse', function () {

		return function (items) {

			var newItems = [];
			angular.forEach(items, function (item) {
				newItems.unshift(item);
			});
			return newItems;
		};
	});

	app.filter('filterByType', function () {

		return function (items, type) {

			var newItems = [];

			type = type || 'inbox';



			angular.forEach(items, function (item) {

				if (type === 'archived' && item.archived === 1) {
					newItems.push(item);
				} else if (type === 'inbox' && item.archived === 0) {
					newItems.push(item);
				} else if (type === 'bookmark' && item.archived === 0 && item.url) {
					newItems.push(item);
				} else if (type === 'image' && item.archived === 0 && item.image) {
					newItems.push(item);
				}

			});

			return newItems;

		};

	});

	app.directive('note', function ($http) {

		return {
			restrict: 'AE',
			replace: false,
			templateUrl: '/templates/note',
			controller: function ($scope, $attrs, $timeout) {

				//console.log('each note');
				//console.log($scope);
				//console.log($attrs);

				$timeout(function () {
					$scope.shared = $attrs.shared;
				});



				$scope.$watch('note.title + note.note', function (newValue, oldValue) {

					if (oldValue && oldValue !== newValue) {
						$scope.note.updated = (new Date()).toISOString();
					}
				});



				// TODO: 서비스로 뺄 것
				$scope.remove = function (note) {

					var newItems = [];

					angular.forEach($scope.$parent.data.notes, function (item) {
						if (item !== note) {
							newItems.push(item);
						}
					});

					$scope.$parent.data.notes = newItems;

					//$scope.$parent.data.notes.splice($scope.$index, 1)[0];

				};
				$scope.keep = function (_note) {

					//console.log($scope);

					//console.log($scope.$parent);

					//console.log($scope.$parent.shares);

					//return;

					var note;
					var newItems = [];

					angular.forEach($scope.$parent.shares, function(item) {

						if (item !== _note) {
							newItems.push(item);
						} else {
							note = item;
						}

					});

					//alert(note);

					if (note) {
					note = angular.copy(note);

					delete note.$$hashKey;

					note.created = (new Date()).toISOString();
					note.archived = 0;
					note.updated = null;
					delete note._already;

					$scope.$parent.data.notes.push(note);			
					$scope.$parent.shares = newItems;			
					}





					//$scope.$parent.

				};
				$scope.archive = function (note) {

					if (note.archived === 0) {
						note.archived = 1;
					} else {
						note.archived = 0;
					}

					

				};


				$scope.share = function () {

					$scope.$parent.shareAll($scope.note);



				};

				//console.log($scope);

			}
		};

	});

	app.controller('view', function ($scope, $routeParams, $http, $filter, $timeout, $modal, GlobalStorage) {

		//console.log($scope);

		console.log(location.pathname);
		if (location.pathname && location.pathname.search(/share/) !== -1) {
			$(document.body).addClass('shared-mode');
		} else {
			$(document.body).removeClass('shared-mode');
		}

		//console.log($routeParams);
		$scope.shares = [];

		$scope.filterType = 'inbox';

		$scope.data = {
			notes: []
		};

		$scope.status = {
			onedit: false
		};

		$scope.notes = [];

		function updateNotes() {

			var newItems = [];

			angular.forEach($scope.shares, function(item) {
				item.shared = true;

				newItems.push(item);
			});

			angular.forEach($scope.data.notes, function (item) {
				item.shared = false;
				newItems.push(item);
			});

			$scope.notes = newItems;

		};

		$scope.$watchCollection('shares', function (newValue, oldValue) {

			//console.log('>>> data list');

			updateNotes();


			//console.log(newValue);
		});

		$scope.$watchCollection('data.notes', function (newValue, oldValue) {

			//console.log('>>> data list');
			updateNotes();


			//console.log(newValue);
		});



		var promise = {};

		$scope.uploadImage = function () {

			alert('not implemented yet.');

		};

		$scope.editNote = function (note) {



			var modalInstance;



			modalInstance = $modal.open({
				templateUrl: '/templates/modalDetail',
				size: 'sm',
				controller: function ($scope, $modalInstance, $http) {

					$scope.note = angular.copy(note);

					$scope.data = {

						url: ''

					};

					$scope.func = {
						update: function () {



							$modalInstance.close($scope.note);



							//alert($scope.data.url);

						},
						save: function (saveAsNew) {

							/*var url = '/work';

							if (!saveAsNew && $scope.data.workId) {
								url += '/' + $scope.data.workId;
							}

							$http.post(url, {
								name: $scope.data.name,
								content: $scope.data.content
							}).success(function (data) {

								if (data.code == 200) {

									$modalInstance.close({
										workId: data.result.id,
										workName: $scope.data.name
									});
								} else {
									alert(data.message);
								}
							});*/
						},
						cancel: function () {

							$modalInstance.dismiss('cancel');
						}
					};

				}
			});
			modalInstance.result.then(function (info) {

				if (info && (info.title || info.note)) {

					if (info.title) {
						note.title = info.title;
					}
					if (info.note) {
						note.note = info.note;
					}
					if (info.image) {
						note.image = info.image;
					}

					//globalScope.data._workName = info.workName ? info.workName : 'noname';
					//globalScope.data._workId = info.workId;
				}
			});


		};

		$scope.noteLink = function () {


			var modalInstance;

			modalInstance = $modal.open({
				templateUrl: '/templates/modalLink',
				size: 'sm',
				controller: function ($scope, $modalInstance, $http) {

					$scope.data = {

						url: ''

					};

					$scope.func = {
						bookmark: function () {

							$http.get('/link/' + encodeURIComponent($scope.data.url)).success(function (data) {

								if (data.code === 200) {
									//console.log(data);	

									$modalInstance.close({
										url: data.result.url,
										title: unescapeHTML(unescapeHTML(data.result.title)),
										note: unescapeHTML(unescapeHTML(data.result.note)),
										image: data.result.image
									});

								}


							});



							//alert($scope.data.url);

						},
						save: function (saveAsNew) {

							/*var url = '/work';

							if (!saveAsNew && $scope.data.workId) {
								url += '/' + $scope.data.workId;
							}

							$http.post(url, {
								name: $scope.data.name,
								content: $scope.data.content
							}).success(function (data) {

								if (data.code == 200) {

									$modalInstance.close({
										workId: data.result.id,
										workName: $scope.data.name
									});
								} else {
									alert(data.message);
								}
							});*/
						},
						cancel: function () {

							$modalInstance.dismiss('cancel');
						}
					};

				}
			});
			modalInstance.result.then(function (info) {

				if (info && (info.title || info.note)) {



					_scope.new.title = info.title;
					_scope.new.note = info.note;
					_scope.new.image = info.image;
					_scope.new.url = info.url;

					_scope.add();
					//globalScope.data._workName = info.workName ? info.workName : 'noname';
					//globalScope.data._workId = info.workId;
				}
			});


		};

		var _scope = $scope;

		$scope.new = {};

		$scope.focus = function () {

			$timeout.cancel(promise.blur);

			$scope.status.onedit = true;

		};

		$scope.blur = function () {

			promise.blur = $timeout(function () {
				$scope.status.onedit = false;

			}, 100);



		};

		GlobalStorage.sync($scope, 'data', CONFIG.ARCHIVE_NOTES_KEY).then(function () {
			if (!$scope.data.notes) {

				$scope.data.notes = [];
			}

			if ($routeParams.id) {
				$http.get('/share/notes/' + $routeParams.id).success(function (data) {
					var dict = {};
					if (data.code === 200) {

						console.log(angular.copy($scope.data.notes));

						angular.forEach($scope.data.notes, function (value, key) {

							dict[value._id] = true;
						});

						angular.forEach(data.result.notes, function (value, key) {

							if (dict[value._id]) {
								value._already = true;
							}
						});

						console.log(data.result.notes);
						console.log(dict);

						//console.log(data.result.notes[0]);

						//return;

						$scope.shares = data.result.notes;

					}
				});
			}
		});
		$scope.shareAll = function (note) {


/*var note = angular.copy($scope.note);

					delete note.$$hashKey;

					$http.post('/share/notes', {
						notes: [note]
					}).success(function (data) {

						if (data.code === 200) {
							$scope.$parent.addAlert('<a href="http://127.0.0.1:4321/share/' + data.result.id + '" target="_blank">http://127.0.0.1:4321/share/' + data.result.id + '</a>');
						}

					});*/

			var notes;

			if (note) {
				notes = [angular.copy(note)];
			} else {
				notes = angular.copy($filter('filterByType')($filter('filter')($scope.data.notes, $scope.data.query), $scope.filterType));
			}

			console.log(notes);



			//var 

			angular.forEach(notes, function (value, key) {
				delete value.$$hashKey;
			});

			$http.post('/share/notes', {
				notes: notes
			}).success(function (data) {

				if (data.code === 200) {
					//		$scope.addAlert('http://10.64.51.102:4321/share/' + data.result.id);


					var modalInstance;

					modalInstance = $modal.open({
						templateUrl: '/templates/modalShare',
						size: 'sm',
						controller: function ($scope, $modalInstance, $http) {

							$scope.data = {

								url: 'http://10.64.51.102:4321/share/' + data.result.id

							};

							$scope.func = {
								cancel: function () {

									$modalInstance.dismiss('cancel');
								}
							};

						}
					});
					modalInstance.result.then(function (info) {});



				}

			});

		};

		$scope.add = function () {

			var obj;

			if ($scope.new.title || $scope.new.note) {
				obj = {
					_id: (parseInt(Math.random() * 900000000 + 100000000, 10)).toString(36).substr(0, 5),
					title: $scope.new.title,
					note: $scope.new.note,
					created: (new Date()).toISOString(),
					archived: 0,
					updated: null,
					color: '#fff'
				};
				if ($scope.new.image) {
					obj.image = $scope.new.image;
				}
				if ($scope.new.url) {
					obj.url = $scope.new.url;
				}
				$scope.data.notes.push(obj);
				$scope.new.title = '';
				$scope.new.note = '';
				$scope.new.image = '';
				$scope.new.url = '';
			}

		};
		$scope.alerts = [];

		$scope.addAlert = function (message) {
			$scope.alerts.push({
				msg: message,
				type: 'success'
			});
		};

		$scope.closeAlert = function (selected) {

			var newItems = [];

			angular.forEach($scope.alerts, function (item) {

				if (item !== selected) {
					newItems.push(item);
				}

			});

			$scope.alerts = newItems;
		};

	});

}());