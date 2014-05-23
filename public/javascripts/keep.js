(function () {

	console.log('app js');

	var app = angular.module('keep', ['ngRoute', 'ui.bootstrap', 'keep.util']);


	var CONFIG = {};

	CONFIG.ARCHIVE_NOTES_KEY = 'keep-notes';

	app.config(function ($routeProvider, $locationProvider) {

		$locationProvider.html5Mode(true);
		$routeProvider
			.when('/home', {
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

	
	app.filter('reverse', function() {

		return function(items) {

			var newItems = [];

			angular.forEach(items, function(item) {

				newItems.unshift(item);

			});

			return newItems;

		};

	});



	app.filter('filterByType', function() {

		return function(items, type) {

			var newItems = [];

			type = type || 'inbox';

			angular.forEach(items, function(item) {

				if (type === 'archived' && item.archived === 1) {
					newItems.push(item);
				} else if (type === 'inbox' && item.archived === 0) {
					newItems.push(item);
				}

			});

			return newItems;

		};

	});

	app.directive('note', function ($http) {

		return {
			restrict: 'E',
			replace: true,
			templateUrl: '/templates/note',
			controller: function ($scope, $attrs) {

				$scope.shared = $attrs.shared;

				$scope.$watch('note.title + note.note', function (newValue, oldValue) {

					if (oldValue && oldValue !== newValue) {
						$scope.note.updated = (new Date()).toISOString();
					}
				});



				// TODO: 서비스로 뺄 것
				$scope.remove = function () {

					$scope.$parent.data.keepList.splice($scope.$index, 1)[0];


				};
				$scope.keep = function () {

					//console.log($scope);

					//console.log($scope.$parent);

					//console.log($scope.$parent.shares);

					//return;

					var note;

					note = angular.copy($scope.$parent.shares.splice($scope.$index, 1)[0]);

					delete note.$$hashKey;

					note.created = (new Date()).toISOString();
					note.archived = 0;
					note.updated = null;
					delete note._already;


					$scope.$parent.data.keepList.push(note);


					//$scope.$parent.

				};
				$scope.archive = function(note) {

					note.archived = 1;

				};
				$scope.share = function () {

					var note = angular.copy($scope.note);

					delete note.$$hashKey;

					$http.post('/share/notes', {
						notes: [note]
					}).success(function (data) {



						if (data.code === 200) {
							$scope.$parent.addAlert('http://10.64.51.102:4321/share/' + data.result.id);
						}



					});


					//alert('share!!!');


				};

				//console.log($scope);

			}
		};

	});

	app.controller('view', function ($scope, $routeParams, $http, GlobalStorage) {

		//console.log($scope);

		//console.log($routeParams);
		$scope.shares = [];



		$scope.data = {
			keepList: []
		};

		GlobalStorage.sync($scope, 'data', CONFIG.ARCHIVE_NOTES_KEY).then(function () {
			if (!$scope.data.keepList) {

				$scope.data.keepList = [];
			}

			if ($routeParams.id) {
				$http.get('/share/notes/' + $routeParams.id).success(function (data) {
					var dict = {};
					if (data.code === 200) {

						console.log(angular.copy($scope.data.keepList));

						angular.forEach($scope.data.keepList, function (value, key) {

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
		$scope.shareAll = function () {

			var notes = angular.copy($scope.data.keepList);

			angular.forEach(notes, function (value, key) {
				delete value.$$hashKey;
			});



			$http.post('/share/notes', {
				notes: notes
			}).success(function (data) {



				if (data.code === 200) {
					$scope.addAlert('http://10.64.51.102:4321/share/' + data.result.id);
				}



			});

		};

		$scope.add = function () {

			if ($scope.new.title || $scope.new.note) {
				$scope.data.keepList.push({
					_id: (parseInt(Math.random() * 900000000 + 100000000, 10)).toString(36).substr(0, 5),
					title: $scope.new.title,
					note: $scope.new.note,
					created: (new Date()).toISOString(),
					archived: 0,
					updated: null,
					color: '#fff'
				});
				$scope.new.title = '';
				$scope.new.note = '';
			}

		};
		$scope.alerts = [{
			msg: 'ttttt',
			type: 'success'
		}];

		$scope.addAlert = function (message) {
			$scope.alerts.push({
				msg: message,
				type: 'success'
			});
		};

		$scope.closeAlert = function (selected) {

			var newItems = [];

			angular.forEach($scope.alerts, function(item) {

				if (item !== selected) {
						newItems.push(item);
				}

			});


			$scope.alerts = newItems;
		};


	});



}());