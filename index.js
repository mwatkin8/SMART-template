let express = require('express');
let app = express();

//SMART
let path = require('path');
app.use(express.static(path.join(__dirname, '/public/')));
app.get('/smart-launch', (request, response) => {
    response.sendFile(path.join(__dirname + '/launch.html'));
});
app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname + '/index.html'));
});

//CDS Hooks
let bodyParser = require('body-parser');
// This is necessary middleware to parse JSON into the incoming request body for POST requests
app.use(bodyParser.json());
/**
 * Security Considerations:
 * - CDS Services must implement CORS in order to be called from a web browser
 */
app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Expose-Headers', 'Origin, Accept, Content-Location, ' +
        'Location, X-Requested-With');

    // Pass to next layer of middleware
    next();
});
/**
 * Authorization.
 * - CDS Services should only allow calls from trusted CDS Clients
 */
app.use((request, response, next) => {
    // Always allow OPTIONS requests as part of CORS pre-flight support.
    if (request.method === 'OPTIONS') {
        next();
        return;
    }

    let serviceHost = request.get('Host');
    let authorizationHeader = request.get('Authorization') || 'Bearer open'; // Default a token until ready to enable auth.

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer')) {
        response.set('WWW-Authenticate', `Bearer realm="${serviceHost}", error="invalid_token", error_description="No Bearer token provided."`)
        return response.status(401).end();
    }

    let token = authorizationHeader.replace('Bearer ', '');
    let aud = `${request.protocol}://${serviceHost}${request.originalUrl}`;

    let isValid = true; // Verify token validity per https://cds-hooks.org/specification/1.0/#trusting-cds-client

    if (!isValid) {
        response.set('WWW-Authenticate', `Bearer realm="${serviceHost}", error="invalid_token", error_description="Token error description."`)
        return response.status(401).end();
    }

    // Pass to next layer of middleware
    next();
});

/**
 * Discovery Endpoint:
 * - A GET request to the discovery endpoint, or URL path ending in '/cds-services'
 * - This function should respond with definitions of each CDS Service for this app in JSON format
 * - See details here: http://cds-hooks.org/specification/1.0/#discovery
 */
app.get('/cds-services', (request, response) => {

    let smart_template = {
        hook: 'patient-view',
        id: 'smart-template',
        title: 'Hooks service endpoint for the SMART-Template project',
        description: 'A demo to show how to launch cards',
        prefetch: {
            patient: 'Patient/{{context.patientId}}',
        }
    };

    let discoveryEndpointServices = {
        services: [ smart_template ]
    };
    response.send(JSON.stringify(discoveryEndpointServices, null, 2));
});

/**
 * Patient View Example Service:
 * - Handles POST requests to the patient-view endpoint
 * - This function should respond with an array of cards in JSON format for the patient-view hook
 *
 * - Service purpose: demonstrate a card with a link to a SMART on FHIR app when patient is male
 */
app.post('/cds-services/smart-template', (request, response) => {
    let patient = request.body.prefetch.patient;
    let responseCard = {"cards": []}
    if (patient.gender === 'male'){
        responseCard = createPatientViewCard(patient);
    }
    response.send(JSON.stringify(responseCard, null, 2));
});

/**
 * Creates a Card array based upon the medication chosen by the provider in the request context
 */
function createPatientViewCard(patient) {
    return {
        cards: [
            {
                summary: 'Male patient detected',
                indicator: 'info',
                source: {
                    label: 'comes from the SMART Template app'
                },
                links: [
                    {
                        label: 'Click to launch the SMART template app',
                        url: 'http://localhost:9000/smart-launch',
                        type: 'smart'
                    }
                ],
            }
        ]
    }
}

// Here is where we define the port for the localhost server to setup
app.listen(9000);
