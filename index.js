  'use strict';

  const path = require('path');

  const fs = require('fs');
  const url = require('url');

  const map = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword'
  };


  const keyPromise = new  Promise((resolve,reject) => {
    fs.readFile(path.resolve(__dirname,  'key.pem'),(err,data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
  const certPromise = new Promise((resolve,reject) => {
    fs.readFile(path.resolve(__dirname,  'certificate.pem'), (err,data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
  Promise.all([keyPromise,certPromise]).then((p) => {
    const certs = {
      key: p[0],
      cert: p[1],
      allowHttp1: true
    };
  
    const server = require('http2').createSecureServer(certs,async (req,res) => {
      req.on('error', err => {
        if(err.code !== 'ENOENT') {
          console.ward(`Request had error of ${err.message}`);
        } else {
          console.log('File not existing error triggered on request');
        }
      });
      res.on('error', err => {
        if(err.code !== 'ENOENT') {
          console.warn(`Response error ${err.message} during request`);
        } else {
          console.log('File not existing error triggered on response');
        }
      });
      req.on('aborted', () => {
        console.warn('request aborted');
      });
      res.on('close', () => {
        console.log('Stream closed before Response End');
      });
  
      let reqURL = url.parse(req.url).pathname;
      console.log('request received ', reqURL);
      if (reqURL === '/') reqURL = '/index.html';
      let forwardError = false;

  
      function statCheck(stat, headers) {

        forwardError = true;
        return true; //tell it to continue
      }
      function onError(err) {
        if (forwardError || !(err.code === 'ENOENT')) {
          console.warn('Error in request');
          res.statusCode = 500;
          res.end(err);
        } else {

          console.log('File Not Found so probably api request');
          //this was probably file not found, in which case we perform our api simulation.
          setTimeout(function() {
            console.log('Just before api res end');
            res.end('{}');
            console.log('Just after api res end');
          }, 1000);
  
        }
      }
  
      const filename = path.resolve(__dirname,reqURL.charAt(0) === '/' ? reqURL.substring(1) : reqURL);
      const ext = path.extname(filename);
      console.log('About to respond with File ', filename);
      res.stream.respondWithFile(
        filename,
        { 'content-type': map[ext] || 'text/plain',
          'cache-control': 'no-cache' },
        { statCheck: statCheck, onError: onError });
  
    });
    server.listen(443,'0.0.0.0');
  });
  
    
