## Configure trycoding.io on AWS

### Trycoding.io Webserver

Create Volume and EC2 instance.

**FAQ**

Q: My instance has not root device attached?
A: If there is an existing volume, attach this in the AWS and using `/dev/sda1` for the device.

Q: HTTPS?
A: We use a Load Balancer that redirects 80 and 443 to our internal trycoding.io ec2 instance. Then we use
a simple [nginx rule](https://thoean.com/using-nginx-on-docker-to-redirect-http-to-https/) to redirect normal http to https:

Q: SSL-Certificate
A: Use Amazon Certificate Manager to get a free certificate

Q: I cannot reach my EC2-Instance?
A: Make sure that you have allowed port 80/443/ssh on the security groups for the instance. See Inbound/Outbound rules.

#### Configuring NGINX
See: http://nginx.org/en/docs/beginners_guide.html
https://thomas-leister.de/nginx-installation-konfiguration-einrichtung-ubuntu-server/

You can find the nginx config file here: `/etc/nginx/sites-enabled/*`

**Comments in config file**
Use `# I am a comment`

**Commands**

* start: `nginx`
* stop: `nginx -s stop` (Fast Shutdown)
* quit : `nginx -s quit ` (Graceful Shutdown)
* reload : `nginx -s reload ` (Reloading the config file)
* reopen : `nginx -s reopen ` (Reopen log files)

**List of running nginx proccesses**

`ps -ax | grep nginx`

## Trouble Shooting
P: My Health-Checks are not passing?
A: Check if your instance allows inbound connection on your configurated port

P: I want to prevent outside inbound access to my ec2 instance, only the load balancer should have access
A: http://docs.aws.amazon.com/ElasticLoadBalancing/latest/DeveloperGuide/elb-security-groups.html#elb-classic-security-groups

P: Where can I find an example for ELB
A: http://serverfault.com/questions/619971/redirect-all-http-requests-behind-amazon-elb-to-https-without-using-if

P: I get the error `failed: WebSocket opening handshake was canceled` when trying to connect to a secure websocket TCP server
behind a ELB Load Balancer.
A: If you use a certificate you cannot use the ELB public dns name, you must use the domain name for the certificate, otherwise
the connection fails. Try to connect to the ELB public dns name with https://NAME and if this fails, it is a certificate problem.