// Copyright 2017 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// [START gae_node_request_example]
const express = require('express');

const app = express();

app.get('/', (req, res) => {
    let body = req.protocol + '://' + req.headers.host + req.url;
    res.status(200).send('Hello, world! ' + body).end();
});

app.get('/*', (req, resp) => {
    //let body = req.protocol + '://' + req.headers.host + req.url;
    let url = "http://35.203.132.149:80"  + req.url;

    let http = require('http');

    http.get(url, (res) => {
        let body = '';
        res.setEncoding('utf8');
        const { statusCode } = res;

        res.on('data', (chunk) => {
            body += chunk;
        });

        res.on('end', (res) => {
            console.log(body);
            console.log(statusCode);
            resp.status(statusCode).send(body).end();
        });

    }).on('error', (e) => {
        console.log(e.message); //エラー時
    });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
// [END gae_node_request_example]

module.exports = app;
