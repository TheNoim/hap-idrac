<p align="center">
  <img width="460" src="https://raw.githubusercontent.com/TheNoim/hap-idrac/master/assets/readme.png">
</p>

# iDrac6 + Homekit = :fire:

I always hated to go to the iDrac6 page, because it is just slow as f**k. So I always had the idea of combining homekit and idrac. This makes it much easier to start your server from mobile or look up the status. 

This docker image supports the following functions:

- Checking on/off status of the server
- Current server temperature
- Executing multiple power actions like force shutdown or force restart
- Of course, turning it on or off

## Config

```json5
{
	"idrac": {
		"username": "admin",
		"password": "SUPERSECRETPASSWORD",
		"address": "https://192.168.0.107",
		"sessionOptions": {
			"saveSession": true,
			"path": "./session.json"
		}
	},
	"hap": {
		"displayName": "Homekit Displayname",
		"pin": "031-45-154",
		"username": "CC:22:3D:E3:CE:F6",
		"port": 51826
	}
}

```

## Usage

### Docker

This is the preferred method. This image supports multiple architectures.

- amd64
- arm64
- arm/v7 (armhf/armv7l)

#### Docker Compose

```yaml
version: "2"
services:
    idrac-home:
        image: noim/idrac6-hap:latest
        restart: always
        network_mode: host
        volumes:
          # Note: You need to create the config first
          # Read more in the config section
          - ./config.json:/app/config.json:ro
          # Optional: You don't need this, but I recommend it.
          # If you bind the session.json you need to create it first with:
          # touch session.json
          - ./session.json:/app/session.json
          # Required to persists homekit settings
          - ./persist:/app/persist
```

#### Docker cli

```bash
docker run \
    -d --rm \
    --name idrac \
    -v `pwd`/config.json:/app/config.json \ # look at the comments in docker compose section
    -v `pwd`/session.json:/app/session.json \
    -v `pwd`/persist:/app/persist \
    noim/idrac6-hap:latest
```

### Direct NodeJS

_Note:_ Requires NodeJS 10

```bash
git clone https://github.com/TheNoim/hap-idrac
cd hap-idrac
yarn # or npm install
yarn build # or npm run build
node dist/index # optional with debug information: DEBUG=* node dist/index
```
