async function loadPatient(){
    // get the URL parameters received from the authorization server
    let state = getUrlParameter("state");  // session key
    let code = getUrlParameter("code");    // authorization code

    // load the app parameters stored in the session
    let params = JSON.parse(sessionStorage[state]);  // load app session
    let tokenUri = params.tokenUri;
    let clientId = params.clientId;
    let serviceUri = params.serviceUri;
    let redirectUri = params.redirectUri;

    // Exchange token
    let r = await fetch(tokenUri, {
        method:'POST',
        body: 'grant_type=authorization_code&client_id=' + clientId + '&redirect_uri=' + redirectUri + '&code=' + code,
        headers: {
		    'Content-Type': 'application/x-www-form-urlencoded'
	    }
    });
    let res = await r.json();
    let access_token = res.access_token;
    let patient_id = res.patient;
    main(patient_id, serviceUri, access_token);
}

// Convenience function for parsing of URL parameters
// based on http://www.jquerybyexample.net/2012/06/get-url-parameters-using-jquery.html
function getUrlParameter(sParam) {
    let sPageURL = window.location.search.substring(1);
    let sURLVariables = sPageURL.split('&');
    for (let i = 0; i < sURLVariables.length; i++)
    {
        let sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            let res = sParameterName[1].replace(/\+/g, '%20');
            return decodeURIComponent(res);
        }
    }
}

async function main(patient_id, service_uri, access_token){
    let url = service_uri + '/Patient?_id=' + patient_id;
    //Send the query with the SMART access token
    let request = new Request(url, {
        method: 'get',
        headers: {'Authorization': 'Bearer ' + access_token}
    });
    try{
        let response = await fetch(request);
        //Convert bundle into json
        let bundle = await response.json();
        //Parse bundle
        let patient = bundle.entry[0].resource;
        //Send name to the DOM
        document.getElementById("main-pre").innerHTML = patient.name[0].given[0] + ' ' + patient.name[0].family;
    }
    catch (error){
        document.getElementById("main-pre").innerHTML = error;
    }
}
