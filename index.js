/*global require,console,__dirname*/
'use strict';

var express = require('express');
var app = express();
var fs = require('fs');
var jimp = require('jimp');
var sharp = require('sharp');
var ExifImage = require('exif').ExifImage;
var multer = require('multer');

var imageware = function(req, res) {
  var fileName = req.query.name;
  var folder = req.query.folder;
  var result;
  var filePath = folder + '/' + fileName;

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  if (!fs.existsSync(filePath)) {
    new jimp(fileName, function() {
      var width = parseInt(req.query.w, 10);
      var height = parseInt(req.query.h, 10);

      switch (req.query.fn) {
        case 'resize':
          result = this.resize(width, height);
          break;
      }

      result.write(folder + '/' + fileName, function() {
        res.sendFile(filePath, { root: __dirname });
      });

    });
  } else {
    res.sendFile(filePath, { root: __dirname });
  }
};

var port = process.env.PORT || 3000;

var server = app.listen(port, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

app.use(express.static(__dirname));
app.use('/photo', imageware);

app.post('/api/photo', multer({
  dest: './uploads',
  onFileUploadComplete: function(file) {
    console.log(file.fieldname + ' uploaded to  ' + file.path + 'size ' + file.buffer.length);
  },
  inMemory: true
}));

app.post('/api/photo', function(req, res, next) {
  var file = req.files.file,
    response = {};

  new ExifImage({ image: file.buffer }, function(error, exifData) {
    if (error)
      console.log('ExifError: ' + error.message);
    else {
      response.exifData = exifData;
      console.log(exifData);
      if (exifData && exifData.image) {
        // EK: refer to EXIF_Orientations.jpg 
        // (taken from http://www.daveperrett.com/articles/2012/07/28/exif-orientation-handling-is-a-ghetto/)
        sharp(file.buffer).rotate().toFile('./uploads/' + file.originalname, (err, info) => {
          response.originalName = file.originalname;
          res.send(response);
          next();
        });
      }
    }
  });
});
