/*
 * Quaternion Camera
 */

var Camera = function()
{
    var self = this;
    self.moving = false;
    self.rotation = quat4.create();
    self.lean = 0;
    self.upVector = vec3.create([0,1,0]);
    self.tangentVector = vec3.create([1,0,0]);

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

            var inc = -Math.PI/360.0;

            var nrot = quat4.createAxisQuat(self.tangentVector, yDelta*inc);
            quat4.multiply(nrot, self.rotation, self.rotation);

            self.rotation = quat4.normalize(self.rotation);

            nrot = quat4.createAxisQuat(self.upVector, xDelta*inc);
            quat4.multiply(self.rotation, nrot, self.rotation);

            self.rotation = quat4.normalize(self.rotation);
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
    this.rotation = quat4.normalize(this.rotation);
    return this.rotation;
};

Camera.prototype.setRotation = function (value)
{
    this.rotation = quat4.createEulerQuat(value[0],value[1],value[2]);
    this.rotation = quat4.normalize(this.rotation);
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
        this.rotation = quat4.normalize(this.rotation);
        this.viewMatrix = null;
        this.viewMatrix = quat4.toMat4(this.rotation);
        mat4.translate(this.viewMatrix, [-this.position[0], -this.position[1], -this.position[2]]);
        this.dirty = false;
    }

    return mat4.create(this.viewMatrix);
};

var z = 0;
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
        dir[0] -= speed;
    }
    if (this.keys['D'.charCodeAt(0)] == true) {
        dir[0] += speed;
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
        var nquat = quat4.create([0,0,1,rot]);
        nquat = quat4.normalize(nquat);

        quat4.multiply(nquat, this.rotation, this.rotation);

        quat4.normalize(this.rotation);

        z++;
        this.dirty = true;
    }

    // Move the camera in the direction we are facing
    if (dir[0] !== 0 || dir[1] !== 0 || dir[2] !== 0)
    {
        var nquat = quat4.create(this.rotation);
        nquat = quat4.normalize(nquat);
        nquat = quat4.inverse(nquat);
        nquat = quat4.normalize(nquat);
        mat4.multiplyVec3(quat4.toMat4(nquat), dir);
        vec3.add(this.position, dir);
        this.rotation = quat4.normalize(this.rotation);
        this.dirty = true;
    }
};