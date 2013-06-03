/*
 *
 * William Miller
 *  ByteMater - Alpha
 */

// Polyfill to ensure we can always call requestAnimaionFrame
if(!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function() {
        return  window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback, element) {
                window.setTimeout(function() {
                    callback(new Date().getTime());
                }, 1000 / 60);
            };
    })();
}
/*
 * Provides cancelRequestAnimationFrame in a cross browser way.
 * @ignore
 */
if(!window.cancelRequestAnimFrame) {
    window.cancelRequestAnimFrame = (function() {
        return window.cancelCancelRequestAnimationFrame ||
            window.webkitCancelRequestAnimationFrame ||
            window.mozCancelRequestAnimationFrame 	  ||
            window.oCancelRequestAnimationFrame      ||
            window.msCancelRequestAnimationFrame     ||
            window.clearTimeout;
    })();
}

/*
 * Start the render loop, cross-browser support
 */
function startRenderLoop(callback)
{
    var startTime = 0;

    var lastTimeStamp = startTime;
    var lastFpsTimeStamp = startTime;
    var framesPerSecond = 0;
    var frameCount = 0;

    function nextFrame(time)
    {
        // Recommendation from Opera devs: calling the RAF shim at the beginning of your
        // render loop improves framerate on browsers that fall back to setTimeout
        window.requestAnimationFrame(nextFrame);

        // Update FPS if a second or more has passed since last FPS update
        if(lastTimeStamp - lastFpsTimeStamp >= 1000)
        {
            framesPerSecond = frameCount;
            frameCount = 0;
            lastFpsTimeStamp = lastTimeStamp;
        }

        frameCount++;
        lastTimeStamp = time;

        callback({
            startTime: startTime,
            timeStamp: time,
            elapsed: time-startTime,
            frameTime: time-lastTimeStamp,
            framesPerSecond: framesPerSecond
        });
    };
    window.requestAnimationFrame(nextFrame);
};

var client = null;

var SampleClient = function()
{
    var self = this;

    self.name = "Byte Matter Sample Client";
    self.log = function(msg, obj)
    {
        console.log(self.name +  " - "  + msg);
    };

    self.renderCtx = null;

    self.byteMatter = null;

    self.camera = new Camera();
    self.projMat = null;
    self.frustum = null;
};

SampleClient.prototype.init = function(context)
{
    var self = this;

    var ctx = document.getElementById(context);

    if(ctx)
    {
        // Disable right-click on canvas
        ctx.oncontextmenu = function() {
            return false;
        };
        self.renderCtx = ctx.getContext("2d");
    }

    self.renderCtx.width = ctx.width;
    self.renderCtx.height = ctx.height;


    self.camera.init(ctx);
    self.camera.setPosition(vec3.create([0,0,-10]));
    self.camera.setRotation(vec3.create([0,0,0]));
    self.projMat = mat4.create();
    var fov = 55;
    var aspect = (self.renderCtx.width/self.renderCtx.height);
    mat4.perspective(fov, aspect, 0.1, 1000, self.projMat);


    //mat4.ortho(0, self.renderCtx.width, 0, self.renderCtx.height, 1, 1000, self.projMat);
    /*
    var winSize = (self.renderCtx.height / 2.0);
    var aspect = (self.renderCtx.width / self.renderCtx.height);
    mat4.ortho(-winSize * aspect, winSize * aspect, -winSize, winSize, -1000, 1000, self.projMat);
    */
    self.frustum = mat6x4.create();

    //console.log(self.frustum);
    /*
    //var inView = mat6x4.pointInFrustum(self.frustum, [0,0,0]);
    var distance = mat6x4.sphereInFrustum(self.frustum, [0,0,-10], 1.0);
    var inView = false;
    if(distance > 0.0)
        inView = true;

    console.log(inView);
    */

    self.byteMatter = new ByteMatter();
    $.get("/core/assets/models/kerrigan.json", function(res)
    {
        self.byteMatter.create(JSON.parse(res));
    });

    startRenderLoop(self.render);
};

SampleClient.prototype.render = function(timing)
{
    var self = client;

    self.renderCtx.clearRect(0, 0, self.renderCtx.width, self.renderCtx.height);
    self.renderCtx.fillStyle = 'pink';
    self.renderCtx.fillRect(0, 0, self.renderCtx.width, self.renderCtx.height);


    self.camera.update(timing);
    var viewMat = self.camera.getMat();
    //var viewMat = mat4.create();
    //mat4.identity(viewMat);
    //mat4.translate(viewMat, [0,0,-5]);

    //var viewFrustrum = self.camera.getFrustumMat();
    mat6x4.frustum(self.projMat, viewMat, self.frustum);
    self.byteMatter.render(timing, self.frustum, {"viewMat" : viewMat, "projMat" : self.projMat, pos: self.camera.getPosition()}, self.renderCtx, null);
};


$(document).ready(function()
{
    client.init("renderCtx");
    client.log("Client Started");
});

(function()
{
    client = new SampleClient();
})();