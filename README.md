# atrakit
Script to automatically tag links, downloads, and events with Google Analytics (or other analytics)

It takes less than a minute to get your site up and running with event tracking. 

1. Have Google Analytics (Classic or Universal) code already running on your site
2. Place atrakit.js (or atrakit.min.js) in your website's javascript folder
3. Place the following code in the footer to be included on all of your pages:

<script src="//static.stthomas.edu/libraries/js/atrakit.min.js"></script>
<script>
$(document).ready( function () { $(document).atrakit("init"); });
</script>


Full Documentation currently at: https://dev.63klabs.net/atrakit
