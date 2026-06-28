const ui = {
  apiURL: document.querySelector("#api-url"),
  apiState: document.querySelector("#api-state"),
  apiVersion: document.querySelector("#api-version"),
  sessionState: document.querySelector("#session-state"),
  socketState: document.querySelector("#socket-state"),
  sessionID: document.querySelector("#session-id"),
  commandLine: document.querySelector("#command-line"),
  healthButton: document.querySelector("#health-btn"),
  connectButton: document.querySelector("#connect-btn"),
  newSessionButton: document.querySelector("#new-session-btn"),
  closeSessionButton: document.querySelector("#close-session-btn"),
  sendCommandButton: document.querySelector("#send-command-btn"),
  clearTerminalButton: document.querySelector("#clear-terminal-btn"),
  focusTerminalButton: document.querySelector("#focus-terminal-btn"),
  terminal: document.querySelector("#terminal"),
  terminalTitle: document.querySelector("#terminal-title"),
  terminalMeta: document.querySelector("#terminal-meta"),
  log: document.querySelector("#log"),
  outputCount: document.querySelector("#output-count"),
  cursorPos: document.querySelector("#cursor-pos")
};

const state = {
  ws: null,
  sessionID: "",
  outputBytes: 0,
  rawText: "",
  connected: false
};

init();

async function init() {
  bindEvents();
  setBadge(ui.apiState, "API", "muted");
  setBadge(ui.sessionState, "idle", "muted");
  setBadge(ui.socketState, "chiuso", "muted");
  try {
    const response = await fetch("/config.json", { cache: "no-store" });
    if (response.ok) {
      const config = await response.json();
      if (config.default_api_url) {
        ui.apiURL.value = config.default_api_url;
      }
    }
  } catch (error) {
    logEvent(`config: ${error.message}`);
  }
  await checkAPI();
}

function bindEvents() {
  ui.healthButton.addEventListener("click", checkAPI);
  ui.newSessionButton.addEventListener("click", createSession);
  ui.connectButton.addEventListener("click", connectExistingSession);
  ui.closeSessionButton.addEventListener("click", closeSession);
  ui.sendCommandButton.addEventListener("click", sendCommandLine);
  ui.clearTerminalButton.addEventListener("click", clearTerminal);
  ui.focusTerminalButton.addEventListener("click", () => ui.terminal.focus());
  ui.commandLine.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendCommandLine();
    }
  });
  ui.terminal.addEventListener("keydown", handleTerminalKey);
}

async function checkAPI() {
  try {
    const health = await apiFetch("/health");
    setBadge(ui.apiState, health.status === "ok" ? "API ok" : "API", health.status === "ok" ? "ok" : "warn");
    const version = await apiFetch("/version");
    ui.apiVersion.textContent = version.version || "-";
    logEvent("API raggiunta");
  } catch (error) {
    setBadge(ui.apiState, "API errore", "error");
    ui.apiVersion.textContent = "-";
    logEvent(`API: ${error.message}`);
  }
}

async function createSession() {
  try {
    disconnectSocket();
    const session = await apiFetch("/sessions", { method: "POST" });
    state.sessionID = session.id;
    ui.sessionID.value = session.id;
    setSessionState(session.state || "idle", session.closed);
    logEvent(`sessione ${shortID(session.id)} creata`);
    openSocket(session.id);
  } catch (error) {
    setBadge(ui.sessionState, "errore", "error");
    logEvent(`sessione: ${error.message}`);
  }
}

function connectExistingSession() {
  const id = ui.sessionID.value.trim();
  if (!id) {
    logEvent("sessione mancante");
    return;
  }
  state.sessionID = id;
  disconnectSocket();
  openSocket(id);
}

async function closeSession() {
  const id = currentSessionID();
  if (!id) {
    return;
  }
  try {
    disconnectSocket();
    await apiFetch(`/sessions/${encodeURIComponent(id)}`, { method: "DELETE", empty: true });
    setSessionState("closed", true);
    logEvent(`sessione ${shortID(id)} chiusa`);
  } catch (error) {
    logEvent(`chiusura: ${error.message}`);
  }
}

function openSocket(id) {
  const url = websocketURL(id);
  const ws = new WebSocket(url);
  state.ws = ws;
  setBadge(ui.socketState, "apertura", "warn");
  ws.addEventListener("open", () => {
    state.connected = true;
    setBadge(ui.socketState, "aperto", "ok");
    ui.terminal.focus();
    logEvent(`websocket ${shortID(id)}`);
  });
  ws.addEventListener("message", (event) => handleSocketMessage(event.data));
  ws.addEventListener("close", () => {
    if (state.ws === ws) {
      state.connected = false;
      setBadge(ui.socketState, "chiuso", "muted");
    }
  });
  ws.addEventListener("error", () => {
    setBadge(ui.socketState, "errore", "error");
    logEvent("websocket errore");
  });
}

function handleSocketMessage(data) {
  let message;
  try {
    message = JSON.parse(data);
  } catch (error) {
    logEvent(`JSON: ${error.message}`);
    return;
  }
  if (message.type === "output" && message.data) {
    state.outputBytes += message.data.length;
    ui.outputCount.textContent = `${state.outputBytes} byte`;
    appendRaw(message.data);
  }
  if (message.type === "snapshot" && message.snapshot) {
    renderSnapshot(message.snapshot);
  }
  if (message.state || message.closed) {
    setSessionState(message.state || "idle", Boolean(message.closed));
  }
  if (message.type === "error" && message.error) {
    logEvent(`errore: ${message.error}`);
    setBadge(ui.sessionState, "errore", "error");
  }
}

function sendCommandLine() {
  const value = ui.commandLine.value.trim();
  if (!value) {
    return;
  }
  sendInput(`${value}\r`);
  ui.commandLine.value = "";
  ui.terminal.focus();
}

function handleTerminalKey(event) {
  if (!state.connected) {
    return;
  }
  let data = "";
  if (event.ctrlKey && !event.altKey && !event.metaKey) {
    const key = event.key.toLowerCase();
    if (key === "c") data = "\x03";
    if (key === "d") data = "\x04";
    if (key === "l") data = "\x0c";
    if (key === "q") data = "\x11";
  } else if (event.key === "Enter") {
    data = "\r";
  } else if (event.key === "Backspace") {
    data = "\x7f";
  } else if (event.key === "Tab") {
    data = "\t";
  } else if (event.key === "Escape") {
    data = "\x1b";
  } else if (event.key.length === 1) {
    data = event.key;
  }
  if (data) {
    event.preventDefault();
    sendInput(data);
  }
}

function sendInput(data) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
    logEvent("websocket non aperto");
    return;
  }
  state.ws.send(JSON.stringify({ type: "input", data }));
}

async function apiFetch(path, options = {}) {
  const base = ui.apiURL.value.trim().replace(/\/+$/, "");
  const response = await fetch(`${base}${path}`, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  if (options.empty || response.status === 204) {
    return null;
  }
  return response.json();
}

function websocketURL(id) {
  const base = new URL(ui.apiURL.value.trim());
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = `${base.pathname.replace(/\/+$/, "")}/sessions/${encodeURIComponent(id)}/ws`;
  base.search = "";
  base.hash = "";
  return base.toString();
}

function renderSnapshot(snapshot) {
  if (!Array.isArray(snapshot.rows)) {
    return;
  }
  ui.terminal.textContent = snapshot.rows.join("\n");
  ui.terminalMeta.textContent = `${snapshot.width || 0} x ${snapshot.height || 0}`;
  ui.cursorPos.textContent = `${snapshot.cursor_row || 0},${snapshot.cursor_col || 0}`;
  ui.terminal.scrollTop = ui.terminal.scrollHeight;
}

function appendRaw(data) {
  state.rawText += data.replace(/\r/g, "");
  if (state.rawText.length > 12000) {
    state.rawText = state.rawText.slice(-12000);
  }
  if (!ui.terminal.textContent) {
    ui.terminal.textContent = state.rawText;
  }
  ui.terminal.scrollTop = ui.terminal.scrollHeight;
}

function clearTerminal() {
  state.rawText = "";
  state.outputBytes = 0;
  ui.terminal.textContent = "";
  ui.outputCount.textContent = "0 byte";
}

function disconnectSocket() {
  if (state.ws) {
    state.ws.close();
  }
  state.ws = null;
  state.connected = false;
  setBadge(ui.socketState, "chiuso", "muted");
}

function setSessionState(value, closed) {
  const text = closed ? "closed" : value || "idle";
  const tone = closed ? "muted" : text === "running" ? "warn" : text === "error" ? "error" : "ok";
  setBadge(ui.sessionState, text, tone);
  ui.terminalTitle.textContent = currentSessionID() ? `A: ${shortID(currentSessionID())}` : "A:";
}

function setBadge(element, text, tone) {
  element.textContent = text;
  element.className = `badge badge-${tone}`;
}

function logEvent(text) {
  const row = document.createElement("div");
  row.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  ui.log.append(row);
  while (ui.log.children.length > 80) {
    ui.log.firstChild.remove();
  }
  ui.log.scrollTop = ui.log.scrollHeight;
}

function currentSessionID() {
  return state.sessionID || ui.sessionID.value.trim();
}

function shortID(id) {
  return id ? id.slice(0, 8) : "-";
}
