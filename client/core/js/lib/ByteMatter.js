/*
 *
 * William Miller
 *
 */

Array.prototype.swap=function(a, b)
{
    var tmp=this[a];
    this[a]=this[b];
    this[b]=tmp;
}

var ByteMatter = function()
{
    var self = this;

    self.data =
    {
        points  : [],
        normals : [],
        colors : [],
        bounds : new Array(6)
    };

    self.instance =
    {
        pos : vec3.create([0,0,0]),
        mat : mat4.identity(mat4.create())
    };
    mat4.translate(self.instance.mat, [self.instance.pos[0], self.instance.pos[1], self.instance.pos[2]]);

    self.ready = false;
};

ByteMatter.prototype.create = function(modelJSON, callback)
{
    // This is an expermental way of rendering geometry, based off a sudo "pre-rastering" of triangles
    // and optimized octree's
    // The general idea is we create a bunch of "matter" to sample from, based of view distance
    // we then sample the shape at some octree resolution to get the need pixel color and position values

    var self = this;

    console.log("Creating ByteMatter");

    // Generate ALL points for ALL triangles (sudo "pre-rasterize" ALL triangles)
    //
    //              _______
    //  xyz   ---   |...../
    //              |..../
    //              |.../
    //              |../
    //              |./
    //              |/
    //
    //

    var models = modelJSON.mModels;
    var points = [];
    var colors = [];
    var defaultColor = ["#FFFFFF", 1.0];

    for(var j = 0; j < models.length; j++)
    {
        var model = models[j];
        var verts = model.mVerticies;
        var indices = model.mIndices;

        for(var i = 0; i < verts.length; i+=3)
        {
            var v0 = vec3.create([verts[i+0], -verts[i+1], verts[i+2]]);
            points.push(vec3.create(v0));
            colors.push(vec2.create(defaultColor));
            /*
            var v0 = vec3.create([verts[indices[i+0]], verts[indices[i+1]], verts[indices[i+2]]]);
            var v1 = vec3.create([verts[indices[i+3]], verts[indices[i+4]], verts[indices[i+5]]]);
            var v2 = vec3.create([verts[indices[i+6]], verts[indices[i+7]], verts[indices[i+8]]]);

            (function()
            {
                var sV = vec3.create(v0);
                var mV = vec3.create(v1);
                var eV = vec3.create(v2);

                //var tmpV = vec3.create(sV);

                var sampleSize = 5;
                var samplerWidth = 0;
                var samplerHeight = 0;

                var t = 1/sampleSize;

                points.push(vec3.create(sV));
                points.push(vec3.create(mV));
                points.push(vec3.create(eV));
                /*
                while(samplerHeight != sampleSize)
                {
                    var tmpV = vec3.create(sV);

                    //points.push(vec3.create(sV));
                    //colors.push(vec4.create(defaultColor));

                    while(samplerWidth != sampleSize)
                    {

                        //vec3.lerp(tmpV, eV, t, tmpV);

                        //points.push(vec3.create(tmpV));
                        //colors.push(vec4.create(defaultColor));

                        samplerWidth++;
                    }

                    var x = vec3.create();
                    var y = vec3.create();
                    vec3.lerp(sV, mV, t, x);
                    vec3.lerp(sV, eV, t, y);

                    points.push(x);
                    points.push(y);
                    //colors.push(vec4.create(defaultColor));

                    t += 1/sampleSize;
                    samplerWidth = 0;
                    samplerHeight++;
                }
                */
            //})();

        }
    }
    console.log("Vertex Interpolation Finished, \"matter\" Generated");
    console.log("ByteMatter Cached (Un-Optimized)");

    // Sort points by top to bottom left to right +y -> -y && -x -> +x && -z -> +z
    //qsort(points, 0, points.length, 2); // sort by z
    //qsort(points, 0, points.length, 0); // sort by x
    self.qsort(points, 0, points.length, 1); // sort by y
    console.log("ByteMatter Sorted (QuickSort)");

    var min = vec3.create();
    var max = vec3.create();

    for (var i = 0; i < points.length; i++)
    {
        var point = vec3.create(points[i]);;
        for (var n = 0; n < 3; n++)
        {
            if (point[n] > max[n])
                max[n] = point[n];
            if (point[n] < min[n])
                min[n] = point[n];
        }
    }

    function validateCreate()
    {
        console.log(self);
        console.log("ByteMatter Created");
        if(callback)
            callback();
    }

    self._create(points, colors, [min[0],min[1],min[2],max[0],max[1],max[2]]);
    self.ready = true;

    validateCreate();
};

ByteMatter.prototype._create = function(points, colors, packedBounds)
{
    var self = this;
    self.data.points = points;
    self.data.colors = colors;
    var color = vec4.create();
    for(var i = 0; i < self.data.colors.length; i++)
    {
        color[0] += self.data.colors[i][0];
        color[1] += self.data.colors[i][1];
        color[2] += self.data.colors[i][2];
        color[3] += self.data.colors[i][3];
    }

    var l = self.data.colors.length;
    color[0] = color[0]/l;
    color[1] = color[1]/l;
    color[2] = color[2]/l;
    color[3] = color[3]/l;
    if(color[3] > 1.0)
        color[3] = 1.0;
    self.data.averageColor = color;
    //console.log(self.data.averageColor);
    self.data.bounds = packedBounds;
    mat4.identity(self.data.mat);

    //
    //  Create octree - divide bbox
    //
    var subPoints = [];//self.devide();

    // TestForPoints in bbox
    function checkPointWithBBox(point, box)
    {
        if((point[0] <= box[3] && point[1] <= box[4] && point[2] <= box[5]) && (point[0] >= box[21] && point[1] >= box[22] && point[2] >= box[23]))
            return true;
        else
            return false;
    }

    var bounds = self.unpackBounds(packedBounds);
    for(var j = 0; j < points.length; j++)
    {
        var point = points[j];
        if(checkPointWithBBox(point, bounds) == true)
        {
            subPoints.push(vec3.create(point));
        }
    }
    console.log("Checked all points");
};

ByteMatter.prototype.unpackBounds = function(packedBounds)
{
    var self = this;

    var min = vec3.create([packedBounds[0],packedBounds[1],packedBounds[2]]);
    var max = vec3.create([packedBounds[3],packedBounds[4],packedBounds[5]]);

    var bounds = new Array(24);
    // x, y, z
    // p0
    bounds[0] = min[0];
    bounds[1] = max[1];
    bounds[2] = max[2];
    // p1
    bounds[3] = max[0];
    bounds[4] = max[1];
    bounds[5] = max[2];
    // p2
    bounds[6] = min[0];
    bounds[7] = min[1];
    bounds[8] = max[2];
    // p3
    bounds[9] = max[0];
    bounds[10] = min[1];
    bounds[11] = max[2];

    // p4
    bounds[12] = min[0];
    bounds[13] = max[1];
    bounds[14] = min[2];
    // p5
    bounds[15] = max[0];
    bounds[16] = max[1];
    bounds[17] = min[2];
    // p6
    bounds[18] = min[0];
    bounds[19] = min[1];
    bounds[20] = min[2];
    // p7
    bounds[21] = max[0];
    bounds[22] = min[1];
    bounds[23] = min[2];

    return bounds;
};

ByteMatter.prototype.unpackColor = function(hex)
{
    function cleanHex(h) {(h.charAt(0)=="#") ? h.substring(1,7):h}
    var color = [parseInt((cleanHex(hex)).substring(0,2),16), parseInt((cleanHex(hex)).substring(2,4),16), parseInt((cleanHex(hex)).substring(4,6),16)];
    return  color;
};

ByteMatter.prototype.devide = function()
{
    var self = this;
    var bounds = self.unpackBounds(self.data.bounds);
};

ByteMatter.prototype.partition = function(array, begin, end, pivot, index)
{
    var piv = array[pivot][index];
    array.swap(pivot, end-1);
    var store = begin;
    var ix;
    for(ix=begin; ix < end-1; ++ix)
    {
        if(array[ix][index] > piv) // <=
        {
            array.swap(store, ix);
            ++store;
        }
    }
    array.swap(end-1, store);

    return store;
}

ByteMatter.prototype.qsort = function(array, begin, end, index, scope)
{
    var self = (scope ? !null : scope || this);
    if(end-1>begin)
    {
        var pivot = begin+Math.floor(Math.random()*(end-begin));

        pivot = self.partition(array, begin, end, pivot, index);

        self.qsort(array, begin, pivot, index, scope);
        self.qsort(array, pivot+1, end, index, scope);
    }
}

ByteMatter.prototype.update = function()
{
    var self = this;
};

ByteMatter.prototype.render = function(timing, frustum, mats, context, callback)
{
    var self = this;
    if(self.ready == false)
        return;

    var data = self.data;
    var instance = self.instance;
    var bounds = self.unpackBounds(data.bounds);
    var m = Math;

    /*
    for (var x = 0; x < canvasData.width; x++)  {
        for (var y = 0; y < canvasData.height; y++)  {
            // Index of the pixel in the array
            var idx = (x + y * width) * 4;
        }
    }
    */

    function renderPoints(points, colors)
    {
        var modelView = mat4.create(mats.viewMat);
        mat4.multiply(modelView, instance.mat, modelView);
        //mat4.multiply(modelView, mats.projMat, modelView);

        var ctxWidth = context.width;
        var ctxHeight = context.height;

        for(var i = 0; i < points.length/3; i++)
        {
            var v0 = vec4.create();

            v0[0] = points[(i*3) + 0];
            v0[1] = points[(i*3) + 1];
            v0[2] = points[(i*3) + 2];
            v0[3] = 1.0;

            var z = vec4.create(v0);
            mat4.multiplyVec3(instance.mat, v0);

            var inView = mat6x4.pointInFrustum(frustum, z);
            //var inView = false;
            //var distance = mat6x4.sphereInFrustum(frustum, z, 0.001);
            //if(distance > 0)
            //    inView = true;

            if(inView == true)
            {
                var p0 = vec2.create();
                var view = mat4.project(v0, modelView, mats.projMat, [0,0,ctxWidth,ctxHeight], p0);

                if(view == 1)
                {
                    context.fillStyle = 'black';
                    context.fillRect(p0[0]-2, p0[1]-2, 4, 4);
                    //context.fillRect(p0[0], p0[1], 1, 1);
                }
            }
        }
        //if(x < 8*8)
            //console.log();
    }

    var flatPoints = [];
    var flatColors = [];
    var cloudPoints = self.data.points;
    var cloudColors = self.data.colors;
    for(var i = 0; i < cloudPoints.length; i+=6)
    {
        var point = cloudPoints[i];
        flatPoints.push(point[0]);
        flatPoints.push(point[1]);
        flatPoints.push(point[2]);


        flatColors.push()
    }

    var test =
    [
        0.0, 0.0, 0.0
    ];
    renderPoints(test, [1, 1, 1, 1]);
    //renderPoints(self.unpackBounds([-1,-1,-1, 1,1,1]));
    renderPoints(flatPoints, flatColors);
};