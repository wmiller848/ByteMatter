/*
 * Created by William Miller
 * CopyRight 3D Systems (C) 2013
 */

// Helper methods
function getURLParameters(paramName)
{
    var sURL = window.document.URL.toString();
    if (sURL.indexOf("?") > 0)
    {
        var arrParams = sURL.split("?");
        var arrURLParams = arrParams[1].split("&");
        var arrParamNames = new Array(arrURLParams.length);
        var arrParamValues = new Array(arrURLParams.length);
        var i = 0;
        for (i=0;i<arrURLParams.length;i++)
        {
            var sParam =  arrURLParams[i].split("=");
            arrParamNames[i] = sParam[0];
            if (sParam[1] != "")
                arrParamValues[i] = unescape(sParam[1]);
            else
                arrParamValues[i] = "No Value";
        }

        for (i=0;i<arrURLParams.length;i++)
        {
            if(arrParamNames[i] == paramName){
                //alert("Param:"+arrParamValues[i]);
                return arrParamValues[i];
            }
        }
        return "No Parameters Found";
    }
}

function getFileExtension(fileName)
{
    return fileName.split('.').pop().toLowerCase();
}


function uniqueid()
{
    // always start with a letter (for DOM friendlyness)
    var idstr=String.fromCharCode(Math.floor((Math.random()*25)+65));
    do
    {
        // between numbers and characters (48 is 0 and 90 is Z (42-48 = 90)
        var ascicode=Math.floor((Math.random()*42)+48);
        if (ascicode<58 || ascicode>64)
        {
            // exclude all chars between : (58) and @ (64)
            idstr+=String.fromCharCode(ascicode);
        }
    } while (idstr.length<32);

    return (idstr);
}


var version = "0.1.0";

var DOCUMENT_ROOT = './client';
var DIRECTORY_INDEX = '/index.html';


var server = null;
var port_Http = 8080;

var http = require('http');
/*
 * Start Server
 */

var host = http.createServer(function(req, res) {
    // Remove query strings from uri
    if (req.url.indexOf('?')>-1) {
        req.url = req.url.substr(0, req.url.indexOf('?'));
    }

    // Remove query strings from uri
    if (req.url == '/') {
        req.url = DIRECTORY_INDEX;
    }

    var filePath = DOCUMENT_ROOT + req.url;

    //var extname = path.extname(filePath);

    var acceptEncoding = req.headers['accept-encoding'];
    if (!acceptEncoding) {
        acceptEncoding = '';
    }
    else
    {
        //console.log('Requested Encoding - ' + acceptEncoding);
    }

    fs.exists(filePath, function(exists) {

        if (exists) {

            fs.stat(filePath, function(err, stats)
            {
                var raw = fs.createReadStream(filePath);

                if (acceptEncoding.match(/\bdeflate\b/)) {
                    res.writeHead(200, { 'content-encoding': 'deflate' });
                    raw.pipe(zlib.createDeflate()).pipe(res);
                } else if (acceptEncoding.match(/\bgzip\b/)) {
                    res.writeHead(200, { 'content-encoding': 'gzip' });
                    raw.pipe(zlib.createGzip()).pipe(res);
                } else {
                    res.writeHead(200, null);
                    raw.pipe(res);
                }
            });
        }
        else {
            res.writeHead(404);
            res.end();
        }
    });
}).listen(port_Http);

var zlib = require('zlib'),
    parser = require('formidable'),
    ioDelay = require('delayed-stream'),
    url = require('url'),
    io = require('socket.io').listen(host),
    os = require('os'),
    fs = require('fs'),
    exec = require('child_process').exec, // returns a buffer
    spawn = require('child_process').spawn, // returns a stream
    temp = require('temp');