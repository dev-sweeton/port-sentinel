# PortSentinel: The Ultimate Localhost Process Manager 🛡️

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/sweeton)

**PortSentinel** is a modern, high-performance dashboard for monitoring and managing your localhost ports and processes. Built with a Cyberpunk aesthetic, it provides developers with instant visibility into network activity and powerful control over running services.

![PortSentinel Dashboard](https://via.placeholder.com/800x450.png?text=PortSentinel+Dashboard+Preview)

## 🚀 Features

### 🔍 Deep Inspection & Monitoring
- **Real-time Monitoring**: Polling interval of 3000ms keeps you up-to-date.
- **Deep Process Info**: Hover over processes to see the full command path and arguments.
- **Security Audit**: 
    - 🟢 **Local Only Badge**: Confirms process is bound to loopback (`127.0.0.1`, `::1`).
    - 🔴 **Exposed Badge**: Warns if a process is listening on all interfaces (`0.0.0.0`) or public IPs.

### ⚡ Powerful Control
- **One-Click Kill**: Terminate processes instantly with a safety confirmation step.
- **Bulk Actions**: Select multiple processes via checkboxes or "Quick Select" (e.g., select all `node` processes) and kill them simultaneously.
- **Smart Nuke Bar**: Floating action bar for managing bulk selections.
- **System Safeguards**: Prevents accidental termination of critical system processes (PID 0, 1) and the PortSentinel server itself.

### 🔥 The Phoenix (Process Recovery)
- **Restart Capability**: Accidentally killed a process? A "Ghost Row" with a **RESTART** button appears for 30 seconds.
- **One-Tap Revival**: Attempts to re-run the killed command in its original working directory.

### 🛑 Graceful Shutdown
- **Remote Shutdown**: Turn off the PortSentinel server directly from the UI with the Power Button.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, React Query.
- **Backend**: Node.js, Express, Native `child_process` (exec).
- **Containerization**: Docker, Docker Compose (Multi-stage builds).

---

## 📦 Installation & Usage

> [!IMPORTANT]
> **Platform Differences:**
> - **Linux**: Single Docker container with full host access ✅
> - **macOS/Windows**: Docker runs in a VM, so you need to run the host agent natively + Docker UI

### Linux Deployment (Production - One Command!)

```bash
# Clone the repository
git clone https://github.com/your-username/portsentinel.git
cd portsentinel

# Start the service
docker-compose up -d
```

**That's it!** Access at `http://localhost:3001`

### macOS/Windows Deployment (Two Components)

Due to Docker Desktop's VM architecture, you need to run the host agent natively:

**Step 1: Start the Native Host Agent**
```bash
# Clone the repository
git clone https://github.com/your-username/portsentinel.git
cd portsentinel

# Install and start host agent
cd host-agent
npm install
node agent.js
```

The host agent will run on `http://127.0.0.1:3002` and monitor your **actual macOS/Windows processes**.

**Step 2: Start the Docker UI (in a new terminal)**
```bash
cd portsentinel

# Edit docker-compose.yml:
# - Comment out the 'portsentinel' service (lines 8-28)
# - Uncomment the 'portsentinel-ui' service (lines 35-49)

docker-compose up -d
```

**Step 3: Access**
Open `http://localhost:3001` - you'll see your **real host machine's processes**!

### Alternative: Full Native (No Docker)

For macOS/Windows, you can run everything natively:

```bash
# Terminal 1: Host Agent
cd host-agent
npm install
node agent.js

# Terminal 2: Backend
cd backend
npm install
HOST_AGENT_URL=http://localhost:3002 node server.js
```

Access at `http://localhost:3001`
git clone https://github.com/your-username/portsentinel.git
cd portsentinel

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install

# Start the App (Concurrent)
# From the root directory:
npm start 
# OR manually run backend & frontend in separate terminals
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/processes` | List all active listening processes. |
| `POST` | `/api/kill` | Kill a specific PID. Body: `{ "pid": 1234 }` |
| `POST` | `/api/kill-bulk` | Kill multiple PIDs. Body: `{ "pids": [123, 456] }` |
| `POST` | `/api/restart` | Restart a recently killed process. Body: `{ "pid": 1234 }` |
| `POST` | `/api/shutdown` | Gracefully shut down the PortSentinel server. |

---

## ☕ Support

If you find PortSentinel helpful, consider buying me a coffee! Your support helps maintain the project and keep the updates coming.

<a href="https://buymeacoffee.com/sweeton" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
