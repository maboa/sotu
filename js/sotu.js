/*
 * Dual licensed under the MIT and GPL licenses.
 *  - http://www.opensource.org/licenses/mit-license.php
 *  - http://www.gnu.org/copyleft/gpl.html
 *
 * Authors: Mark Boas, Mark J Panaghiston
 *
 * For: Al-Jazeera and OpenNews
 *
 * Date: 4th October 2012
 */

$(document).ready(function(){   

	// The prefix variables should always be populated

	var dataMs = "data-ms";


	var fbTitle = "The President Addresses A Joint Session of Congress (Feb 2009)";

	var locationUrl = (window.location != window.parent.location) ? document.referrer: document.location;

	var hashTag = "#SOTU";

	var operaBarChartFix = true;

	var searchDefault = "search transcript";

	$('#searchStr').focus();
	$('#searchStr').attr('value',searchDefault);

	$('#main-loader').append('.');
	var bars = 40;
	var data = new Array(bars);

	var maxData = 0;
	var tPause = 0;


	// NB: IE8 D3 support https://github.com/mbostock/d3/issues/619
	// Added Sizzle and es5-shim, but fails silently in IE8.

	// Expose these functions to main scope.
	var initPieCharts = function() {};


		// Closure to keep local vars away from main scope.
	(function() {
		// var pie, arc, arcs, arcLabels, pie_dur, r;

		var w = 52, //width
			h = 52, //height
			r = 20, //radius
			pie_dur = 2000, // 750; // ms
			// color = d3.scale.category20c(), // builtin range of colors
			color = ["#444","#fff"], // Changed to define an array. Usually this is a function!
			pie = d3.layout.pie().sort(null),
			arc = d3.svg.arc().outerRadius(r), //this will create <path> elements for us using arc data
			arcs, arcLabels;


		initPieCharts = function(id, idata) {

			//$('.address-pie').empty();

			// var data = [{"label":"-", "value":1},{"label":"-", "value":1}];

			var data = [0,1]; // [dem, rep]
			//var labels = ['Dem','Rep'];

			var svg = d3.select(id)
				.append("svg:svg") //create the SVG element inside the <body>
				// .data([data]) //associate our data with the document
				.attr("width", w) //set the width and height of our visualization (these will be attributes of the <svg> tag
				.attr("height", h)
				.style("padding", "2px");
				// .append("svg:g") //make a group to hold our pie chart
				// .attr("transform", "translate(" + r + "," + r + ")") //move the center of the pie chart from 0, 0 to radius, radius

			var arc_grp = svg.append("svg:g")
				.attr("class", "arcGrp")
				.attr("transform", "translate(" + r + "," + r + ")"); //move the center of the pie chart from 0, 0 to radius, radius


			// DRAW ARC PATHS
			arcs = arc_grp.selectAll("path")
				.data(pie(data));
			arcs.enter().append("svg:path")
				.attr("stroke", "#444")
				.attr("stroke-width", 1)
				.attr("fill", function(d, i) {return color[i];}) // Note using an array and not usual color(i) functions.
				.attr("d", arc)
				.each(function(d) {this._current = d});

			data = idata;

			arcs.data(pie(data)); // recompute angles, rebind data
			arcs.transition().ease("elastic").duration(pie_dur).attrTween("d", arcTween);

		};

		// initPieChart();

		// Store the currently-displayed angles in this._current.
		// Then, interpolate from this._current to the new angles.
		function arcTween(a) {
			var i = d3.interpolate(this._current, a);
			this._current = i(0);
			return function(t) {
				return arc(i(t));
			};
		}
	})();		

	


	initPieCharts('#address-pie-13',[2,2]);
	initPieCharts('#address-pie-12',[2,3]);
	initPieCharts('#address-pie-11',[2,1]);
	initPieCharts('#address-pie-10',[2,2.5]);
	initPieCharts('#address-pie-09',[2,1.5]);

	/*$('.mini-footer').slideUp(function() {
		$('.footer').slideDown(function() {
			drawStackedChart();
		});
		$('.body.row').animate({bottom: '164px'}, 500);
		$('#fade-bot').animate({top: '554px'}, 500);
		$('#transcript-inst-panel').fadeOut();
	});*/




	function drawStackedChart(data) {
		$('#chart').empty();
		var parseDate = d3.time.format("%Y-%m").parse,
		    formatYear = d3.format("02d"),
		    formatDate = function(d) { return "Q" + ((d.getMonth() / 3 | 0) + 1) + formatYear(d.getFullYear() % 100); };

		var margin = {top: 10, right: 20, bottom: 20, left: 20},
		    width = 736 - margin.left - margin.right,
		    height = 100 - margin.top - margin.bottom;

		var y0 = d3.scale.ordinal()
		    .rangeRoundBands([height, 0], .2);

		var y1 = d3.scale.linear();

		var x = d3.scale.ordinal()
		    .rangeRoundBands([0, width], .1, 0);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom")
		    .tickFormat(formatDate);

		var nest = d3.nest()
		    .key(function(d) { return d.group; });

		var stack = d3.layout.stack()
		    .values(function(d) { return d.values; })
		    .x(function(d) { return d.date; })
		    .y(function(d) { return d.value; })
		    .out(function(d, y0) { d.valueOffset = y0; });

		var color = d3.scale.category10();

		var svg = d3.select("#chart").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		d3.tsv("data.tsv", function(error, data) {

		  data.forEach(function(d) {
		    d.date = parseDate(d.date);
		    d.value = +d.value;
		  });

		  var dataByGroup = nest.entries(data);

		  stack(dataByGroup);
		  x.domain(dataByGroup[0].values.map(function(d) { return d.date; }));
		  y0.domain(dataByGroup.map(function(d) { return d.key; }));
		  y1.domain([0, d3.max(data, function(d) { return d.value; })]).range([y0.rangeBand(), 0]);

		  var group = svg.selectAll(".group")
		      .data(dataByGroup)
		    .enter().append("g")
		      .attr("class", "group")
		      .attr("transform", function(d) { return "translate(0," + y0(d.key) + ")"; });

		  group.append("text")
		      .attr("class", "group-label")
		      .attr("x", -6)
		      .attr("y", function(d) { return y1(d.values[0].value / 2); })
		      .attr("dy", ".35em")
		      .text(function(d) { return d.key; });

		  group.selectAll("rect")
		      .data(function(d) { return d.values; })
		    .enter().append("rect")
		      .style("fill", function(d) { return color(d.group); })
		      .attr("x", function(d) { return x(d.date); })
		      .attr("y", function(d) { return y1(d.value); })
		      .attr("width", x.rangeBand())
		      .attr("height", function(d) { return y0.rangeBand() - y1(d.value); });

		  group.filter(function(d, i) { return !i; }).append("g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + y0.rangeBand() + ")")
		      .call(xAxis);

		  d3.selectAll("input").on("change", change);

		  var timeout = setTimeout(function() {
		    d3.select("input[value=\"stacked\"]").property("checked", true).each(change);
		  }, 2000);

		  function change() {
		    clearTimeout(timeout);
		    if (this.value === "multiples") transitionMultiples();
		    else transitionStacked();
		  }

		  function transitionMultiples() {
		    var t = svg.transition().duration(750),
		        g = t.selectAll(".group").attr("transform", function(d) { return "translate(0," + y0(d.key) + ")"; });
		    g.selectAll("rect").attr("y", function(d) { return y1(d.value); });
		    g.select(".group-label").attr("y", function(d) { return y1(d.values[0].value / 2); })
		  }

		  function transitionStacked() {
		    var t = svg.transition().duration(750),
		        g = t.selectAll(".group").attr("transform", "translate(0," + y0(y0.domain()[0]) + ")");
		    g.selectAll("rect").attr("y", function(d) { return y1(d.value + d.valueOffset); });
		    g.select(".group-label").attr("y", function(d) { return y1(d.values[0].value / 2 + d.values[0].valueOffset); })
		  }
		});
	}









	function drawBarChart(data) {
		console.dir(data);
		$('#chart').empty();
		var barWidth = 14;
		var width = (barWidth + 4) * data.length;
		var height = 70;
		var bottomPadding = 20;

		var colorlist = ["#ffcccc", "#ccccff"];

		//if ($('#repCb:checked').val()) {
			colorlist[0]="#dc3912";
		//}

		//if($('#demCb:checked').val()) {
			colorlist[1]="#3366cc";	
		//}

		var paddingList = [1,-1];

		var x = d3.scale.linear().domain([0, data.length]).range([0, width]);
		var y = d3.scale.linear().domain([0, d3.max(data, function(datum) { return datum.s; })]).
		  rangeRound([0, height]);

		// add the canvas to the DOM


		var barDemo = d3.select("#chart").
		  append("svg:svg").
		  attr("width", width).
		  attr("height", height+bottomPadding);


		barDemo.selectAll("rect").
		  data(data).
		  enter().
		  append("svg:rect").
		  attr("x", function(datum, index) { return x(index) + paddingList[index % 2]; }).
		  attr("y", function(datum) { return height - y(datum.s); }).
		  attr("height", function(datum) { return y(datum.s); }).
		  attr("width", barWidth).
		  attr("fill", function(d, i) { return colorlist[i % 2]; });

		// text on bars

		barDemo.selectAll("text").
		  data(data).
		  enter().
		  append("svg:text").
		  attr("x", function(datum, index) { return x(index) + barWidth + paddingList[index % 2]; }).
		  attr("y", function(datum) { return height - y(datum.s); }).
		  attr("dx", -barWidth/2 ).
		  attr("dy", "1em").
		  attr("text-anchor", "middle").
		  filter(function(datum){return datum.s > 0}). 
		  text(function(datum) { return datum.s;}).
		  attr("fill", "white");

		var rules = barDemo.append("g");

    // Add rules

  	rules = rules.selectAll(".rule")
   		.data(y.ticks(d3.max(data, function(datum) { return datum.s; })))
    	.enter().append("g")
    	.attr("class", "rule")
    	.attr("transform", function(d) { return "translate(0," + y(d) + ")"; });
  
  	rules.append("line")
      .attr("x2", width);

    var xScale = d3.scale.linear().domain([5,95]).range([width/20, width-width/20]);


		var xAxis = d3.svg.axis()
     .scale(xScale)
     .orient("bottom")
     .ticks(20);

		// Add an axis 
  	barDemo.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + (height) + ")")
      .call(xAxis);

    barDemo.selectAll("rect").on("click", function(d,i) {

  	});

		maxData = d3.max(data, function(datum) { return datum.s; });

	}


		
	var theScript = [];  
	var mediaDirM = "http:/";
	var mediaDirW = "http://webapps.aljazeera.net/aje/custom/debate/d4";
	var transcriptDir = "transcripts";  

	var videoM = [];
	var videoW = [];

	// Array of Objects to hold media information.
	var addressInfo = [
		{
			id: "09",
			title: "The President Addresses A Joint Session of Congress (Feb 2009)",
			color: "#1f77b4",
			transcript: "sotu2009.htm",
			videoM: {
				lo: "www.whitehouse.gov/videos/2009/February/20090224_JointSession.mp4",
				me: "www.whitehouse.gov/videos/2009/February/20090224_JointSession.mp4",
				hi: "www.whitehouse.gov/videos/2009/February/20090224_JointSession.mp4",
				hd: "www.whitehouse.gov/videos/2009/February/20090224_JointSession.mp4"
			},
			videoW: {
				lo: "debate4.webm",
				me: "debate4.webm",
				hi: "debate4.webm",
				hd: "debate4.webm"
			}
		},
		// The rest only the id, title and color have been set
		{
			id: "10",
			title: "State Of The Union Address (Jan 2010)",
			color: "#ff7f0e",
			transcript: "sotu2010.htm",
			videoM: {
				lo: "happyworm.com/video/m4v/sotu-2010.mp4",
				me: "happyworm.com/video/m4v/sotu-2010.mp4",
				hi: "happyworm.com/video/m4v/sotu-2010.mp4",
				hd: "happyworm.com/video/m4v/sotu-2010.mp4"
			},
			videoW: {
				lo: "debate4.webm",
				me: "debate4.webm",
				hi: "debate4.webm",
				hd: "debate4.webm"
			}
		},
		{
			id: "11",
			title: "State Of The Union Address (Jan 2011)",
			color: "#2ca02c",
			transcript: "sotu2009.htm",
			videoM: {
				lo: "20090224_JointSession.mp4",
				me: "20090224_JointSession.mp4",
				hi: "20090224_JointSession.mp4",
				hd: "20090224_JointSession.mp4"
			},
			videoW: {
				lo: "debate4.webm",
				me: "debate4.webm",
				hi: "debate4.webm",
				hd: "debate4.webm"
			}
		},
		{
			id: "12",
			title: "State Of The Union Address (Jan 2012)",
			color: "#d62728",
			transcript: "sotu2009.htm",
			videoM: {
				lo: "20090224_JointSession.mp4",
				me: "20090224_JointSession.mp4",
				hi: "20090224_JointSession.mp4",
				hd: "20090224_JointSession.mp4"
			},
			videoW: {
				lo: "debate4.webm",
				me: "debate4.webm",
				hi: "debate4.webm",
				hd: "debate4.webm"
			}
		},
		{
			id: "13",
			title: "State Of The Union Address (Feb 2013)",
			color: "#9467bd",
			transcript: "sotu2009.htm",
			videoM: {
				lo: "20090224_JointSession.mp4",
				me: "20090224_JointSession.mp4",
				hi: "20090224_JointSession.mp4",
				hd: "20090224_JointSession.mp4"
			},
			videoW: {
				lo: "debate4.webm",
				me: "debate4.webm",
				hi: "debate4.webm",
				hd: "debate4.webm"
			}
		},
	];

/*
	// mp4

	videoM['lo'] = "20090224_JointSession.mp4";
	videoM['me'] = "20090224_JointSession.mp4";
	videoM['hi'] = "20090224_JointSession.mp4";
	videoM['hd'] = "20090224_JointSession.mp4";

	// webm

	videoW['lo'] = "debate4.webm";
	videoW['me'] = "debate4.webm";
	videoW['hi'] = "debate4.webm";
	videoW['hd'] = "debate4.webm";
*/

	var latency = 1000;

	var theScriptState = [];

	var theScriptLength = theScript.length; 
		
		
	var currentyLoaded = "";
	var currentTime = 0;
	var hints = true;
	var playSource = true;
		

		
	var myPlayer = $("#jquery_jplayer_1");
	
	// moved jPlayer instancing to loadFile()

	$.jPlayer.timeFormat.showHour = true;

	var i = 0;
   

		// These events are fired as play time increments  

		var playingWord = 1;    
		
		
		// transcript links to audio

		$('#transcript').delegate('span','click',function(e){ 
			playSource = true;
			tPause = 0; 
			endTime = null;
			var jumpTo = $(this).attr(dataMs)/1000; 
			myPlayer.jPlayer("play",jumpTo);  
			$('#play-btn-source').hide();
			$('#pause-btn-source').show();  

			/*e.stopPropagation();
			e.preventDefault(); 
    	e.stopImmediatePropagation();*/

    	_gaq.push(['_trackEvent', 'USElect', 'Word clicked', 'word '+$(this).text()]);
		   
			return false;
		});     
		
		var index = "";
		var filename = "";
		var end = "";
		var start = ""; 
		var mediaId = "";
		
		myPlayer.bind($.jPlayer.event.ended, function() {  
			// 
		}); 

		myPlayer.bind($.jPlayer.event.timeupdate, function(event) {       
			currentTime = event.jPlayer.status.currentTime; 
    });

		/* load in the file */  

		// loadFile('sotu2009');
		// loadFile(0); // Now an index to addressInfo array
		loadFile('09'); // Now the id string

		function initPopcorn(id) {   
			var p = Popcorn(id)
			.code({
			  start: 0,
		    onStart: function (options) {
		         //console.log('start')
		     },
		     onFrame: (function () {



				// Warning: This might start polling before the transcript is loaded and ready.

		        var count = 0;
		        var endedLoop = false;
		        
		        return function (options) {

		       	//console.log('here');
					
            var now = this.Popcorn.instances[0].media.currentTime*1000;  

            //console.log("now="+now/100);
            //console.log("end="+endTime); 

            if (endTime && endTime < (now / 100) ) {
            	myPlayer.jPlayer("pause");
            	endTime = null;
            }
					
						var src = "";

						if (endedLoop == true) {
							index = 0;
							endedLoop = false;
							end = -1;
							//console.log("e now="+now);
							//console.log("e end="+end);
							myPlayer.jPlayer("pause");
							//console.log('ended loop');
						}

						if (now > end && playSource == false) {   

							//console.log('in');

          		//myPlayer.jPlayer("pause"); // MJP: Looks like old code. Commented out.
							index = parseInt(index);

							// check for the end

							

							if (theScript.length < (index+1) && now > end) {
								myPlayer.jPlayer("pause");

								//console.log("paused");

								// check for loop

								

								if (getUrlVars()["l"] != null) {
									endedLoop = true;
								} else {
									tPause = 0;
									playSource = true;
								}
							} 
							
							if (theScript.length > index) {  

								// moving to the next block in the target

								      

								start = theScript[index].s;   
								end = theScript[index].e;

								//console.log(start);
								//console.log(end);
								//console.log(now);

							
								//myPlayer.bind($.jPlayer.event.progress + ".fixStart", function(event) {
									//console.log("p now="+now);
									//console.log("p end="+end);
									// Warning: The variable 'start' must not be changed before this handler is called.
							   // $(this).unbind(".fixStart"); 
							    //console.log('log about to play from '+start);
									myPlayer.jPlayer("play",start/1000);
									index = index + 1; 
									//end = theScript[index].e;
								//});

				
								//myPlayer.jPlayer("pause",start);   
							}



						}
		      }
		    })(),
		    onEnd: function (options) {
		         //console.log('end');
		    }
			}); 
			return p; 
		};

		$('.quality-switch').click(function(){
			var timeOnClick = currentTime;
			var quality = $(this).attr('q');
			var mediaMp4 = mediaDirM+'/'+videoM[quality];
			var mediaWebM = mediaDirW+'/'+videoW[quality];
			// IE9 needs a fix to support SetMedia followed by play(time). It works for all browsers.
			myPlayer.bind($.jPlayer.event.progress + ".ie9fix", (function(time) {
				return function() {
					$(this).unbind(".ie9fix");
					$(this).jPlayer("play",time);
				};
			})(timeOnClick));
			myPlayer.jPlayer('setMedia', {m4v: mediaMp4, webmv: mediaWebM});
			// myPlayer.jPlayer('play',timeOnClick);
			$('.jp-quality-ctrl').fadeOut();
			$('.quality-btn').hide();
			$('.quality-btn[q="'+quality+'"]').show();
			//$('.jp-video-busy').show();

			_gaq.push(['_trackEvent', 'USElect', 'Quality button', 'switched to '+$(this).attr('q')]);

			return false;
		})	

		$('.quality-btn').click(function(){

			if ($('.jp-quality-ctrl').is(':visible')) { 

				$('.jp-quality-ctrl').fadeOut();
				$('.fs-quality-ctrl').fadeOut();
					
			} else {
				$('.jp-quality-ctrl').fadeIn();
			}

			_gaq.push(['_trackEvent', 'USElect', 'Quality button', 'clicked']);

			return false;
		});


		$('.address-summary').click(function() {
			
			var year = $(this).attr('data-addr');

			// $('.address-summary').css('backgroundColor','#eee').css('border-width','0px');
/*			
			var colour = "#fff";
			var titleText = "";

			switch (year) {
				case "13":
					colour = "#9467bd";
					titleText = "State Of The Union Address (Feb 2013)";
					break;
				case "12":
					colour = "#d62728";
					titleText = "State Of The Union Address (Jan 2012)";
					break;
				case "11":
					colour = "#2ca02c";
					titleText = "State Of The Union Address (Jan 2011)";
					break;
				case "10":
					colour = "#ff7f0e";
					titleText = "State Of The Union Address (Jan 2010)";
					break;
				case "09":
					colour = "#1f77b4";
					titleText = "The President Addresses A Joint Session of Congress (Feb 2009)";

					break;
			}
*/
			// var addrInfo = setTitle(year);

			// $(this).css('backgroundColor','#fff').css('border-style','solid').css('border-bottom-width','2px').css('border-top-width','2px').css('border-color',colour);
			// $(this).css('backgroundColor','#fff').css('border-style','solid').css('border-bottom-width','2px').css('border-top-width','2px').css('border-color',addrInfo.color);

			// $('.control').css('backgroundColor',colour).text(titleText);

			loadFile(year);

			return false;
		});

		// $('.address-summary [data-addr="value"]')

		function setTitle(id) {
			var rObj = {
				title: "",
				color: "#fff"
			};

			var i = getAddressIndex(id);
			if(i >= 0) {
				rObj = addressInfo[i];
				$('.address-summary').css('backgroundColor','#eee').css('border-width','0px');
				$('.address-summary').filter('[data-addr="' + id + '"]').css('backgroundColor','#fff').css('border-style','solid').css('border-bottom-width','2px').css('border-top-width','2px').css('border-color',rObj.color);
				$('.control').css('backgroundColor',rObj.color).text(rObj.title);
			}
			return rObj;
		}

		function getAddressIndex(id) {
			var r;
			$.each(addressInfo, function(i) {
				if(this.id === id) {
					r = i;
					return false; // exit $.each
				}
			});
			return r;
		}

		function initTranscript(p) {
			//console.log("initTranscript in "+(new Date()-startTimer));
			$("#transcript-content span").each(function(i) {  
				// doing p.transcript on every word is a bit inefficient - wondering if there is a better way
				p.transcript({
					time: $(this).attr(dataMs) / 1000, // seconds
					futureClass: "transcript-grey",
					target: this,
					onNewPara: function(parent) {
						$("#transcript-content").stop().scrollTo($(parent), 800, {axis:'y',margin:true,offset:{top:0}});
					}
				});
			});
			//console.log("initTranscript out "+(new Date()-startTimer));
		}

		// Reviewed recursively async adding the plugins to avoid lock up at start.
		// It worked, but took a long time to complete.
		// Plus, you could scroll down in text way ahead of this function loop and click on word, which kinda broke it...
		// As it was not setup for that word yet.
		function initTranscriptAsync(p) {
			var $trans = $("#transcript-content span");
			var asyncTrans = function(i) {
				if(i < $trans.length) {
					p.transcript({
						time: $($trans[i]).attr(dataMs) / 1000, // seconds
						futureClass: "transcript-grey",
						target: $trans[i],
						onNewPara: function(parent) {
							$("#transcript-content").stop().scrollTo($(parent), 800, {axis:'y',margin:true,offset:{top:0}});
						}
					});
					setTimeout(function() {
						asyncTrans(i+1);
					},0);
				}
			};
			asyncTrans(0);
		}

		$('rect,text').live('click',function(e){
			playSource = true;
			tPause = 0;
			var top = $('#chart').offset().top;
			var height = $('#chart').height();
			var piece = (maxData-1) - (Math.floor((e.clientY-top) / (height/maxData)));

			// text items are placed next to rects affecting their indexes so we need to mod

			var gIndex = $(this).index() % bars;
			var m = hitsDetails[gIndex][piece];
			jumpTo = m/1000;
			myPlayer.jPlayer("play",jumpTo);  

			var $target = $('#transcript-content span[m="'+m+'"]').parent(); // The paragraph of the word.

			$target = $target.prev().length ? $target.prev() : $target; // Select the previous paragraph if there is one.
			// Transcript has progressed beyond last paragraph, select last. Prevents crash in jquery
    	$target = $target.length ? $target : $("#transcript-content span").last().parent();
    
    	$("#transcript-content").stop().scrollTo($target, 1000, {axis:'y',margin:true});

    	_gaq.push(['_trackEvent', 'USElect', 'Bar chart clicked', 'Bar '+gIndex]);

			return false;
		});
		
		var startTimer = new Date();

		// Flag to load in the transcripts for the search system the first time loadFile() called.
		var requireMultiTranscripts = true;
		var loadNextTranscript = function(i) {
			if(i < addressInfo.length) {
				// Create a divider for the transcript
				var transElem = document.createElement('div');
				// $('#transcript-collection').append('<div id="' + this.title '" data-i="' + i '"></div>');
				$('#transcript-collection').append(transElem);

				$(transElem)
				.attr('id', 'transcript-' + i)
				.attr('data-i', i)
				.load(transcriptDir + '/' + addressInfo[i].transcript, function() {
					loadNextTranscript(++i);
				});
			} else {
				// Finished loading transcripts
				console.log('loaded hidden transcripts');
			}
		};
		function loadMultiTranscripts() {
			if(requireMultiTranscripts) {
				requireMultiTranscripts = false;
				// load in the transcripts.
				loadNextTranscript(0);
			}
		}

		function loadFile(id) { 

			var ai = getAddressIndex(id);
			if(ai < 0) {
				return; // invalid address id.
			}

			// Setup the legacy variables
			videoM = addressInfo[ai].videoM;
			videoW = addressInfo[ai].videoW;

			checkEasterParam();

			$('#main-loader').append('.');
			// var file = transcriptDir+'/'+id+'.htm'; 
			var file = transcriptDir+'/'+addressInfo[ai].transcript; 

			var mediaMp4 = mediaDirM+'/'+videoM['me'];
			var mediaWebM = mediaDirW+'/'+videoW['me'];
			 
			// MJP: Next line appears obsolete.
			// currentlyPlaying = id;

			setTitle(id);

			var p, busySeekId, busyWaitId, delayBusy = 250, loadTrans = function() {
				//console.log("loadTrans in "+(new Date()-startTimer));
				// $('#load-status').html('loading ...');

				$('#transcript-content').load(file, function() {
					//console.log("loaded Transcript "+(new Date()-startTimer));
				  	//load success!!!     
					initTranscript(p);

					$('#main-loader').append('.');

					// MJP: Next line appears obsolete.
					// $.data(myPlayer,'mediaId',id);
					

					checkStartParam();
					checkKeywordParam();

					myPlayer.jPlayer("volume", 1); // max volume

					//$('.jp-video-busy').show();
					//$('#transcript').animate({scrollTop: $("#page").offset().top}, 2000);

					loadMultiTranscripts(); // Load in the other trans now the initial one ready for use.
				});
				//console.log("loadTrans out "+(new Date()-startTimer));

				// ugly chrome fix to stop scroll-bar disappearing

				/*var bodyRow = $('.body.row');
				var bottom = parseInt(bodyRow.css('bottom').replace('px',''));
				bodyRow.animate({bottom: bottom+1+'px'}, 500);
				bodyRow.animate({bottom: bottom+'px'}, 500);*/

				// end ugly chrome fix
			};

			// Destroy the old jPlayer instance
			myPlayer.jPlayer('destroy');

			myPlayer.jPlayer({
				ready: function (event) {
					if(event.jPlayer.html.used && event.jPlayer.html.video.available) {
						p = initPopcorn('#' + myPlayer.data("jPlayer").internal.video.id);
					} else {
						$(this).jPlayer('option', 'emulateHtml', true);
						p = initPopcorn('#' + myPlayer.attr('id'));
						$(this).trigger($.jPlayer.event.loadeddata);
					}
					$(this).jPlayer("setMedia", {
						m4v: mediaMp4,
						webmv: mediaWebM,
						poster: "poster.jpg"
					});
					setTimeout(function() {
						loadTrans();
					}, 1000);
				},
				seeking: function() {
					clearTimeout(busySeekId);
					busySeekId = setTimeout(function() {
						$('.jp-video-busy').show();
					},delayBusy);
				},
				seeked: function() {
					clearTimeout(busySeekId);
					$('.jp-video-busy').hide();
				},
				waiting: function() {
					clearTimeout(busyWaitId);
					busyWaitId = setTimeout(function() {
						$('.jp-video-busy').show();
					},delayBusy);
				},
				playing: function() {
					clearTimeout(busyWaitId);
					$('.jp-video-busy').hide();
				},
				solution: "html, flash",
				swfPath: "js",
				supplied: "m4v,webmv",
				preload: "auto",
				size: {
					width: "720px",
					height:"405px",
					cssClass: "jp-video-360p"
				}
			});
		} 
		

		

		// select text function

		function getSelText()
		{
			var txt = '';
			if (window.getSelection){
				txt = window.getSelection();
			}
			else if (document.getSelection){
				txt = document.getSelection();
			}
			else if (document.selection){
				txt = document.selection.createRange().text;
			}          

			return txt;
		}


		$('#transcript-content').mouseup(function(e){     

			playSource = true;
			tPause = 0;
			
			var s = 0, e = 0;
	 		var select = getSelText(); 
	  		var tweetable = select+"";  

			var startSpan = select.anchorNode.nextSibling; 
			if (startSpan == null) {
				startSpan = select.anchorNode.parentNode;
			}
			
			var endSpan = select.focusNode.nextSibling;    
			if (endSpan == null) {  
				endSpan = select.focusNode.parentNode.nextElementSibling; 
				if (endSpan == null) {
					endSpan = select.focusNode.parentNode;
				}
			}     
			
			// We can do this better by looking at the complete tweet once generated and then removing from inside the quote until it fits 140 chars 
			
			if (tweetable.length > 78) {
				tweetable = tweetable.substr(0,75)+'...';
			}
						      
			
			// Short and sweet      
			
			var s = Math.floor(parseInt(startSpan.getAttribute(dataMs))/100); 
			var e = Math.floor(parseInt(endSpan.getAttribute(dataMs))/100);   
			
			// Make sure s < e
			
			if (s > e) {
				var temp = e;
				e = s;
				s = temp;
			}
			  
			// Check that it isn't a single click ie endtime is not starttime   
			// Also that tweetable is > 0 in length
			
			if (tweetable.length > 0) {    
			
				// Clean up window.location in case it already has params on the url    
			
				var winLoc = locationUrl;      
				var url = winLoc;
				var paramStart = winLoc.indexOf('?');   
			
				if (paramStart > 0) {
					url = winLoc.substr(0,paramStart);
				}
			 
				var theTweet = "'"+tweetable+"' "+url+"?s="+s+"-"+e+" "+hashTag;//+"&e="+e;  
				 
				$('.share-snippet').empty();
				$('.share-snippet').append(theTweet);  
				$('#tweet-like').empty();
				$('#tweet-like').append('<script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script><a data-url="" data-text="'+theTweet+'" href="http://twitter.com/share?url=none&count=none" class="twitter-share-button">Tweet</a>');  
				
				// uncomment this line when we go live!
				//url = "http://www.aljazeera.com/indepth/interactive/2012/10/20121049528478583.html";
				var fbLink = "http://www.facebook.com/sharer.php?s=100&p[title]="+fbTitle+"&p[url]="+url+"&p[summary]="+encodeURIComponent(tweetable);
				//var fbLink = "http://www.facebook.com/sharer.php?u="+url+"?s="+s+"-"+e;
				$('#fb-link').attr('href',fbLink);
				$('#fb-link').show();
				

				//http://www.facebook.com/sharer.php?s=100&p[title]=titlehere&p[url]=http://www.yoururlhere.com&p[summary]=yoursummaryhere&p[images][0]=http://www.urltoyourimage.com

				_gaq.push(['_trackEvent', 'USElect', 'Tweet generated', 'Tweet content '+theTweet]);
			} 
		}); 

		$('#transcript-content-hint').click(function() {
			$(this).fadeOut('slow');
			hints = false;
		});


		$('#play-btn-source').click(function(){
			myPlayer.jPlayer("play");
			$(this).hide();
			$('#pause-btn-source').show();
			return false;
		});

		$('#pause-btn-source').click(function(){
			myPlayer.jPlayer("pause");
			$(this).hide();
			$('#play-btn-source').show();
			return false;
		});

		$('#clear-btn').click(function(){   
			
			//$.bbq.removeState();
			theScript = [];
			$('#transcript-content').html('');
			$('#target-content').html('');

			return false;
		});

		
		$('#instructions-btn').click(function(){   
			
			if($('#instructions').is(':visible')){
				$('#instructions').fadeOut();
			} else {
				$('#instructions').fadeIn();
			}
			 
			return false;
		});

		$("#searchStr").click(function(e) {
			if ($("#searchStr").val() == searchDefault) {
				$("#searchStr").val('');
				$('#searchStr').css('color','#000');
			}
		});

		$("#searchStr").keydown(function(e) {
			if ($("#searchStr").val() == searchDefault) {
				$("#searchStr").val('');
				$('#searchStr').css('color','#000');
			}

    	if(e.which == 13) {
    		playSource = true;
    		tPause = 0;
    		$('#search-btn').trigger('click');
        return false;
    	}
		});


		function contains (list, target) {
			for (var i in list) {
				if (target == list[i]) {
					return true;
				}
			}

			return false;
		}


		function cleanWord(w) {
			return w.replace(".","").replace(",","").replace("!","").replace("?","").replace("-","").replace("-","").toLowerCase();
		}

		var hitsDetails;

		$('#search-btn').click(function(e){   

			if (e.originalEvent instanceof MouseEvent) {
				//console.log('cleared');
				playSource = true;
				tPause = 0;
			}

			hitsDetails = [];

			var searchStr = $('#searchStr').val().toLowerCase();

			var matches = [];
			var speakers = [];
			var demCount = 0;
			var repCount = 0;

			$('#transcript-content span').css('background-color','white');

			$('#transcript-content span').each(function(i) {
				//console.log($(this).text());
				var searchWords = searchStr.split(" ");
				//if (cleanWord($(this).text()).indexOf('jack') >=0 ) console.log(cleanWord($(this).text()));
				//console.log(searchWords[0]);
				//console.log(cleanWord($(this).text()));

				if (searchWords[0] == cleanWord($(this).text())) {
					//console.log('checking');
					
					var matching = true;
					if (searchWords.length == 1) {
						//$(this).css('background-color','yellow');
					} else {
						var nextWord = $(this).next();

						for (var w=1; w < searchWords.length; w++) {

							if (searchWords[w] != cleanWord(nextWord.text())) {
								matching = false;
							}
							nextWord = nextWord.next();
						}
					}
					
					if (matching == true) {
						//console.log("hit");
						var thisWord = $(this);
						var timeSpan = {};
						timeSpan.s = parseInt($(this).attr(dataMs));
						timeSpan.e = parseInt($(this).attr(dataMs))+parseInt(tPause);
						//console.log('tp='+tPause);
						

						/*establish the speaker*/

						var wordElement = $(this).parent().children(':first');
						var word = wordElement.text();

						speakers.push('d');
						matches.push($(this).attr(dataMs));

						for (var w=0; w < searchWords.length; w++) {
							thisWord.css('background-color','yellow');
							thisWord = thisWord.next();
						}
						theScript.push(timeSpan); 
					}
				}
			});

			var hits = new Array(bars);
			for (var h=0; h < hits.length; h++) {
				hits[h] = 0;
			}

			for (var n=0; n < matches.length; n++) {	
				if (speakers[n] == 'r') {
					var barI = 2*(Math.floor(matches[n]/300000));
					hits[barI]++;	
					if (!hitsDetails[barI]) {
						hitsDetails[barI] = new Array();
					}
					hitsDetails[barI].push(matches[n]);
				}

				if (speakers[n] == 'd') {
					var barJ = 2*(Math.floor(matches[n]/300000))+1;
					hits[barJ]++;	
					if (!hitsDetails[barJ]) {
						hitsDetails[barJ] = new Array();
					}
					hitsDetails[barJ].push(matches[n]);
				}
				
			}

			for (var h=0; h < hits.length; h++) {
				data[h] = {};
				data[h].s = hits[h];
				//data[h].m = hitsDetails[h];
			}

			// The chart gets drawn twice now to fix Opera bug and to make it slide in nicely for other browsers.
			drawBarChart(data); // Moved down to animated callback. Opera bug on 1st chart.
			//drawStackedChart(data);

			// set up tweet

			var winLoc = locationUrl;      
			var url = winLoc;
			var paramStart = winLoc.indexOf('?');   
			
			if (paramStart > 0) {
				url = winLoc.substr(0,paramStart);
			}
			 
			var keyword = searchStr.split(' ').join('%20');
			var theTweet = "How often was '"+searchStr+"' mentioned? "+url+"?k="+keyword+" "+hashTag;//+"&e="+e;  
				 
			$('.share-snippet').empty();
			$('.share-snippet').append(theTweet);  
			$('#tweet-like').empty();
			$('#tweet-like').append('<script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script><a data-url="" data-text="'+theTweet+'" href="http://twitter.com/share?url=none&count=none" class="twitter-share-button">Tweet</a>');  

			//var fbLink = "http://www.facebook.com/sharer.php?u="+url+"?k="+keyword;

			var fbLink = "http://www.facebook.com/sharer.php?s=100&p[title]="+fbTitle+"&p[url]="+url+"&p[summary]="+encodeURIComponent(theTweet);

			$('#fb-link').attr('href',fbLink);
			$('#fb-link').show();

			$('.mini-footer').slideUp(function() {
				$('.footer').slideDown(function() {
					if(operaBarChartFix) {
						operaBarChartFix = false;
						drawBarChart(data); // Draw the graph again to keep Opera happy that 1st time.
						//drawStackedChart(data);
					}
				});
				$('.body.row').animate({bottom: '164px'}, 500);
				$('#fade-bot').animate({top: '554px'}, 500);
				$('#transcript-inst-panel').fadeOut();
			});

			// uncomment below to activate search term playback
				
			if (tPause > 0) {	
				//console.log('tPause='+tPause);
				playSource = false;
				end = -1;
				index = 0;
			}
			//console.dir(theScript);
			
			_gaq.push(['_trackEvent', 'USElect', 'Search ', 'Keyword(s) ='+searchStr]);

			return false;
		});

	  var endTime =  null;

		function checkStartParam() {
			var param = getUrlVars()["s"];
			if ( param != null) {  
				var sParam = null;
				if ( param.indexOf('-') >= 0 ) {
					sParam = param.substr(0, param.indexOf('-'));
					var eParam = param.substr(param.indexOf('-')+1,param.length);
					endTime = parseInt(eParam);
					//console.log("endTime = "+endTime);
				} else {
					sParam = param;
					endTime = null;
				}

				var s = parseInt(sParam);

				//console.log("s = "+sParam);

				myPlayer.jPlayer("play",s/10);    
				_gaq.push(['_trackEvent', 'USElect', 'Start/End parameter', 'Triggered at '+s]);
			}
		}

		function checkKeywordParam() {
			if (getUrlVars()["k"] != null) {    
				var s = getUrlVars()["k"];
				s = s.split('%20').join(' ');
    		$('#searchStr').val(s);
    		$('#search-btn').trigger('click');
				_gaq.push(['_trackEvent', 'USElect', 'Keyword parameter', 'Triggered at '+s]);
			}
		}



		function checkEasterParam() {
			if (getUrlVars()["t"] != null) {    
				var t = getUrlVars()["t"];
				if (t != null) {
					tPause = t;
				}
				_gaq.push(['_trackEvent', 'USElect', 'Easter parameter', 'Triggered with '+t]);
			}
		}


		function getUrlVars() {
			var vars = [], hash;
			var myWindow = window;

			if (parent) {
				myWindow = parent.window;
			}


			//if (isAString(locationUrl) == false) {
			if (typeof locationUrl != "string") {
				locationUrl = locationUrl.href;
			}


			var hashes = locationUrl.slice(locationUrl.indexOf('?') + 1).split('&');
			for(var i = 0; i < hashes.length; i++)
			{
				hash = hashes[i].split('=');
				vars.push(hash[0]);
				vars[hash[0]] = hash[1];
			}

	    return vars;
	  }  

	  $('.thumb-link').click(function(){
	  	myPlayer.jPlayer('play',$(this).attr('data-start')/10);
	  	endTime = $(this).attr('data-end');
	  	playSource = true;
			tPause = 0;
			_gaq.push(['_trackEvent', 'USElect', 'Dont Miss', 'Triggered with '+$(this).attr('data-start')]);
	  	return false;
	  });

		$('#main-loader').append('.');

		
});    