# 🚀 PortSentinel Release Guide

Follow these steps to build, push, and release your Beta version to the world.

## 1. Prerequisites
- **Docker Hub Account**: [Sign up here](https://hub.docker.com/) if you haven't.
- **Docker Desktop**: Ensure it's running.
- **GitHub Repo**: Ensure your code is pushed to GitHub.

---

## 2. Docker Image Release

Since you are on a Mac (likely M1/M2 ARM64) and most users run Linux servers (AMD64), we use `docker buildx` to build for **both platforms** at once. This makes your image "Dozzle-style" (universal).

### Step 2.1: Login
```bash
docker login
# Enter your Docker Hub username/password
```

### Step 2.2: Create a Builder (One-time setup)
```bash
docker buildx create --use
```

### Step 2.3: Build & Push (The Magic Command)
Replace `YOUR_USERNAME` with your Docker Hub handle.

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t YOUR_USERNAME/portsentinel:latest \
  -t YOUR_USERNAME/portsentinel:v1.0.0-beta \
  --push .
```

> **Why two tags?**
> - `:latest` -> For users who just want "the new stuff" blindly.
> - `:v1.0.0-beta` -> Specific version for this release.

---

## 3. GitHub Beta Release

Now that the image is on Docker Hub, let's tell GitHub users about it.

1.  **Tag your Code**:
    ```bash
    git tag v1.0.0-beta
    git push origin v1.0.0-beta
    ```

2.  **Draft Release**:
    - Go to your GitHub Repo -> **Releases** -> **Draft a new release**.
    - **Choose a tag**: Select `v1.0.0-beta`.
    - **Title**: `v1.0.0-beta - Linux Release`
    - **Checkbox**: ✅ "Set as a pre-release" (Important for Beta).

3.  **Release Notes**:
    Copy/Paste this template:

    ```markdown
    ## 🛡️ PortSentinel Linux Beta
    
    PortSentinel is now available as a Docker container! Monitoring your server ports has never been easier.
    
    ### 🐳 Quick Start
    
    ```bash
    docker run -d \
      --name portsentinel \
      --restart always \
      --pid host \
      --network host \
      --privileged \
      -v /var/run/docker.sock:/var/run/docker.sock \
      YOUR_USERNAME/portsentinel:latest
    ```
    
    ### ✨ New Features
    - **Real-time CPU/Memory Monitoring**: Visualise resource usage per process.
    - **Dark Stats Mode**: Beautiful cyberpunk dashboard.
    - **Port Control**: Kill unresponsive processes directly from the UI.
    
    > **Note**: This is a Beta release optimized for Linux environments.
    ```

4.  **Publish Release**! 🚀
