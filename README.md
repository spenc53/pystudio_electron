# Pystudio

## Description

## How to run the project

```bash
npm run electron-dev
```

### Pystudio Env

#### Setting up a python env
```bash
python3 -m venv env
```

Folder directory for pytstudio project
- Project_Folder
    - .pystudio
        - config.json
        - ipython_config.json
    - python env folder

#### Example config.json file
```json
{
    "env_name": "env",
    "config_name": "ipython_config"
}
```

#### Example ipython_config.json folder
```json
{
  "shell_port": 53794,
  "iopub_port": 53795,
  "stdin_port": 53796,
  "control_port": 53797,
  "hb_port": 53798,
  "ip": "127.0.0.1",
  "key": "",
  "transport": "tcp",
  "signature_scheme": "hmac-sha256",
  "kernel_name": ""
}
```

## How to build the project

Todo