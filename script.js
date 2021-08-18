
var renderer, scene, camera, controls;
var mesh, mesh2, mesh3, mesh4, mesh5, mesh6;

init();
render();
animate();

// var collisions = [];

function init() {

	// info
	let info = document.createElement( 'div' );
	info.style.position = 'absolute';
	info.style.top = '30px';
	info.style.width = '100%';
	info.style.textAlign = 'center';
	info.style.color = '#fff';
	info.style.fontWeight = 'bold';
	info.style.backgroundColor = 'transparent';
	info.style.zIndex = '1';
	info.style.fontFamily = 'Monospace';
	info.innerHTML = 'three.js - Isometric Projection<br/>drag mouse to rotate camera';
	document.body.appendChild( info );

	// renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	// scene
	scene = new THREE.Scene();

	// camera
	var aspect = window.innerWidth / window.innerHeight;
	var d = 20;
	camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 1000 );

	// /////////////////////////////////////////////////////////////////////////

	// method 1 - use lookAt
		//camera.position.set( 20, 20, 20 );
		//camera.lookAt( scene.position );

	// method 2 - set the x-component of rotation
		camera.position.set( 20, 20, 20 );
		camera.rotation.order = 'YXZ';
		camera.rotation.y = - Math.PI / 4;
		camera.rotation.x = Math.atan( - 1 / Math.sqrt( 2 ) );

	// /////////////////////////////////////////////////////////////////////////

	// controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.addEventListener( 'change', render );
	controls.enableZoom = false;
	controls.enablePan = false;
	controls.maxPolarAngle = Math.PI / 2;

	// ambient
	scene.add( new THREE.AmbientLight( 0x444444 ) );

	// light
	var light = new THREE.PointLight( 0xffffff, 0.8 );
	light.position.set( 0, 50, 50 );
	scene.add( light );

	// axes
	scene.add( new THREE.AxisHelper( 40 ) );

	// grid
	var geometry = new THREE.PlaneBufferGeometry( 100, 100, 10, 10 );
	var material = new THREE.MeshBasicMaterial( { wireframe: true, opacity: 0.5, transparent: true } );
	var grid = new THREE.Mesh( geometry, material );
	grid.rotation.order = 'YXZ';
	grid.rotation.y = - Math.PI / 2;
	grid.rotation.x = - Math.PI / 2;
	scene.add( grid );

	// geometry
	var geometry = new THREE.BoxGeometry( 10, 10, 10 );

	// material
	var material = new THREE.MeshNormalMaterial();

	// mesh
	mesh = new THREE.Mesh( geometry, material );
	mesh2 = new THREE.Mesh( geometry, material );
	mesh3 = new THREE.Mesh( geometry, material );
	mesh4 = new THREE.Mesh( geometry, material );
	mesh5 = new THREE.Mesh( geometry, material );
	mesh6 = new THREE.Mesh( geometry, material );
	scene.add( mesh, mesh2, mesh3, mesh4, mesh5, mesh6 );

}

function render() {

	renderer.render( scene, camera );

}

function animate() {
    requestAnimationFrame( animate );

    mesh.position.x += 0.01;
    if (mesh.position.x > 1) {
        mesh.position.x = -1;
    }
    mesh2.position.x -= 0.01;
    if (mesh2.position.x < -1) {
        mesh2.position.x = 1;
    }
    mesh3.position.y += 0.01;
    if (mesh3.position.y > 1) {
        mesh3.position.y = -1;
    }
    mesh4.position.y -= 0.01;
    if (mesh4.position.y < -1) {
        mesh4.position.y = 1;
    }
    mesh5.position.z += 0.01;
    if (mesh5.position.z > 1) {
        mesh5.position.z = -1;
    }
    mesh6.position.z -= 0.01;
    if (mesh6.position.z < -1) {
        mesh6.position.z = 1;
    }

    // cube.position.y += 0.01;

    renderer.render( scene, camera );
}

/**
 * Calculates collision detection parameters.
 * http://www.bryanjones.us/article/basic-threejs-game-tutorial-part-5-collision-detection
 */
//  function calculateCollisionPoints( mesh, scale, type = 'collision' ) { 
//     // Compute the bounding box after scale, translation, etc.
//     var bbox = new THREE.Box3().setFromObject(mesh);
   
//     var bounds = {
//       type: type,
//       xMin: bbox.min.x,
//       xMax: bbox.max.x,
//       yMin: bbox.min.y,
//       yMax: bbox.max.y,
//       zMin: bbox.min.z,
//       zMax: bbox.max.z,
//     };
   
//     collisions.push( bounds );
//   }