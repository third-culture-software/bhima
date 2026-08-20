# Production Deployment with Systemd

This guide will walk through deploying BHIMA using systemd for process and log management and a nginx to load balance between multiple Node.js instances.  These instructions have been tested on Ubuntu 20.04.

### Process Management with SystemD

Create a file called `bhima@.service` into the directory `/etc/systemd/system/`.  This is a [systemd unit file](https://www.freedesktop.org/software/systemd/man/systemd.unit.html) that will start BHIMA at a specified port.  Assuming the user is `bhima` and the installation of BHIMA is found in `/home/bhima/apps/bhima`, the file's context will be:

```systemd
# bhima@.service
[Unit]
Description=The bhima server
Documentation=https://docs.bhi.ma
After=network.target

[Service]
Environment=NODE_ENV=production PORT=%i
Type=simple
User=bhima

# adjust this accordingly
WorkingDirectory=/home/bhima/apps/bhima/bin/

# adjust this accordingly
ExecStart=/usr/bin/node server/app.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

[More information](https://www.freedesktop.org/software/systemd/man/systemd.syntax.html) on the syntax of unit files.  Once the file is in place you need to reload the systemd daemon.

```bash
systemctl daemon-reload
```


### Load Balancing with Nginx

In this example, we'll load balance across three downstream Node.js servers.  However, best practice is to use a maximum of `$(nproc - 1)` processes.  Adjust the following file accordingly.

Create a new nginx configuration file named `bhima` in `/etc/nginx/sites-available/`.  Put the following configuration in that file:

```nginx
upstream bhima {

  # make sure to route requests to the server that has the least connections
  # http://nginx.org/en/docs/http/load_balancing.html
  least_conn;

  # change these ports according to what you want to load balance
 # add/remove server as needed.  Here, we have three downstream nodejs servers
  server 127.0.0.1:3001;
  server 127.0.0.1:3002;
  server 127.0.0.1:3003;
}


# Load-Balancing Server
server {

 # add in gzip configuration (if desired)
 include includes/gzip.conf;

 # opt out of Google's FLOCK.
 add_header Permissions-Policy interest-cohort=();

 server_name _;

 # pass data to upstream server
 location / {
   proxy_pass http://bhima;
   proxy_http_version 1.1;
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection 'upgrade';
   proxy_set_header Host $host;
   proxy_cache_bypass $http_upgrade;
  }
}
```

For completeness, the `gzip.conf` file located in `/etc/nginx/includes/gzip.conf` is:

```nginx
gzip on;
gzip_disable "msie6";

gzip_vary on;
gzip_proxied any;

gzip_comp_level 5;
gzip_buffers 16 8k; # see http://stackoverflow.com/a/5132440
gzip_http_version 1.1;
gzip_min_length 128;

gzip_types
        application/atom+xml
        application/javascript
        application/json
        application/ld+json
        application/manifest+json
        application/octet-stream
        application/rss+xml
        application/vnd.geo+json
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-javascript
        application/x-web-app-manifest+json
        application/xhtml+xml
        application/xml
        font/opentype
        image/bmp
        image/svg+xml
        image/x-icon
        text/cache-manifest
        text/css
        text/javascript
        text/plain
        text/vcard
        text/vnd.rim.location.xloc
        text/vtt
        text/x-component
        text/x-cross-domain-policy
        text/xml;
```

This file configures a load balance that proxies requests to three downstream servers on ports 3001, 3002, and 3003.  Create a symlink between `/etc/nginx/sites-available/bhima` into `/etc/nginx/sites-enabled/bhima` to ensure that it is active.  Test the nginx configuration, then reload:

```bash
# test the configuration
nginx -t

# reload the configuration
systemctl reload nginx
```

### Deployment and automatic restart

The final touch for deployment is setting up automatic start on boot.  This is done easily with `systemctl enable bhima@${PORT}` where `${PORT}` is the desired port to run BHIMA on.  Do this for every downstream server.

```bash
# start the nodejs server
systemctl start bhima@3001

# enable start on boot.
systemctl enable bhima@3001
```

When you cURL `http://localhost`, you should now get to the BHIMA server though nginx.

### Log Management

Because we are using systemd, logs are managed with [journald](https://www.man7.org/linux/man-pages/man8/systemd-journald.service.8.html).  To monitor the logs of the above servers, the following one-liner will display the logs in real-time:

```bash
# tail and follow all bhima logs
journalctl -u bhima@* --follow
```

It may be important on installation with low-disk space to adjust the `SystemMaxUse` and `SystemMaxFileSize` settings in `/etc/systemd/journald.conf`.
