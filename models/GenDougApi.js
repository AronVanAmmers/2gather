function GenDougApi() {
	var gdaddr = sutil.stringToHex("0000000000THISISDOUG");

	var txs = {};
	//Doug Functions

	this.checkName = function(contractname){
		addr = esl.ll.Main(gdaddr, sutil.stringToHex("DOUG"),sutil.stringToHex(contractname));
		return addr
	}

	this.register = function(contractname, contractaddr){
		var txData = [];
		txData.push("register");
		txData.push(contractname);
		txData.push(contractaddr);

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	//Variable Functions
	this.varType = function(varname){
		type = esl.stdvar.Type(gdaddr, sutil.stringToHex(varname));
		return type
	}

	this.getVar = function(varname, key, elnum){
		type = this.varType(varname);
		if(type === "single"){
			return esl.single.Value(gdaddr, sutil.stringToHex(varname));
		}else if(type === "double"){
			return esl.double.Value(gdaddr, sutil.stringToHex(varname));
		}else if(type === "linkedlist"){
			if(typeof key === "undefined"){
				return esl.ll.GetPairs(gdaddr, sutil.stringToHex(varname));
			} else {
				return esl.ll.Main(gdaddr,sutil.stringToHex(varname), key);
			}
		}else if(type === "keyvalue"){
			if(typeof key === "undefined"){
				return null
			}else{
				return esl.kv.Value(gdaddr, sutil.stringToHex(varname), key);
			}
		}else if(type === "array"){
			if(typeof key === "undefined" || typeof elnum === "undefined"){
				return null
			}else{
				return esl.array.Element(gdaddr, sutil.stringToHex(varname), key, elnum)
			}
		}else {
			return null
		}
	}

	this.setVar = function(varname, type, args){
		var txData = [];
		txData.push("setvar");
		txData.push(type);
		if(type == "single"){
			txData.push(args.Value[0]);
		}else if (type == "double"){
			txData.push(args.Value[0]);
			txData.push(args.Value[1]);
		}else if (type == "linkedlist"){
			txData.push(args.Key);
			txData.push(args.Value[0]);
		}else if (type == "keyvalue"){
			txData.push(args.Key);
			txData.push(args.Value[0]);
		}else if (type == "array"){
			txData.push(args.Key);
			txData.push(args.Enum);
			txData.push(args.Value);
		}else {
			return null
		}

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	this.initVar = function(varname, type, esize){
		var txData = [];
		txData.push("setvar");
		txData.push(type);
		if (type == "array"){
			esize = (typeof esize === "undefined") ? "0x100" : esize;
			txData.push(esize);
		}

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	//Permissions
	this.checkPerm = function(permname, target){
		pslot = esl.ll.Main(gdaddr, sutil.stringToHex("permnames"), sutil.stringToHex(permname));
		if (Equals(pslot,"0x0")){
			return null
		}

		pval = esl.array.Element(gdaddr,sutil.stringToHex("perms"),target,pslot);
		gpval = esl.kv.Value(gdaddr,sutil.stringToHex("global"),sutil.stringToHex(permname));
		geval = esl.array.Element(gddr,sutil.stringToHex("exclude"),target,pslot);

		if (Equals(pval,"0x0") && Equals(geval,"0x0")){
			return pval
		} else {
			return gpval
		}
	}

	this.addPerm = function(permname){
		var txData = [];
		txdata.push("addperm");
		txData.push(permname);

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	this.rmPerm = function(permname){
		var txData = [];
		txdata.push("rmperm");
		txData.push(permname);

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	this.setPerm = function(permname, target, value){
		var txData = [];
		txData.push("setperm");
		txData.push(permname);
		txData.push(target);
		txData.push(value);

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	this.setGlobal = function(permname, value)
		var txData = [];
		txData.push("setglobal");
		txData.push(permname);
		txData.push(value);

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	this.setExclude = function(permname, target, value){
		var txData = [];
		txData.push("setperm");
		txData.push(permname);
		txData.push(target);
		txData.push(value);

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	//Transaction Tracking
	this.trackTx = function(txHash){
		Println("Added hash for tracking: " + txHash.slice(0,6) + "...");
		var txObj = this.newTxObj();
		txObj.status = 1;
		txs[txHash] = txObj;
		Println("Added tx data");
	}

	this.checkTx = function(txHash){
		Println("CHECKING HASH: " + txHash);
		var txObj = txs[txHash];
		if(txObj === undefined){
			return 0;
		}

		return txObj.status;
	}
		
	this.newTxObj = function(){
		return {"status" : 0 };
	}
}