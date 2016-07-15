##
# You should look at the following URL's in order to grasp a solid understanding
# of Nginx configuration files in order to fully unleash the power of Nginx.
# http://wiki.nginx.org/Pitfalls
# http://wiki.nginx.org/QuickStart
# http://wiki.nginx.org/Configuration
#
# Generally, you will want to move this file somewhere, and start with a clean
# file but keep this around for reference. Or just disable in sites-enabled.
#
# Please see /usr/share/doc/nginx-doc/examples/ for more detailed examples.
##

upstream app_trycoding {
	server 127.0.0.1:3000;
	keepalive 8;
}

server {
	listen		80;
	server_name	www.trycoding.io;
	rewrite		^ https://$server_name$request_uri? permanent;
}




server {
	listen 1443;
	listen [::]:1443 default_server ipv6only=on;


	# Make site accessible from http://localhost/
	server_name www.trycoding.io;
	access_log /var/log/nginx/trycoding.io.log;

	location / {
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $http_host;
		proxy_set_header X-NginX-Proxy true;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";

		proxy_pass http://app_trycoding/;
		proxy_redirect off;
	}
}
