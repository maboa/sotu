/*
 * Dual licensed under the MIT and GPL licenses.
 *  - http://www.opensource.org/licenses/mit-license.php
 *  - http://www.gnu.org/copyleft/gpl.html
 *
 * Authors: Mark Boas (@maboa), Mark J Panaghiston (@thePag)
 *
 * For: Al-Jazeera
 *
 * Date: February 2013
 */

$(document).ready(function(){

	// The prefix variables should always be populated

	var dataMs = "data-ms";

	var fbTitle = "State of the Union";

	var locationUrl = (window.location != window.parent.location) ? document.referrer: document.location;

	var hashTag = "#SOTU";

	var operaBarChartFix = true;

	var searchDefault = "search transcript";

	$('#searchStr').focus();
	$('#searchStr').attr('value',searchDefault);

	$('#chart-legend-left').hide();
	$('#chart-legend-right').hide();

	var bars = 16; // 40;
	var data = new Array(bars);

	var maxData = 0;
	var tPause = 0;

	var transcriptsLoaded = false;
	var performSearchWhenReady = false;
	var thisIsTheFirstTime = true;

	var currentAddressIndex = -1;
	var currentAddressReady = false;

	// NB: IE8 D3 support https://github.com/mbostock/d3/issues/619
	// Added Sizzle and es5-shim, but fails silently in IE8.


	function drawStackedChart(data) {

		/*example data*/
/*
		var searchData = new Array(5);

		searchData[0] = new Array(16);
		searchData[1] = new Array(16);
		searchData[2] = new Array(16);
		searchData[3] = new Array(16);
		searchData[4] = new Array(16);

		for (var i = 0; i < 5; i++) {
		  for (j = 0; j < 16; j++) {
		    searchData[i][j] = new Object();
		    searchData[i][j].x= j; 
		    searchData[i][j].y= Math.random()*0.1;
		    searchData[i][j].y0 = 0;
		    for (var k = i; k--; k > 0) {
		      searchData[i][j].y0 += searchData[k][j].y; 
		    }
		  }
		}

		var data = searchData;
*/
		/*can delete above when you pipe real data through*/


		$('#chart').empty();


		var n = 5, // number of layers
		    m = 16, // number of samples per layer
		    stack = d3.layout.stack(),
		    layers = data, 
		    yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); }),
		    yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });

		    //console.dir(searchData);


		var margin = {top: 0, right: 0, bottom: 30, left: 10},
		    width = 730 - margin.left - margin.right,
		    height = 100 - margin.top - margin.bottom;

		var x = d3.scale.ordinal()
		    .domain(d3.range(m))
		    .rangeRoundBands([0, width], .08);

		var y = d3.scale.linear()
		    .domain([0, yStackMax])
		    .range([height, 0]);

		// var color = d3.scale.category10();
		var color = []; // Changed to define an array. Usually this is a function!
		for(var ci=0, cLen = addressInfo.length; ci < cLen; ci++) {
			color[ci] = addressInfo[ci].color;
		}

		var xScale = d3.scale.linear().domain([0,80]).range([0, width]);

		var xAxis = d3.svg.axis()
		    .scale(xScale)
		    .ticks(m)
		    .tickSize(0)
		    .tickPadding(6)
		    .orient("bottom");

		var svg = d3.select("#chart").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var layer = svg.selectAll(".layer")
		    .data(layers)
		  .enter().append("g")
		    .attr("class", "layer")
		    // .style("fill", function(d, i) { return color(i); });
		    .style("fill", function(d, i) { return color[i]; }); // Note using an array and not usual color(i) functions.

		var rules = svg.append("g");

    // Add rules

  	/*rules = rules.selectAll(".rule")
   		.data(y.ticks(d3.max(data, function(datum) { return datum.s; })))
    	.enter().append("g")
    	.attr("class", "rule")
    	.attr("transform", function(d) { return "translate(0," + y(d) + ")"; });
  
  	rules.append("line")
      .attr("x2", width);*/

		var rect = layer.selectAll("rect")
		    .data(function(d) { return d; })
		  .enter().append("rect")
		    .attr("x", function(d) { return x(d.x); })
		    .attr("y", height)
		    .attr("width", x.rangeBand())
		    .attr("height", 0);

		rect.transition()
		    .delay(function(d, i) { return i * 10; })
		    .attr("y", function(d) { return y(d.y0 + d.y); })
		    .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });

		svg.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + height + ")")
		    .call(xAxis);

		d3.selectAll(".chart-type").on("change", change);

		var timeout = setTimeout(function() {
		  d3.select("input[value=\"grouped\"]").property("checked", true).each(change);
		}, 2000);

		function change() {
		  clearTimeout(timeout);
		  if (this.value === "grouped") transitionGrouped();
		  else transitionStacked();
		}

		function transitionGrouped() {
		  y.domain([0, yGroupMax]);

		  rect.transition()
		      .duration(500)
		      .delay(function(d, i) { return i * 10; })
		      .attr("x", function(d, i, j) { return x(d.x) + x.rangeBand() / n * j; })
		      .attr("width", x.rangeBand() / n)
		    .transition()
		      .attr("y", function(d) { return y(d.y); })
		      .attr("height", function(d) { return height - y(d.y); });
		}

		function transitionStacked() {
		  y.domain([0, yStackMax]);

		  rect.transition()
		      .duration(500)
		      .delay(function(d, i) { return i * 10; })
		      .attr("y", function(d) { return y(d.y0 + d.y); })
		      .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
		    .transition()
		      .attr("x", function(d) { return x(d.x); })
		      .attr("width", x.rangeBand());
		}
	}


	var theScript = [];  
	var mediaDirM = "http://bc05.ajnm.me/665003303001/";
	var mediaDirW = "http://webapps.aljazeera.net/aje/custom/debate/d4/";
	var transcriptDir = "transcripts/";
	var posterDir = "";

	var videoM = [];
	var videoW = [];

	// NOTE: ONLY THE M4V VIDEOS ARE BEING USED.
	// The WebM videos were not provided.
	// The jPlayer options were used to switch it to use M4V only.

	// Array of Objects to hold media information.
	var addressInfo = [
	{
			id: "13",
			title: "State Of The Union Address (Feb 2013)",
			color: "#9467bd",
			transcript: "sotu2013.htm",
			poster: "2013Poster.jpg",
			videoM: {
				lo: "665003303001_2161312826001_The-2013-State-of-the-Union-Address.mp4",
				me: "665003303001_2161312826001_The-2013-State-of-the-Union-Address.mp4",
				hi: "665003303001_2161312826001_The-2013-State-of-the-Union-Address.mp4",
				hd: "665003303001_2161312826001_The-2013-State-of-the-Union-Address.mp4"
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
			transcript: "sotu2012.htm",
			poster: "2012Poster.jpg",
			videoM: {
				lo: "665003303001_2154491021001_012412-StateoftheUnion-EN-HD.mp4",
				me: "665003303001_2154491034001_012412-StateoftheUnion-EN-HD.mp4",
				hi: "665003303001_2154502042001_012412-StateoftheUnion-EN-HD.mp4",
				hd: "665003303001_2154502042001_012412-StateoftheUnion-EN-HD.mp4"
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
			transcript: "sotu2011.htm",
			poster: "2011Poster.jpg",
			videoM: {
				lo: "665003303001_2154478437001_012511-SOTU-EN-HD.mp4",
				me: "665003303001_2154478392001_012511-SOTU-EN-HD.mp4",
				hi: "665003303001_2154493579001_012511-SOTU-EN-HD.mp4",
				hd: "665003303001_2154512765001_012511-SOTU-EN-HD.mp4"
			},
			videoW: {
				lo: "debate4.webm",
				me: "debate4.webm",
				hi: "debate4.webm",
				hd: "debate4.webm"
			}
		},
		{
			id: "10",
			title: "State Of The Union Address (Jan 2010)",
			color: "#ff7f0e",
			transcript: "sotu2010.htm",
			poster: "2010Poster.jpg",
			videoM: {
				lo: "665003303001_2154453217001_012710-StateoftheUnion.mp4",
				me: "665003303001_2154469843001_012710-StateoftheUnion.mp4",
				hi: "665003303001_2154467481001_012710-StateoftheUnion.mp4",
				hd: "665003303001_2154491005001_012710-StateoftheUnion.mp4"
			},
			videoW: {
				lo: "debate4.webm",
				me: "debate4.webm",
				hi: "debate4.webm",
				hd: "debate4.webm"
			}
		},
		{
			id: "09",
			title: "The President Addresses A Joint Session of Congress (Feb 2009)",
			color: "#1f77b4",
			transcript: "sotu2009.htm",
			poster: "2009Poster.jpg",
			videoM: {
				lo: "665003303001_2154457655001_20090224-JointSession.mp4",
				me: "665003303001_2154461731001_20090224-JointSession.mp4",
				hi: "665003303001_2154473025001_20090224-JointSession.mp4",
				hd: "665003303001_2154497657001_20090224-JointSession.mp4"
			},
			videoW: {
				lo: "debate4.webm",
				me: "debate4.webm",
				hi: "debate4.webm",
				hd: "debate4.webm"
			}
		}
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
	
	$.jPlayer.timeFormat.showHour = true;

	var i = 0;
   

		// These events are fired as play time increments  

		var playingWord = 1;    
		
		
		// transcript links to audio

		// $('#transcript').delegate('span','click',function(e){ 
		$('#transcript-content').delegate('span','click',function(e){ 
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

    	_gaq.push(['_trackEvent', 'SOTU', 'Word clicked', 'word '+$(this).text()]);
		   
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

		function initPopcorn(id) {   
			var p = Popcorn(id).code({
				start: 0,
				onStart: function (options) {
					//console.log('start')
				},
				onFrame: (function () {

					// Warning: This might start polling before the transcript is loaded and ready.

					var count = 0;
					var endedLoop = false;

					return function (options) {

						if(currentAddressReady) {

							//console.log('here');

							// var now = this.Popcorn.instances[0].media.currentTime*1000;
							var now = p.media.currentTime*1000;

							// console.log("now="+now/100);
							// console.log("end="+endTime); 

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

									if(theScript[index].ai !== currentAddressIndex) {
										end = -1;
										loadFile(addressInfo[theScript[index].ai].id); // Fn uses the id, not the index.
										return; // exit this onFrame execution.
									}

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
					};
				})(),
				onEnd: function (options) {
					//console.log('end');
				}
			}); 
			return p; 
		}

		$('.quality-switch').click(function(){
			var timeOnClick = currentTime;
			var quality = $(this).attr('q');
			var mediaMp4 = mediaDirM+videoM[quality];
			var mediaWebM = mediaDirW+videoW[quality];
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

			_gaq.push(['_trackEvent', 'SOTU', 'Quality button', 'switched to '+$(this).attr('q')]);

			return false;
		})	

		$('.quality-btn').click(function(){

			if ($('.jp-quality-ctrl').is(':visible')) { 

				$('.jp-quality-ctrl').fadeOut();
				$('.fs-quality-ctrl').fadeOut();
					
			} else {
				$('.jp-quality-ctrl').fadeIn();
			}

			_gaq.push(['_trackEvent', 'SOTU', 'Quality button', 'clicked']);

			return false;
		});

		$('.address-summary .address-tags span').click(function() {
			var term = $(this).text();
			$('#searchStr').val(term);
			var year = $(this).parent().parent().attr('data-addr');
			$('.checkboxes input').attr('checked', false);
			$('#search-addr-' + year).attr('checked', true);
			if(transcriptsLoaded) {
				$('#search-btn').trigger('click');
			} else {
				performSearchWhenReady = true;
			}
		});

		$('.address-summary').click(function() {
			
			var year = $(this).attr('data-addr');

			$('.intro').fadeOut();
			//$('.the-analysis').fadeOut();

			playSource = true; // Stop the auto playback, as this was a user GUI action.

			if(currentAddressIndex < 0 || year !== addressInfo[currentAddressIndex].id) {
				loadFile(year);
			}

			return false;
		});

		$('.thumb').hover(function() {
			$(this).hide();
			$(this).next().show();
		});

		$('.thumbOn').mouseout(function() {
			$(this).hide();
			$(this).prev().show();
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

		function initTranscript(p, ai) {
			//console.log("initTranscript in "+(new Date()-startTimer));
			$("#transcript-content-" + ai + " span").each(function(i) {  
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
			$("#transcript-content-" + ai).show();
			//console.log("initTranscript out "+(new Date()-startTimer));
		}

		// Reviewed recursively async adding the plugins to avoid lock up at start.
		// It worked, but took a long time to complete.
		// Plus, you could scroll down in text way ahead of this function loop and click on word, which kinda broke it...
		// As it was not setup for that word yet.
		function initTranscriptAsync(p, ai) {
			var $trans = $("#transcript-content-" + ai + " span");
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

/*

		// DISABLED clicks on the chart from attempting to play from the search data.
		// Did not get round to doing that part.

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

    	_gaq.push(['_trackEvent', 'SOTU', 'Bar chart clicked', 'Bar '+gIndex]);

			return false;
		});
*/		
		var startTimer = new Date();

		var loadNextTranscript = function(i, p, ai) {
			if(i < addressInfo.length) {
				// Create a divider for the transcript
				var transElem = document.createElement('div');
				$('#transcript-content').append(transElem);

				$(transElem).hide()
				.addClass('transcript-layer')
				.attr('id', 'transcript-content-' + i)
				.attr('data-i', i)
				.attr('data-addr', addressInfo[i].id)
				.load(transcriptDir + addressInfo[i].transcript, function() {
					loadNextTranscript(++i, p, ai);
				});
			} else {
				// Finished loading transcripts
				// console.log('loaded hidden transcripts');
				transcriptsLoaded = true;
				prepareMultiTranscripts(p, ai);
			}
		};
		// Flag to load in the transcripts for the search system the first time loadFile() called.
		var requireMultiTranscripts = true;
		function prepareMultiTranscripts(p, ai) {
			if(requireMultiTranscripts) {
				requireMultiTranscripts = false;
				// load in the transcripts.
				loadNextTranscript(0, p, ai);
			} else {
				initTranscript(p, ai);
				$('#main-loader').hide();
				myPlayer.jPlayer("volume", 1); // max volume
				currentAddressReady = true; // Video and Transcript ready for use.
				if(performSearchWhenReady) {
					performSearchWhenReady = false;
					$('#search-btn').trigger('click');
				}
				if(thisIsTheFirstTime) {
					thisIsTheFirstTime = false;
					checkStartParam(); // MJP: This probably needs to move elsewhere
					checkKeywordParam(); // MJP: This probably needs to move elsewhere
				}
			}
		}

		function loadFile(id) { 

			var ai = getAddressIndex(id);
			if(ai < 0) {
				return; // invalid address id.
			}

			// Wide scope vars used in onFrame
			currentAddressIndex = ai;
			currentAddressReady = false;

			// Setup the legacy variables
			videoM = addressInfo[ai].videoM;
			videoW = addressInfo[ai].videoW;

			checkEasterParam();

			// var file = transcriptDir+'/'+id+'.htm'; 
			var file = transcriptDir+addressInfo[ai].transcript; 

			var mediaMp4 = mediaDirM+videoM['me'];
			var mediaWebM = mediaDirW+videoW['me'];

			var poster = posterDir + addressInfo[ai].poster;

			$("#the-analysis").scrollTo($("#analysis-" + id), 800, {axis:'y',margin:true,offset:{top:0}});

			// MJP: Next line appears obsolete.
			// currentlyPlaying = id;

			setTitle(id);

			var p, busySeekId, busyWaitId, delayBusy = 250;
/*
			var loadTrans = function() {
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

					prepareMultiTranscripts(); // Load in the other trans now the initial one ready for use.
				});
*/
				//console.log("loadTrans out "+(new Date()-startTimer));

				// ugly chrome fix to stop scroll-bar disappearing

				/*var bodyRow = $('.body.row');
				var bottom = parseInt(bodyRow.css('bottom').replace('px',''));
				bodyRow.animate({bottom: bottom+1+'px'}, 500);
				bodyRow.animate({bottom: bottom+'px'}, 500);*/

				// end ugly chrome fix
			// };

			$('.transcript-layer').hide();
			$('#main-loader').show();

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
						poster: poster
					});
					setTimeout(function() {
						// loadTrans();
						prepareMultiTranscripts(p, ai);
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
				supplied: "m4v", // m4v,webmv",
				// preload: "auto",
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

			var year = addressInfo[currentAddressIndex].id;
			var yearParam = "y"+year+"=1";

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
			 
				var theTweet = "'"+tweetable+"' "+url+"?s="+s+"-"+e+"&"+yearParam+" "+hashTag;//+"&e="+e;  
				 
				$('.share-snippet').empty();
				$('.share-snippet').append(theTweet);  
				$('#tweet-like').empty();
				$('#tweet-like').append('<script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script><a data-url="" data-text="'+theTweet+'" href="http://twitter.com/share?url=none&count=none" class="twitter-share-button">Tweet</a>');  
				
				// uncomment this line when we go live!
				//url = "http://www.aljazeera.com/indepth/interactive/2012/10/20121049528478583.html";
				var fbLink = "http://www.facebook.com/sharer.php?s=100&p[title]="+fbTitle+"&p[url]="+url+"&p[summary]="+encodeURIComponent(theTweet);
				//var fbLink = "http://www.facebook.com/sharer.php?u="+url+"?s="+s+"-"+e;
				$('#fb-link').attr('href',fbLink);
				$('#fb-link').show();
				

				//http://www.facebook.com/sharer.php?s=100&p[title]=titlehere&p[url]=http://www.yoururlhere.com&p[summary]=yoursummaryhere&p[images][0]=http://www.urltoyourimage.com

				_gaq.push(['_trackEvent', 'SOTU', 'Tweet generated', 'Tweet content '+theTweet]);
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


		$('.close-intro').click(function(){   
			
			$('.intro').fadeOut(function() {
				//loadFile(addressInfo[0].id);
				$('#transcript-how').fadeIn();
			});
			 
			return false;
		});

		$('.close-analysis').click(function(){

			$('.the-analysis').fadeOut(function() {
				if (transcriptsLoaded == false) {
					loadFile(addressInfo[0].id);
				}
			});

			// need to check here if a video is selected and if not load the default

			return false;
		});

		$('#get-analysis').click(function(){   
			
			//loadFile(12);

			$('.intro').fadeOut();
			$('.the-analysis').fadeIn();
			
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

			$('.intro').fadeOut();

			if(!transcriptsLoaded) {
				return false; // Exit now as nothing to search yet.
			}

			if (e.originalEvent instanceof MouseEvent) {
				//console.log('cleared');
				playSource = true;
				tPause = 0;
			}

			hitsDetails = [];

			var searchStr = $('#searchStr').val().toLowerCase();

			var matches = [];
			var speakers = []; // Obsolete
			var demCount = 0; // Obsolete
			var repCount = 0; // Obsolete

			var searchData = []; // Used for chart

			// This var has wide scope. Used in onFrame.
			theScript = []; // Used for search result playback.

			// Used in creating the sharing url
			var yearParam = "";

			$('#transcript-content span').css('background-color','white');

			// Want an Array containing 5 Arrays of 16 objects containing x, y and y0 properties.
			// The 5 Arrays represent the group/year.
			// The 16 objects, represent the 5 minutes segments. 16x5=80min.
			// The x property is the time period, EG 1 means 5-9mins
			// The y property is the number of incidents (found by the search).
			// The y0 property is the sum of all the previous y values in that time period.

			// Search through each transcript in turn.
			$.each(addressInfo, function(ai) {
				//
				matches[ai] = [];
				searchData[ai] = new Array(bars);

				if($('#search-addr-' + addressInfo[ai].id).is(':checked')) {

					yearParam += "&y"+addressInfo[ai].id+"=1";

					$('#transcript-content-' + ai + ' span').each(function(i) {
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
								var thisPara = $(this).parent();
								// timeSpan.s = parseInt($(this).attr(dataMs));
								// timeSpan.e = parseInt($(this).attr(dataMs))+parseInt(tPause);
								timeSpan.s = parseInt(thisPara.children(':first').attr(dataMs));
								timeSpan.e = parseInt(thisPara.children(':last').attr(dataMs))+parseInt(1000);
								timeSpan.ai = ai;
								//console.log('tp='+tPause);
								

								/*establish the speaker*/

								var wordElement = $(this).parent().children(':first');
								var word = wordElement.text();

								speakers.push('d'); // Obsolete
								matches[ai].push($(this).attr(dataMs));

								for (var w=0; w < searchWords.length; w++) {
									thisWord.css('background-color','yellow');
									thisWord = thisWord.next();
								}

								if(theScript.length > 0) {
									var previous = theScript.length-1;
									// Check the previous result does not point at the same Address and Paragraph
									if(theScript[previous].ai !== timeSpan.ai || theScript[previous].s !== timeSpan.s) {
										theScript.push(timeSpan); 
									}
								} else {
									theScript.push(timeSpan); 
								}
							}
						}
					});
				}

				var hits = new Array(bars);
				for (var h=0; h < hits.length; h++) {
					hits[h] = 0;
				}
/*
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
*/
				for (var n=0; n < matches[ai].length; n++) {	
					var tSeg = Math.floor(matches[ai][n]/300000); // Which 5 minute time segment is it in?
					hits[tSeg]++;	
					if (!hitsDetails[tSeg]) {
						hitsDetails[tSeg] = new Array();
					}
					hitsDetails[tSeg].push(matches[ai][n]);
				}

				for (var h=0; h < hits.length; h++) {
					searchData[ai][h] = {};
					searchData[ai][h].x = h;
					searchData[ai][h].y = hits[h];
					searchData[ai][h].y0 = ai > 0 ? searchData[ai-1][h].y + searchData[ai-1][h].y0 : 0;
					//searchData[ai][h].m = hitsDetails[h];
				}
			});

			// The chart gets drawn twice now to fix Opera bug and to make it slide in nicely for other browsers.
			drawStackedChart(searchData); // Moved down to animated callback. Opera bug on 1st chart.

			// set up tweet

			var winLoc = locationUrl;      
			var url = winLoc;
			var paramStart = winLoc.indexOf('?');   
			
			if (paramStart > 0) {
				url = winLoc.substr(0,paramStart);
			}

			var keyword = searchStr.split(' ').join('%20');
			var theTweet = "How often was '"+searchStr+"' mentioned? "+url+"?k="+keyword+yearParam+"&t=1 "+hashTag;//+"&e="+e;  
				 
			$('.share-snippet').empty();
			$('.share-snippet').append(theTweet);  
			$('#tweet-like').empty();
			$('#tweet-like').append('<script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script><a data-url="" data-text="'+theTweet+'" href="http://twitter.com/share?url=none&count=none" class="twitter-share-button">Tweet</a>');  

			//var fbLink = "http://www.facebook.com/sharer.php?u="+url+"?k="+keyword;

			var fbLink = "http://www.facebook.com/sharer.php?s=100&p[title]="+fbTitle+"&p[url]="+url+"&p[summary]="+encodeURIComponent(theTweet);

			$('#fb-link').attr('href',fbLink);
			$('#fb-link').show();

			$('.mini-footer').slideUp(function() {
				$('.chart-controls').fadeIn();
				$('.year-key-hldr').fadeIn();
				$('.footer').slideDown(function() {
					$('#close-chart-hldr').fadeIn();

					if(operaBarChartFix) {
						operaBarChartFix = false;
						// drawStackedChart(searchData); // Draw the graph again to keep Opera happy that 1st time.
					}
				});
				$('#chart-legend-left').slideDown();
				$('#chart-legend-right').slideDown();
				// $('.body.row').animate({bottom: '164px'}, 500);
				$('#transcript-content').animate({bottom: '164px'}, 500);
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
			
			_gaq.push(['_trackEvent', 'SOTU', 'Search ', 'Keyword(s) ='+searchStr]);

			return false;
		});

		$('#close-chart').click(function() {
			$('#close-chart-hldr').fadeOut();
			$('.footer').slideUp(function() {
				$('.mini-footer').slideDown(function() {
				});
				$('#transcript-content').animate({bottom: '80px'}, 500);
				$('#fade-bot').animate({top: '634px'}, 500);
				$('#transcript-inst-panel').fadeIn();
				$('.chart-controls').fadeOut();
				$('.year-key-hldr').fadeOut();
				//$('#chart-legend-right').fadeOut();
				//$('#target-content').attr('height','730px');

			});
			return false;
		});

		$('.search-tag').click(function() {
			var term = $(this).text();
			$('#searchStr').val(term);
			$('#search-btn').trigger('click');
		});

		$('#search-playback').click(function() {
			//
			playSource = false;
			// tPause = 1000; // To late here, since theScript[] already pushed with timeSpan with .e using zero.
			end = -1;
			index = 0;
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
				_gaq.push(['_trackEvent', 'SOTU', 'Start/End parameter', 'Triggered at '+s]);
			}
		}

		function checkKeywordParam() {
			if (getUrlVars()["k"] != null) {    
				var s = getUrlVars()["k"];
				s = s.split('%20').join(' ');
				$('#searchStr').val(s);
				// checkSearchYearParam();
				$('#search-btn').trigger('click');
				_gaq.push(['_trackEvent', 'SOTU', 'Keyword parameter', 'Triggered at '+s]);
			}
		}


		function checkSearchYearParam() {
			var idRet = addressInfo[0].id;
			var getFirstYear = true; // Want the 1st year, going backwards in time. (In the addressInfo array order.)
			for(var i=0, iLen=addressInfo.length; i < iLen; i++) {
				var year = getUrlVars()["y" + addressInfo[i].id];
				if(year === "1") {
					$('#search-addr-' + addressInfo[i].id).attr('checked', true);
					if(getFirstYear) {
						getFirstYear = false;
						idRet = addressInfo[i].id;
					}
				} else {
					$('#search-addr-' + addressInfo[i].id).attr('checked', false);
				}
			}
			return idRet;
		}
		function checkStartYearParam() {
			var idRet = addressInfo[0].id;
			for(var i=0, iLen=addressInfo.length; i < iLen; i++) {
				var year = getUrlVars()["y" + addressInfo[i].id];
				// console.log('typeof year = ' + typeof year);
				if(year !== undefined) {
					if(year === "1") {
						idRet = addressInfo[i].id;
						break;
					}
				}
			}
			return idRet;
		}

		function checkEasterParam() {
			if (getUrlVars()["t"] != null) {    
				var t = getUrlVars()["t"];
				if (t != null) {
					tPause = t;
				}
				_gaq.push(['_trackEvent', 'SOTU', 'Easter parameter', 'Triggered with '+t]);
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
			_gaq.push(['_trackEvent', 'SOTU', 'Dont Miss', 'Triggered with '+$(this).attr('data-start')]);
	  	return false;
	  });

	if(getUrlVars()["k"] !== undefined) {
		$('.intro').fadeOut(function() {
			// loadFile(addressInfo[0].id);
			loadFile(checkSearchYearParam());
		});
	} else if(getUrlVars()["s"] !== undefined) {
		$('.intro').fadeOut(function() {
			loadFile(checkStartYearParam());
		});
	} else {
		// Otherwise load in the default video
		loadFile("13"); // loadFile() uses the addressInfo id.
	}
});
