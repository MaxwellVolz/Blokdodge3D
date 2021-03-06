//variable declaration section
let physicsWorld, scene, camera, renderer, rigidBodies = [], tmpTrans = null

// Dynamic bodies
let ballObject = null,
    moveDirection = { left: 0, right: 0, forward: 0, back: 0, up: 0 },
    jumpCooldown = 1, jumpOnCooldown = false, jumpClock = new THREE.Clock()

const STATE = { DISABLE_DEACTIVATION: 4 }

// Kinematic bodies
let kObject = null,
    kMoveDirection = { left: 0, right: 0, forward: 0, back: 0 },
    tmpPos = new THREE.Vector3(), tmpQuat = new THREE.Quaternion();
const FLAGS = { CF_KINEMATIC_OBJECT: 2 }

// Wave bodies
let wave_objects = []
let test_wave = [
    [1,1,1,0,1,0,1,0],
    [0,0,0,1,1,1,0,1],
    [1,1,0,0,1,0,1,0],
    [1,1,1,0,0,0,1,0],
    [0,0,0,1,1,1,0,1],
    [1,1,0,0,1,0,1,0],
    [1,1,1,0,1,0,1,0],
    [0,0,1,1,0,1,0,1],
    [1,1,0,0,1,0,1,0],
    [0,0,0,1,1,1,0,1],
    [1,1,0,0,1,0,1,0],
    [1,1,1,0,1,0,1,0],
    [0,0,1,1,0,1,0,1],
    [1,1,0,0,1,0,1,0]]

let ammoTmpPos = null, ammoTmpQuat = null;

//Ammojs Initialization
Ammo().then(start)


function start() {
    tmpTrans = new Ammo.btTransform();
    ammoTmpPos = new Ammo.btVector3();
    ammoTmpQuat = new Ammo.btQuaternion();
    
    setupPhysicsWorld();
    setupGraphics();

    unpackWaves(test_wave)
    // createWaveBlock(-40,6,-40);

    createPlane(0,0,0);
    createBall();
    createKinematicBox(20, 6,20);

    setupEventHandlers();
    renderFrame();
}

function setupPhysicsWorld() {

    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache = new Ammo.btDbvtBroadphase(),
        solver = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -50, 0));

}


function setupGraphics() {

    //create clock for timing
    clock = new THREE.Clock();

    //create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);
    scene.fog = new THREE.Fog( 0xccddff, 100, 160 );

    //create camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 5000);
    camera.position.set(0, 30, 100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    //Add hemisphere light
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.1);
    hemiLight.color.setHSL(0.6, 0.6, 0.6);
    hemiLight.groundColor.setHSL(0.1, 1, 0.4);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    //Add directional light
    let dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1.75, 1);
    dirLight.position.multiplyScalar(100);
    scene.add(dirLight);

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    let d = 50;

    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    dirLight.shadow.camera.far = 13500;

    //Setup the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xbfd1e5);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;

}


function renderFrame() {
    let deltaTime = clock.getDelta();

    moveBall();
    moveKinematic();

    moveWave();

    updatePhysics(deltaTime);

    renderer.render(scene, camera);
    requestAnimationFrame(renderFrame);
}

function setupEventHandlers() {

    window.addEventListener('keydown', handleKeyDown, false);
    window.addEventListener('keyup', handleKeyUp, false);

}


function handleKeyDown(event) {
    let keyCode = event.keyCode;

    switch (keyCode) {

        case 32: //???: SPACE
            checkJumpStatus();
            break;

        case 38: //???: FORWARD
            kMoveDirection.forward = 1
            break;

        case 40: //???: BACK
            kMoveDirection.back = 1
            break;

        case 37: //???: LEFT
            kMoveDirection.left = 1
            break;

        case 39: //???: RIGHT
            kMoveDirection.right = 1
            break;

        case 87: //W: FORWARD
            moveDirection.forward = 1
            break;

        case 83: //S: BACK
            moveDirection.back = 1
            break;

        case 65: //A: LEFT
            moveDirection.left = 1
            break;

        case 68: //D: RIGHT
            moveDirection.right = 1
            break;
    }
}


function handleKeyUp(event) {
    let keyCode = event.keyCode;

    switch (keyCode) {
        case 32: //???: SPACE
            break;

        case 38: //???: FORWARD
            kMoveDirection.forward = 0
            break;

        case 40: //???: BACK
            kMoveDirection.back = 0
            break;

        case 37: //???: LEFT
            kMoveDirection.left = 0
            break;

        case 39: //???: RIGHT
            kMoveDirection.right = 0
            break;

        case 87: //FORWARD
            moveDirection.forward = 0
            break;

        case 83: //BACK
            moveDirection.back = 0
            break;

        case 65: //LEFT
            moveDirection.left = 0
            break;

        case 68: //RIGHT
            moveDirection.right = 0
            break;

    }

}

function checkJumpStatus() {
    // check time since last jump
    if (jumpClock.getElapsedTime() > jumpCooldown) {
        jumpOnCooldown = false
    }

    // stop "jump"
    if (jumpOnCooldown){
        moveDirection.up = 0
    }
    else{
        moveDirection.up = 1
        jumpOnCooldown = true
        jumpClock.start()
    }

}

function createPlane(x_pos, y_pos, z_pos) {

    let pos = { x: x_pos, y: y_pos, z: z_pos };
    let scale = { x: 100, y: 2, z: 100 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0;

    //threeJS Section
    let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({ color: 0xa0afa4 }));

    blockPlane.position.set(pos.x, pos.y, pos.z);
    blockPlane.scale.set(scale.x, scale.y, scale.z);

    blockPlane.castShadow = true;
    blockPlane.receiveShadow = true;

    scene.add(blockPlane);


    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);

    body.setFriction(4);
    body.setRollingFriction(10);

    physicsWorld.addRigidBody(body);
}

function createBall() {

    let pos = { x: 0, y: 4, z: 0 };
    let radius = 2;
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 1;

    //threeJS Section
    let ball = ballObject = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshPhongMaterial({ color: 0xff0505 }));

    ball.position.set(pos.x, pos.y, pos.z);

    ball.castShadow = true;
    ball.receiveShadow = true;

    scene.add(ball);


    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btSphereShape(radius);
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);

    body.setFriction(4);
    body.setRollingFriction(10);

    body.setActivationState(STATE.DISABLE_DEACTIVATION);

    physicsWorld.addRigidBody(body);

    ball.userData.physicsBody = body;
    rigidBodies.push(ball);
}

function moveBall() {

    let scalingFactor = 20;

    let moveX = moveDirection.right - moveDirection.left;
    let moveZ = moveDirection.back - moveDirection.forward;
    let moveY = moveDirection.up;

    if (moveX == 0 && moveY == 0 && moveZ == 0) return;

    // TODO: if jumping disable lateral movement


    let resultantImpulse = new Ammo.btVector3(moveX*20, moveY*75, moveZ*20)
    resultantImpulse.op_mul(scalingFactor);

    let physicsBody = ballObject.userData.physicsBody;

    physicsBody

    console.log(physicsBody)

    // Not physics based movement
    // physicsBody.setLinearVelocity(resultantImpulse);

    // Insane accel
    // physicsBody.applyImpulse(resultantImpulse) 

    // Push with applyForce
    physicsBody.applyForce(resultantImpulse) 

    moveDirection.up = 0


}

function createKinematicBox(x_pos, y_pos, z_pos) {

    let pos = { x: x_pos, y: y_pos, z: z_pos };
    let scale = { x: 10, y: 10, z: 10 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0;

    //threeJS Section
    kObject = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({ color: 0x30ab78 }));

    kObject.position.set(pos.x, pos.y, pos.z);
    kObject.scale.set(scale.x, scale.y, scale.z);

    kObject.castShadow = true;
    kObject.receiveShadow = true;

    scene.add(kObject);

    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);

    body.setFriction(4);
    body.setRollingFriction(10);

    body.setActivationState(STATE.DISABLE_DEACTIVATION);
    body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);


    physicsWorld.addRigidBody(body);
    kObject.userData.physicsBody = body;

}

function moveKinematic(){

    let scalingFactor = 0.3;

    let moveX =  kMoveDirection.right - kMoveDirection.left;
    let moveZ =  kMoveDirection.back - kMoveDirection.forward;
    let moveY =  0;

    let translateFactor = tmpPos.set(moveX, moveY, moveZ);

    translateFactor.multiplyScalar(scalingFactor);

    kObject.translateX(translateFactor.x);
    kObject.translateY(translateFactor.y);
    kObject.translateZ(translateFactor.z);

    kObject.getWorldPosition(tmpPos);
    kObject.getWorldQuaternion(tmpQuat);

    let physicsBody = kObject.userData.physicsBody;

    let ms = physicsBody.getMotionState();
    if ( ms ) {

        ammoTmpPos.setValue(tmpPos.x, tmpPos.y, tmpPos.z);
        ammoTmpQuat.setValue( tmpQuat.x, tmpQuat.y, tmpQuat.z, tmpQuat.w);


        tmpTrans.setIdentity();
        tmpTrans.setOrigin( ammoTmpPos ); 
        tmpTrans.setRotation( ammoTmpQuat ); 

        ms.setWorldTransform(tmpTrans);
    }
}

function createWaveBlock(x_pos, y_pos, z_pos) {

    let pos = { x: x_pos, y: y_pos, z: z_pos };
    let scale = { x: 10, y: 6, z: 10 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0;

    let wavePart = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({ color: 0x30ab78 }));

    wavePart.position.set(pos.x, pos.y, pos.z);
    wavePart.scale.set(scale.x, scale.y, scale.z);

    wavePart.castShadow = true;
    wavePart.receiveShadow = true;

    scene.add(wavePart);
    wave_objects.push(wavePart)

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);

    body.setFriction(4);
    body.setRollingFriction(10);

    
    body.setActivationState(STATE.DISABLE_DEACTIVATION);
    body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);


    physicsWorld.addRigidBody(body);
    wavePart.userData.physicsBody = body;
}

function moveWave(){
    wave_objects.forEach(single_wave => {
        let scalingFactor = 0.3;

        let moveX =  0;
        let moveZ =  .5;
        let moveY =  0;
    
        let translateFactor = tmpPos.set(moveX, moveY, moveZ);
    
        translateFactor.multiplyScalar(scalingFactor);
    
        single_wave.translateX(translateFactor.x);
        single_wave.translateY(translateFactor.y);
        single_wave.translateZ(translateFactor.z);
    
        single_wave.getWorldPosition(tmpPos);
        single_wave.getWorldQuaternion(tmpQuat);

        // console.log(single_wave.getWorldPosition(tmpPos).z);

        if (single_wave.getWorldPosition(tmpPos).z > 100){
            single_wave.translateZ(-300);

        }


        let physicsBody = single_wave.userData.physicsBody;
    
        let ms = physicsBody.getMotionState();
        if ( ms ) {
    
            ammoTmpPos.setValue(tmpPos.x, tmpPos.y, tmpPos.z);
            ammoTmpQuat.setValue( tmpQuat.x, tmpQuat.y, tmpQuat.z, tmpQuat.w);
    
    
            tmpTrans.setIdentity();
            tmpTrans.setOrigin( ammoTmpPos ); 
            tmpTrans.setRotation( ammoTmpQuat ); 
    
            ms.setWorldTransform(tmpTrans);
        }
    })
}

function unpackWaves(waves){
    console.log(waves)

    waves.forEach(( wave, index) => {  
        wave.forEach((inner_element, inner_index) => {
            // console.log("index:", index, " inner_index:", inner_index)
            if (inner_element) {
                let x_offset = -45 + (inner_index * 12.8);
                let z_offset = -40 + index * -15;

                createWaveBlock(x_offset,3,z_offset);
            }
        })
    })
}

function updatePhysics(deltaTime) {

    // Step world
    physicsWorld.stepSimulation(deltaTime, 10);

    // Update rigid bodies
    for (let i = 0; i < rigidBodies.length; i++) {
        let objThree = rigidBodies[i];
        let objAmmo = objThree.userData.physicsBody;
        let ms = objAmmo.getMotionState();
        if (ms) {

            ms.getWorldTransform(tmpTrans);
            let p = tmpTrans.getOrigin();
            let q = tmpTrans.getRotation();
            objThree.position.set(p.x(), p.y(), p.z());
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

        }
    }

}

window.onresize = function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};