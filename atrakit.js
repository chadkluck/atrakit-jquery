/** @preserve ATRAKIT: VIEW DOC|CODE|LIC @ github.com/chadkluck/atrakit */
/*  ============================================================================================
    ********************************************************************************************
        Analytics TRAcking toolKIT (ATRAKIT /ah... track it!/) (requires jQuery)
    ********************************************************************************************

	Chad Leigh Kluck (63Klabs)
	Version: 0.1.3-20170118-01
	github.com/chadkluck/atrakit
	
	Released under Creative Commons Attribution 4.0 International license (CC BY)
	https://creativecommons.org/licenses/by/4.0/
	
	The code, with its heavy use of comments, is provided as an educational resource in hopes
	that it can be useful in function and disection.
	Minifying and obvuscating for production environments is OK and, in fact, strongly encouraged 
	even if it removes attribution comments.
	
    ********************************************************************************************
	
	- Clean implementation (easy for site owner to implement and add content to HTML structure)
	- Degrades gracefully if no flavor of Google Analytics installed
	- Allows new, dynamically generated content to be tracked (content created after init)
	- Decoupled from other scripts/stand alone
	- Works alongside other trackers and won't double track if using your scoping on inits
	- Can tag individual elements, groups of a type, or containers with trackable elements
	
    ********************************************************************************************
	
	USAGE:

	See full documentation at github.com/chadkluck/atrakit
	At minimum the following must be placed on your page or in your sitewide script file:

		// initialize ATRAKIT for entire page
		$(document).ready( function() { 
			$(document).atrakit("init");
		});

	Alternatively you could also narrow the scope of tagging to one or more areas on page
	But, absoutely, under no circumstances, never, ever, cross the streams

		$("#main-content").atrakit("init"); // just tag elements within #main-content
		$(".newsline").atrakit("init"); // tag applicable elements within .newsline, but not newsline
		$(".newsline").atrakitAdd("data").atrakitAdd("event"); // tag element(s) w/class newsline
		$("a.playvideo").atrakitAdd(); // same as above (event & data) but for different element
			
    ********************************************************************************************
*/

/*  ============================================================================================
    ********************************************************************************************
    GLOBAL VARIABLES 
	******************************************************************************************** 
*/

// atrakit
if (typeof atrakit === 'undefined') { atrakit = false; } // let init take care of setting true


/*  ============================================================================================
    ********************************************************************************************
    ATRAKIT PLUGIN FUNCTION 
	********************************************************************************************
*/

(function( $ ) {

	//"use strict"; // reserved for "someday" once we overcome how to detect analytics using globals
	
/* +++++++++++++++++++++++++++++++++++++++++++++++++
   +++ Local variables +++ */
	
	/* Script info */
	var version = "0.1.3-20170118-01"; // just a manual version number for debugging and preventing unneccessary hair pulling: "Is it loading the code I *thought* I uploaded?"
	var code    = "github.com/chadkluck/atrakit";
	var handle  = "ATRAKIT";
	var name    = "Analytics TRAcking toolKIT";
	
	/* Settings (Read/Write) */
	var silent = false; // does debug() output to console.log?
	var listEventType = false; // when logging event do we want the event action (click|mouseenter) to be appended to the data-action value?
	
	var fileTypes = "txt|pdf|pptx?|xlsx?|docx?|mp(3|4|eg)|mov|avi|wmv|wav|zip|jar|gif|jpe?g|png|exe|css|js"; // the regex of downloadable file exensions
	//     default: "txt|pdf|pptx?|xlsx?|docx?|mp(3|4|eg)|mov|avi|wmv|wav|zip|jar|gif|jpe?g|png|exe|css|js"

	// default things (elements) we track and corresponding default events
	var things = {
		'a':      "click",
		'button': "click",
		'form':   "submit",
		'select': "change",
		'input':  "change"
	};
		
	var gaFlavors = { 
		
		/* using traditional ga.js - very old */
		  TRAD: { desc: "Using Traditional Google Analytics (ga.js)",  
				  eventfn: function(category, action, label) { pageTracker._trackEvent(category, action, label); }, 
				  pagefn: function(page) { pageTracker._trackPageview(page); },
				  detectfn: function() { return (typeof gaJsHost !== 'undefined'); } /* pageTracker*/ 
				},

		/* using async classic ga.js - old */
		  CLAS: { desc: "Using Async Classic Google Analytics (ga.js async)",  
				  eventfn: function(category, action, label) { _gaq.push(['_trackEvent', category, action, label]); }, 
				  pagefn: function(page) { _gaq.push(['_trackPageview', page]); },
				  detectfn: function() { return (typeof _gaq !== 'undefined'); }
				},
		/* using universal analytics.js - the latest and greatest! */							  
		  UNIV: { desc: "Using Universal Analytics (analytics.js)",  
				  eventfn: function(category, action, label) { ga('send', 'event', category, action, label); }, 
				  pagefn: function(page) { ga('send', 'pageview', page); },
				  detectfn: function() { return (typeof ga !== 'undefined'); }
				},
				  
		/* using Google Tag Manager */
		  GTMX: { desc: "Using Google Tag Manager",  
				  eventfn: function(category, action, label) { /* do nothing */ }, 
				  pagefn: function(page) { /* do nothing */ },
				  detectfn: function() { return (typeof dataLayer !== 'undefined'); }
				},
				
		/* nothing detected*/
		  NONE: { desc: "No Analytics Detected",  
				  eventfn: function(category, action, label) { /* do nothing */ }, 
				  pagefn: function(page) { /* do nothing */ },
				  detectfn: function() { return false; } 
				  /* if everything in entire array returns false then we go with NONE, 
				  but we don't set it here. NONE is not guaranteed to be at end of array! */
				}
					  
	}; /* We can add new future flavors here, the dev can also add to the array by using $.fn.atrakit("customAnalytics, object) - see $.fn.atrakit() notes */
		
	/* States (Read) */
	var gaFlavor = null;

	/* Diagnostics (Internal) */
	var initCount = 0;
	var levels = ["Track Only", "Tag and Track", "Tag Only"]; // don't get confused, the levels are -1, 0, 1, so to call this we use levels[level+1]
		
		
		
		
/* +++++++++++++++++++++++++++++++++++++++++++++++++
   +++ Local Functions +++ */		


	 
	/* =====================================================================
		debug()

		If not silenced, outputs text pased to it to console.log 
		
		Need a line number? In your code use debug(yourmessage + " - Line:"+ (new Error()).lineNumber );

		This function has a companion variable: silent
	*/
	var debug = function( text ) {

		// as long as we aren't silenced (silent === false)...
		if( !silent ) {
			var d = new Date();
			var ts = d.getHours() +":"+ d.getMinutes() +":"+ d.getSeconds() +"."+ d.getMilliseconds();
			console.log(handle+" ["+ts+"] : " + text);
		}
	};
	
	
	/* =====================================================================
		setSilence()
	*/	
	var setSilence = function(silence){
		if( silence ) {
			debug("Silenced");
			silent = true;
		} else {
			silent = false;
			debug("Unsilenced");	
		}
	};

	
	/* =====================================================================
		getGlobalInit()
		
		We do it here so these are the only functions not using strict
	*/	
	var getGlobalInit = function() {
		return atrakit;
	}
	
	var setGlobalInit = function(b) {
		atrakit = b === true ? true : false; // don't blindly accept what is passed
		return getGlobalInit();
	}
	
	/* =====================================================================
		setListAction()
	*/		
	var setListEventType = function ( bool ) {
		if( bool ) {
			debug("Event types will be sent with Action Attributes");
			listEventType = true;
		} else {
			debug("Event types will NOT be sent with Action Attributes");
			listEventType = false;	
		}
	};

	/* =====================================================================
		setCustomFlavor()
	*/
	var setCustomFlavor = function ( flav ) {
		gaFlavors.addElem( flav ); // add the flavor
		gaFlavor = null; // reset
		hasGA(); // detect flavor
	};

	
	/* =====================================================================
		setDownloadFileTypes()
	*/
	var setDownloadFileTypes = function ( sFileTypes ) {
		fileTypes = sFileTypes;
	};
	
	/* =====================================================================
		eventTrigger()

		This is the event trigger added by all .on() 
	*/
	var eventTrigger = function (event) {
		var eType = listEventType ? eType = " (" + event.type + ")" : ""; // shorthand, if event.type not supressed from data-action, set it
		var $me = $(this);
		$me.atrakitAdd("data"); // just in case we don't already have data attributes
		recordEvent( $me.attr("data-category"), $me.attr("data-action") + eType ,$me.attr("data-label") );
	};

	/* =====================================================================
		init()

		This gets the party started 

		Called by $.fn.atrakit("init"):
		    --- $(document).atrakit("init"); or $(someselector).atrakit("init");
			    (but don't cross the streams! Don't use multiple selectors that could be nested)
	*/
	var init = function( $obj, level ) {

		/* ---------------------------------------------------------------------
			HOUSEKEEPING - let's get our workspace ready
		*/
				
		// going to use this for diagnostics. Even a heavy page shouldn't require more than 30ms of processing we'd hope
		var initStart = new Date(); 

		// Detect Analytics (example of $.fn.atrakitGet()
		$(document).atrakitGet("gaFlavor");	// since we're local we could have just used getGA();
				
		// if we did $(document).atrakit("init") then we want to apply it to the BODY (whole page)
		if( /*typeof $obj.prop("tagName") ===  "undefined"*/ $obj.is(document) ) { 
			$obj = $(document.getElementsByTagName("BODY")[0]);
		} 
		
		if (typeof $obj.prop('tagName') === 'undefined' ) {
			debug("Tracking selector returned 0 results");
		} else {
			// let the devs know what we are setting up (espcially if not BODY)
			debug("Init on for "+ $obj.prop('tagName')+": "+levels[level+1]); 	

		
			// Are we tagging elements?
			if(level >= 0) {
				/* ---------------------------------------------------------------------
					1.0: FIRST: LABEL EVERYTHING WITH data-category, data-action, and data-label
					We make two passes (1.1 & 1.2)
				*/

				// initialize findElements, we'll reset this var a few times
				var findElements = ""; // jQuery selector notation

				// exclude everything that already has all 3 data attributes (category, action, label) OR explicitly marked as Do Not Track
				var excludeElements = "[data-category][data-action][data-label], [data-atrakit='false']"; // jQuery selector notation

				/* ---------------------------------------------------------------------
					1.1: Pass #1: Find the following:
				*/

				// set the findElements for initial pass (in jQuery selector notation)
				findElements = "form, select:required, input:required, "         /* forms and elements */
							 + "a[href=''], a[href^='javascript:'], a[href^='mailto:'], a[href^='tel:'], " /* special href, including those that link to self */
							 + "a.button, button, "                              /* buttons */
							 + "[data-atrakit='true'], [data-atrakit-event]";    /* explicitly labeled for atrakit event tagging */

				// Perform the search and use $.fn.atrakitAdd() to add the data attributes
				$obj.find( findElements ).not( excludeElements ).atrakitAdd("data"); // execute

				/* ---------------------------------------------------------------------
					1.2: Pass #2: Now find the following only certain anchor ("A") tags:

					We DON'T care about internal links
					We DO care about:
						- Links to other domains/sub-domains (external links)
						- Links that take a user to a specific ID (#)
						- Links that are downloads

					The "a[href*='#'], a[href*='.']" selector only identifies potential candidates, 
					but $.fn.atrakitFilter() will actually identify and pull out the ones we care about
				*/

				// note that a[href*='.'] will match domains and files asdf.mp3 as well as asdf.html so we will add a filter for deeper inpsection
				findElements =  "a[href*='#'], a[href*='.']"; // jQuery selector notation

				// Perform the search, use $.fn.atrakitFilter() to further limit findings and then $.fn.atrakitAdd() to add the data attributes
				$obj.find( findElements ).not(".button, " + excludeElements ).atrakitLinkFilter().atrakitAdd("data");
			} /* end level >= 0 */

			// Are we tracking events?
			if (level <= 0) {
				/* ---------------------------------------------------------------------
					2.0: SECOND: Add the event handlers

					Starting at the parent, these will automatically add new event handlers when new children are added.
					Note that anything new needs to already be tagged with data attributes as we are not going back and
					adding any. 

					However, this will detect any new tags with data attributes (even if it is just data-atrakit=true) and
					if there are no data-category, data-action, or data-label attributes, we'll add them at event time.

					Note that while we used .atrakitAdd("data") we can't use atrakitAdd("event") here. Why?
					Because, for example, 2.1 and 2.2 adds event handlerls to all current, and all future, elements that 
					match the criteria. 2.3 would be a good candidate but it is already 1 line. .atrakitAdd("event") is 
					really a 4th unique way to add the event handlers, serving it's own purpose.
				*/

				var eList = ""; // we'll use this later

				/* ---------------------------------------------------------------------
					2.1: STEP 1: Handle events for predefined THINGS and their default Events 

					We are going to use the "things" array to add default event handlers
				*/
				Object.keys(things).forEach(function(key) {
					// ex: $("table").on( "click", "button", function() {}) tags all current and all future buttons in table elements
					$obj.on( things[key], key +"[data-category]:not([data-atrakit-event])", eventTrigger);
					eList = eList + key + ", "; // we'll use this later, but why not put it in an already existing loop?
				}, things);

				/* ---------------------------------------------------------------------
					2.2: STEP 2: Handle events for predefined THINGS and their default Events 

					Find all the atrakit-events, those elements that have an override event handler (instead of default click maybe a mouseenter)
				*/
				$obj.find( "[data-category][data-atrakit-event]" ).each( function() {
					$(this).on( $(this).attr("data-atrakit-event"), eventTrigger);
				});

				/* ---------------------------------------------------------------------
					2.3: STEP 3: Handle events for predefined THINGS and their default Events 

					Find remaining elements that are not in the list and give them a default click event
				*/
				$obj.on( "click", "[data-category]:not("+ eList + "[data-atrakit-event])", eventTrigger);
			} /* end level <= 0 */
		}

		/* ---------------------------------------------------------------------
			INIT is done! 
			
			Record our time. Hopefully we did everything pretty quickly.
			Initial tests were ran against pages of 300 links and elements,
			of which 67 elements were actually of interest and thus tagged in just 20ms
			
			Hopefully even your largest pages come in under 30ms
		*/		
		
		// calculate the milliseconds it took
		var diff = Math.abs((new Date()) - initStart); 
		
		// put it in the console.log for devs
		debug("Init of "+initCount+" elements completed in "+diff+" milliseconds");
	};


	/* =====================================================================
		addData() 

		Checks for data-category, data-action, data-label attributes and adds them if needed
		
		called by .atrakitAdd("data"):
		    --- $.fn.atrakitAdd("data") can be called by the init function, or other functions
			--- Since $.fn.atrakitAdd("data") is an external function for the pluggin, it can be 
			    called other times too for reasons unknown such as $("p").atrakitAdd("data"); 
				since p's are overlooked by default. 
				Which is an alternative to <p atrakit="true"> if the dev doesn't have HTML access
				
			Read more in the $.fn.atrakitAdd() section for more about external usage and availability
	*/
	var addData = function (element, param) {
		
		if (typeof param === 'undefined') { param = {}; }
		
		/* ---------------------------------------------------------------------
			updateDataAttr() - a local, internal, helper function exclusively for addData()
			
			This is a helper function to update data attributes only if not already set.
			(won't overwrite data-category if it is already specified)
			
			Pass it the attribute name "category" "action" or "label" and the value, 
			- NOT the local variable with same name!
		
		*/	
		var updateDataAttr = function (attributeName, value) {
			
			// It is important to note that when the parent function executes, any 
			// data attribute that doesn't exist is set to 0, so we check against that
			
			// determine what data attribute we are setting
			switch (attributeName) {
				case "category":
					if ( category === 0 ) { category = value; } // set data-category to passed value
					break;
				case "action":
					if ( action === 0 ) { action = value; } // set data-action to passed value
					break;
				case "label":
					if ( label === 0 ) { label = value; } // set.... well, you get the point
					break;
			}
		};
		
		
		/* ---------------------------------------------------------------------
			Local variables for this function
			
			Check to see if they are already defined as attributes for the element.
			If so, store the value. Otherwise mark it as 0 (needing to be filled)
		
		*/	
		var category = 0, action = 0, label = 0;
		var updateFlag = false; // will become true if param passed or data attributes added dynamically
		
		// First see if any parameters were passed
		if ( param !== {} ) {
			category = typeof param.category !== "undefined" ? param.category : 0;
			action   = typeof param.action   !== "undefined" ? param.action   : 0;
			label    = typeof param.label    !== "undefined" ? param.label    : 0;
			updateFlag = true;
		}
		
		// Now see if data-attributes were already defined for the element
		if (category === 0) { category = typeof $(element).attr("data-category") !== "undefined" ? $(element).attr("data-category") : 0; }
		if (action   === 0) { action   = typeof $(element).attr("data-action")   !== "undefined" ? $(element).attr("data-action")   : 0; }
		if (label    === 0) { label    = typeof $(element).attr("data-label")    !== "undefined" ? $(element).attr("data-label")    : 0; }
		
		// increase the count of the number of elements we evaluated
		initCount++; // Code purists may say we should do this as the last line of the 
		             // function, but here's the story:
					 
		             // This little doggie had originally been after the rules block but 
					 // got swept up in a storm and separated accidentally from the main 
					 // code block. 
					 
					 // So, to keep the little fella safe we're just going to put him here.

		/* ---------------------------------------------------------------------
			Check to see if we need to set any attributes
			
			If any of these attributes are not set, set them. We won't touch the 
			already set ones, just the empty ones
			
			This if block should be the last piece of code in this function as
			our job is done if everything is already set and we don't want to hold
			up the scripts time.
		*/
		if ( !category || !action || !label ) {

			// helper functions
			var getParentID = function( e ) {

				var parentID = "";
				
				if ( typeof $(e).closest("[id]").attr("id") !== "undefined" ) {
					var $ancestor = $(e).closest("[id]");
					parentID = $ancestor.prop("tagName")+"#"+$ancestor.attr("id")+" ";
				}

				return parentID;				
			};

			var getMyID = function( e ) {
				return typeof $(e).attr("id") !== "undefined" ? "#"+$(e).attr("id") : " ";
			};
			
			// determine what kind of element the data attributes are attached to
			var elementTag = $(element).prop("tagName").toUpperCase();
			
			/* 
				We have rules in some priority order, but if a dev really wants his or her HTML
				elements to be tracked in a certain way, just code the dang data attributes! 
				We can't read minds!---yet
			   
				We do some basic things to figure out a name and not have it generic like "Link Click"
				We want to know where on the page the link was clicked and what kind of action was intended
			   
				Is it a downloadable? A form? An interactive UI? Does it have a title or ID? Does it's parent?
				In a perfect world IDs and data attributes would be used and coded already.
				In a perfect world IDs and data attributes would be used and coded already.
				... yes, in a perfect world.
				
				Downloadable links are the most prevalent in terms of not being labelled, 
				which makes perfect sense and are a perfect usecase for this.
			*/
			
			// --------------------------------------------------------------------- //
			// ======   BEGIN RULES   ============================================== //
			// --------------------------------------------------------------------- //

			// DR ZE: There's some crazy stuff going on here, but as long as we follow the rules no one will have a serious, fatal injury
			// HENRY: Aren't all fatal injuries serious?
			// DR ZE: Not the minor ones. Come along now.

			/* ---------------------------------------------------------------------
				IS IT AN ANCHOR ("A") TAG? - do this check first as they are the most prevalent
		    */
			if ( elementTag === "A" ) {
				
				// Does it have an href?
				if ( $(element).attr("href") ) {
					
					var d = isDownload($(element));

					// Is it a downloadable?
					if ( d.isDownload ) { 
						/* It's a downloadable! */
						updateDataAttr("category", "Download"                   );
						updateDataAttr("action",   "Download ("+d.type+")"      );
						updateDataAttr("label",    d.name + " (" + d.path + ")" );
					} 
					// Okay, it's not downloadable, let's check the HREF
					else {
						var href = $(element).attr("href");
						
						// is it a mailto: ?
						if ( /^mailto:/i.test(href) ) { 
							/* It's a mailto: ! */
							updateDataAttr("category", "Contact"  );
							updateDataAttr("action",   "Email" );
							updateDataAttr("label",    href );
						} 
						
						// is it a tel: ?
						else if ( /^tel:/i.test(href) ) {
							/* It's a tel: ! */
							updateDataAttr("category", "Contact"  );
							updateDataAttr("action",   "Telephone" );
							updateDataAttr("label",    href );
						}
						
						// is it a javascript: ?
						else if ( /^javascript:/i.test(href) ) { 
							/* It's a javascript: ! */
						    /* No, dude (or codestress (a female coder - which is awesome!)), 
							   seriously, please don't code hrefs this way as it is so old school
							   --but I'm sure you just inherited that code from a predecessor--
							   However, you can now find them in your analytics report and update them! 
							   What a hero! */
							updateDataAttr("category", "Script"  );
							updateDataAttr("action",   "Link" );
							updateDataAttr("label",    "'javascript:' in HREF" ); // you didn't think we'd really put the javascript in your report, did you?
						} 
						
						// no, its just a link!
						else {
							updateDataAttr("label",      $(element).attr("href") ); // deal with category in the default section below
							updateDataAttr("action",     "Link");
						}
						
					}
					
				}  // worked out a solution for all A tags that have HREFs
				
				// Wait, what if it doesn't have an href? 
				// ... it doesn't have an href? What the heck? Okay, we can still figure this out
				else {
					var myID = typeof $(element).attr("id") !== "undefined" ? "#"+$(element).attr("id")+" " : ""; // check if it has an id
					var myText = $(element).text() ? $(element).text() : "Empty Text"; // does it at least have text between <a> and </a>?
					
					// we don't know what this was, but check for it in the reports because someone clicked on it and probably nothing happened
					updateDataAttr("label",  "A" + myID + " " + myText + " (No HREF)");
				} // weird
				
			} // worked out a solution for all the A tags

			/* ---------------------------------------------------------------------
				IS IT AN INPUT OR SELECT TAG? - second most prevalent as each form probably has 1 or more inputs
		    */
			else if ( elementTag === "INPUT" || elementTag === "SELECT") {

				// update label, we'll worry about category and action in the default section
				updateDataAttr("label", getParentID(element) + elementTag + getMyID(element) + "[name='" + $(element).attr("name") + "']" );
				
			} // worked out a solution for all the INPUT and SELECT tags

			/* ---------------------------------------------------------------------
				IS IT A FORM TAG?
		    */
			else if ( elementTag === "FORM" ) { 
				
				// We'll update action right away, then get to choosing a label. Category can use a default below
				updateDataAttr("action",  "Form Submitted" );
				
				// get the form's ID
				var formID = typeof $(element).attr("id") !== "undefined" ? "#"+$(element).attr("id") : "";
				
				// does the FORM have an action?
				if ( $(element).attr("action") ) { 
					updateDataAttr("label",  "FORM"+formID+" submitted to " + $(element).attr("action") );
				}
				// no action, so we'll just say where it was submitted from
				else {
					updateDataAttr("label", "FORM"+formID+" submitted from " + window.location.href );
				}
				
			} // worked out a solution for all the FORM tags
			
			/* ---------------------------------------------------------------------
				IT'S SOMETHING ELSE 
				(P, DIV, SPAN, etc, whatever may be requested to have an event)
		    */
			else {
				
				// see if it has an id, if so, use it (as they should, *SHOULD* be unique
				if ( $(element).attr("id") ) {
					updateDataAttr("label", elementTag + "#" + $(element).attr("id") );
				}
				
				// see if it has an ancestor with an ID
				else if ( $(element).closest("[id]") ) {
					updateDataAttr("label", $(element).closest("[id]").prop("tagName") + "#" + $(element).closest("[id]").attr("id") + " " + elementTag );
				}
				
				// does it have a title?
				else if ( $(element).attr("title") ) {
					updateDataAttr("label", elementTag + " " + $(element).attr("title") );
				} 
								
				// Does an ancestor have a title?
				else if ( $(element).closest("[title]") ) {
					updateDataAttr("label", $(element).closest("[id]").prop("tagName") + " " + $(element).closest("[title]").attr("title") + " " + elementTag );
				}

				// last resort
				else { 
					updateDataAttr("label", elementTag + " at " + window.location.href);
				}
				
			}
			
			// --------------------------------------------------------------------- //
			// ======   END RULES   ================================================ //
			// --------------------------------------------------------------------- //
			
			// These may have been set in the rules above, but if not we have some final defaults

			// If data-action is 0 set action as event
			updateDataAttr("action", "Event Trigger"); // if listEventType == true, then the event.type will be appended when triggered, we don't worry here	
			
			// If data-category is 0, set tag name as category
			updateDataAttr("category", elementTag); // just list the tag
			
			// set the update flag
			updateFlag = true;
			
		}
		
		if (updateFlag) { 
			// add the data-attributes to the tag
			$(element).attr({"data-label":label, "data-action":action, "data-category":category});
		}
		
	};
	
	/* ---------------------------------------------------------------------
		addEvent() - a local, internal, helper function

		Checks passed element for data-category, data-action, data-label attributes and adds an event.
        It does not add data attributes so it does nothing if they are not already present. 
        That is a feature, not a bug
	*/		
	var addEvent = function (element) {
	
		// we only add an event if already tagged with data-category, etc attributes
		if ( $(element).attr("data-category") && $(element).attr("data-action") && $(element).attr("data-label") ) {
			
			var myEvent = "click"; // default trigger
			
			// does it have a data-atrakit-event attribute? If so, use that, otherwise use default
			if ( $(element).attr("data-atrakit-event") ) {
				myEvent = $(element).attr("data-atrakit-event");
				$(element).on( myEvent, eventTrigger );
			} else {
			// is it in the things table?
				var eType = $(element).prop("tagName");

				// we're using a try catch block to escape the forEach once we have a match
				// it looks scarier than it is
				// More info: http://stackoverflow.com/questions/2641347/how-to-short-circuit-array-foreach-like-calling-break
			
				var BreakException = {};
			
				try {
					
					// This here is what we are really doing.
					Object.keys(things).forEach(function(key) {
						if ( eType === key ) { 
							myEvent = things[key];
							throw BreakException; }
					}, things);
					// see, that's not so scary, is it?
					
				} catch (e) {
					if (e !== BreakException) { throw e; }
				}
				
			}
			
			$(element).on( myEvent, eventTrigger );	// add the event trigger to the element
				
		} else {
          debug("No data tags so no event added");
        }

		
	};

	/* =====================================================================
		isDownload()

		Private function that checks to see if the element passed to it is a link to a downloadable

		This function is a candidate to be moved into addData() as a local function.
		I don't know if there is a practical use for it outside of addData()

		Returns an array with the boolean isDownload and file name attributes (if it is a downloadable)

	*/
	var isDownload = function (element) {
		
		// initialize the return variable
		var v = {isDownload: false};
		
		// first, make sure this is an anchor tag (A), if not, do nothing and return false
		if ( $(element).prop("tagName").toUpperCase() === "A" ) {
			
			// get the href, but only the pathname
			var aHref = $(element)[0].pathname; // this gets rid of the query string, #, and other crud
			
			// create the regular expression, inserting the predefined fileTypes
			var reg = new RegExp("("+fileTypes+")$", "gi");
			
			// if it is a downloadable file (passes the regex test)
			if (reg.test(aHref) ) {
		
				// set the variables
				var vName = aHref.substring(aHref.lastIndexOf('/')+1);
				var vType = vName.substring(vName.lastIndexOf('.')+1).toUpperCase();
				var vPath = $(element)[0].hostname + aHref;
				
				// set the return value
				v = {isDownload: true, name: vName, type: vType, path: vPath};
				
			}
		}
		
		return v;
	};	

	/* =====================================================================
		recordEvent()

		Private function that records events using the correct function
		specific to the flavor of analytics being used.

		ga.js documentation: 
			https://developers.google.com/analytics/devguides/collection/gajs/
		analytics.js documentation: 
			https://developers.google.com/analytics/devguides/collection/analyticsjs/events
	 
	 	Returns:
	 	category - the Category to submit for an event hit (ex: "Video")
		action   - the Action to submit for an event hit (ex: "Play")
	 	label    - the Label to submit for an event hit (ex: "Fall Campaign")
	*/
	 var recordEvent = function(category, action, label) {	

	 	// from the gaFlavors array, get the eventfn for the analytics flavor
		getGAflavor().eventfn(category, action, label); // we use the gaFlavors array
		
		// let the devs know that an event was triggered
		debug("Event Triggered (category: '"+category+"', action: '"+action+"', label: '"+label+"') Sent To: " + getGAflavor().name ); 
		// site admin should check Google Analytics dashboard "Real-Time" to verify
	};

	/* =====================================================================
		recordPageView()

		Private function that records page views using the correct function
		specific to the flavor of analytics being used.

		Not sure if there is use for it here, but since we can store functions
		along with the flavor of analytics, we'll just do it.

		ga.js documentation: 
			https://developers.google.com/analytics/devguides/collection/gajs/
		analytics.js documentation: 
			https://developers.google.com/analytics/devguides/collection/analyticsjs/pages
	 
	 	Returns:
	 	page - the page path to submit for a page view hit (ex: /blog/2016/01/16/all-about-today)
	*/
	 var recordPageView = function (page) {

	 	// from the gaFlavors array, get the pagefn for the analytics flavor
		getGAflavor().pagefn(page); // we use the gaFlavors array
		
		// let the devs know that an event was triggered
		debug("PageView Triggered ("+page+") Sent To: " + getGAflavor().name); 
		// site admin should check Google Analytics dashboard "Real-Time" to verify
	};

	/* =====================================================================
		getGAflavor()

		Private helper function to see what analytics we detect.
		This is the method by which all checks should be performed.
		Only this function should be using gaFlavor, all others should go through here

		You should not be worried about using this function repeatedly, it caches the 
		result as in theory the flavor of analytics should not change upon execution. 
		If it does we have bigger problems.

		Returns:
		gaFlavor object (an array with values and functions specific to flavor)
	 */
	 var getGAflavor = function() {
		
		// we cache the flavor in the variable upon first call and then just return gaFlavor from then on
		if ( typeof(gaFlavor) === 'undefined' || gaFlavor === null ) {
			gaFlavor = gaFlavors.NONE;
			gaFlavor.name = "NONE";
								
			// we're using a try catch block to escape the forEach once we have a match
			// it looks scarier than it is
			// More info: http://stackoverflow.com/questions/2641347/how-to-short-circuit-array-foreach-like-calling-break
			
			var BreakException = {};
			
			try {
				
				// This here is what we are really doing.
				Object.keys(gaFlavors).forEach(function(key) {
					if ( this[key].detectfn() ) { 
						gaFlavor = gaFlavors[key];
						gaFlavor.name = key; 
						throw BreakException; }
				}, gaFlavors);
				// see, that's not so scary, is it?
				
			} catch (e) {
				if (e !== BreakException) { throw e; }
			}
			
			// send what we found to the console
			debug(gaFlavor.desc);
		}
		
		return gaFlavor;
	};

	/* =====================================================================
		isGA()

		Helper function that helps us ponder the question: "Is Analytics is of type "X"?
		Where "X" can be NONE|TRAD|CLAS|UNIV|GTMX|CUST
	*/
	var isGA = function (type) {
		return type === getGAflavor().name;
	};
	
	/* =====================================================================
		hasGA()

		Private helper function to see if we detect analytics

		Returns:
		true if Analytics was detected, false if not detected
	*/
	 var hasGA = function() {
		return ( getGAflavor().name !== "NONE" ); /* a simple, elegant, one line says it all */
	};


	
		
		
/* +++++++++++++++++++++++++++++++++++++++++++++++++
   +++ Plugin Functions +++ */		

	
	
	

    $.fn.atrakitAdd = function( action, param ) {
		
		// ECMAScript 6 allows default in function, but not all code editors and minifiers support it
		// in future: $.fn.atrakitAdd = function( action="both", param = {} )
		if (typeof action === 'undefined') { action = "both"; }
		if (typeof param === 'undefined') { param = {}; }
				
		return this.each( function() {
 			
			switch ( action.toLowerCase() ) {
				
				case "data":
					addData(this, param);
					break;
					
				case "event":
					addEvent(this);
					break;
					
				case "both":
					addData(this, param);
					addEvent(this);
					break;
					
				default:
					debug("Unknown Command for atrakitAdd(): "+ action);
			}

		});
 
    };
	
	/*
	
	ALSO:
	$(document).atrakit("init");
	$(document).atrakit("init", {tagOnly: true});
	$(document).atrakit("config", {silence: true, listEventType: true}).atrakit("init");
	
	

	// Sample code for adding a custom analytic
	var myCustomAnalytic = 
		{ CUST: { desc: "Custom Analytic",  
				  eventfn: function(category, action, label) { true; }, 
				  pagefn: function(page) { true; },
				  detectfn: function() { return (typeof yourCustVar !== 'undefined'); }
				}
		};
						  
	$(document).atrakit("config", { customAnalytic: myCustomAnalytic });
	
	// Example of all config parameters
	$(document).atrakit("config", {
		silence: true,
		listEventType: true,
		customAnalytic: myCustomAnalytic,
		fileTypes: "pdf|mp3"
	})
	*/
	
	
	$.fn.atrakit = function ( action, param ) {

		// ECMAScript 6 allows default in function, but not all code editors and minifiers support it
		// in future: $.fn.atrakit = function ( action="init", param={} )
		if (typeof action === 'undefined') { action = "init"; }
		if (typeof param === 'undefined') { param = {}; }
		
		switch ( action.toLowerCase() ) {
 
			case "init":
				var level = 0; // both
				if ( typeof param.tagOnly !== 'undefined' ) { level = param.tagOnly ? 1 : level; } // if tagOnly is true set level to 1 otherwise leave as is
				if ( typeof param.trackOnly !== 'undefined' ) { level = param.trackOnly ? -1 : level; } // we don't care if we overrite tagOnly, shouldn't be using both anyway
				init($(this), level);
				break;
		 
			case "config":
				if ( typeof param.silence !== 'undefined' ) { setSilence(param.silence); }
				if ( typeof param.listEventType !== 'undefined' ) { setListEventType(param.listEventType); }
				if ( typeof param.customAnalytic !== 'undefined' ) { setCustomFlavor(param.customAnalytic); }
				if ( typeof param.fileTypes !== 'undefined' ) { setDownloadFileTypes(param.fileTypes); }
				break;			

			default:
				debug("Unknown Command for atrakit(): "+ action);
		}
		
		return this;
	};
	
	/**
	
	Return values
	
	*/
	
	$.fn.atrakitGet = function ( get, arg ) {
		
		// ECMAScript 6 allows default in function, but not all code editors and minifiers support it
		// in future: $.fn.atrakitGet = function ( get="gaFlavor", arg="" )
		if (typeof get === 'undefined') { get = "gaFlavor"; }
		if (typeof arg === 'undefined') { arg = ""; }
		
		var returnThis = "";
		
		switch ( get.toLowerCase() ) {
			
			case "gaflavor":
				returnThis = getGAflavor();
				break;
				
			case "is":
				if ( arg !== "" ) { returnThis = isGA(arg.toUpperCase()); }
				else { debug("Empty arg for atrakitGet('is', arg)"); }
				break;
				
			default:
				debug("Unknown Command for atrakitGet(): "+ get);
		}
		
		return returnThis;
	};
	
	// http://stackoverflow.com/questions/190253/jquery-selector-regular-expressions
	// this has little use externally of the plugin, this is more internal use only
	// but we want to use the jQuery filter functionality
	$.fn.atrakitLinkFilter = function(){
		
		var currentDomain = window.location.hostname.replace(/\./g, "\\.");
		
		//off site
		var regExOffSite = "(https?\\:)?\\/\\/(?!"+currentDomain+")"; // domain not same as current domain
		//debug(regExOffSite);
		
		//in page
		var regExInPage = "(("+currentDomain+"){0,1}.*#)|^\\s*$"; // starts with # or # points to own self
		
		//downloads                                can be followed by ? and # if in there for some reason
		var regExDownloads = "\\.(?:"+fileTypes+")(?=\\?([^#]*))?(?:#(.*))?"; // href has an extension we're looking for		
		
		var pattern = "("+regExOffSite+")|("+regExDownloads+")|("+regExInPage+")";
		//debug( pattern );
		
		return this.filter( function () {	
			var regEx = new RegExp( pattern, "gi" );
			//debug( regEx.test( $(this).attr('href') ) + " " + regEx.exec( $(this).attr('href') ) + " " + $(this).attr('href') );
			return regEx.test( $(this).attr('href'));
		});


    };

	
	
	

		
		
/* +++++++++++++++++++++++++++++++++++++++++++++++++
   +++ On Ready/Loaded +++ */		


	
	
	// we are initializing, so now we'll set this to true
	setGlobalInit(true); 

	// let the devs know a little about the script in console.log
	debug("Loaded "+name+" ("+code+") [ver"+version+"]"); 
	
	// figure out the Analytics flavor
	hasGA();
	
	
	
/* +++++++++++++++++++++++++++++++++++++++++++++++++
   +++ Done! +++ */		

 
}( jQuery ));
	 

/*  ********************************************************************************************
        END -- Analytics TRAcKing toolKIT (ATRAKIT /ah... track it!/)
    ********************************************************************************************
    ============================================================================================ 
*/