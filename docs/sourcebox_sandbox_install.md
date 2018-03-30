---
id: sandbox_install
title: Installing the Sourcebox Sandbox
---

# Sourcebox Sandbox Install

## Requirements

- works best with **debian**
- needs latest debian-stretch for `lxc-dev` package which is not present in current stable (jessie)

## Install

Install a couple of required tools...

```bash
sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt-get update
sudo apt-get install nodejs git btrfs-tools libcap-dev build-essential lxc lxc-dev
sudo -E npm install -g ebertmi/sourcebox-sandbox
```

**Hint:**

* Also try to update `npm` itself with `sudo npm install npm` and maybe you need to link the node binary `sudo ln -s /usr/bin/nodejs /usr/bin/node`.
* You might need to disable apparmor in order to get lxc working on Ubuntu (see https://help.ubuntu.com/community/AppArmor & https://forum.proxmox.com/threads/nfs-file-system-mount-problem-apparmor.31706/)

## Experiences

In my first `sourcebox create --interactive /root/sb` tries the creation failed with `path is of type unknown` or some similar message.
After some tries the following command was working:

```bash
sudo sourcebox create --distro debian --release jessie --loop 4GB /bar
```

## Trouble Shooting

### Installing `sandbox-web` fails or cannot run server

Try to rerun `sudo node-gype rebuild` in the sourcebox-lxc directory (the one with the bindings.gyp)

## Install Script

> There is a difference between the number of subuids and subgids between debian jessie and stretch or higher. In jessie we can get at least 65536 whereas in stretch or higher we only get less which causes any `apt install` command to fail.

```bash
#!/bin/sh -e
set -e

TARGET=$1
shift
PACKAGES=$*

sourcebox create -d debian -r jessie -a amd64 -l 4GB $TARGET
sourcebox manage $TARGET -- bash -e << EOF
apt-get --yes update
apt-get --yes dist-upgrade
apt-get --yes install $PACKAGES
EOF
```

and here is a example using the script:

`installer.sh ./trycodingsb python3 python3-pip python python-pip`

## Run the sourcebox server

Use `sudo NODE_ENV=production pm2 start server.js` for production mode and config

If you have accidentially run pm2 without sudo it is not possible to access your lxc container. Use `sudo pm2 kill && pm2 kill` to stop the pm2 daemon and then run the above mentioned command.