// UCLA's Graphics Example Code (Javascript and C++ translations available), by Garett Ridge for CS174a.
// example-displayables.js - The subclass definitions here each describe different independent animation processes that you want to fire off each frame, by defining a display
// event and how to react to key and mouse input events.  Make one or two of your own subclasses, and fill them in with all your shape drawing calls and any extra key / mouse controls.

// Now go down to Example_Animation's display() function to see where the sample shapes you see drawn are coded, and a good place to begin filling in your own code.

var spaceship_transform = mat4();
var posOffset = [];
var gameObjects = [];
var counter = 1;
var head, tail;
var heartCounter = 0;
var ringRate = 220, asteroidRate = 100, heartRate = 1500;
var ringSpeed = 60.0, asteroidSpeed = 60.0;
var rocketSphere;
var colliderSphere = 4.2;
var ringColliderSphere = 1.3;
var colliderCount = 0;
var isDead = false;
var pointBuffer = 0;
var smokeParticle = [];

function initSmokeParticles(numParticles, bt, spaceship_transform, color) {
  // smokeParticle = [];
  for (var i = 0; i < numParticles; i++) {
    var sx = Math.cos(Math.random() * 2 * Math.PI);
    var sy = Math.cos(Math.random() * 2 * Math.PI);
    var sz = Math.cos(Math.random() * 2 * Math.PI);
    var dx = Math.cos(Math.random() * 2 * Math.PI)/50;
    var dy = Math.cos(Math.random() * 2 * Math.PI)/50;
    var dz = Math.cos(Math.random() * 2 * Math.PI)/50;

    smokeParticle.push({
      startTransform: mult(spaceship_transform, translation(sx, sy, sz+5.5)),
      color: color,
      delta: [dx, dy, dz],
      birthTime: bt
    });
  }
}

window.onload = function() {
    var canvas = document.getElementById('gl-canvas');
    var context = canvas.getContext('2d');
    var imageObj = new Image();

    imageObj.onload = function() {
      context.drawImage(imageObj, 69, 50);
    };
    imageObj.src = 'images/starter_bg.png';
};

function Node(data) {
    this.data = data;
    this.next = null;
}

function add_object_helper(shape, material, time, position, speed, transform, osc){
  if (head == null){
    head = new Node([shape, material, time, position, speed, transform, osc]);
  }
  else if (head.next == null){
    head.next = new Node([shape, material, time, position, speed, transform, osc]);
    tail = head.next;
  }
  else{
    tail.next = new Node([shape, material, time, position, speed, transform, osc]);
    tail = tail.next;
  }
}

// Stuff to control spaceship movement

// var maxRotations = 5;
// var rightRot = 0;
// var leftRot = 0;

var playerlocationx = 0;
var playerlocationy = 0;
var maxspeed = 4;
var xforce = 0;
var yforce = 0;
var pixelx = 0;
var pixely = 0;
var left_right_rotation = 0;
var up_down_rotation = 0;
var key_left = false;
var key_right = false;
var key_up = false;
var key_down = false;

window.addEventListener('keydown', handleKeyDown, true)
window.addEventListener('keyup', handleKeyUp, true)

function handleKeyDown(event){
  if (event.keyCode == 37)
    key_left = true;
  else if (event.keyCode == 39)
    key_right = true;
  else if (event.keyCode == 38)
    key_up = true;
  else if (event.keyCode == 40)
    key_down = true;
}

function handleKeyUp(event){
  if (event.keyCode == 37)
    key_left = false;
  else if (event.keyCode == 39)
    key_right = false;
  else if (event.keyCode == 38)
    key_up = false;
  else if (event.keyCode == 40)
    key_down = false;
}

function reset_values(){
  spaceship_transform = mat4();
  posOffset = [];
  gameObjects = [];
  counter = 1;
  head = null;
  tail = null;
  ringRate = 220, asteroidRate = 100;
  ringSpeed = 60.0, asteroidSpeed = 60.0;
  rocketSphere;
  colliderSphere = 4.2;
  ringColliderSphere = 1.3;
  colliderCount = 0;
  isDead = false;
  pointBuffer = 0;
  smokeParticle = [];
  left_right_rotation = 0;
  up_down_rotation = 0;

  playerlocationx = 0;
  playerlocationy = 0;
  maxspeed = 4;
  xforce = 0;
  yforce = 0;
  pixelx = 0;
  pixely = 0;
  key_left = false;
  key_right = false;
  key_up = false;
  key_down = false;
}

Declare_Any_Class( "Debug_Screen",  // Debug_Screen - An example of a displayable object that our class Canvas_Manager can manage.  Displays a text user interface.
  { 'construct': function( context )
      { this.define_data_members( { string_map: context.shared_scratchpad.string_map, start_index: 0, tick: 0, visible: false, graphicsState: new Graphics_State() } );
        shapes_in_use.debug_text = new Text_Line( 35 );
      },
    'init_keys': function( controls )
      { controls.add( "t",    this, function() { this.visible ^= 1;                                                                                                             } );
        controls.add( "up",   this, function() { this.start_index = ( this.start_index + 1 ) % Object.keys( this.string_map ).length;                                           } );
        controls.add( "down", this, function() { this.start_index = ( this.start_index - 1   + Object.keys( this.string_map ).length ) % Object.keys( this.string_map ).length; } );
        this.controls = controls;
      },
    'update_strings': function( debug_screen_object )   // Strings that this displayable object (Debug_Screen) contributes to the UI:
      { debug_screen_object.string_map["tick"]              = "Frame: " + this.tick++;
        debug_screen_object.string_map["text_scroll_index"] = "Text scroll index: " + this.start_index;
      },
    'display': function( time )
      { if( !this.visible ) return;

        shaders_in_use["Default"].activate();
        gl.uniform4fv( g_addrs.shapeColor_loc, Color( .8, .8, .8, 1 ) );

        var font_scale = scale( .02, .04, 1 ),
            model_transform = mult( translation( -.95, -.9, 0 ), font_scale ),
            strings = Object.keys( this.string_map );

        for( var i = 0, idx = this.start_index; i < 4 && i < strings.length; i++, idx = (idx + 1) % strings.length )
        {
          shapes_in_use.debug_text.set_string( this.string_map[ strings[idx] ] );
          shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );  // Draw some UI text (strings)
          model_transform = mult( translation( 0, .08, 0 ), model_transform );
        }
        model_transform = mult( translation( .7, .9, 0 ), font_scale );
        shapes_in_use.debug_text.set_string( "Controls:" );
        shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );    // Draw some UI text (controls title)

        for( let k of Object.keys( this.controls.all_shortcuts ) )
        {
          model_transform = mult( translation( 0, -0.08, 0 ), model_transform );
          shapes_in_use.debug_text.set_string( k );
          shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );  // Draw some UI text (controls)
        }
      }
  }, Animation );

Declare_Any_Class( "Example_Camera",     // An example of a displayable object that our class Canvas_Manager can manage.  Adds both first-person and
  { 'construct': function( context )     // third-person style camera matrix controls to the canvas
      { // 1st parameter below is our starting camera matrix.  2nd is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.

        context.shared_scratchpad.graphics_state = new Graphics_State( translation(0, -20, -30), perspective(50, canvas.width/canvas.height, .1, 1000), 0 );

        this.define_data_members( { graphics_state: context.shared_scratchpad.graphics_state, thrust: vec3(), origin: vec3( 0, 5, 0 ), looking: false } );

        this.graphics_state.camera_transform = mult( rotation( 20, 1, 0, 0 ), this.graphics_state.camera_transform );

        // *** Mouse controls: ***
        this.mouse = { "from_center": vec2() };
        var mouse_position = function( e ) { return vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2 ); };   // Measure mouse steering, for rotating the flyaround camera.
        canvas.addEventListener( "mouseup",   ( function(self) { return function(e) { e = e || window.event;    self.mouse.anchor = undefined;              } } ) (this), false );
        canvas.addEventListener( "mousedown", ( function(self) { return function(e) { e = e || window.event;    self.mouse.anchor = mouse_position(e);      } } ) (this), false );
        canvas.addEventListener( "mousemove", ( function(self) { return function(e) { e = e || window.event;    self.mouse.from_center = mouse_position(e); } } ) (this), false );
        canvas.addEventListener( "mouseout",  ( function(self) { return function(e) { self.mouse.from_center = vec2(); }; } ) (this), false );    // Stop steering if the mouse leaves the canvas.
      },
    'init_keys': function( controls )   // init_keys():  Define any extra keyboard shortcuts here
      {
        //move camera in and out along z axis
        controls.add( "i",     this, function() { this.thrust[2] =  1; } );     controls.add( "i",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'} );
        controls.add( "o",     this, function() { this.thrust[2] =  -1; } );     controls.add( "o",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'} );

      },
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
      { var C_inv = inverse( this.graphics_state.camera_transform ), pos = mult_vec( C_inv, vec4( 0, 0, 0, 1 ) ),
                                                                  z_axis = mult_vec( C_inv, vec4( 0, 0, 1, 0 ) );
        user_interface_string_manager.string_map["origin" ] = "Center of rotation: " + this.origin[0].toFixed(0) + ", " + this.origin[1].toFixed(0) + ", " + this.origin[2].toFixed(0);
        user_interface_string_manager.string_map["cam_pos"] = "Cam Position: " + pos[0].toFixed(2) + ", " + pos[1].toFixed(2) + ", " + pos[2].toFixed(2);    // The below is affected by left hand rule:
        user_interface_string_manager.string_map["facing" ] = "Facing: "       + ( ( z_axis[0] > 0 ? "West " : "East ") + ( z_axis[1] > 0 ? "Down " : "Up " ) + ( z_axis[2] > 0 ? "North" : "South" ) );
      },
    'display': function( time )
      { var leeway = 70,  degrees_per_frame = .0004 * this.graphics_state.animation_delta_time,
                          meters_per_frame  =   .01 * this.graphics_state.animation_delta_time;

        // Third-person camera mode: Is a mouse drag occurring?
        if( this.mouse.anchor )
        {
          var dragging_vector = subtract( this.mouse.from_center, this.mouse.anchor );            // Arcball camera: Spin the scene around the world origin on a user-determined axis.
          if( length( dragging_vector ) > 0 )
            this.graphics_state.camera_transform = mult( this.graphics_state.camera_transform,    // Post-multiply so we rotate the scene instead of the camera.
                mult( translation( this.origin ),
                mult( rotation( .05 * length( dragging_vector ), dragging_vector[1], dragging_vector[0], 0 ),
                      translation(scale_vec( -1, this.origin ) ) ) ) );
        }
        // First-person flyaround mode:  Determine camera rotation movement when the mouse is past a minimum distance (leeway) from the canvas's center.
        var offset_plus  = [ this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway ];
        var offset_minus = [ this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway ];

        for( var i = 0; this.looking && i < 2; i++ )      // Steer according to "mouse_from_center" vector, but don't start increasing until outside a leeway window from the center.
        {
          var velocity = ( ( offset_minus[i] > 0 && offset_minus[i] ) || ( offset_plus[i] < 0 && offset_plus[i] ) ) * degrees_per_frame;  // Use movement's quantity unless the &&'s zero it out
          this.graphics_state.camera_transform = mult( rotation( velocity, i, 1-i, 0 ), this.graphics_state.camera_transform );     // On X step, rotate around Y axis, and vice versa.
        }     // Now apply translation movement of the camera, in the newest local coordinate frame
        this.graphics_state.camera_transform = mult( translation( scale_vec( meters_per_frame, this.thrust ) ), this.graphics_state.camera_transform );
      }
  }, Animation );



Declare_Any_Class( "Example_Animation",  // An example of a displayable object that our class Canvas_Manager can manage.  This one draws the scene's 3D shapes.
  { 'construct': function( context )
      { this.shared_scratchpad    = context.shared_scratchpad;
        shapes_in_use.cube        = new Cube();
        shapes_in_use.ring        = new Torus(25, 25, 0.8);
        shapes_in_use.asteroid    = new Sphere(7, 7, 3);
        shapes_in_use.collisionSphere = new Sphere(5, 5, colliderSphere);
        shapes_in_use.ringCollisionSphere = new Sphere(5, 5, ringColliderSphere);
        shapes_in_use.collisionDisk = new Regular_2D_Polygon(15, 15, 4.5);

        shapes_in_use.ringobj = new Shape_From_File( "images/ring.obj" );
        shapes_in_use.heartobj = new Shape_From_File( "images/Heart.obj" );
        shapes_in_use.asteroidobj = new Shape_From_File( "images/asteroid27.obj" );

        shapes_in_use.cylindrical_tube = new Cylindrical_Tube(5, 20);
        shapes_in_use.capped_cylinder = new Capped_Cylinder(5, 20);
        shapes_in_use.rounded_closed_cone = new Rounded_Closed_Cone(5, 30);
        shapes_in_use.sphere    = new Subdivision_Sphere( 4 );

        shapes_in_use.square = new Square() // smoke ver. 1 - og square
        shapes_in_use.triangle = new Triangle() // smoke ver.2 - better?
        shapes_in_use.smoke = new Sphere(8,5,1); // smoke ver. 3 - or this is better?

        //for some reason it won't animate by itself, even when it's set to true in tinywebgl
        this.shared_scratchpad.animate   = true;
      },
    'init_keys': function( controls )   // init_keys():  Define any extra keyboard shortcuts here
      {
        controls.add( "ALT+g", this, function() { this.shared_scratchpad.graphics_state.gouraud       ^= 1; } );   // Make the keyboard toggle some
        controls.add( "ALT+n", this, function() { this.shared_scratchpad.graphics_state.color_normals ^= 1; } );   // GPU flags on and off.
        controls.add( "ALT+a", this, function() { this.shared_scratchpad.animate                      ^= 1; } );
        controls.add( "r", this, function() {
          reset_values();
          this.shared_scratchpad.animate = true;
          this.shared_scratchpad.game_state.score_amount = 0;
          this.shared_scratchpad.game_state.lives_amount = 3;
          this.shared_scratchpad.game_state.display_text = "";
        })
      },
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
      {
        user_interface_string_manager.string_map["time"]    = "Animation Time: " + Math.round( this.shared_scratchpad.graphics_state.animation_time )/1000 + "s";
        user_interface_string_manager.string_map["animate"] = "Animation " + (this.shared_scratchpad.animate ? "on" : "off") ;
      },

    'spaceship': function(model_transform, graphics_state, prescale, texture)
      { // MATERIALS, VARIABLES
        var icyGray = new Material( Color(.6, .6, .7, 1), .5, .2, .1, 20, "images/metal-height-map.png"),
        blueGray = new Material( Color(.5, .6, .7, 1), .5, .2, .1, 20, "images/metal-height-map.png");
        collidedRed = new Material( Color(1, 0, 0, 1), .8, .5, .4, 20 );
        var bodyCenter;
        var wing;


        // BODY
        bodyCenter = model_transform;
        model_transform = mult( model_transform, scale(prescale * 2.4, prescale * 2.4, prescale * 14));
        if(colliderCount == 0)
          shapes_in_use.capped_cylinder.draw( graphics_state, model_transform, blueGray);
        else
          shapes_in_use.capped_cylinder.draw( graphics_state, model_transform, collidedRed);

        // TIP
        model_transform = bodyCenter;
        model_transform = mult(model_transform, rotation(180, 0, 1, 0));  // place on other side
        model_transform = mult( model_transform, translation( prescale * 0, prescale * 0, prescale * 9.9 ) );
        model_transform = mult( model_transform, scale(prescale * 3, prescale * 3, prescale * 3) );
        if (colliderCount == 0)
          shapes_in_use.rounded_closed_cone.draw(graphics_state, model_transform, icyGray);
        else
          shapes_in_use.rounded_closed_cone.draw(graphics_state, model_transform, collidedRed);

        // WINGS
        for (var i = 0; i < 2; i++){
         model_transform = bodyCenter;
         model_transform = mult(model_transform, translation(prescale * 5.3 * Math.pow(-1, i), prescale * 0, prescale * 1));
         // shear
         model_transform = mult( model_transform, mat4(1, 0, 0, 0,
                                                       0, 1, 0, 0,
                                                       1 * Math.pow(-1, i), 0, 1, 0,
                                                       0, 0, 0, 1) );
         model_transform = mult(model_transform, scale(prescale * 3, prescale * .5, prescale * 3));
         if(colliderCount == 0)
          shapes_in_use.cube.draw( graphics_state, model_transform, icyGray);
        else
          shapes_in_use.cube.draw(graphics_state, model_transform, collidedRed);

         // SIDE CYLINDERS
         model_transform = bodyCenter;
         model_transform = mult(model_transform, translation(prescale * 9 * Math.pow(-1, i), prescale * 0, prescale * 3.5));
         model_transform = mult( model_transform, scale(prescale * .8, prescale * .8, prescale * 9) );
         if (colliderCount == 0)
         shapes_in_use.capped_cylinder.draw( graphics_state, model_transform, blueGray);
        else
          shapes_in_use.capped_cylinder.draw(graphics_state, model_transform, collidedRed);

         // SIDE TOP SPHERES
         model_transform = bodyCenter;
         model_transform = mult(model_transform, translation(prescale * 9 * Math.pow(-1, i), prescale * 0, prescale * -1));
         model_transform = mult( model_transform, scale(prescale * .8, prescale * .8, prescale * 1) );
         if (colliderCount == 0)
          shapes_in_use.sphere.draw( graphics_state, model_transform, icyGray);
         else
          shapes_in_use.sphere.draw(graphics_state, model_transform, collidedRed);
         }

        // BUTT
        model_transform = bodyCenter;
        model_transform = mult(model_transform, rotation(180, 0, 1, 0));  // place on other side
        model_transform = mult( model_transform, translation(prescale * 0, prescale * 0, prescale * -7 ) );
        model_transform = mult( model_transform, scale(prescale * 3, prescale * 3, prescale * 3) );
        if (colliderCount == 0)
          shapes_in_use.rounded_closed_cone.draw(graphics_state, model_transform, icyGray);
        else
          shapes_in_use.rounded_closed_cone.draw(graphics_state, model_transform, collidedRed);

        // collision sphere
        model_transform = bodyCenter;
        rocketSphere = mult(model_transform, scale(.8, 0.2, 1));
        //shapes_in_use.collisionSphere.draw(graphics_state, rocketSphere, icyGray);
        // model_transform = translation(0, 0, -5);
         // shapes_in_use.ringCollisionSphere.draw(graphics_state, model_transform, icyGray);

      },
    'smoke' : function () {
        var graphics_state = this.shared_scratchpad.graphics_state;
        var time = graphics_state.animation_time/1000;
        var smokeTexture;
        // var smokeTexture = new Material ( Color(1, 1, 1, 1), .4, .8, .9, 50, "images/asteroid.jpg");

        var i = 0;
        while (i < smokeParticle.length) {
          model_transform = smokeParticle[i].startTransform;

          var smokeScale = 0.1 * (1 - ((time - smokeParticle[i].birthTime)/2));
          if (smokeScale <= 0) {
            smokeScale = 0;
          }

          model_transform = mult(model_transform, scale(smokeScale * 3, smokeScale * 3, smokeScale * 3));
          if (smokeParticle[i].color == "grey") {
            smokeTexture = new Material(Color(0, 0, 0, 0), 0.2, .1, .2, 50 , "images/smoke.gif");
          } else if (smokeParticle[i].color == "red") {
            smokeTexture = new Material(Color(1, 0, 0, 1), 0.7, .1, .2, 50);
          } else if (smokeParticle[i].color == "green") {
            smokeTexture = new Material(Color(0, 1, 0, 1), 0.7, .1, .2, 50);
          }
          // shapes_in_use.triangle.draw(graphics_state, model_transform, smokeTexture); // ver.1
          shapes_in_use.square.draw(graphics_state, model_transform, smokeTexture); // ver.2
          // shapes_in_use.smoke.draw(graphics_state, model_transform, smokeTexture); // ver.3

          smokeParticle[i].startTransform = mult(smokeParticle[i].startTransform, translation(smokeParticle[i].delta[0],smokeParticle[i].delta[1],smokeParticle[i].delta[2]));

          if (smokeScale <= 0) {  // prune particles that are no longer alive
            smokeParticle.splice(i,1);
          } else {
            i++;
          }
        }

      },
      'spawn_objects': function(){

        var graphics_state  = this.shared_scratchpad.graphics_state;

        function getRandomNumber(min, max) {
          return Math.random() * (max - min) + min;
        }

        function add_object(shape, material, position, speed, transform = mat4(), osc = 0) {
          add_object_helper(shape, material, graphics_state.animation_time, position, speed, transform, osc);
        }

        var ringTexture = new Material(Color(1, 1, 0, 1), .4, .8, .9, 50),
        transparent = new Material(Color(0, 0, 0, 0), 0, 0, 0, 0)
        asteroidTexture = new Material(Color(1, 1, 1, 1), .4, .8, .9, 50, "images/asteroid.jpg"),
        ring_material = new Material(Color(0,0,0,1), 1, 1, 1, 40, "images/gold.jpg")
        heart_material = new Material(Color(0,0,0,1), 1, 1, 1, 40, "images/red.jpg");
        asteroid_material = new Material(Color(0,0,0,1), 1, 1, 1, 40, "images/asteroid.jpg");

        // var randx = getRandomNumber(-50, 50);
        // var randy = getRandomNumber(-20, 20);
        var randx = getRandomNumber(spaceship_transform[0][3]-50, spaceship_transform[0][3]+50);
        var randy = getRandomNumber(spaceship_transform[1][3]-20, spaceship_transform[1][3]+20);

        if (counter % ringRate == 0) {
          var osc = Math.floor(getRandomNumber(0, 6));

          var ring_transform = mult( mat4(), rotation( 90, 0, 1, 0 ) );
          ring_transform = mult(ring_transform, scale(5.5, 5.5, 5.5));

          add_object(shapes_in_use.ringobj, ring_material, vec3(randx, randy, -100), ringSpeed, ring_transform, osc);
          add_object(shapes_in_use.collisionDisk, transparent, vec3(randx, randy, -100), ringSpeed, mat4(), osc);
        } else if (counter % asteroidRate == 0) {
          randx = getRandomNumber(spaceship_transform[0][3]-50, spaceship_transform[0][3]+50);
          randy = getRandomNumber(spaceship_transform[1][3]-20, spaceship_transform[1][3]+20);
          var asteroidSize = getRandomNumber(3, 10);
          var asteroid_transform = mult(mat4(), scale(asteroidSize, asteroidSize, asteroidSize));
           add_object(shapes_in_use.asteroidobj, asteroid_material, vec3(randx, randy, -100), asteroidSpeed, asteroid_transform);
          //add_object(shapes_in_use.asteroid, asteroidTexture, vec3(randx, randy, -100), asteroidSpeed);
        }

        heartCounter++;
        console.log(heartCounter);
        if (heartCounter == heartRate) {
          console.log("should spawn a life?");
          var shouldSpawn = getRandomNumber(0, 100);
          if(shouldSpawn <= 35){
            console.log("spawned a life");
            randx = getRandomNumber(spaceship_transform[0][3]-50, spaceship_transform[0][3]+50);
            getRandomNumber(spaceship_transform[1][3]-20, spaceship_transform[1][3]+20);
            var heart_transform = mult( model_transform, rotation( 90, 0, 1, 0 ) );
            heart_transform = mult(heart_transform, scale(2, 2, 2));
            add_object(shapes_in_use.heartobj, heart_material, vec3(randx, randy, -100), ringSpeed, heart_transform);
          }
          heartCounter = 0;
        }

        if (asteroidRate > 20 && counter == 1000) {
          // console.log("leveling up");
          asteroidRate -= 11;
          asteroidSpeed -= 5;
          ringSpeed -= 3;
          ringRate -= 4;
          counter = 0;
        }
      },
      'collider_activity': function(gameObject){

        var shape = gameObject[0];

        function collisionPhysics(object, shared_scratchpad) {
          var obj_pos = object[3];
          var obj_x = obj_pos[0];
          var obj_y = obj_pos[1];
          var obj_speed = object[4];

          var ship_x = playerlocationx/100;
          var ship_y = playerlocationy/100;

          console.log(obj_speed);
          console.log(ship_x);
          console.log(ship_y);
          console.log("-----");
          console.log(obj_x);
          console.log(obj_y);
          console.log("-----");

          // left: -1, right: 1, down: -1, up: 1
          //check if ship on left or right
          var left_right = ship_x < obj_x ? -1 : 1;
          //check if ship on up or down
          var up_down = ship_y < obj_y ? -1 : 1;

          console.log("-----");
          console.log(left_right);
          console.log("-----");
          console.log(up_down);

          var x_displacement = Math.abs(ship_x - obj_x);
          var y_displacement = Math.abs(ship_y - obj_y);

          console.log("-----");
          console.log(x_displacement);
          console.log(y_displacement);
          console.log("-----");

          playerlocationx += (left_right * x_displacement * obj_speed / 120) * 100;
          playerlocationy += (up_down * y_displacement * obj_speed / 120) * 100;

          xforce *= -1 * .5;
          yforce *= -1 * .5;
          pixelx *= -1 * .5;
          pixely *= -1 * .5;

          left_right_rotation += -1* (left_right * x_displacement * 15);
          up_down_rotation += -1 * (up_down * y_displacement * 12);

          shared_scratchpad.game_state.count_down_timer("collision_recover", 0, "", 650);
        }

        var t = this.shared_scratchpad.graphics_state.animation_time/1000;

        if (shape.class_name === "Regular_2D_Polygon") {
          if (pointBuffer == 0) {
            this.shared_scratchpad.game_state.count_down_timer("display_text", 1.5, "<p class='point-msg'>+1000</p>");
            this.shared_scratchpad.game_state.score_amount += 1000;
            initSmokeParticles(20,t,spaceship_transform,"green");
            var audio = new Audio('sound/Sonic_Ring.mp3');
            audio.play();
            pointBuffer++;
          }
          return false;
        }
        if (shape.class_name === "Shape_From_File") {
          var image = shape.filename.toString();
          if (image == "images/asteroid27.obj") {
            colliderCount++;
            this.shared_scratchpad.game_state.count_down_timer("display_text", 1.5, "<p>You hit an asteroid!</p><p class='lose-life-msg'>Lives -1</p>");
            this.shared_scratchpad.game_state.lives_amount -= 1;
            initSmokeParticles(20,t,spaceship_transform,"red");
            collisionPhysics(gameObject, this.shared_scratchpad);
            var audio = new Audio('sound/Junk_Crash.mp3');
            audio.play();
          }
          else if (image == "images/Heart.obj") {
            if (this.shared_scratchpad.game_state.lives_amount < 3) {
              this.shared_scratchpad.game_state.count_down_timer("display_text", 1.5, "<p>You got a heart!<p><p class='gain-life-msg'>Lives +1</p>");
              this.shared_scratchpad.game_state.lives_amount += 1;
              var heartAudio = new Audio('sound/Mario_Extra_Life.mp3');
              heartAudio.play();
            } else if (this.shared_scratchpad.game_state.lives_amount >= 3) {
              this.shared_scratchpad.game_state.count_down_timer("display_text", 1.5, "<p>Max lives reached</p>");
            }
            return true;
          }
        }
        if (this.shared_scratchpad.game_state.lives_amount == 0) {
          this.shared_scratchpad.game_state.flag_timers.display_text = Number.MAX_SAFE_INTEGER;
          isDead = true;
        }
        return false;
      },
      'collision_detection': function(gameObject) {
        var shape = gameObject[0];

        if (shape.class_name === "Shape_From_File" && shape.filename.toString() == "images/ring.obj")
          return;

        if (colliderCount == 0 || shape.class_name === "Regular_2D_Polygon") {
          //collision detection
          var collider = mult(inverse(rocketSphere), model_transform);
          for (var i = 0; i < shape.positions.length; i++) {
            var point = shape.positions[i];
            var c = mult_vec(collider, vec4(point[0], point[1], point[2], 1));
            var dist = length(vec3(c[0], c[1], c[2]));

            var checker;
            if (shape.class_name === Regular_2D_Polygon)
              checker = ringColliderSphere;
            else
              checker = colliderSphere;

            if (dist < checker) {
              return this.collider_activity(gameObject);
            }
          }
        }
        return false;
      },
      'get_oscillations': function(oscType, offset) {
        var oscx = 0;
        var oscy = 0;
        if(oscType == 1) {  // horiztonal
          oscx = Math.sin((this.shared_scratchpad.graphics_state.animation_time - offset)/(speed*20)) * 12;
        }
        else if (oscType == 2) { // vertical
          oscy = Math.cos((this.shared_scratchpad.graphics_state.animation_time - offset)/(speed*20)) * 12;
        }
        else if (oscType == 3) { // spiral
          oscx = Math.sin((this.shared_scratchpad.graphics_state.animation_time - offset)/(speed*20)) * 12;
          oscy = Math.cos((this.shared_scratchpad.graphics_state.animation_time - offset)/(speed*20)) * 12;
        }
        else if (oscType == 4) { // diag right left
          oscx = Math.sin((this.shared_scratchpad.graphics_state.animation_time - offset)/(speed*20)) * 12;
          oscy = Math.sin((this.shared_scratchpad.graphics_state.animation_time - offset)/(speed*20)) * 12;
        }
        else if (oscType == 5) { // diag left right
          oscx = -Math.sin((this.shared_scratchpad.graphics_state.animation_time - offset)/(speed*20)) * 12;
          oscy = Math.sin((this.shared_scratchpad.graphics_state.animation_time - offset)/(speed*20)) * 12;
        }
        return [oscx, oscy];
      },
      'draw_shapes': function() {
        var shape, material, offset, pos, zpos;
        var iterator = head;
        var graphics_state  = this.shared_scratchpad.graphics_state;
        while (iterator != null) {
          gameObject = iterator.data;
          pos = gameObject[3];
          offset = gameObject[2];
          speed = gameObject[4];

          zpos = pos[2] + (graphics_state.animation_time - offset) / speed;

          shape = gameObject[0];
          material = gameObject[1];
          model_transform = mat4();
          model_transform = mult(translation(pos[0], pos[1], zpos), model_transform);
          if (!(shape.class_name === "Regular_2D_Polygon"))
            shape.draw(graphics_state, model_transform, material);
          iterator = iterator.next;
        }
      },
      'create_game_objects': function () {
      // ************ GAME OBJECTS ********** //

      function getRandomNumber(min, max) {
        return Math.random() * (max - min) + min;
      }


        gl.enable(gl.BLEND);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);



      var graphics_state  = this.shared_scratchpad.graphics_state;

      this.spawn_objects();


      var shape, material, offset, pos, zpos, oscx, oscy, oscType;
      var oscArray = [];
      //oscType 0: still, 1: hor, 2: vert, 3: spiral, 4: diag rightleft 5: diag left right
      //gameobject:(shape, material, animationtime, startpos, speed, transform, oscType)
      var iterator = head;
      while (iterator != null) {
        gameObject = iterator.data;
        pos = gameObject[3];
        offset = gameObject[2];
        speed = gameObject[4];
        zpos = pos[2] + (graphics_state.animation_time - offset) / speed;

        if (zpos > 32 && iterator == head) {
          head = head.next;
          iterator = iterator.next;
          continue;
        }

        shape = gameObject[0];
        material = gameObject[1];
        model_transform = gameObject[5];
        oscType = gameObject[6];

        oscArray = this.get_oscillations(oscType, offset);
        oscx = oscArray[0];
        oscy = oscArray[1];

        model_transform = mult(translation(pos[0] + oscx, pos[1] + oscy, zpos), model_transform);

        if (this.collision_detection(gameObject)){
          // remove life object
          iterator.data = iterator.next.data;
          iterator.next = iterator.next.next;
          continue;
        }

        if (isDead) {
          this.shared_scratchpad.game_state.display_text = "GAME OVER</br>Press R to restart";
          this.shared_scratchpad.animate = false;
        }


        if (!(shape.class_name === "Regular_2D_Polygon")){
            if (shape.filename.toString() == "images/asteroid27.obj"){
              var rot = (graphics_state.animation_time - offset) / 30;
          model_transform = mult(model_transform, rotation(rot , 1, 1, 0));
        }
          shape.draw(graphics_state, model_transform, material);

        }
        iterator = iterator.next;
      }

      if (colliderCount != 0) {
          colliderCount++;
          if (colliderCount == 150)
            colliderCount = 0;
      }

      if (pointBuffer != 0) {
        pointBuffer++;
        if (pointBuffer == 50)
          pointBuffer = 0;
      }
    },
    'spaceship_controls': function() {

        function clamp(num, min, max) {
          return num <= min ? min : num >= max ? max : num;
        }

        function descent(num) {
          var zero_diff = Math.min(0.5, Math.abs(num));
          return num < 0 ? num + zero_diff : num > 0 ? num - zero_diff : num;
        }

        if (this.shared_scratchpad.game_state.flags.collision_recover) {

          if (key_left){
            left_right_rotation += 1.3;
            pixelx = (pixelx > 0) ? 0 : pixelx;
            xforce = (xforce > 0) ? 0 : xforce;
            xforce--;
          }
          if (key_right){
            left_right_rotation -= 1.3;
            pixelx = (pixelx < 0) ? 0 : pixelx;
            xforce = (xforce < 0) ? 0 : xforce;
            xforce++;
          }
          if (key_down){
            up_down_rotation -= 0.8;
            pixely = (pixely > 0) ? 0 : pixely;
            yforce = (yforce > 0) ? 0 : yforce;
            yforce--;
          }
          if (key_up){
            up_down_rotation += 0.8;
            pixely = (pixely < 0) ? 0 : pixely;
            yforce = (yforce < 0) ? 0 : yforce;
            yforce++;
          }

          // abrupt stop
          if (!key_left && !key_right){
            pixelx = 0;
            xforce = 0;
          }

          if (!key_down && !key_up){
            pixely = 0;
            yforce = 0;
          }

          // reset ship rotation if no keys are pressed
          if (!(key_left && key_right)) {
            left_right_rotation = descent(left_right_rotation);
          }
          if (!(key_down && key_up)) {
            up_down_rotation = descent(up_down_rotation);
          }

        }
        // handle acceleration
        xforce = clamp(xforce, -1*maxspeed, maxspeed);
        yforce = clamp(yforce, -1*maxspeed, maxspeed);

        // bounded movement range
        playerlocationx = clamp(playerlocationx + pixelx, -20000, 20000);
        playerlocationy = clamp(playerlocationy + pixely, -20000, 20000);
        // playerlocationx = playerlocationx + pixelx;
        // playerlocationy = playerlocationy + pixely;

        // bounded rotation range
        left_right_rotation = clamp(left_right_rotation, -25, 25);
        up_down_rotation = clamp(up_down_rotation, -10, 10);

        pixelx += xforce;
        pixely += yforce;


    },
    'display': function(time)
      {
        if (gameInPlay == true){
          //this.shared_scratchpad.graphics_state.camera_transform = mult( rotation( 8, -1, 0, 0 ), this.shared_scratchpad.graphics_state.camera_transform );
          var graphics_state  = this.shared_scratchpad.graphics_state,
              model_transform = mat4();             // We have to reset model_transform every frame, so that as each begins, our basis starts as the identity.

          // shaders_in_use[ "Default" ].activate();
          shaders_in_use[ "Bump_Mapping" ].activate();
          // shaders_in_use[ "Plasma_Shader" ].activate();

          gl.enable(gl.BLEND);
          // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

          counter++;

          // *** Lights: *** Values of vector or point lights over time.  Arguments to construct a Light(): position or vector (homogeneous coordinates), color, size
          // If you want more than two lights, you're going to need to increase a number in the vertex shader file (index.html).  For some reason this won't work in Firefox.
          graphics_state.lights = [];                    // First clear the light list each frame so we can replace & update lights.

          var t = graphics_state.animation_time/1000, light_orbit = [ Math.cos(t), Math.sin(t) ];
          graphics_state.lights.push( new Light( vec4( 5, 5, 40, 1 ), Color( 1, 1, 1, 1 ), 20 ) );
          // graphics_state.lights.push( new Light( vec4( -10*light_orbit[0], -20*light_orbit[1], -14*light_orbit[0], 0 ), Color( 1, 1, .3, 1 ), 100*Math.cos( t/10 ) ) );

          // *** Materials: *** Declare new ones as temps when needed; they're just cheap wrappers for some numbers.
          // 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
          // Omit the final (string) parameter if you want no texture
                                                        //ambient, diffuse, specular, specular exponent

          // FIRST: Make the background (giant cube texture mapped with sky)
          var backgroundSky = new Material(Color(0,0,0,1), 1, 1, 1, 40, "images/starry-sky.jpg");
          var sky_transform = mult(mat4(), scale(500, 500, 500));
          shapes_in_use.cube.draw(graphics_state, sky_transform, backgroundSky);

          // ************ MAKE A SPACESHIP ********** //
          spaceship_transform = mat4();
          spaceship_transform = mult(spaceship_transform, translation(playerlocationx/100, playerlocationy/100, 0, 0 ));
          var camera_transform = spaceship_transform;
          camera_transform = mult(camera_transform, translation(1, 5, 30));
          this.shared_scratchpad.graphics_state.camera_transform = inverse(camera_transform);
          // smoke_transform = mult(smoke_transform, translation, smoke_transform);

          var prescale = .35;  // control spaceship size
          var rotated_spaceship_transform = mult(spaceship_transform, rotation(left_right_rotation, [0, 0, 1]));
          var rotated_spaceship_transform = mult(rotated_spaceship_transform, rotation(up_down_rotation, [1, 0, 0]));
          this.spaceship(rotated_spaceship_transform, graphics_state, prescale);  // specify position, etc with model_transform


          if (!isDead) {
            this.spaceship_controls();
            initSmokeParticles(2, t, spaceship_transform, "grey");
            this.create_game_objects();
            this.shared_scratchpad.game_state.score_amount++;
          }else {
            this.draw_shapes();
          }
            this.smoke();
        }
    }
  }, Animation );

  /* ==============================

  Begin writing our own classes here:

  =============================== */

  Declare_Any_Class("Score_Screen",
    {
      'construct': function (context) {
        this.define_data_members({
          shared_scratchpad: context.shared_scratchpad,
          score: document.getElementById("score-text"),
          lives: document.getElementById("lives-text"),
          display_text: document.getElementById("main-display-text")
        });
        this.shared_scratchpad.game_state = {score_amount: 0, lives_amount: 3, display_text: ""};
        this.shared_scratchpad.game_state.flags = {"asteroid": true, "ring": true, "display_text": true, "collision_recover": true};
        this.shared_scratchpad.game_state.flag_timers = {"asteroid": Number.MAX_SAFE_INTEGER, "ring": Number.MAX_SAFE_INTEGER, "display_text": Number.MAX_SAFE_INTEGER, "collision_recover": Number.MAX_SAFE_INTEGER};
        this.shared_scratchpad.game_state.count_down_timer = function(object, count_down_time, text_string = "", count_down_time_ms = 0) {
          var currTime = new Date();
          context.shared_scratchpad.game_state.flags[object] ^= 1;
          currTime.setSeconds(currTime.getSeconds() + count_down_time, count_down_time_ms);
          context.shared_scratchpad.game_state.flag_timers[object] = currTime;
          if (text_string != ""){
            context.shared_scratchpad.game_state.display_text = text_string;
          }
        }
      },
      'update_timers': function() {
        for (var flag in this.shared_scratchpad.game_state.flag_timers) {
          var currTime = new Date();
          if (this.shared_scratchpad.game_state.flag_timers[flag] < currTime) {
            this.shared_scratchpad.game_state.flags[flag] ^= 1;
            this.shared_scratchpad.game_state.flag_timers[flag] = Number.MAX_SAFE_INTEGER;
            if (flag == "display_text") {
              this.shared_scratchpad.game_state.display_text = "";
            }
          }
        }
      },
      'display': function (time) {
        if (gameInPlay == true) {
          this.score.innerHTML = "Score: " + this.shared_scratchpad.game_state.score_amount;
          this.lives.innerHTML = "Health: " + "<div class='health-container'>" + "<div class='health-bar'></div>".repeat(this.shared_scratchpad.game_state.lives_amount) + "</div>";
          this.display_text.innerHTML = this.shared_scratchpad.game_state.display_text;
          this.update_timers();
        }
        else {

        }

      }
    }, Animation);

Shape.prototype.normalize_positions = function()
  { var average_position = vec3(), average_length = 0;
    for( var i = 0; i < this.positions.length; i++ ) average_position  =  add( average_position, scale_vec( 1/this.positions.length, this.positions[i] ) );
    for( var i = 0; i < this.positions.length; i++ ) this.positions[i] =  subtract( this.positions[i], average_position );
    for( var i = 0; i < this.positions.length; i++ ) average_length    += 1/this.positions.length * length( this.positions[i] );
    for( var i = 0; i < this.positions.length; i++ ) this.positions[i] =  scale_vec( 1/average_length, this.positions[i] );
  }
