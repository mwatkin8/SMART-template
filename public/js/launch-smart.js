async function auth(){
    // Change this to the ID of the client that you registered with the SMART on FHIR authorization server.
    let clientId = "b37af179-c4e4-476c-8021-89924ff270b1";

    // These parameters will be received at loadPatient time in the URL
    let serviceUri = getUrlParameter("iss");
    let launchContextId = getUrlParameter("launch");

    // For info on scopes see here, http://www.hl7.org/fhir/smart-app-launch/scopes-and-launch-context/index.html
    let scope = ["patient/*.read","launch"].join(" ");

    // Generate a unique session key string
    let state = Math.round(Math.random()*100000000).toString();

    // To keep things flexible, let's construct the loadPatient URL by taking the base of the
    // current URL and replace "loadPatient.html" with "index.html".
    let launchUri = window.location.protocol + "//" + window.location.host + window.location.pathname;
    let redirectUri = launchUri.replace("smart-launch","");

    // FHIR Service Conformance Statement URL
    let conformanceUri = serviceUri + "/metadata";

    // Get the conformance statement from server (contains endpoint URLs for
    // authorization server and data server)
    let req = await fetch(conformanceUri);
    let r = await req.json();
    let authUri,tokenUri;
    let smartExtension = r.rest[0].security.extension.filter(function (e) {
        return (e.url === "http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris");
    });
    smartExtension[0].extension.forEach(function(arg, index, array){
        if (arg.url === "authorize") {
            authUri = arg.valueUri;
        } else if (arg.url === "token") {
            tokenUri = arg.valueUri;
        }
    });

    // Save in the session for later use
    sessionStorage[state] = JSON.stringify({
        clientId: clientId,
        serviceUri: serviceUri,
        redirectUri: redirectUri,
        tokenUri: tokenUri,
        authUri: authUri
    });
    // Redirect the browser to the authorizatin server and pass the needed
    // parameters for the authorization request in the URL
    window.location.href = authUri + "?" +
        "response_type=code&" +
        "client_id=" + encodeURIComponent(clientId) + "&" +
        "scope=" + encodeURIComponent(scope) + "&" +
        "redirect_uri=" + encodeURIComponent(redirectUri) + "&" +
        "aud=" + encodeURIComponent(serviceUri) + "&" +
        "launch=" + launchContextId + "&" +
        "state=" + state;
}


// Convenience function for parsing of URL parameters
// based on http://www.jquerybyexample.net/2012/06/get-url-parameters-using-jquery.html
function getUrlParameter(sParam)
{
    let sPageURL = window.location.search.substring(1);
    let sURLVariables = sPageURL.split('&');
    for (let i = 0; i < sURLVariables.length; i++)
    {
        let sParameterName = sURLVariables[i].split('=');
        console.log(sParameterName);
        if (sParameterName[0] == sParam) {
            let res = sParameterName[1].replace(/\+/g, '%20');
            return decodeURIComponent(res);
        }
    }
}
