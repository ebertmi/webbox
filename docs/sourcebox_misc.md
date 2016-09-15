# Notes about Sourcebox

## Using matplotlib and pyplot
Generating the font-cache when importing pyplot the first time consumes more memory than the defaults can provide and therefore fails after a couple of minutes.
Using the following options seem to solve this:
```javascript
const sourceboxOptions = {
  memory: '100MB',
  cpu: 15
}
```

Yet, we need to test if we can lower the memory usage.

## Run Sourcebox Server with pm2
`sudo DEBUG=sourcebox:* pm2 start index`

## Sourcebox 503 errors
This error might indicate that your IP for the EC2-Instance has changed.


## Mounting/Unmounting
**Unmounting loop device:** `umount DIRECTORY`

**Mounting as loop:** `sudo mount -o loop ./DIRECTORY/NAME.fs ./DIRECTORY`

**Resizing filesystem:** `sudo btrfs filesystem resize +2g ./testsb/` (Should not be in use, when executing the command [Stop the server])
https://docs.oracle.com/cd/E37670_01/E37355/html/ol_use_case2_btrfs.html

**Repairing broken filesystem:** First unmount and then execute `sudo btrfs check --repair sourcebox.fs`

**List all subvolumes/snapshots:** Switch to /DIRECTORY and then run `sudo btrfs subvolume list -a .` Now you can use the path to delete all

## Other Helpful commands
**Resize root device:** Install `sudo apt-get install cloud-initramfs-growroot` and then reboot. Use `lsblk` to check.