# PortSentinel (Linux Beta) 🛡️

[![Linux Beta](https://img.shields.io/badge/Release-Beta_Linux-orange?style=for-the-badge&logo=linux)](https://github.com/dev-sweeton/port-sentinel)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)](https://hub.docker.com/)

**PortSentinel** is the ultimate localhost process manager. It gives you a "God Mode" dashboard to monitor, manage, and kill processes running on your server.

> **⚠️ BETA NOTICE**: This release is optimized for **Linux** environments. Support for macOS/Windows is currently experimental.

![Dashboard](images/dashboard.png)

## 🚀 Quick Start (Docker)

Run PortSentinel with a single command (similar to Dozzle/Portainer).

```bash
docker run -d \
  --name portsentinel \
  --restart always \
  --pid host \
  --network host \
  --privileged \
  -v /var/run/docker.sock:/var/run/docker.sock \
  portsentinel:latest
```

**That's it!** Access your dashboard at:
> **http://localhost:3001**

### 🐳 Docker Compose

If you prefer `docker-compose.yml`:

```yaml
version: '3.8'
services:
  portsentinel:
    image: portsentinel:latest
    container_name: portsentinel
    restart: always
    # Critical for monitoring the host system
    pid: host
    network_mode: host
    privileged: true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

---

## ✨ Features

- **🔥 Process Control**: View specific details, kill processes, or bulk-terminate memory hogs.
- **🛡️ Security Audit**: Instantly spot processes listening on public interfaces (`0.0.0.0`) vs localhost.
- **⚡ Real-Time**: Live updates (1s interval) of CPU, Memory, and Network usage.
- **🧹 Auto-Cleanup**: Prevents accidental killing of system-critical PIDs (0, 1).
- **📋 Log Viewer**: Watch live logs/output stream for any running process (Beta).

---

## 🛠️ Building from Source

If you want to build the image yourself:

1. **Clone the repo**
   ```bash
   git clone https://github.com/dev-sweeton/port-sentinel.git
   cd port-sentinel
   ```

2. **Build the Image**
   ```bash
   docker build -t portsentinel:latest .
   ```

3. **Run**
   ```bash
   docker-compose up -d
   ```

---

## 🤝 Contributing

Found a bug in the Beta? Open an issue!

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/cool-new-thing`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## ☕ Support

If PortSentinel saved your server from a rogue process, consider buying a coffee!

<a href="https://buymeacoffee.com/sweeton" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
