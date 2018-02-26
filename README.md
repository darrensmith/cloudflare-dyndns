# CloudFlare DynDNS v1.0
# Author: Darren Smith
# https://github.com/darrensmith/cloudflare-dyndns

Thanks for checking out my Dynamic DNS Update tool for CloudFlare.

CloudFlare is the perfect dynamic DNS host because, unlike the other major ones supported by many routers, CloudFlare is completely free. Unfortunately most routers don't support dynamically updating DNS records on CloudFlare - and so you need a tool that can run in the background of a server on your LAN. This is that tool.

To get started:

* Clone this repository to the computer that you wish to run this on
* Type "npm install" to install all dependencies
* Rename config.json.example to config.json and modify it to include your CloudFlare credentials and setup details
* Run the process using "npm start" (or use Forever to run it in the background - recommended)