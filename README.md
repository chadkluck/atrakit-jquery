# atrakit
Script to automatically tag links, downloads, and events with Google Analytics (or other analytics)

It takes less than a minute to get your site up and running with event tracking. 

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

Full Documentation currently at: https://dev.63klabs.net/atrakit
