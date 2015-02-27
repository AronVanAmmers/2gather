
function TwoGather() {
	var COMMITTING = false;

	handlers = {};
	tgApi = new TwoGatherAPI();

	// Used to handle all incoming requests. It is set as the callback for
	// incominghttp requests. It parses the request URL into an object, then 
	// pass that object into the appropriate sub handler (should one exist).
	// Sub handlers needs to return a response object.
	this.handle = function(httpReq) {
		
		Println("Receiving");
		var urlObj = network.parseUrl(httpReq);
		// Error 400 bad request
		if (urlObj.error !== "") {
			return null;
		}
		var res = urlObj.path[0];
		var hFunc = handlers[res];
		// Return an error.
		if (typeof (hFunc) !== "function") {
			network.getHttpResponse(400,{},"Bad request: no resource named: " + urlObj.path[0] + ".");
		}
		var resp = hFunc(urlObj, httpReq);

		Println("RESPONSE OBJECT: " + JSON.stringify(resp));

		// Weak check, but this is clearly not a valid response.
		if (typeof (resp) !== "object" || resp.Body === undefined
				|| resp.Header === undefined || resp.Status === undefined) {
			return null;
		}
		return resp;
	}
	
	// Handle user requests. Warning! - Very sophisticated routing algorithm at work.
	handlers.user = function(urlObj,httpReq){
		var path = urlObj.path;
		if(path.length === 0 || path > 4){
			return network.getHttpResponse(400,{},"Bad request: invalid path.");
		} else if (path.length == 1){
			return doUser("", httpReq.Method, httpReq.Body);
		} else if (path.length == 2){
			return doUser(path[1], httpReq.Method, httpReq.Body);
		} else if (path.length == 3){
			if(path[2] === "videos"){
				return doVideo("","",httpReq.Method,httpReq.Body);
			} else if (path[2] === "subs"){
				Println("Sub request");
				return doSub("",httpReq.Method,httpReq.Body);
			}
		} else if (path.length == 4){
			if(path[2] === "videos"){
				return doVideo(path[1],path[3],httpReq.Method,httpReq.Body);
			} else if (path[2] === "subs"){
				return doSub(path[3],httpReq.Method,httpReq.Body);
			}
		} else {
			return network.getHttpResponse(400,{},"Bad request: malformed URL");
		}
	}
	
	handlers.txs = function(urlObj, httpReq) {
		Println("Getting tx");
		if(httpReq.Method === "GET") {			
			if(urlObj.path.length !== 2){
				return network.getHttpResponse(400,{},"Bad request: invalid path.");
			}
			var result = tgApi.checkTx(urlObj.path[1]);
			Printf("Got result of tx: %v\n",result);
			if(result === 0){
				return network.getHttpResponse(404,{},"Resource not found.");
			}
			return network.getHttpResponseJSON(result);
		} else {
			return network.getHttpResponse(400,{},"Bad request: method not supported (" + httpReq.Method + ")");
		}
	}

	handlers.mining = function(urlObj, httpReq) {
		Println("Mining");
		Println(httpReq.Method);
		if(httpReq.Method === "POST") {			
			if(urlObj.path.length !== 1){
				return network.getHttpResponse(400,{},"Bad request: invalid path.");
			}
			Println(httpReq.body);
			if (httpReq.Body === "on"){
				monk.AutoCommit(true);
			} else if (httpReq.Body === "off"){
				monk.AutoCommit(false);
			} else {
				return network.getHttpResponse(400,{}, "Bad request.");
			}
			return network.getHttpResponse(200,{}, "");
		} else {
			return network.getHttpResponse(400,{},"Bad request: method not supported (" + httpReq.Method + ")");
		}
	}

	handlers.session = function(urlObj, httpReq) {
		Println("Getting session.");
		if(httpReq.Method === "GET") {			
			if(urlObj.path.length !== 1){
				return network.getHttpResponse(400,{},"Bad request: invalid path.");
			}
			var user = tgApi.getSession();
			if(user === null){
				return network.getHttpResponse(404,{},"Resource not found.");
			}
			return network.getHttpResponseJSON(user);
		} else {
			return network.getHttpResponse(400,{},"Bad request: method not supported (" + httpReq.Method + ")");
		}
	}

	function doUser(username, method, body){
		if (method === "GET"){
			// This is a request to get user data.
			Println("Getting user: " + username);
			var user = tgApi.getUser(username);
			Println("User gotten. Type is: " + typeof(user));
			if (user === null){
				return network.getHttpResponse(404,{},"Resource not found.");
			}
			return network.getHttpResponseJSON(user);
		} else if (method === "POST"){
			// We get username from the body here.
			var nameObj = JSON.parse(body);
			if (nameObj.user_name === undefined || nameObj.user_name === ""){
				return network.getHttpResponse(400,{},"Bad request - malformed user name.");
			}
			var hash = tgApi.createAccount(nameObj.user_name);
			if (hash === "0x0"){
				return network.getHttpResponse(500,{},"Internal error - blockchain transaction not processed.");
			}
			// DEBUG
			if(COMMITTING){
				monk.Commit();
			}
			return network.getHttpResponseJSON(hash);
		} else if (method === "PATCH"){
			var user = tgApi.getUser(username);
			if (user === null){
				return network.getHttpResponse(404,{},"Resource not found.");
			}
			var patches = JSON.parse(body);
			if (patches[0] === undefined){
				return network.getHttpResponse(400,{},"Bad request - patch data not an array.");
			}
			var txHashes = [];
			for(var i = 0; i < patches.length; i++){
				var patch = patches[i];
				if (!isPatch(patch)){
					return network.getHttpResponse(400,{},"Bad request - patch data malformed.");
				}
				if(patch.field === "btc_address"){
					if(typeof(patch.value) !== "string" ){
						return network.getHttpResponse(400,{},"Bad request - patch data malformed.");
					}
					if(patch.op === "replace"){
						txHashes[i] = tgApi.setBTC(patch.value);
					} else {
						txHashes[i] = tgApi.setBTC("0x0");
					}
				} else if (patch.field === "doug_perm"){
					if(typeof(patch.value) !== "boolean" ){
						return network.getHttpResponse(400,{},"Bad request - patch data malformed.");
					}
					if(patch.op === "replace"){
						txHashes[i] = tgApi.setDOUGPerm(username, patch.value);
					} else {
						txHashes[i] = tgApi.setDOUGPerm(username, false);
					}
				} else if (patch.field === "blacklist_perm"){
					if(typeof(patch.value) !== "boolean" ){
						return network.getHttpResponse(400,{},"Bad request - patch data malformed.");
					}
					if(patch.op === "replace"){
						txHashes[i] = tgApi.setBlacklistPerm(username, patch.value);
					} else {
						txHashes[i] = tgApi.setBlacklistPerm(username, false);
					}
				} else {
					return network.getHttpResponse(400,{},"Bad request - no such field in user: " + patch.field);
				}
			}
			// DEBUG
			if(COMMITTING){
				monk.Commit();
			}
			return network.getHttpResponseJSON(txHashes);
		} else if (method === "DELETE"){
			Println("DELETING USER: " + username);
			var hash = tgApi.deleteAccount(username);
			if (hash === "0x0"){
				return network.getHttpResponse(500,{},"Internal error - blockchain transaction not processed.");
			}
			// DEBUG
			if(COMMITTING){
				monk.Commit();
			}
			return network.getHttpResponseJSON(hash);
		} else {
			return network.getHttpResponse(405,{},"Method not allowed: " + method);
		}
	}

	function doVideo(username,videoId, method, body){
		if (method === "GET"){
			// This is a request to get user data.
			Println("Getting video: " + username + "/" + videoId);
			var video = tgApi.getVideoData(username,videoId);
			if (video === null){
				return network.getHttpResponse(404,{},"Resource not found.");
			}
			return network.getHttpResponseJSON(video);
		} else if (method === "POST"){
			// We get videoId from the body here.
			var nameObj = JSON.parse(body);
			if (nameObj.name === undefined || nameObj.name === ""){
				return network.getHttpResponse(400,{},"Bad request - malformed video owner name.");
			}
			if (nameObj.url === undefined || nameObj.url === ""){
				return network.getHttpResponse(400,{},"Bad request - malformed video owner url.");
			}
			Println("Posting video: " + nameObj.name + "/" + nameObj.url);
			var hash = tgApi.addVideo(nameObj.name,nameObj.url);

			if (hash === "0x0"){
				return network.getHttpResponse(500,{},"Internal error - blockchain transaction not processed.");
			}
			// DEBUG
			if(COMMITTING){
				monk.Commit();
			}
			return network.getHttpResponseJSON(hash);
		} else if (method === "PATCH"){
			var video = tgApi.getVideoData(username,videoId);
			if (IsZero(video)){
				return network.getHttpResponse(404,{},"Resource not found.");
			}
			var patches = JSON.parse(body);
			if (patches[0] === undefined){
				return network.getHttpResponse(400,{},"Bad request - patch data must be a non-empty array.");
			}
			var txHashes = [];
			Println("ITERATING OVER PATCHES");
			for(var i = 0; i < patches.length; i++){
				var patch = patches[i];
				if (!isPatch(patch)){
					return network.getHttpResponse(400,{},"Bad request - patch data malformed.");
				}
				if(typeof(patch.value) !== "boolean" ){
					return network.getHttpResponse(400,{},"Bad request - patch data malformed.");
				}
				if(patch.field === "blacklist"){
					if(patch.op === "replace"){
						txHashes[i] = tgApi.blacklistById(username, videoId);
					} else {
						return network.getHttpResponse(501,{},"Not yet supported - Blacklisting can't be undone.");	
					}
				} else if (patch.field === "flag"){
					if(patch.op === "replace"){
						txHashes[i] = tgApi.flagVid(username, videoId);
					} else {
						txHashes[i] = tgApi.clearFlagById(username, videoId);
					}
				} else {
					return network.getHttpResponse(400,{},"Bad request - no such field in user: " + patch.field);
				}
			}
			// DEBUG
			if(COMMITTING){
				monk.Commit();
			}
			return network.getHttpResponseJSON(txHashes);
		} else if (method === "DELETE"){
			var hash = tgApi.removeVideo(videoId);
			if (hash === "0x0"){
				return network.getHttpResponse(500,{},"Internal error - blockchain transaction not processed.");
			}
			// DEBUG
			if(COMMITTING){
				monk.Commit();
			}
			return network.getHttpResponseJSON(hash);
		} else {
			return network.getHttpResponse(405,{},"Method not allowed: " + method);
		}
	}

	function doSub(username, method, body){
		if (method === "POST"){
			// We get username from the body here.
			var nameObj = JSON.parse(body);
			if (nameObj.user_name === undefined || nameObj.user_name === ""){
				return network.getHttpResponse(400,{},"Bad request - malformed sub name.");
			}
			var hash = tgApi.subTo(nameObj.user_name);

			if (hash === "0x0"){
				return network.getHttpResponse(500,{},"Internal error - blockchain transaction not processed.");
			}
			// DEBUG
			if(COMMITTING){
				monk.Commit();
			}

			return network.getHttpResponseJSON(hash);
		} else if (method === "DELETE"){
			var hash = tgApi.unSubTo(username);

			if (hash === "0x0"){
				return network.getHttpResponse(500,{},"Internal error - blockchain transaction not processed.");
			}

			// DEBUG
			if(COMMITTING){
				monk.Commit();
			}
			return network.getHttpResponseJSON(hash);
		} else {
			return network.getHttpResponse(405,{},"Method not allowed: " + method);
		}
	}

	function isPatch(obj){
		if(obj.op === undefined || obj.field === undefined || obj.value === undefined){
			return false;
		} 
		if (typeof(obj.op) !== "string" || (obj.op !== "replace" && obj.op !== "remove") ){
			return false;
		}
		return true;
	}

	// Init
	this.init = function(){
		tgApi.init();
	}

};


// *************************************** Initialization ***************************************

var tg = new TwoGather();
tg.init();

network.registerIncomingHttpCallback(tg.handle);
Println("2gather initialized");
