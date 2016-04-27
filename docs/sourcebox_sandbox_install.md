# Sourcebox Sandbox Install

## Requirements
- works best with **debian**
- needs latest debian-stretch for `lxc-dev` package which is not present in current stable (jessie)


## Install
Upgrade the distro to the latest stretch release and then install the precompiled kernel options
```bash
sudo apt-get dist-upgrade
sudo dpkg linux-image-4.5.0-rc5-sourcebox_4.5.0-rc5-11_amd64.deb linux-headers-4.5.0-rc5-sourcebox_4.5.0-rc5-1_amd64.deb
```

Next we install a couple of required tools
```bash
sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
sudo apt-get update
sudo apt-get update install nodejs git btrfs-tools libcap-dev build-essential lxc lxc-dev
sudo -E npm install -g git+ssh://git@github.io:waywaaard/sourcebox-sandbox
```

For using the `sourcebox-sandbox` repository your public key must be added to the ssh config (`~/.ssh/config`).

## Experiences

In my first `sourcebox create --interactive /root/sb` tries the creation failed with `path is of type unknown` or some similar message.
After some tries the following command was working:
```bash
sudo sourcebox create --distro debian --release jessie --loop 2GB /bar
```