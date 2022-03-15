//Pasar de grados a radianes
var deg2Rad = Math.PI / 180;

// Crear un nuevo juego cuando la pantalla es cargada
window.addEventListener('load', function () {
	new Game();
});

 //Inicializa el Juego y tiene el loop constante del juego
function Game() {

	var self = this;

	var element, scene, camera, cube, renderer, light,
		objects, paused, keysAllowed, score, difficulty,
		pyramidPresenceProb, maxPyramidSize, fogDistance, gameOver;

	init();

	function init() {

		element = document.getElementById('game');

		renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true
		});
		renderer.setSize(element.clientWidth, element.clientHeight);
		renderer.shadowMap.enabled = true;
		element.appendChild(renderer.domElement);

		scene = new THREE.Scene();

		// Inicializa la cama con los distintos campos de vista
		camera = new THREE.PerspectiveCamera(50, element.clientWidth / element.clientHeight, 1, 100000);
		camera.position.set(0, 1200, -1800);
		camera.lookAt(new THREE.Vector3(0, 600, -5000));
		window.camera = camera;

		//Inicialimos el puente creando un cubo
		var bridge = createCube(2900, 10, 120000, 0xc9c9c9, 0, -300, -55000);
		scene.add(bridge);

		//Inicializamos el cubo que es el protagonista del juego
		cube = new Cube();
		scene.add(cube.element);

		objects = [];
		pyramidPresenceProb = 0.2;
		maxPyramidSize = 0.5;
		for (var i = 10; i < 40; i++) {
			createRowOfpyramids(i * -3000, pyramidPresenceProb, 0.5, maxPyramidSize);
		}

		fogDistance = 35000;
		scene.fog = new THREE.Fog(0xd8d0d1, 1, fogDistance);

		// Inicializamos las luces
		light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
		scene.add(light);

		gameOver = false;
		paused = true;

		// Las constantes del keyboard que vamos a recibir del jugador
		var left = 37;
		var up = 38;
		var right = 39;
		var p = 80;

		keysAllowed = {};
		document.addEventListener(
			'keydown',
			function (e) {
				if (!gameOver) {
					var key = e.keyCode;
					if (keysAllowed[key] === false) return;
					keysAllowed[key] = false;
					if (paused && !collisionsDetected() && key > 18) {
						paused = false;
						cube.onUnpause();
						document.getElementById("loser").style.visibility = "hidden";
						document.getElementById("controls").style.display = "none";
					} else {
						if (key == p) {
							paused = true;
							cube.onPause();
							document.getElementById("loser").style.visibility = "visible";
							document.getElementById("loser").innerHTML ="Juego esta pausado. Pulsa cualquier tecla para reanudar la partida.";
						}
						if (key == up && !paused) {
							cube.onUpKeyPressed();
						}
						if (key == left && !paused) {
							cube.onLeftKeyPressed();
						}
						if (key == right && !paused) {
							cube.onRightKeyPressed();
						}
					}
				}
			}
		);
		document.addEventListener(
			'keyup',
			function (e) {
				keysAllowed[e.keyCode] = true;
			}
		);
		document.addEventListener(
			'focus',
			function (e) {
				keysAllowed = {};
			}
		);

		score = 0;
		difficulty = 0;
		document.getElementById("score").innerHTML = score;

		// Comienza el bucle con la renderización
		loop();

	}


	function loop() {


		if (!paused) {

			// Añade más pirámides en función de como aumenta la dificultad
			if ((objects[objects.length - 1].mesh.position.z) % 3000 == 0) {
				difficulty += 1;
				var levelLength = 30;
				if (difficulty % levelLength == 0) {
					var level = difficulty / levelLength;
					switch (level) {
						case 1:
							pyramidPresenceProb = 0.35;
							maxPyramidSize = 0.5;
							break;
						case 2:
							pyramidPresenceProb = 0.35;
							maxPyramidSize = 0.85;
							break;
						case 3:
							pyramidPresenceProb = 0.5;
							maxPyramidSize = 0.85;
							break;
						case 4:
							pyramidPresenceProb = 0.5;
							maxPyramidSize = 1.1;
							break;
						case 5:
							pyramidPresenceProb = 0.5;
							maxPyramidSize = 1.1;
							break;
						case 6:
							pyramidPresenceProb = 0.55;
							maxPyramidSize = 1.1;
							break;
						default:
							pyramidPresenceProb = 0.55;
							maxPyramidSize = 1.25;
					}
				}
				// Aumenta la niebla
				if ((difficulty >= 5 * levelLength && difficulty < 6 * levelLength)) {
					fogDistance -= (25000 / levelLength);
				} else if (difficulty >= 8 * levelLength && difficulty < 9 * levelLength) {
					fogDistance -= (5000 / levelLength);
				}
				createRowOfpyramids(-120000, pyramidPresenceProb, 0.5, maxPyramidSize);
				scene.fog.far = fogDistance;
			}

			// Pone las pirámides cerca del cubo
			objects.forEach(function (object) {
				object.mesh.position.z += 100;
			});

			// Elimina las pirámides que están fuera del puente
			objects = objects.filter(function (object) {
				return object.mesh.position.z < 0;
			});

			cube.update();

			// Comprueba las colisiones del cubo con las pirámides
			if (collisionsDetected()) {
				gameOver = true;
				paused = true;
				document.addEventListener(
					'keydown',
					function (e) {
						if (e.keyCode == 82)
							document.location.reload(true);
					}
				);
				var loser = document.getElementById("loser");
				loser.style.visibility = "visible";
				loser.innerHTML ="¡Has Perdido! Presiona R para volver a jugar";
			}

			score += 10;
			document.getElementById("score").innerHTML = score;

		}

		// Renderiza la página y repite.
		renderer.render(scene, camera);
		requestAnimationFrame(loop);
	}


	//Crea y devuelve una fila de pirámides según los parámetos que se les pase.
	function createRowOfpyramids(position, probability, minScale, maxScale) {
		for (var lane = -1; lane < 2; lane++) {
			var randomNumber = Math.random();
			if (randomNumber < probability) {
				var scale = minScale + (maxScale - minScale) * Math.random();
				var pyramid = new Pyramid(lane * 800, -400, position, scale);
				objects.push(pyramid);
				scene.add(pyramid.mesh);
			}
		}
	}

	// Comprueba si el cubo ha colisionado con alguna pirámided
	function collisionsDetected() {
		var charMinX = cube.element.position.x - 115;
		var charMaxX = cube.element.position.x + 115;
		var charMinY = cube.element.position.y - 310;
		var charMaxY = cube.element.position.y + 320;
		var charMinZ = cube.element.position.z - 40;
		var charMaxZ = cube.element.position.z + 40;
		for (var i = 0; i < objects.length; i++) {
			if (objects[i].collides(charMinX, charMaxX, charMinY,
				charMaxY, charMinZ, charMaxZ)) {
				return true;
			}
		}
		return false;
	}

}

// Función para crear el cubo
function Cube() {

	var self = this;

	this.jumpDuration = 0.6;
	this.jumpHeight = 1500;

	init();


	function init() {

		// Construye el cubo
		self.cube = createCube(300, 300, 160, 0x33ffec, 0, 100, 0);

		self.element = createGroup(0, 0, -4000);
		self.element.add(self.cube);

		// Inicializa los parámetros del cubo para jugar
		self.isJumping = false;
		self.isSwitchingLeft = false;
		self.isSwitchingRight = false;
		self.currentLane = 0;
		self.runningStartTime = new Date() / 1000;
		self.pauseStartTime = new Date() / 1000;
		self.stepFreq = 2;
		self.queuedActions = [];
	}

	// Actualiza el movimiento del cubo
	this.update = function () {

		// Obtiene el tiempo actual
		var currentTime = new Date() / 1000;

		if (!self.isJumping &&
			!self.isSwitchingLeft &&
			!self.isSwitchingRight &&
			self.queuedActions.length > 0) {
			switch (self.queuedActions.shift()) {
				case "up":
					self.isJumping = true;
					self.jumpStartTime = new Date() / 1000;
					break;
				case "left":
					if (self.currentLane != -1) {
						self.isSwitchingLeft = true;
					}
					break;
				case "right":
					if (self.currentLane != 1) {
						self.isSwitchingRight = true;
					}
					break;
			}
		}

		// Comprueba la altura de salto del cubo y si no esta saltando sigue corriendo
		if (self.isJumping) {
			var jumpClock = currentTime - self.jumpStartTime;
			self.element.position.y = self.jumpHeight * Math.sin((1 / self.jumpDuration) * Math.PI * jumpClock) + sinusoidal(0, 20, 0, self.jumpStartTime - self.runningStartTime);
			if (jumpClock > self.jumpDuration) {
				self.isJumping = false;
				self.runningStartTime += self.jumpDuration;
			}
		} else {
			var runningClock = currentTime - self.runningStartTime;
			self.element.position.y = sinusoidal(0, 20, 0, runningClock);
			self.cube.rotation.x = sinusoidal(-10, -5, 180, runningClock) * deg2Rad;

			if (self.isSwitchingLeft) {
				self.element.position.x -= 200;
				var offset = self.currentLane * 800 - self.element.position.x;
				if (offset > 800) {
					self.currentLane -= 1;
					self.element.position.x = self.currentLane * 800;
					self.isSwitchingLeft = false;
				}
			}
			if (self.isSwitchingRight) {
				self.element.position.x += 200;
				var offset = self.element.position.x - self.currentLane * 800;
				if (offset > 800) {
					self.currentLane += 1;
					self.element.position.x = self.currentLane * 800;
					self.isSwitchingRight = false;
				}
			}
		}
	}

	this.onLeftKeyPressed = function () {
		self.queuedActions.push("left");
	}

	this.onUpKeyPressed = function () {
		self.queuedActions.push("up");
	}

	this.onRightKeyPressed = function () {
		self.queuedActions.push("right");
	}

	this.onPause = function () {
		self.pauseStartTime = new Date() / 1000;
	}

	this.onUnpause = function () {
		var currentTime = new Date() / 1000;
		var pauseDuration = currentTime - self.pauseStartTime;
		self.runningStartTime += pauseDuration;
		if (self.isJumping) {
			self.jumpStartTime += pauseDuration;
		}
	}

}

// Función para generar las pirámides con una escala determinada y en una posición
function Pyramid(x, y, z, s) {

	var self = this;

	this.mesh = new THREE.Object3D();
	var pyramid = createCylinder(2, 700, 700, 4, 0xdf6262, 0, 1000, 0);
	this.mesh.add(pyramid);
	this.mesh.position.set(x, y, z);
	this.mesh.scale.set(s, s, s);
	this.scale = s;

	// Una función para detectar si la pirámide esta colisionando con el cubo, para dar el espacio de coordenadas
	this.collides = function (minX, maxX, minY, maxY, minZ, maxZ) {
		var pyramidMinX = self.mesh.position.x - this.scale * 250;
		var pyramidMaxX = self.mesh.position.x + this.scale * 250;
		var pyramidMinY = self.mesh.position.y;
		var pyramidMaxY = self.mesh.position.y + this.scale * 1150;
		var pyramidMinZ = self.mesh.position.z - this.scale * 250;
		var pyramidMaxZ = self.mesh.position.z + this.scale * 250;
		return pyramidMinX <= maxX && pyramidMaxX >= minX
			&& pyramidMinY <= maxY && pyramidMaxY >= minY
			&& pyramidMinZ <= maxZ && pyramidMaxZ >= minZ;
	}

}

// Esta función se ha obtenido de stackoverflow para consguir una función sinusoidal para realizar el salto del cubo https://stackoverflow.com/questions/44692895/sinusoidal-or-other-custom-move-type-between-two-points
function sinusoidal(minimum, maximum, phase, time) {
	var amplitude = 0.5 * (Math.random() * (maximum - minimum));
	var period = 30;
	var phaseRadians = phase * Math.PI / 180;
	var deviation = amplitude * Math.sin(period * time + phaseRadians);
	var average = (minimum + maximum) / 2;
	return average + deviation;
}


// Crea un grupo vacio de objetos en unas determinadas coordenadas para poder trabajar mejor con los objetos en los espacios
function createGroup(x, y, z) {
	var group = new THREE.Group();
	group.position.set(x, y, z);
	return group;
}


// Función que crea un cubo utilizando los métodos de THREE.js de BoxGeometry para generarlo
// https://threejs.org/docs/#api/en/geometries/BoxGeometry
function createCube(dx, dy, dz, color, x, y, z) {
	var geom = new THREE.BoxGeometry(dx, dy, dz);
	var mat = new THREE.MeshPhongMaterial({ color: color });
	var cube = new THREE.Mesh(geom, mat);
	cube.castShadow = true;
	cube.receiveShadow = true;
	cube.position.set(x, y, z);
	return cube;
}

// Función que crea una pirámide con la propiedad de THREE.js de CylinderGeometry
// https://codepen.io/AMill/pen/KRbEpx
function createCylinder(radiusTop, radiusBottom, height, radialSegments, color, x, y, z) {
	var geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
	var mat = new THREE.MeshPhongMaterial({ color: color });
	var pyramid = new THREE.Mesh(geom, mat);
	pyramid.castShadow = true;
	pyramid.receiveShadow = true;
	pyramid.position.set(x, y, z);
	return pyramid;
}
