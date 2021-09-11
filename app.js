/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var AssistantV1 = require('watson-developer-cloud/assistant/v1'); // watson sdk
const ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

const vcapServices = require('./config/vcap_services');

var app = express ();

let workspaceID = '';

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

app.all('/api/secure/*', [require('./middlewares/validateRequest')]);

// Create the service wrapper

var assistant = new AssistantV1({
	version: '2018-07-10',
	// version: '2019-02-28',
	headers: {
		'X-Watson-Learning-Opt-Out': true
	}
});

const toneAnalyzer = new ToneAnalyzerV3({
	version: '2017-09-21',
	headers: {
		'X-Watson-Learning-Opt-Out': true
	}
});

function validateAPIKey(req, res, next) {
	if (!req.header) {
		return res.json({
			output: {
				text: ['API Key is not found in the header!!']
			}
		});
	}

	const token = req.header('API-Key');
	switch (token) {
		case process.env.ARABIA_API_KEY:
			workspaceID = process.env.WORKSPACE_ID;
			next();
			break;
		case process.env.AFRICA_API_KEY:
			workspaceID = process.env.WORKSPACE_ID;
			next();
			break;
		case process.env.CATALYST_API_KEY:
			workspaceID = process.env.CATALYST_WORKSPACE_ID;
			next();
			break;
		case process.env.OLD_AFRICA_API_KEY:
			workspaceID = process.env.OLD_AFRICA_WORKSPACE_ID;
			next();
			break;
		default:
			return res.json({
				output: {
					text: ['API Key is not found or incorrect!']
				}
			});
	}
}
// Endpoint to be call from the client side
app.post('/api/message', validateAPIKey, function (req, res) {
	console.log('workspace ID: ' + workspaceID);
	if (!workspaceID) {
		return res.json({
			output: {
				text: [
					'The app has not been configured with a <b>WORKSPACE_ID</b> or <b>OLD_AFRICA_WORKSPACE_ID</b> environment variable.'
				]
			}
		});
	}

	let context = {};
	if (req.body.context) {
		context = req.body.context;
	}
	context.tone_anger_threshold = 0.6;
	context.tone_sadness_threshold = 0.5;
	if (req.body.input && req.body.input.text) {
		const queryInput = JSON.stringify(req.body.input.text);

		const toneParams = {
			tone_input: {
				text: queryInput
			},
			content_type: 'application/json'
		};
		toneAnalyzer.tone(toneParams, function (err, tone) {
			let toneAngerScore = 0;
			let toneSadnessScore = 0;
			if (err) {
				console.log('Error occurred while invoking Tone analyzer. ::', err);
			} else {
				console.log(JSON.stringify(tone, null, 2));
				const emotionTones = tone.document_tone.tones;

				const len = emotionTones.length;
				for (let i = 0; i < len; i++) {
					if (emotionTones[i].tone_id === 'anger') {
						console.log('Input = ', queryInput);
						console.log(
							'emotion_anger score = ',
							'Emotion_anger',
							emotionTones[i].score
						);
						toneAngerScore = emotionTones[i].score;
						break;
					} else if (emotionTones[i].tone_id === 'sadness') {
						console.log('Input = ', queryInput);
						console.log(
							'esadness_anger score = ',
							'Sadness_anger',
							emotionTones[i].score
						);
						toneSadnessScore = emotionTones[i].score;
						break;
					}
				}
			}

			context.tone_anger_score = toneAngerScore;
			context.tone_sadness_score = toneSadnessScore;

			var payload = {
				workspace_id: workspaceID,
				context: context || {},
				input: req.body.input || {}
			};

			// Send the input to the assistant service
			assistant.message(payload, function (err, data) {
				if (err) {
					return res.status(err.code || 500).json(err);
				}

				// This is a fix for now, as since Assistant version 2018-07-10,
				// output text can now be in output.generic.text
				var output = data.output;
				if (output.text.length === 0 && output.hasOwnProperty('generic')) {
					var generic = output.generic;

					if (Array.isArray(generic)) {
						// Loop through generic and add all text to data.output.text.
						// If there are multiple responses, this will add all of them
						// to the response.
						for (var i = 0; i < generic.length; i++) {
							if (generic[i].hasOwnProperty('text')) {
								data.output.text.push(generic[i].text);
							} else if (generic[i].hasOwnProperty('title')) {
								data.output.text.push(generic[i].title);
							}
						}
					}
				}

				return res.json(updateMessage(payload, data));
			});
		});
	} else {
		var payload = {
			workspace_id: workspaceID,
			context: req.body.context || {},
			input: req.body.input || {}
		};

		// Send the input to the assistant service
		assistant.message(payload, function (err, data) {
			if (err) {
				return res.status(err.code || 500).json(err);
			}

			// This is a fix for now, as since Assistant version 2018-07-10,
			// output text can now be in output.generic.text
			var output = data.output;
			if (output.text.length === 0 && output.hasOwnProperty('generic')) {
				var generic = output.generic;

				if (Array.isArray(generic)) {
					// Loop through generic and add all text to data.output.text.
					// If there are multiple responses, this will add all of them
					// to the response.
					for (var i = 0; i < generic.length; i++) {
						if (generic[i].hasOwnProperty('text')) {
							data.output.text.push(generic[i].text);
						} else if (generic[i].hasOwnProperty('title')) {
							data.output.text.push(generic[i].title);
						}
					}
				}
			}

			return res.json(updateMessage(payload, data));
		});
	}
});

// Secured endpoint to be call from the client side
app.post('/api/secure/message', validateAPIKey, function (req, res) {
	console.log('workspace ID' + workspaceID);
	if (!workspaceID) {
		return res.json({
			output: {
				text: 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable.'
			}
		});
	}

	let context = {};
	if (req.body.context) {
		context = req.body.context;
	}
	context.tone_anger_threshold = 0.6;
	context.tone_sadness_threshold = 0.5;
	if (req.body.input && req.body.input.text) {
		const queryInput = JSON.stringify(req.body.input.text);

		const toneParams = {
			tone_input: {
				text: queryInput
			},
			content_type: 'application/json'
		};
		toneAnalyzer.tone(toneParams, function (err, tone) {
			let toneAngerScore = 0;
			let toneSadnessScore = 0;
			if (err) {
				console.log('Error occurred while invoking Tone analyzer. ::', err);
			} else {
				console.log(JSON.stringify(tone, null, 2));
				const emotionTones = tone.document_tone.tones;

				const len = emotionTones.length;
				for (let i = 0; i < len; i++) {
					if (emotionTones[i].tone_id === 'anger') {
						console.log('Input = ', queryInput);
						console.log(
							'emotion_anger score = ',
							'Emotion_anger',
							emotionTones[i].score
						);
						toneAngerScore = emotionTones[i].score;
						break;
					} else if (emotionTones[i].tone_id === 'sadness') {
						console.log('Input = ', queryInput);
						console.log(
							'esadness_anger score = ',
							'Sadness_anger',
							emotionTones[i].score
						);
						toneSadnessScore = emotionTones[i].score;
						break;
					}
				}
			}

			context.tone_anger_score = toneAngerScore;
			context.tone_sadness_score = toneSadnessScore;

			var payload = {
				workspace_id: workspaceID,
				context: context || {},
				input: req.body.input || {}
			};

			// Send the input to the assistant service
			assistant.message(payload, function (err, data) {
				if (err) {
					return res.status(err.code || 500).json(err);
				}

				// This is a fix for now, as since Assistant version 2018-07-10,
				// output text can now be in output.generic.text
				var output = data.output;
				if (output.text.length === 0 && output.hasOwnProperty('generic')) {
					var generic = output.generic;

					if (Array.isArray(generic)) {
						// Loop through generic and add all text to data.output.text.
						// If there are multiple responses, this will add all of them
						// to the response.
						for (var i = 0; i < generic.length; i++) {
							if (generic[i].hasOwnProperty('text')) {
								data.output.text.push(generic[i].text);
							} else if (generic[i].hasOwnProperty('title')) {
								data.output.text.push(generic[i].title);
							}
						}
					}
				}

				return res.json(updateMessage(payload, data));
			});
		});
	} else {
		var payload = {
			workspace_id: workspaceID,
			context: req.body.context || {},
			input: req.body.input || {}
		};

		// Send the input to the assistant service
		assistant.message(payload, function (err, data) {
			if (err) {
				return res.status(err.code || 500).json(err);
			}

			// This is a fix for now, as since Assistant version 2018-07-10,
			// output text can now be in output.generic.text
			var output = data.output;
			if (output.text.length === 0 && output.hasOwnProperty('generic')) {
				var generic = output.generic;

				if (Array.isArray(generic)) {
					// Loop through generic and add all text to data.output.text.
					// If there are multiple responses, this will add all of them
					// to the response.
					for (var i = 0; i < generic.length; i++) {
						if (generic[i].hasOwnProperty('text')) {
							data.output.text.push(generic[i].text);
						} else if (generic[i].hasOwnProperty('title')) {
							data.output.text.push(generic[i].title);
						}
					}
				}
			}

			return res.json(updateMessage(payload, data));
		});
	}
});

app.get('/api/health', function (req, res) {
	try {
		res.status(200).json({
			appStatus: "Up"
		})
	} catch (error) {
		res.status(500).json({
			appStatus: "Down"
		})
	}
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Assistant service
 * @param  {Object} response The response from the Assistant service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
	var responseText = null;
	if (!response.output) {
		response.output = {};
	} else {
		return response;
	}
	if (response.intents && response.intents[0]) {
		var intent = response.intents[0];
		// Depending on the confidence of the response the app can return different messages.
		// The confidence will vary depending on how well the system is trained. The service will always try to assign
		// a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
		// user's intent . In these cases it is usually best to return a disambiguation message
		// ('I did not understand your intent, please rephrase your question', etc..)
		if (intent.confidence >= 0.75) {
			responseText = 'I understood your intent was ' + intent.intent;
		} else if (intent.confidence >= 0.5) {
			responseText = 'I think your intent was ' + intent.intent;
		} else {
			responseText = 'I did not understand your intent';
		}
	}
	response.output.text = responseText;
	return response;
}

module.exports = app;