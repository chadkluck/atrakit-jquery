# atrakit

> NOTE: This repository is deprecated as it uses old versions of Google Analytics. Use Google Analytics 4 with Tag Manager to achieve the same.

ATRAKIT can be used to add tracking events to web pages.

It is a script to automatically tag links, downloads, and events with Google Analytics (or other analytics)

`$(document).atrakit("init"); // will add it to all trackable events on a page`

Yep, that's it. It takes less than a minute to get your site up and running with event tracking. 

1. Have Google Analytics (Classic or Universal) code already running on your site
2. Place atrakit.js (or atrakit.min.js) in your website's javascript folder
3. Place the following code in the footer to be included on all of your pages:

```
<script src="//yoursite.com/path/to/js/atrakit.min.js"></script>
<script>
$(document).ready( function () { $(document).atrakit("init"); });
</script>
```
4. Check Google Analytics Real-Time and verify that it is working. Open the browser's dev console to see logging.

No other customization or set-up is required. Required fields, downloads, and off site clicks will automatically be tracked. To track more read the documentation.

## Demo

Go to https://atrakit.demo.63klabs.net and open a browser console to see it in action.

## Usage

`$(document).atrakit("init"); // will add it to all trackable events on a page`

See [Whole page examples](examples/init/body.html)

By default it's the only call you need with no configuration necessary!

What is trackable (by default)? Basically it includes (but not limted to):

- A
    - if it is downloadable (mp3, pdf, etc)
    - if it links offsite (to another domain)
    - if it has contact markup (href=mailto:, href=tel:)
    - if it has href=javascript:
- INPUT, SELECT if it is required
- FORM (All)
- Any element (P, SPAN, etc), including A and INPUT if the following attributes are present:
    - data-category - just add data-category, data-label, data-action to any element that would not normally be tracked and it will be tracked (default event is onClick)
    - data-atrakit=true - add this if you don't want to go through the hassle of adding data-category and the like, the script will do it for you (default event is onClick)
    - data-atrakit-event - add this if you want to have events trigger on things like hover. This can also be used to change the default event behavior. Just add an event type to the attribute's value data-atrakit-event="mouseenter"

Note that if a trackable event does not have data-category, data-label, or data-action attributes, they will automatically be generated.

## Advanced Usage

You don't have to track all the default elements on the page. Maybe you just want to track a few. That's where jQuery selectors come in!

The following piece of code will track all trackable elements within _A jQuery SELECTED CONTAINER_ ("#main-body", "#footer", and "div.ads"):

`$("#main-body, #footer, div.ads").atrakit("init"); // Selector examples`

See [Selector examples](examples/init/selectors.html)

Any jQuery selector may be used, and may be used with .not, .filter, etc. `$(selector).not(something).filter(somethingtoo).atrakit("init");`. Even though "document" is not a selector, the script recognizes it and treats it as $("BODY") so $(document).atrakit("init") and $("BODY").atrakit("init") is essentially the same thing.

CAUTION! NEVER CROSS THE STREAMS! It won't result in total protonic reversal, but doing something like `$(document).atrakit("init); $("table").atrakit("init");` "would be bad" even if you are fuzzy on the whole good/bad thing.

## Tracking Using .atrakitAdd()

Maybe you have a different flavor of analytics, maybe you already have some other auto tag feature going but it isn't getting all of your stuff. Whatever the reason we have another solution: .atrakitAdd()

.atrakitAdd() will add data attributes and/or event triggers to specific elements (not children, grandchildren, etc). For example, if you want to add data, but not events to all p.play elements $("p.play").atrakitAdd("data") is your friend. Want both data and events added? $("p.play").atrakitAdd(). Want just events? $("p.play").atrakitAdd("event") but note that if data-category, action, and label aren't already on p.play elements, events won't be added. .atrakitAdd("event") only adds events to elements with the data-category and the like already added, even if atrakit-event and atrakit=true are in the element. Why? Because if you wanted data AND events then use ().

Remember, unlike .atrakit("init), .atrakitAdd() tracks the element(s) selected through the selector, it it does not track child, grandchild, etc elements of that element or elements that come into existence later after the .atrakitAdd element was run. There are limited use cases why .atrakitAdd can be used, it is best to stick with .atrakit("init").

The following piece of code will track all elements captured by the selector:

`$(".clickable").atrakitAdd();`

See [atrakitAdd() examples](examples/add/index.html)