// UCLA's Graphics Example Code (Javascript and C++ translations available), by Garett Ridge for CS174a.
// example-displayables.js - The subclass definitions here each describe different independent animation processes that you want to fire off each frame, by defining a display
// event and how to react to key and mouse input events.  Make one or two of your own subclasses, and fill them in with all your shape drawing calls and any extra key / mouse controls.

// Now go down to Example_Animation's display() function to see where the sample shapes you see drawn are coded, and a good place to begin filling in your own code.

var spaceship_transform = mat4();
var smoke_transform = mat4();
var posOffset = [];
var gameObjects = [];
var counter = 1;
var nodecount = 0;
var head, tail;

var smokeParticle = [];
var smokeOriginTransform = mat4();
var lastTime = 0;

function initSmokeParticles() {
  smokeParticle = [];
  var numParticles = 500;
  for (var i = 0; i < numParticles; i++) {
    var sx = Math.cos(Math.random() * 2 * Math.PI);
    var sy = Math.cos(Math.random() * 2 * Math.PI);
    var sz = Math.cos(Math.random() * 2 * Math.PI);
    var dx = Math.cos(Math.random() * 2 * Math.PI)/10;
    var dy = Math.cos(Math.random() * 2 * Math.PI)/10;
    var dz = Math.cos(Math.random() * 2 * Math.PI)/10;
    // var t = (Math.random() * 4) + 3;
    smokeParticle.push({
      startPosition: [sx, sy, sz],
      delta: [dx, dy, dz],
      lifeTime: 4.0
    });
  }
}

initSmokeParticles();

function calculateSmokeOrigin() {
  smokeOriginTransform = spaceship_transform;
}

setInterval(calculateSmokeOrigin,2000);

function Node(data) {
    this.data = data;
    this.next = null;
}

function add_object_helper(shape, material, time, position){
    tail.next = new Node([shape, material, time, position]);
    tail = tail.next;
    nodecount++;
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

        //gameobject:(shape, material, animationtime, startpos)
        head = new Node([shapes_in_use.cube, new Material( Color( 1,1,0,1 ), .4, .8, .9, 50 ), this.graphics_state.animation_time,
          vec3( -1, 1, -50)]);
        nodecount++;

        tail = new Node([shapes_in_use.cube, new Material( Color( 1,0,1,1 ), .4, .8, .9, 50 ), this.graphics_state.animation_time,
          vec3( 0, 1, -50)]);

        head.next = tail;

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

    //    control system to move the camera angle.  If the camera is attached to a planet, only the heading can be change left/right
        // controls.add( "left",  this, function() {
        //   spaceship_transform = mult( translation( -.5, 0, 0, 0 ), spaceship_transform );
        //
        //   if (leftRot <= maxRotations) {
        //     leftRot++;
        //     rightRot--;
        //     var zRotationMatrix = mat4();
        //     zRotationMatrix = mult(zRotationMatrix, rotation(-3, [0, 0, 1]));
        //     spaceship_transform = mult(spaceship_transform, zRotationMatrix);
        //   }
        //
        // });
        // controls.add( "right",  this, function() {
        //   spaceship_transform = mult( translation( .5, 0, 0, 0 ), spaceship_transform );
        //
        //   if (rightRot <= maxRotations) {
        //     rightRot++;
        //     leftRot--;
        //     var zRotationMatrix = mat4();
        //     zRotationMatrix = mult(zRotationMatrix, rotation(3, [0, 0, 1]));
        //     spaceship_transform = mult(spaceship_transform, zRotationMatrix);
        //   }
        // });

        //  TODO: limit camera up/down changes
        // controls.add( "up",  this, function() {
        //   this.graphics_state.camera_transform = mult( rotation( 2, -1, 0, 0 ), this.graphics_state.camera_transform );
        // });
        // controls.add( "down",  this, function() {
        //   this.graphics_state.camera_transform = mult( rotation( 2, 1, 0, 0 ), this.graphics_state.camera_transform );
        // });

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


        shapes_in_use.cylindrical_tube = new Cylindrical_Tube(5, 20);
        shapes_in_use.capped_cylinder = new Capped_Cylinder(5, 20);
        shapes_in_use.rounded_closed_cone = new Rounded_Closed_Cone(5, 30);
        shapes_in_use.sphere    = new Subdivision_Sphere( 4 );

        shapes_in_use.square = new Square() // smoke

        //for some reason it won't animate by itself, even when it's set to true in tinywebgl
        this.shared_scratchpad.animate   = true;
      },
    'init_keys': function( controls )   // init_keys():  Define any extra keyboard shortcuts here
      {
        controls.add( "ALT+g", this, function() { this.shared_scratchpad.graphics_state.gouraud       ^= 1; } );   // Make the keyboard toggle some
        controls.add( "ALT+n", this, function() { this.shared_scratchpad.graphics_state.color_normals ^= 1; } );   // GPU flags on and off.
        controls.add( "ALT+a", this, function() { this.shared_scratchpad.animate                      ^= 1; } );
        controls.add( "r", this, function() { rotationOffset =  this.shared_scratchpad.graphics_state.animation_time - rotationOffset;
                                                rotate = !rotate; })
      },
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
      {
        user_interface_string_manager.string_map["time"]    = "Animation Time: " + Math.round( this.shared_scratchpad.graphics_state.animation_time )/1000 + "s";
        user_interface_string_manager.string_map["animate"] = "Animation " + (this.shared_scratchpad.animate ? "on" : "off") ;
      },
    'spaceship': function(model_transform, graphics_state, prescale)  // Build the spaceship
      { // MATERIALS, VARIABLES
        var icyGray = new Material( Color(.6, .6, .7, 1), .5, .2, .1, 20, "images/metal-height-map.png"),
        blueGray = new Material( Color(.5, .6, .7, 1), .5, .2, .1, 20, "images/metal-height-map.png");
        var bodyCenter;
        var wing;

        // BODY
        bodyCenter = model_transform;
        model_transform = mult( model_transform, scale(prescale * 2.4, prescale * 2.4, prescale * 14));
        shapes_in_use.capped_cylinder.draw( graphics_state, model_transform, blueGray);

        // TIP
        model_transform = bodyCenter;
        model_transform = mult(model_transform, rotation(180, 0, 1, 0));  // place on other side
        model_transform = mult( model_transform, translation( prescale * 0, prescale * 0, prescale * 9.9 ) );
        model_transform = mult( model_transform, scale(prescale * 3, prescale * 3, prescale * 3) );
        shapes_in_use.rounded_closed_cone.draw(graphics_state, model_transform, icyGray);

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
         shapes_in_use.cube.draw( graphics_state, model_transform, icyGray);

         // SIDE CYLINDERS
         model_transform = bodyCenter;
         model_transform = mult(model_transform, translation(prescale * 9 * Math.pow(-1, i), prescale * 0, prescale * 3.5));
         model_transform = mult( model_transform, scale(prescale * .8, prescale * .8, prescale * 9) );
         shapes_in_use.capped_cylinder.draw( graphics_state, model_transform, blueGray);

         // SIDE TOP SPHERES
         model_transform = bodyCenter;
         model_transform = mult(model_transform, translation(prescale * 9 * Math.pow(-1, i), prescale * 0, prescale * -1));
         model_transform = mult( model_transform, scale(prescale * .8, prescale * .8, prescale * 1) );
         shapes_in_use.sphere.draw( graphics_state, model_transform, icyGray);
         }

        // BUTT
        model_transform = bodyCenter;
        model_transform = mult(model_transform, rotation(180, 0, 1, 0));  // place on other side
        model_transform = mult( model_transform, translation(prescale * 0, prescale * 0, prescale * -7 ) );
        model_transform = mult( model_transform, scale(prescale * 3, prescale * 3, prescale * 3) );
        shapes_in_use.rounded_closed_cone.draw(graphics_state, model_transform, icyGray);
      },
    'smoke' : function (model_transform, graphics_state, scaleFactor, textureFilePath) {
        var smokeTexture = new Material(Color(0, 0, 0, 1), .8, .5, .4, 20 , textureFilePath);
        var default_transform = model_transform;
        var t = graphics_state.animation_time / 1000;

        var i = 0;
        while (i < smokeParticle.length) {
          // if (scaleFactor <= 0)
          //   smokeParticle[i].lifeTime = 0;

          model_transform = mult(default_transform, translation(smokeParticle[i].startPosition[0], smokeParticle[i].startPosition[1], 5.5));
          model_transform = mult(model_transform, scale(scaleFactor * 3, scaleFactor * 3, scaleFactor * 3) );
          shapes_in_use.square.draw(graphics_state, model_transform, smokeTexture);

          smokeParticle[i].startPosition[0] = smokeParticle[i].startPosition[0] + smokeParticle[i].delta[0];  
          smokeParticle[i].startPosition[1] = smokeParticle[i].startPosition[1] + smokeParticle[i].delta[1];  
          smokeParticle[i].startPosition[2] = smokeParticle[i].startPosition[2] + smokeParticle[i].delta[2];

          // if (smokeParticle[i].lifeTime == 0) {
          //   smokeParticle.splice(i, 1);
          // } else {
          //   i++;
          // }
          i++;
          
        }
        // for (var i = 0; i < smokeParticle.length; i++) {
        //   // console.log("Particle " + i);
        //   // console.log(smokeParticle[i].startPosition[0]);
        //   // console.log(smokeParticle[i].startPosition[1]);
        //   // console.log(smokeParticle[i].startPosition[2]);
        //   // console.log(smokeParticle[i].lifeTime);
          
        //   // console.log(smokeParticle[i].delta[0]);
        //   // console.log(smokeParticle[i].delta[1]);
        //   // console.log(smokeParticle[i].delta[2]);
        //   // var lt = smokeParticle[i].lifeTime;
        //   // var scaleFactor = 0.4 * (lt/4.0);
        //   // if (scaleFactor <= 0) 
        //   //   scaleFactor = 0;

        //   if (scaleFactor <= 0)
        //     smokeParticle[i].lifeTime = 0;

        //   model_transform = mult(default_transform, translation(smokeParticle[i].startPosition[0], smokeParticle[i].startPosition[1], 5.5));
        //   model_transform = mult(model_transform, scale(scaleFactor * 3, scaleFactor * 3, scaleFactor * 3) );
        //   shapes_in_use.square.draw(graphics_state, model_transform, smokeTexture);

        //   smokeParticle[i].startPosition[0] = smokeParticle[i].startPosition[0] + smokeParticle[i].delta[0];  
        //   smokeParticle[i].startPosition[1] = smokeParticle[i].startPosition[1] + smokeParticle[i].delta[1];  
        //   smokeParticle[i].startPosition[2] = smokeParticle[i].startPosition[2] + smokeParticle[i].delta[2];
        //   // smokeParticle[i].lifeTime = smokeParticle[i].lifeTime - t; 
          
        //   // console.log("-----")
        // }



      },
    'display': function(time)
      {
        //this.shared_scratchpad.graphics_state.camera_transform = mult( rotation( 8, -1, 0, 0 ), this.shared_scratchpad.graphics_state.camera_transform );
        var graphics_state  = this.shared_scratchpad.graphics_state,
            model_transform = mat4();             // We have to reset model_transform every frame, so that as each begins, our basis starts as the identity.
        shaders_in_use[ "Default" ].activate();

        counter++;

        function add_object(shape, material, position) {
          add_object_helper(shape, material, graphics_state.animation_time, position);
        }

        // *** Lights: *** Values of vector or point lights over time.  Arguments to construct a Light(): position or vector (homogeneous coordinates), color, size
        // If you want more than two lights, you're going to need to increase a number in the vertex shader file (index.html).  For some reason this won't work in Firefox.
        graphics_state.lights = [];                    // First clear the light list each frame so we can replace & update lights.

        var t = graphics_state.animation_time/1000, light_orbit = [ Math.cos(t), Math.sin(t) ];
        graphics_state.lights.push( new Light( vec4( 0, 2 , 3, 1 ), Color( 1, 1, 1, 1 ), 20 ) );
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
        // CONTROL MOVEMENT
        spaceship_transform = mat4();
        if (key_left){
          xforce--;
        }
        if (key_right){
          xforce++;
        }
        if (key_down){
          yforce--;
        }
        if (key_up){
          yforce++;
        }
        // handle acceleration
        if (xforce > maxspeed)
            xforce = maxspeed;
        if (xforce < -maxspeed)
            xforce = -maxspeed;
        if (yforce > maxspeed)
            yforce = maxspeed;
        if (yforce < -maxspeed)
            yforce = -maxspeed;

        // abrupt stop
        if (!key_left && !key_right){
           pixelx = 0;
           xforce = 0;
        }
        else{
           pixelx += xforce;
        }

        if (!key_down && !key_up){
           pixely = 0;
           yforce = 0;
        }
        else{
          pixely += yforce;
        }

        // bounded movement range
        playerlocationx = playerlocationx + pixelx;
        if (playerlocationx >= 2500)
          playerlocationx = 2500;
        if (playerlocationx <= -2500)
          playerlocationx = -2500;

        playerlocationy = playerlocationy + pixely;
        if (playerlocationy >= 1700)
          playerlocationy = 1700;
        if (playerlocationy <= 0)
          playerlocationy = 0;

        spaceship_transform = mult(spaceship_transform, translation(playerlocationx/100, playerlocationy/100, 0, 0 ), spaceship_transform);
        // smoke_transform = mult(smoke_transform, translation, smoke_transform);

        var prescale = .5;  // control spaceship size
        this.spaceship(spaceship_transform, graphics_state, prescale);  // specify position, etc with model_transform

        
        var smoke_scale = 0.1 * (1 - ((t - lastTime)/2));
        if (smoke_scale <= 0) {
          initSmokeParticles();
          lastTime = t;        
          calculateSmokeOrigin();  
        }


        // if (smokeOriginTransform != spaceship_transform)        

        this.smoke(smokeOriginTransform, graphics_state, smoke_scale, "images/smoke.gif");

        
        // ************ GAME OBJECTS ********** //

        var cube1 = new Material( Color( 1,1,0,1 ), .4, .8, .9, 50 ),
            cube2 = new Material( Color( 1,0,1,1 ), .4, .8, .9, 50 ),
            asteroidTexture = new Material ( Color(1, 1, 1, 1), .4, .8, .9, 50, "images/asteroid.jpg");


        var randx = getRandomNumber(-50, 50);
        var randy = getRandomNumber(-20, 20)

        if (counter % 50 == 0){
          counter = 0;
          add_object(shapes_in_use.asteroid, asteroidTexture, vec3(randx, randy, -100));
          randx = getRandomNumber(-50, 50);
          randy = getRandomNumber(-20, 20)
          add_object(shapes_in_use.ring, cube1, vec3(randx, randy, -100));
        }

        var shape, material, offset, pos, zpos;
        //gameobject:(shape, material, animationtime, startpos)
        var iterator = head;
        while(iterator != null){
          gameObject = iterator.data;
          pos = gameObject[3];
          offset = gameObject[2];

          zpos = pos[2] + (graphics_state.animation_time - offset)/60.0;

          if (zpos > 0 && iterator == head){
            nodecount--;
            head = head.next;
            iterator = iterator.next;
            continue;
          }

          shape = gameObject[0];
          material = gameObject[1];

          model_transform = mat4();
          model_transform = mult(translation(pos[0], pos[1], zpos) , model_transform );

          shape.draw( graphics_state, model_transform, material);
          iterator = iterator.next;
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
          lives: document.getElementById("lives-text")
        });
        this.shared_scratchpad.game_state = {score_amount: 0, lives_amount: 3};
      },
      'display': function (time) {
        this.score.innerHTML = "Score: " + this.shared_scratchpad.game_state.score_amount++;
        this.lives.innerHTML = "Lives: " + this.shared_scratchpad.game_state.lives_amount;
      }
    }, Animation);

    function getRandomNumber(min, max) {
      return Math.random() * (max - min) + min;
    }


