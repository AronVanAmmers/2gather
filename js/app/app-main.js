	var conn = null;

	$("#menu-toggle").click(function(e) {
	    e.preventDefault();
	    
	    $("#wrapper").toggleClass("active");
	    
	    if($('#main_icon').hasClass("fa-arrow-circle-o-left")){
	    	$('#main_icon').removeClass("fa-arrow-circle-o-left");
	    	$('#main_icon').addClass("fa-arrow-circle-o-right");
	    } else {
	    	$('#main_icon').removeClass("fa-arrow-circle-o-right");
	    	$('#main_icon').addClass("fa-arrow-circle-o-left");
	    }
	});
	
	$(".toggle-button").click(function(e) {
		var tb = $(this);
	    e.preventDefault();
	    if(tb.hasClass("fa-minus")){
	    	tb.removeClass("fa-minus");
	    	tb.addClass("fa-plus");
	    } else {
	    	tb.removeClass("fa-plus");
	    	tb.addClass("fa-minus");
	    }
	    
	    var body = $(this).parent().parent().parent().children('.panel-body');
	    
	    if (body.hasClass('collapsed')) {
	        // expand the panel
	    	body.slideDown();
	    	body.removeClass('collapsed');
	        if(body.attr("id") === "EditorBody" && !DBstarted){
	        	DBstarted = true;
	        	renderDB(important,0);
	        }
	    }
	    else {
	        // collapse the panel
	    	body.slideUp();
	    	body.addClass('collapsed');
	    }
	});
	
	$(window).unload(function() {
		if(conn != null && conn.readyState < 2){
			conn.close();
		}
	});
	
	$('#TreeView').on('nodeSelected', function(event, node) {
	    var nd = currentTree[node.nodeId];
	    $('#NodeId').html(nd.Id);
	    $('#NodeAddress').html(nd.Address);
	    $('#NodeParent').html(nd.Parent);
	    $('#NodeTime').html(nd.Time);
	    $('#NodeIndicator').html(nd.Indicator);
	    $('#NodeModel').html(nd.Model);
	    $('#NodeContent').html(nd.Content);
	    $('#NodeOwner').html(nd.Owner);
	    $('#NodeCreator').html(nd.Creator);
	    $('#NodeBehavior').html(nd.Behavior);
	});
	
	$( document ).ready(function() {
				
		initRPCEventHandlers();
		
		if (window["WebSocket"]) {
	        conn = new WebSocket("ws://localhost:3000/srpc");
	        
	        conn.onopen = function () {
	        	console.log("WebSockets connection opened.");
	        	ponos.GetTree();
	        }
	        
	        conn.onclose = function(evt) {
	            console.log("WebSockets connection closed.");
	        }
	        
	        conn.onmessage = function(evt) {	
	        	ponos.handleSRPC(evt.data);
	        }
	    } else {
	    	console.log("Your browser does not support WebSockets.");
	    }
		
	});
	