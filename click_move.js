
// Declare globals
var camera, // We need a camera.
    scene, // The camera has to see something.
    renderer, // Render our graphics.
    controls, // Our Orbit Controller for camera magic.
    container, // Our HTML container for the program.
    rotationPoint;  // The point in which our camera will rotate around.

var box;
var characterSize = 50;
var outlineSize = characterSize * 0.05;

// Track all objects and collisions.
var objects = [];
var collisions = [];

// Track click intersects.
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

// Watch for double clicks. 
var clickTimer = null;

// Store movements.
var movements = [];
var playerSpeed = 5;

// The movement destination indicator.
var indicatorTop;
var indicatorBottom;

// Initial Setup and Render Loop
init();
animate();

function init() {
    // Build the container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create the scene.
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xccddff);
    scene.fog = new THREE.Fog(0xccddff, 500, 2000);

    // Ambient lights.
    var ambient = new THREE.AmbientLight(0xffffff);
    scene.add(ambient);

    // Hemisphere lighting.
    var hemisphereLight = new THREE.HemisphereLight(0xdddddd, 0x000000, 0.5);
    scene.add(hemisphereLight);

    // Create a rotation point.
    rotationPoint = new THREE.Object3D();
    rotationPoint.position.set(0, 0, 0);
    scene.add(rotationPoint);

    // Add Character
    createCharacter();

    // Add Objects
    createFloor();
    createTree(300, 300);
    createTree(800, -300);
    createTree(-300, 800);
    createTree(-800, -800);


    // var aspect = window.innerWidth / window.innerHeight;
	// var d = 20;
	// camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 1000 );
    // camera.position.set( 2, 2, 2 );
    // camera.rotation.order = 'YXZ';
    // camera.rotation.y = - Math.PI / 4;
    // camera.rotation.x = Math.atan( - 1 / Math.sqrt( 2 ) );

    // PerspectiveCamera
    camera = new THREE.PerspectiveCamera(
        60, // Angle
        window.innerWidth / window.innerHeight, // Aspect Ratio.
        1, // Near view.
        20000 // Far view.
    );

    // Move the camera away from the center of the scene.
    camera.position.z = -300;
    camera.position.y = 200;

    // Make chase cam
    box.add(camera);

    // Build the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });

    var element = renderer.domElement;
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(element);

    // Build the controls.
    controls = new THREE.OrbitControls(camera, element);
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.maxDistance = 1000; // Set our max zoom out distance (mouse scroll)
    controls.minDistance = 60; // Set our min zoom in distance (mouse scroll)
    controls.target.copy(new THREE.Vector3(0, 0, 0));
}

window.onresize = function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};
// Apply to Scene while running
function update() {
    camera.updateProjectionMatrix();
}

// Render Scene
function render() {
    renderer.render(scene, camera);

    // Don't let the camera go too low.
    if (camera.position.y < 10) {
        camera.position.y = 10;
    }

    // If any movement was added, run it!
    if (movements.length > 0) {
        // Set an indicator point to destination.
        if (scene.getObjectByName('indicator_top') === undefined) {
            drawIndicator();
        } else {
            if (indicatorTop.position.y > 10) {
                indicatorTop.position.y -= 15;
            } else {
                indicatorTop.position.y = 100;
            }
        }


        move(rotationPoint, movements[0]);
    }
    if (collisions.length > 0) {
        detectCollisions();
    }
}

// Animate Scene
function animate() {
    requestAnimationFrame(animate);
    update();
    render();
}

// Create character
function createCharacter() {
    var geometry = new THREE.BoxBufferGeometry(characterSize, characterSize, characterSize);
    var material = new THREE.MeshPhongMaterial({ color: 0x22dd88 });
    box = new THREE.Mesh(geometry, material);
    box.position.y = characterSize / 2;
    rotationPoint.add(box);

    // Create outline object
    var outline_geo = new THREE.BoxGeometry(characterSize + outlineSize, characterSize + outlineSize, characterSize + outlineSize);
    var outline_mat = new THREE.MeshBasicMaterial({ color: 0x0000000, side: THREE.BackSide });
    var outline = new THREE.Mesh(outline_geo, outline_mat);
    box.add(outline);
}

// Create floor
function createFloor() {
    var geometry = new THREE.PlaneBufferGeometry(100000, 100000);
    var material = new THREE.MeshToonMaterial({ color: 0x336633 });
    var plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -1 * Math.PI / 2;
    plane.position.y = 0;
    scene.add(plane);
    objects.push(plane);
}

document.addEventListener('mousedown', onDocumentMouseDown, false);

function onDocumentMouseDown(event, bypass = false) {
    event.preventDefault();

    if (event.which == 1) {
        console.log("im #1")
    }

    // Detect which mouse button was clicked.
    if (event.which == 3) {
        stopMovement();

        // Grab the coordinates.
        console.log(event.clientX)
        console.log(renderer.domElement.clientWidth)
        mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

        // Use the raycaster to detect intersections.
        raycaster.setFromCamera(mouse, camera);

        // Grab all objects that can be intersected.
        var intersects = raycaster.intersectObjects(objects);
        if (intersects.length > 0) {
            movements.push(intersects[0].point);
        }
    }
}

document.addEventListener('touchstart', onDocumentTouchStart, false);

function onDocumentTouchStart(event) {
    event.preventDefault();
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;

    // Default touch doesn't offer a bypass.
    var bypass = false;

    // Detect if there was a double click. If so, bypass mouse button check.
    bypass = detectDoubleTouch();
    onDocumentMouseDown(event, bypass);
}

function stopMovement() {
    scene.remove(indicatorTop);
    scene.remove(indicatorBottom);
    movements = [];
}

function move(location, destination, speed = playerSpeed) {
    var moveDistance = speed;

    // Translate over to the position.
    var posX = location.position.x;
    var posZ = location.position.z;
    var newPosX = destination.x;
    var newPosZ = destination.z;

    // Set a multiplier just in case we need negative values.
    var multiplierX = 1;
    var multiplierZ = 1;

    // Detect the distance between the current pos and target.
    var diffX = Math.abs(posX - newPosX);
    var diffZ = Math.abs(posZ - newPosZ);
    var distance = Math.sqrt(diffX * diffX + diffZ * diffZ);

    // Use negative multipliers if necessary.
    if (posX > newPosX) {
        multiplierX = -1;
    }

    if (posZ > newPosZ) {
        multiplierZ = -1;
    }

    // Update the main position.
    location.position.x = location.position.x + (moveDistance * (diffX / distance)) * multiplierX;
    location.position.z = location.position.z + (moveDistance * (diffZ / distance)) * multiplierZ;

    // If the position is within margin of error we can call the movement complete.
    var moveMargin = 2
    if ((Math.floor(location.position.x) <= Math.floor(newPosX) + moveMargin &&
        Math.floor(location.position.x) >= Math.floor(newPosX) - moveMargin) &&
        (Math.floor(location.position.z) <= Math.floor(newPosZ) + moveMargin &&
            Math.floor(location.position.z) >= Math.floor(newPosZ) - moveMargin)) {
        location.position.x = Math.floor(location.position.x);
        location.position.z = Math.floor(location.position.z);

        // Reset any movements.
        stopMovement();

        // Maybe move should return a boolean. True if completed, false if not. 
    }
}

function calculateCollisionPoints(mesh, scale, type = 'collision') {
    // Compute the bounding box after scale, translation, etc.
    var bbox = new THREE.Box3().setFromObject(mesh);

    var bounds = {
        type: type,
        xMin: bbox.min.x,
        xMax: bbox.max.x,
        yMin: bbox.min.y,
        yMax: bbox.max.y,
        zMin: bbox.min.z,
        zMax: bbox.max.z,
    };

    collisions.push(bounds);
}

function detectCollisions() {
    // Get the user's current collision area.
    var bounds = {
        xMin: rotationPoint.position.x - box.geometry.parameters.width / 2,
        xMax: rotationPoint.position.x + box.geometry.parameters.width / 2,
        yMin: rotationPoint.position.y - box.geometry.parameters.height / 2,
        yMax: rotationPoint.position.y + box.geometry.parameters.height / 2,
        zMin: rotationPoint.position.z - box.geometry.parameters.width / 2,
        zMax: rotationPoint.position.z + box.geometry.parameters.width / 2,
    };

    // Run through each object and detect if there is a collision.
    for (var index = 0; index < collisions.length; index++) {

        if (collisions[index].type == 'collision') {
            if ((bounds.xMin <= collisions[index].xMax && bounds.xMax >= collisions[index].xMin) &&
                (bounds.yMin <= collisions[index].yMax && bounds.yMax >= collisions[index].yMin) &&
                (bounds.zMin <= collisions[index].zMax && bounds.zMax >= collisions[index].zMin)) {
                // We hit a solid object! Stop all movements.
                stopMovement();

                // Move the object in the clear. Detect the best direction to move.
                if (bounds.xMin <= collisions[index].xMax && bounds.xMax >= collisions[index].xMin) {
                    // Determine center then push out accordingly.
                    var objectCenterX = ((collisions[index].xMax - collisions[index].xMin) / 2) + collisions[index].xMin;
                    var playerCenterX = ((bounds.xMax - bounds.xMin) / 2) + bounds.xMin;
                    var objectCenterZ = ((collisions[index].zMax - collisions[index].zMin) / 2) + collisions[index].zMin;
                    var playerCenterZ = ((bounds.zMax - bounds.zMin) / 2) + bounds.zMin;

                    // Determine the X axis push.
                    if (objectCenterX > playerCenterX) {
                        rotationPoint.position.x -= 1;
                    } else {
                        rotationPoint.position.x += 1;
                    }
                }
                if (bounds.zMin <= collisions[index].zMax && bounds.zMax >= collisions[index].zMin) {
                    // Determine the Z axis push.
                    if (objectCenterZ > playerCenterZ) {
                        rotationPoint.position.z -= 1;
                    } else {
                        rotationPoint.position.z += 1;
                    }
                }
            }
        }
    }
}

function createTree(posX, posZ) {
    // Set some random values so our trees look different.
    var randomScale = (Math.random() * 3) + 0.8;
    var randomRotateY = Math.PI / (Math.floor((Math.random() * 32) + 1));

    // Create the trunk.
    var geometry = new THREE.CylinderGeometry(characterSize / 3.5, characterSize / 2.5, characterSize * 1.3, 8);
    var material = new THREE.MeshToonMaterial({ color: 0x664422 });
    var trunk = new THREE.Mesh(geometry, material);

    // Position the trunk based off of it's random given size.
    trunk.position.set(posX, ((characterSize * 1.3 * randomScale) / 2), posZ);
    trunk.scale.x = trunk.scale.y = trunk.scale.z = randomScale;
    scene.add(trunk);

    // Create the trunk outline.
    var outline_geo = new THREE.CylinderGeometry(characterSize / 3.5 + outlineSize, characterSize / 2.5 + outlineSize, characterSize * 1.3 + outlineSize, 8);
    var outline_mat = new THREE.MeshBasicMaterial({
        color: 0x0000000,
        side: THREE.BackSide
    });
    var outlineTrunk = new THREE.Mesh(outline_geo, outline_mat);
    trunk.add(outlineTrunk);

    // Create the tree top.
    var geometry = new THREE.DodecahedronGeometry(characterSize);
    var material = new THREE.MeshToonMaterial({ color: 0x44aa44 });
    var treeTop = new THREE.Mesh(geometry, material);

    // Position the tree top based off of it's random given size.
    treeTop.position.set(posX, ((characterSize * 1.3 * randomScale) / 2) + characterSize * randomScale, posZ);
    treeTop.scale.x = treeTop.scale.y = treeTop.scale.z = randomScale;
    treeTop.rotation.y = randomRotateY;
    scene.add(treeTop);

    // Create outline.
    var outline_geo = new THREE.DodecahedronGeometry(characterSize + outlineSize);
    var outline_mat = new THREE.MeshBasicMaterial({
        color: 0x0000000,
        side: THREE.BackSide
    });
    var outlineTreeTop = new THREE.Mesh(outline_geo, outline_mat);
    treeTop.add(outlineTreeTop);

    calculateCollisionPoints(trunk);
}

function drawIndicator() {
    // Store variables.
    var topSize = characterSize / 8;
    var bottomRadius = characterSize / 4;

    // Create the top indicator.
    var geometry = new THREE.TetrahedronGeometry(topSize, 0);
    var material = new THREE.MeshToonMaterial({ color: 0x00ccff, emissive: 0x00ccff });
    indicatorTop = new THREE.Mesh(geometry, material);
    indicatorTop.position.y = 100; // Flat surface so hardcode Y position for now.
    indicatorTop.position.x = movements[0].x; // Get the X destination.
    indicatorTop.position.z = movements[0].z; // Get the Z destination.
    indicatorTop.rotation.x = -0.97;
    indicatorTop.rotation.y = Math.PI / 4;
    indicatorTop.name = 'indicator_top'
    scene.add(indicatorTop);

    // Create the top indicator outline.
    var geometry = new THREE.TetrahedronGeometry(topSize + outlineSize, 0);
    var material = new THREE.MeshBasicMaterial({ color: 0x0000000, side: THREE.BackSide });
    var outlineTop = new THREE.Mesh(geometry, material);
    indicatorTop.add(outlineTop);

    // Create the bottom indicator.
    var geometry = new THREE.TorusGeometry(bottomRadius, (bottomRadius * 0.25), 2, 12);
    geometry.dynamic = true;
    var material = new THREE.MeshToonMaterial({ color: 0x00ccff, emissive: 0x00ccff });
    indicatorBottom = new THREE.Mesh(geometry, material);
    indicatorBottom.position.y = 3;
    indicatorBottom.position.x = movements[0].x;
    indicatorBottom.position.z = movements[0].z;
    indicatorBottom.rotation.x = -Math.PI / 2;
    scene.add(indicatorBottom);

    // Create the bottom outline.
    var geometry = new THREE.TorusGeometry(bottomRadius + outlineSize / 10, bottomRadius / 2.5, 2, 24);
    var material = new THREE.MeshBasicMaterial({ color: 0x0000000, side: THREE.BackSide });
    var outlineBottom = new THREE.Mesh(geometry, material);
    outlineBottom.position.z = -2;
    indicatorBottom.add(outlineBottom);
}

function detectDoubleTouch() {
    // If a single click was detected, start the timer.
    if (clickTimer == null) {
        clickTimer = setTimeout(function () {
            clickTimer = null;
        }, 300);
    } else {
        // A double tap was detected!
        clearTimeout(clickTimer);
        clickTimer = null;
        return true;
    }

    // No double tap.
    return false;
}