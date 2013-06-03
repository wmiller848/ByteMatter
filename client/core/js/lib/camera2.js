/*
 * Basic Mat4 Camera
 */

var Camera = function()
{
    var self = this;
    self.moving = false;
    self.rotation = vec3.create();

    self.position = vec3.create([0,0,0]);
    self.moving = false;
    self.speed = 10.0;
    self.boost = 10;
    self.viewMatrix = mat4.create();
    self.keys = new Array(128);
    self.shift = false;
    self.dirty = true;
};

Camera.prototype.init = function(context)
{
    var self = this;
    var lastX, lastY;

    // Set up the appropriate event hooks
    // Set up the appropriate event hooks
    document.addEventListener("keydown", function (event) {
        self.keys[event.keyCode] = true;
        if(event.keyCode == 32) { // Prevent the page from scrolling
            event.preventDefault();
            return false;
        }
        if(event.shiftKey)
        {
            self.shift = true;
        }
    }, true);

    document.addEventListener("keyup", function (event) {
        self.keys[event.keyCode] = false;
        if(self.shift) {self.shift = false;}
    }, false);

    context.addEventListener('mousedown',function(event)
    {
        if(event.which === 1)
        {
            self.moving = true;
        }
        lastX = event.pageX;
        lastY = event.pageY;
    }, false);

    context.addEventListener('mousemove',function(event)
    {
        if(self.moving == true)
        {
            var xDelta = event.pageX-lastX,
                yDelta = event.pageY-lastY;

            lastX = event.pageX;
            lastY = event.pageY;

            var inc = 1;//-Math.PI/360.0;

            self.rotation[0] += -inc*yDelta;
            self.rotation[1] += inc*xDelta;
            self.dirty = true;
        }
    },false);

    context.addEventListener('mouseup',function()
    {
        self.moving = false;
        self.dirty = true;
    },false);

    context.addEventListener('mousewheel',function(event)
    {
        event.preventDefault();
    },false);

    context.addEventListener('DOMMouseScroll',function(event)
    {
        event.preventDefault();
    },false);
};

Camera.prototype.setSpeed = function (newSpeed)
{
    this.speed = newSpeed;
};

Camera.prototype.getRotation = function ()
{
    return this.rotation;
};

Camera.prototype.setRotation = function (value)
{
    this.rotation = vec3.create(value);
    this.dirty = true;
};

Camera.prototype.getPosition = function ()
{
    return this.position;
};

Camera.prototype.setPosition = function (value)
{
    this.position = value;
    this.dirty = true;
};

Camera.prototype.getMat = function ()
{
    if (this.dirty == true)
    {
        this.viewMatrix = mat4.create();
        mat4.identity(this.viewMatrix);
        mat4.rotateX(this.viewMatrix, degToRad(this.rotation[0]));
        mat4.rotateY(this.viewMatrix, degToRad(this.rotation[1]));
        mat4.rotateZ(this.viewMatrix, degToRad(this.rotation[2]));

        mat4.translate(this.viewMatrix, [this.position[0], this.position[1], this.position[2]]);
        this.dirty = false;
    }

    return mat4.create(this.viewMatrix);
};

Camera.prototype.getFrustumMat = function()
{
    var frustumMat = mat4.create();
    mat4.identity(frustumMat);
    mat4.rotateX(frustumMat, degToRad(this.rotation[0]));
    mat4.rotateY(frustumMat, degToRad(this.rotation[1]));
    mat4.rotateZ(frustumMat, degToRad(this.rotation[2]));
    mat4.inverse(frustumMat);
    mat4.multiplyVec3(frustumMat, [0,0,10]);

    mat4.translate(frustumMat, [this.position[0], this.position[1], this.position[2]]);

    return frustumMat;
};

Camera.prototype.update = function(timing)
{
    var dir = vec3.create();
    var speed = (this.speed / 1000);
    var rot = 0;
    // Check for speed boost
    if (this.keys[16] == true) // shift key
    {
        speed = (speed * this.boost);
    }
    // Rotate/lean
    if (this.keys['Q'.charCodeAt(0)] == true)
    {
        rot += Math.PI/360.0;
        this.keys['Q'.charCodeAt(0)] = false;
    }
    else if (this.keys['E'.charCodeAt(0)] == true)
    {
        rot -= Math.PI/360.0;
    }

    // This is our first person movement code. It's not really pretty, but it works
    if (this.keys['W'.charCodeAt(0)] == true) {
        dir[2] += speed;
    }
    if (this.keys['S'.charCodeAt(0)] == true) {
        dir[2] -= speed;
    }

    if (this.keys['A'.charCodeAt(0)] == true) {
        dir[0] += speed;
    }
    if (this.keys['D'.charCodeAt(0)] == true) {
        dir[0] -= speed;
    }

    if (this.keys[32] == true) { // Space, moves up
        dir[1] += speed;
    }
    if (this.keys[17] == true) { // Ctrl, moves down
        dir[1] -= speed;
    }

    // Rotate the camera
    if(rot !== 0)
    {
        this.dirty = true;
    }

    // Move the camera in the direction we are facing
    if (dir[0] !== 0 || dir[1] !== 0 || dir[2] !== 0)
    {
        var mat = mat4.create();
        mat4.identity(mat);
        mat4.rotateX(mat, degToRad(this.rotation[0]));
        mat4.rotateY(mat, degToRad(this.rotation[1]));
        mat4.rotateZ(mat, degToRad(this.rotation[2]));
        mat4.inverse(mat);
        mat4.multiplyVec3(mat, dir);

        vec3.add(this.position, dir);
        this.dirty = true;
    }
};