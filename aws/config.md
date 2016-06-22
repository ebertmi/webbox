## Configure trycoding.io on AWS


### Trycoding.io Webserver
Create Volume and EC2 instance.

**FAQ**

Q: My instance has not root device attached?
A: If there is an existing volume, attach this in the AWS and using `/dev/sda1` for the device.

Q: HTTPS?
A: We use a Load Balancer that redirects 80 and 443 to our internal trycoding.io ec2 instance. Then we use
a simple [nginx rule](https://thoean.com/using-nginx-on-docker-to-redirect-http-to-https/) to redirect normal http to https:
```
events {

}
http {
  server {
    listen       80;
    location / {
      return 301 https://$host$request_uri;
    }
  }
}
```

Q: SSL-Certificate
A: Use Amazon Certificate Manager to get a free certificate

Q: I cannot reach my EC2-Instance?
A: Make sure that you have allowed port 80/443/ssh on the security groups for the instance. See Inbound/Outbound rules.

#### Configuring NGINX
See: http://nginx.org/en/docs/beginners_guide.html

You can find the nginx config file here: `/usr/local/etc/nginx`

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
