#!/bin/bash
# A2A Network - One-Click Installation Script
# https://a2a.aixc.store

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════╗"
    echo "║     A2A Network Installation          ║"
    echo "║  Agent-to-Agent Communication         ║"
    echo "╚═══════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root or with sudo"
        exit 1
    fi
}

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        print_error "Cannot detect OS"
        exit 1
    fi
    print_step "Detected OS: $OS $VER"
}

install_nodejs() {
    print_info "Installing Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_step "Node.js already installed: $NODE_VERSION"
        return
    fi
    
    # Install Node.js 20.x
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    print_step "Node.js installed: $(node -v)"
}

install_dependencies() {
    print_info "Installing dependencies..."
    apt-get update -qq
    apt-get install -y build-essential python3 git curl sqlite3
    print_step "Dependencies installed"
}

download_a2a_client() {
    print_info "Downloading A2A Client..."
    
    A2A_DIR="/opt/a2a-client"
    
    if [ -d "$A2A_DIR" ]; then
        print_info "A2A Client already exists, removing old version..."
        rm -rf "$A2A_DIR"
    fi
    
    # Download zip instead of git clone (avoid TLS issues)
    print_info "Downloading from GitHub..."
    curl -L https://github.com/shell9000/a2a-network/archive/refs/heads/main.zip -o /tmp/a2a.zip
    
    print_info "Extracting..."
    unzip -q /tmp/a2a.zip -d /tmp/
    mv /tmp/a2a-network-main "$A2A_DIR"
    rm /tmp/a2a.zip
    
    print_step "A2A Client downloaded"
}

build_client() {
    print_info "Building A2A Client..."
    cd /opt/a2a-client/packages/client
    npm install --silent
    npm run build --silent
    print_step "A2A Client built"
}

register_agent() {
    print_info "Registering agent..."
    
    cd /opt/a2a-client/packages/client
    
    # Create register script
    cat > register.js <<'EOFREG'
const { A2AClient } = require('./dist/index');

async function register() {
  const hostname = require('os').hostname().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
  const client = new A2AClient({
    dbPath: '/opt/a2a-client/agent.db',
    relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
  });
  
  // Register with Firebase
  const result = await client.register(hostname, 'auto-install', 'openclaw');
  
  console.log(`Agent ID: ${result.agentId}`);
  console.log(`API Key: ${result.apiKey}`);
  
  // Save to file for reference
  const fs = require('fs');
  fs.writeFileSync('/opt/a2a-client/.env', `AGENT_ID=${result.agentId}\nAPI_KEY=${result.apiKey}\n`);
}

register().catch(console.error);
EOFREG
    
    # Run register
    REGISTER_OUTPUT=$(node register.js 2>&1)
    
    # Extract Agent ID and API Key
    AGENT_ID=$(echo "$REGISTER_OUTPUT" | grep -oP 'Agent ID: \K[^\s]+' || echo "")
    API_KEY=$(echo "$REGISTER_OUTPUT" | grep -oP 'API Key: \K[^\s]+' || echo "")
    
    if [ -z "$AGENT_ID" ]; then
        print_error "Failed to register agent"
        echo "$REGISTER_OUTPUT"
        exit 1
    fi
    
    print_step "Agent registered: $AGENT_ID"
}

create_listener() {
    print_info "Creating listener script..."
    
    cd /opt/a2a-client/packages/client
    
    # Create listener script
    cat > listener.js <<'EOFLIST'
const { A2AClient } = require('./dist/index');
const fs = require('fs');

// Load credentials
const env = fs.readFileSync('/opt/a2a-client/.env', 'utf-8');
const agentId = env.match(/AGENT_ID=(.+)/)[1];

const client = new A2AClient({
  dbPath: '/opt/a2a-client/agent.db',
  relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
});

async function start() {
  console.log('🚀 啟動 A2A 監聽程序...');
  await client.connect();
  console.log('✅ 已連接到 A2A Network');
  console.log('📡 持續監聽訊息中...');
  
  client.on('message', (msg) => {
    console.log(`\n📨 收到訊息來自 ${msg.from}:`);
    console.log(`   ${msg.content}`);
  });
}

start().catch(console.error);
EOFLIST
    
    print_step "Listener script created"
}

create_systemd_service() {
    print_info "Creating systemd service..."
    
    cat > /etc/systemd/system/a2a-listener.service <<EOF
[Unit]
Description=A2A Network Listener
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/a2a-client/packages/client
ExecStart=/usr/bin/node listener.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable a2a-listener
    systemctl start a2a-listener
    
    print_step "Systemd service created and started"
}

show_summary() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   Installation Complete! 🎉           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
    echo ""
    
    # Load credentials
    . /opt/a2a-client/.env
    
    echo -e "${BLUE}Agent Information:${NC}"
    echo -e "  Agent ID:  ${GREEN}$AGENT_ID${NC}"
    echo -e "  API Key:   ${YELLOW}$API_KEY${NC}"
    echo ""
    echo -e "${BLUE}Service Status:${NC}"
    systemctl status a2a-listener --no-pager | head -5
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  Check status:  ${YELLOW}systemctl status a2a-listener${NC}"
    echo -e "  View logs:     ${YELLOW}journalctl -u a2a-listener -f${NC}"
    echo -e "  Restart:       ${YELLOW}systemctl restart a2a-listener${NC}"
    echo ""
    echo -e "${GREEN}Your agent is now online and ready to communicate!${NC}"
    echo ""
}

# Main installation flow
main() {
    print_header
    check_root
    detect_os
    install_dependencies
    install_nodejs
    download_a2a_client
    build_client
    register_agent
    create_listener
    create_systemd_service
    show_summary
}

main
