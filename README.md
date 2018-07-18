multer-autoreap
===============

Express middleware for reaping uploaded files saved to disk by multer or any multipart middleware propagating the req.files object.  The middleware will automatically remove any uploaded files left in their temporary location upon response end or close.


#### Installation

`$ npm install multer-autoreap`



#### Usage
as app middleware
```js
const express = require('express');
const multer  = require('multer');
const autoReap  = require('multer-autoreap');

let app = express();
app.use(multer({ dest: '/tmp/' }));
app.use(autoReap);
...
```

or attaching to a route / router.

```js
const express = require('express');
const router = express.Router();

const multer  = require('multer');
const autoReap  = require('multer-autoreap');

let app = express();
app.use(multer({ dest: '/tmp/' }));

app.route('/upload-a').post(autoReap, function(req, res, next) {
	res.on('autoreap', function(file) {
		console.log('auto-reaped: ', file);
	});

	res.send('ok');
});

router.use('/upload-b', autoReap, function(req, res, next) {
	res.on('autoreap', function(file) {
		console.log('auto-reaped: ', file);
	});

	res.send('ok');
});
...
```

[Multer](https://github.com/expressjs/multer) is an efficient `multipart/form-data` handling middleware that uses [busboy](https://github.com/mscdex/busboy).  Files encoded in a miltipart request body are piped to a temporary upload location (def: multer options dest ).  This can have the effect of leaving open an attack vector where disk space can be consumed by these temporary files.  Its prudent and generally good form to clean them up.  While [reap](https://github.com/visionmedia/reap) cleans based on age, multer-autoreap cleans them up as soon as the request is done.

#### Options

```js
autoReap.options = {
	reapOnError: true
};
```
* *reapOnError* (boolean) - If an error occurs, continue reaping the file, or no.
```js
var autoReap  = require('multer-autoreap');
autoReap.options.reapOnError = false;
```


#### Events
The middleware will emit an 'autoreap' event on the Response object when removing files.  The event will include the original file object from req.files[].
```js
res.on('autoreap', function(reapedFile) {
	console.log(reapedFile);
});
```

Please report any issues...
