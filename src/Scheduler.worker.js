/* This worker generates the ticks for our drum machine
   at the specifid interval */

let timerID=null;
let interval=100;

// This next comment is necessary in order for 'npm run build' to work

// eslint-disable-next-line
self.onmessage=function(e){
	if (e.data=="start") {
        //console.log("begin generating ticks");
		timerID=setInterval(function(){postMessage("tick");},interval)
	}
	else if (e.data.interval) {
		interval=e.data.interval;
        //console.log("changing interval to "+interval);
        // we need to restart setInterval to the new interval
		if (timerID) {
			clearInterval(timerID);
			timerID=setInterval(function(){postMessage("tick");},interval)
		}
	}
	else if (e.data=="stop") {
		//console.log("stop generating ticks");
		clearInterval(timerID);
		timerID=null;
	}
};

postMessage('tick generator ready for action');