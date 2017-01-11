/** @preserve TABGROUPS: VIEW DOC|CODE|LIC @ github.com/ustlibraries/tabgroups */
/*  ============================================================================================
    ********************************************************************************************
    	TabGroups (requires jQuery)
    ********************************************************************************************
	
	University of St. Thomas Libraries (stthomas.edu/libraries) - 12/16/2016
	Version: 2016.12.16
	github.com/ustlibraries/tabgroups
	
	Released under Creative Commons Attribution 4.0 International license (CC BY)
	https://creativecommons.org/licenses/by/4.0/
	
	The code, with it's heavy use of comments, is provided as an educational resource in hopes
	that it can be useful in function and disection.
	Minifying and obvuscating for production environments is OK and, in fact, strongly encouraged 
	even if it removes attribution comments.
	
    ********************************************************************************************
	
	- Clean implementation (easy for site owner to implement and add content to HTML structure)
	- Degrades gracefully if noscript
	- Fully responsive (ability for site owner to choose accordion or dropdown when compact)
	- Works in modern browsers (IE, Edge, Firefox, Chrome, Safari)
	- UX focused
	- Accessibility compliant
	- Infinately nestable (but I wouldn't recommend it as infinate web pages make for infinate page load times)
	
	Place this code in your site's main javascript file
	
	********************************************************************************************
	
	RESOURCES
	Accessibility:
	http://www.learningjquery.com/2010/04/accessible-showing-and-hiding
	http://webaim.org/techniques/css/invisiblecontent/
	https://developer.mozilla.org/en-US/docs/Web/Accessibility/
	
    ********************************************************************************************
	
	USAGE:



	********************************************************************************************
	
	ISSUES:

	- when a dropdown, the wrong open/close is sent to the data labels, exec out of order?
	- with accordian, just nudge it up a bit, don't move all way up to top. up 20px, no higher than top.
	- tab group de-duplicate id does not work
	- implement tab level de-duplicate id
	- dynamically nest the h2, h3, etc tags
	- clean up the code

    ********************************************************************************************
*/

/*  ============================================================================================
    ********************************************************************************************
    GLOBAL VARIABLES 
	******************************************************************************************** 
*/

// tabgroups
if (typeof tabgroups === 'undefined') { tabgroups = false; } // let init take care of setting true



/*  ============================================================================================
    ********************************************************************************************
    TabGroup PLUGIN FUNCTION 
	********************************************************************************************
*/

(function( $ ) {
	
	//"use strict"; // reserved for "someday" once we overcome how to detect global init variable w/o using globals
	
/* *** Local variables *** */
	
	/* Script info */
	var version = "0.0.2-20161220-01"; // just a manual version number for debugging and preventing unneccessary hair pulling: "Is it loading the code I *thought* I uploaded?"
	var code    = "github.com/ustlibraries/tabgroups";
	var handle  = "TABGROUPS";
	var name    = "TabGroups UI";
	
	/* Settings (Read/Write) */
	var silent = false; // should debug() not output to console.log?
	

/* *** Local Functions *** */
	 
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
		
		If silenced, debug() won't send messages to console.log
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
	 *  getGlobalInit() / setGlobalInit()
	 *
	 *  We do it here so these are the only functions not using strict
	 */	
	var getGlobalInit = function() {
		return tabgroups;
	};
	
	var setGlobalInit = function(b) {
		tabgroups = b === true ? true : false; // don't blindly accept what is passed
		return getGlobalInit();
	};
	
	/* =====================================================================
	 *  checkUniqueID()
	 *
	 *  Make sure the ID on the element is unique, change it if not, give
	 *  it one if it doesn't have an id
	 */
	
	var checkUniqueID = function (e) {
		
		var isUniqueID = function (checkMe) {
			var i = $(checkMe).attr("id");
			var t = $(checkMe).prop("tagName");
			return ( $(t+"#"+i).length < 2 );
		};
		
		var id = $(e).attr("id");
		var tag = $(e).prop("tagName");
		
		// 
		if( typeof id === 'undefined' || !isUniqueID(e) ) {
			debug("Element with no-ID/non-unique ID detected ("+tag+"#"+id+")... assigning a unique ID");
			if( typeof id === 'undefined' ) { id = handle; }

			// select a new id
			var newId = "";
			do {
				newId = id + "_" + Math.floor((Math.random() * 1000) + 1); 
			} while (!isUniqueID( $(e).attr("id", newId) ) );

			debug("Element ("+tag+"#"+id+") reassigned to: " + tag+"#"+$(e).attr("id") );

		}
		
	};
					
	
	/* =====================================================================
	 *  tg_selectTab()
	 *
	 *  This is the event assigned to onclick=""
	 */
	function tg_selectTab(selectedTab) {
		changeTabSelection(selectedTab); // A new selection has been made
		if ( $(selectedTab).closest("div").hasClass("tab-to-dropdown") ) {
			tg_toggleDropdown( $(selectedTab).closest("div"), false); // we're just closing the dropdown
		}



		// TODO: what if current tab reselected?
	}

	/* =====================================================================
	 *  changeTabSelection()
	 *
	 *  This is what changes the tab selection
	 *  Called by tg_selectTab()
	 */
	function changeTabSelection(selectedTab) {

		// find out what tab-group called it
		// each box on a page should have it's own ID
		var tabbedContent = "#" + $(selectedTab).closest("div").attr("id");

		// Deselect the previously selected li tab and h2 accordion
		$(tabbedContent + " > ul > li.selected, " + tabbedContent + " > h2.selected").removeClass("selected").addClass("not-selected").find("span.screen-reader-text").html("Show: ");

		// Hide the previously shown content associated with that tab
		$(tabbedContent + " > div.selected").addClass("hidden").removeClass("selected");

		// Find out what tabs/accordion is selected
		var contentID = $(selectedTab).find("a").attr("href");	

		// Select the newly selected tab (Both the ul > li tab and the h2 (as both are parents to the a href match) 2 for 1!
		$(tabbedContent + " a[href='"+contentID+"']").each( 
			function() {
				$(this).parent().removeClass("not-selected").addClass("selected");            // changes selection
				$(this).parent().find("span.screen-reader-text").html("Currently Showing: "); // changes screen reader text
			}
		);

		// Show the newly selected content associated with the selected tab

		var currTabContent = $(tabbedContent + " > div"+contentID);
		currTabContent.removeClass("hidden").addClass("selected");

		// if accordion, scroll to new selection
		if( $(tabbedContent + ".compact.tab-to-accordion").length ) {
			debug("Scroll: "+$(contentID).prev().offset().top);
			$('html, body').animate({
			  scrollTop: $(contentID).prev().offset().top
			}, 1000);
		}

		if( $(tabbedContent).find(" > div.selected div.tab-group").length ) { // are there nested child groups in this content?
			calculateTabbedContentSize();
			// TODO: chage it so it only recalcs for recently selected content (mainly if there is a nested tab) right now it does a recalc of all tabs on page
		}

		debug("Current Tab for Group ["+tabbedContent+"] Now: [" + currTabContent.attr('id') + "]" );
	}

	/** ********************************************************************************************
	 *  This is what changes the dropdown selection
	 *  Called by tg_selectTab()
	 */
	function tg_toggleDropdown(thisTagGroup, clicked) {

		if(typeof clicked === 'undefined') { clicked = true; }

		var elem = $(thisTagGroup).find("ul:first");
		var dropdown = $(thisTagGroup).find("span.tab-menu > a");

		if ( elem !== null) {
			if ( $(elem).hasClass("dropdown-expanded") || clicked === false ) {
				elem.removeClass("dropdown-expanded");                                                    // Remove Expanded Class (css will hide menu)
				$(thisTagGroup).find(" > span.tab-menu > span.screen-reader-text").html("Show Menu: ");   // Change screen reader text from hide to show
				dropdown.html(elem.find("li.selected a").attr("data-name"));                              // Change the dropdown text to show current selection
				dropdown.attr("data-action","Open Dropdown");                                             // Change the data-action analytics attribute to Open Dropdown (ready for next click)
			} else {
				elem.addClass("dropdown-expanded");                                                       // Add Expanded Class (css will show menu)
				$(thisTagGroup).find("span.tab-menu > span.screen-reader-text").html("Hide Menu: ");      // Change screen reader text from show to hide
				dropdown.html("Select...");                                                               // Change the dropdown text to show Select...
				dropdown.attr("data-action","Close Dropdown (no selection made)");                        // Change the data-action analytics attribute to Close Dropdown (ready for next click)
			}
		}
	}

	/** ********************************************************************************************
	 *  This calculates the width of the Tab Group
	 *  If the tab labels are too wide to all fit on one line
	 *  we'll want to collapse it into a dropdown or accordion. This
	 *  is the function that calulates the width, but does not actually
	 *  make the change.
	 */
	function calculateTabbedContentSize() {

			$("div.tab-group").each( function() {

				var tabElementID = "div#" + $( this ).attr("id");

				var tabElement = $(tabElementID + " > div.selected");
				var cWidth = tabElement.outerWidth(true);

				var tWidth = 0;
				if ( $(tabElementID + " > ul").css("max-width") !== "none" ) {
					// the ul was initialized
					tWidth = parseInt($(tabElementID + " > ul").css("max-width"));
				} else {
					// initialize the ul if it is visible (otherwise the width would be 0, however this function is called upon init, resize, and select so we'll just wait until needed
					if( $(tabElementID).is(":visible") ) {
						$(tabElementID + " > ul > li").each( function() { tWidth = tWidth + 3 + $( this ).outerWidth(true); });
						$(tabElementID + " > ul").css("max-width", tWidth);
						$(tabElementID + " > ul").css("white-space","nowrap"); // we set it here so it would have degraded gracefully if noscript
					}

				}

				var wOkay = true;
				if (cWidth < tWidth) { wOkay = false; }

				// for testing, place the width in the bottom of the tab group (there is a css style for p.test that can hide/unhide the result)
				$(tabElementID).attr("data-tab-group-calc-width", "Needed: " + tWidth + " | Current: " + cWidth + " | Enough Room?: " + wOkay);

				if ( wOkay && $(this).hasClass("compact") ) {
					// tabs
					$(this).removeClass("compact").addClass("tabbed");
					if ( $(this).find("ul.dropdown-expanded") ) { tg_toggleDropdown(this, false); } // if dropdown was expanded, clear
				} else if ( !wOkay && $(this).hasClass("tabbed") ){
					// compact
					$(this).removeClass("tabbed").addClass("compact");
				}

			}); // end of .each


	}

	/** ********************************************************************************************
	 *  This is the function called by $(document).ready()
	 */
	function init_tabGroups() {

		// going to use this for diagnostics.
		var initStart = new Date(); 
		var initCount = 0;

		// find any tabs
		var tabbedContent = $("div.tab-group");

		// if the page contains tabbed content, initialize it
		if (tabbedContent) {

			// set default classes
			$(tabbedContent).each( 
				function ( ) { 
					initCount++;
					var tc = $(this); 
					
					checkUniqueID(tc);

					/* Create the element that serves as the dropdown menu title holder, and screen reader text */

					var tabGroupTitle = tc.attr('data-name'); // get the title of the group tabs to use as span text
					if (typeof tabGroupTitle === 'undefined') { tabGroupTitle = "Tab Group"; tc.attr('data-name', tabGroupTitle); } // define it if it isn't set and set it for future use

					var a = $( document.createElement('a') ); // create the link for inside the span
					$(a).attr("href", "#").click( function(e) { e.preventDefault(); tg_toggleDropdown( $( this ).closest("div") ); } );
					$(a).attr( {"data-category": "Tabs", "data-action": "Open Dropdown", "data-label": tc.attr("id") } );

					var spanTabMenu = $( document.createElement('span') ).addClass("tab-menu").append( a );

					$(tc).prepend(spanTabMenu);

					/* Now that the dropdown is created, we can use it as a reference point to insert screen reader items before it */
					$( document.createElement('h1') ).append(document.createTextNode(tabGroupTitle)).insertBefore(spanTabMenu); // for screen readers - provides context for tab group
					$( document.createElement('span') ).addClass("screen-reader-text").html("Show Menu: ").prependTo(spanTabMenu); // for screen readers - provides context for dropdown menu


					// set default responsive compact behaviour to tab-to-dropdown if not otherwise specified
					if (!tc.hasClass("tab-to-accordion") && !tc.hasClass("tab-to-dropdown")) { 
						tc.addClass("tab-to-dropdown"); 
					} 

					// initialize the starting format
					if (!tc.hasClass("tabbed") && !tc.hasClass("compact") ) {
						tc.addClass("tabbed");
					}


				}
			);

			// Place H2 for accordion AND screen readers (not visible onscreen unless accordion)
			// Also add data labels
			$("div.tab-group > ul > li > a").each(  /* div.tab-group.tab-to-accordion > ul > li > a */
				function () { 

					// start extracting the data needed to generate the h2 tags and data attributes
					var li_a = $(this);
					var id = li_a.attr("href");
					var text = li_a.attr("data-name");

					// if title attribute is blank, use the text between the <a></a>
					if (typeof text === 'undefined') {
						text = li_a.html();
						li_a.attr({"data-name": text}); // set default for own title attribute since it doesn't exist
					}

					// generate the h2 tag
					var h2 = $( document.createElement('h2') );
					var a = $( document.createElement('a') ).attr('href', id).append( document.createTextNode(text) );

					// put the anchor tag inside the h2
					$(h2).append(a);

					// insert the h2 tag in the appropriate spot before the content
					$(h2).insertBefore(id);

					var tabGroupId = $(this).closest('div').attr('id');

					// add data labels - analytics event tracking is invoked during actual selection
					$(this).attr( { "data-category": "Tabs", "data-action": "Select Tab", "data-label": tabGroupId +" : "+ text } );
					$(a).attr( { "data-category": "Tabs", "data-action": "Open accordion", "data-label": tabGroupId +" : "+ text } );

				}
			);



			// Set the click behavior of tabs/dropdown
			$("div.tab-group > ul > li > a, div.tab-group > h2 > a").click( function(e) { e.preventDefault(); tg_selectTab( $( this ).parent() ); } );

			// set all to not selected to begin with
			$("div.tab-group > ul > li, div.tab-group > h2").each( function () { $(this).addClass("not-selected"); $( document.createElement("span") ).addClass("screen-reader-text").html("Show: ").prependTo(this); }); // ready the li and h2 labels
			$("div.tab-group > div").each( function () { $(this).addClass("hidden"); });

			// Set the first tab/dropdown/accordion as active
			$("div.tab-group").find(" > ul > li:first, > h2:first").addClass("selected").removeClass("not-selected").find("span.screen-reader-text").html("Currently Showing: ");
			$("div.tab-group").find(" > div:first").addClass("selected").removeClass("hidden");

			// dropdown label
			$("div.tab-group").each( function () { $(this).find(" > span.tab-menu > a").html( $(this).find(" > ul > li.selected > a").attr("data-name") ); } );

			// determine if tab or compact (dropdown/accordion) (based on horizontal space)
			calculateTabbedContentSize();

			// Add event listener for window resizing
			$( window ).resize(function() {
				calculateTabbedContentSize();
			});

		} // end initialize tabs if present

		/* ---------------------------------------------------------------------
			INIT is done! 
			
			Record our time. Hopefully we did everything pretty quickly.
			Initial tests were 10 tabgroups in 44ms
		*/		
		
		// calculate the milliseconds it took
		var diff = Math.abs((new Date()) - initStart); 
		
		// put it in the console.log for devs
		debug("Init of "+initCount+" TabGroups completed in "+diff+" milliseconds");
	}

	$.fn.tabgroups = function ( action, param ) {

		// ECMAScript 6 allows default in function, but not all code editors and minifiers support it
		// in future: $.fn.atrakit = function ( action="init", param={} )
		if (typeof action === 'undefined') { action = "init"; }
		if (typeof param === 'undefined') { param = {}; }
		
		switch ( action.toLowerCase() ) {
 
			case "init":
				init_tabGroups();
				break;
		 
			case "config":
				if ( typeof param.silence !== 'undefined' ) { setSilence(param.silence); }
				break;
				
			case "select":
				// This is for non-user initiated selects (initiated by a script, not a user's click)
				// Useful when selecting a non-default tab based on a query string or other functional event
				// Usage: $("#tabContainerID").tabgroups("select", "idOfContent")
				if ( typeof param.id !== 'undefined' ) { 
					var tab = this.find("ul:first > li > a[href='#"+param.id+"']").parent(); // find the tab we represent
					debug("Dynamically select tab for content ID: "+ param.id);
					tg_selectTab(tab);
				}
				break;

			default:
				debug("Unknown Command for tabgroups(): "+ action);
		}
		
		return this;
 
    };
	
/* *** On Ready/Loaded *** */	
	
	// we are initializing, so now we'll set this to true
	setGlobalInit(true); 

	// let the devs know a little about the script in console.log
	debug("Loaded "+name+" ("+code+") [ver"+version+"]"); 
	
	// initialize the tabgroups
	init_tabGroups();
	
 
}( jQuery ));

/*  ********************************************************************************************
    END -- TAB GROUPS
    ********************************************************************************************
    ============================================================================================ 
*/
