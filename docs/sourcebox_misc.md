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
`sudo DEBUG=*.sourcebox pm2 start index`

## Sourcebox 503 errors
This error might indicate that your IP for the EC2-Instance has changed.