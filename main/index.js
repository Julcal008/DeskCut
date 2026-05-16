// Native
const { join } = require("path");
const { format } = require("url");
const { exec, spawn } = require("child_process");
const fs = require("fs");

function escapeDesktopExecArg(arg) {
  return arg
    .replace(/\\/g, "\\\\")
    .replace(/ /g, "\\ ")
    .replace(/"/g, '\\"');
}

function writeWineLauncher(name, targetExe) {
  const safeName = name.replace(/[^A-Z0-9]+/gi, "_");
  const launcherDir = join(app.getPath("userData"), "launchers");
  fs.mkdirSync(launcherDir, { recursive: true });

  const launcherPath = join(launcherDir, `${safeName}.sh`);
  const cacheDir = process.env.XDG_CACHE_HOME || join(app.getPath("home"), ".cache");
  const script = `#!/bin/sh
CACHE_DIR="${cacheDir}/ExesDeskCut"
mkdir -p "$CACHE_DIR"
MARKER="$CACHE_DIR/.winecfg-ran"
if [ ! -f "$MARKER" ]; then
  winecfg && touch "$MARKER"
fi
wine "$@"
`;

  fs.writeFileSync(launcherPath, script, "utf-8");
  fs.chmodSync(launcherPath, 0o755);

  return launcherPath;
}

// Packages
const { BrowserWindow, app, ipcMain } = require("electron");
const isDev = require("electron-is-dev");
const prepareNext = require("electron-next");

// Prepare the renderer once the app is ready
app.on("ready", async () => {
  await prepareNext("./renderer");

  const mainWindow = new BrowserWindow({
    width: 520,
    height: 820,
    minWidth: 520,
    minHeight: 600,
    webPreferences: {
      autoHideMenuBar: true,
      nodeIntegration: false,
      preload: join(__dirname, "preload.js"),
    },
  });
  const url = isDev
    ? "http://localhost:8000"
    : format({
        pathname: join(__dirname, "../renderer/out/index.html"),
        protocol: "file:",
        slashes: true,
      });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setResizable(true);
  mainWindow.loadURL(url);
});

// Quit the app once all windows are closed
app.on("window-all-closed", app.quit);

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on("message", (event, message) => {
  console.log(message);

  let desktopCommand;
  if (message.runWineCfg) {
    const launcherPath = writeWineLauncher(message.name, message.exec);
    desktopCommand = `${escapeDesktopExecArg(launcherPath)} ${escapeDesktopExecArg(
      message.exec
    )}`;
  } else {
    desktopCommand = `wine ${escapeDesktopExecArg(message.exec)}`;
  }

  let text = `[Desktop Entry]
Encoding=UTF-8
Name=${message.name}
Comment=${message.comment}
Exec=${desktopCommand}
Icon=${message.icon}
Terminal=${message.terminal}
Type=Application
Categories=GNOME;Application;Utility;Game;
`;

  try {
    const desktopPath = app.getPath("desktop");
    const filePath = join(
      desktopPath,
      `${message.name.replace(/[^A-Z0-9]+/gi, "_")}.desktop`
    );

    fs.mkdirSync(desktopPath, { recursive: true });
    fs.writeFileSync(filePath, text, "utf-8");

    exec(`chmod +x ${filePath}`, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
  } catch (e) {
    alert("Failed to save the file !");
  }
});

ipcMain.on("install-wine", (event, payload) => {
  // payload can be either a string (distro) or an object { distro, password }
  const { distro, password } =
    typeof payload === "object" && payload !== null
      ? { distro: payload.distro, password: payload.password }
      : { distro: payload, password: null };

  let commandsWithoutSudo;

  switch (distro) {
    case "ubuntu-debian":
      commandsWithoutSudo = "apt update && apt install -y wine wine64 wine32";
      break;
    case "arch":
      commandsWithoutSudo = "pacman -Sy --noconfirm wine";
      break;
    case "redhat":
      commandsWithoutSudo = "dnf install -y wine";
      break;
    default:
      commandsWithoutSudo = null;
  }

  if (!commandsWithoutSudo) {
    event.sender.send("install-wine-result", {
      success: false,
      error: "Unsupported distro family.",
    });
    return;
  }

  // If password provided, use sudo -S and write password to stdin. Otherwise run sudo which may fail without a tty.
  if (password) {
    const child = spawn("sudo", ["-S", "bash", "-lc", commandsWithoutSudo], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("close", (code) => {
      const ttyRegex = /no tty present|a terminal is required|sudo:.*password is required/i;
      if (code !== 0) {
        if (ttyRegex.test(stderr)) {
          event.sender.send("install-wine-result", {
            success: false,
            error:
              "Installation requires a terminal for entering your sudo password. Run the installer from a terminal or configure passwordless sudo for your user.",
            stderr,
          });
        } else {
          event.sender.send("install-wine-result", {
            success: false,
            error: `Install command exited with code ${code}`,
            stderr,
            stdout,
          });
        }
        return;
      }

      event.sender.send("install-wine-result", {
        success: true,
        stdout,
      });
    });

    // write password (sudo -S reads from stdin)
    try {
      child.stdin.write(password + "\n");
      child.stdin.end();
    } catch (e) {
      event.sender.send("install-wine-result", {
        success: false,
        error: "Failed to send password to sudo process.",
      });
    }
  } else {
    // No password provided: run sudo via shell (will fail if sudo requires a tty)
    const fullCommand = `sudo bash -lc \"${commandsWithoutSudo.replace(/"/g, '\\"')}\"`;
    const child = spawn("/bin/bash", ["-lc", fullCommand], { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("close", (code) => {
      const ttyRegex = /no tty present|a terminal is required|sudo:.*password is required/i;
      if (code !== 0) {
        if (ttyRegex.test(stderr)) {
          event.sender.send("install-wine-result", {
            success: false,
            error:
              "Installation requires a terminal for entering your sudo password. Run the installer from a terminal or configure passwordless sudo for your user.",
            stderr,
          });
        } else {
          event.sender.send("install-wine-result", {
            success: false,
            error: `Install command exited with code ${code}`,
            stderr,
            stdout,
          });
        }
        return;
      }

      event.sender.send("install-wine-result", {
        success: true,
        stdout,
      });
    });
  }
});

// Open winecfg to allow users to edit Wine settings
ipcMain.on("open-winecfg", (event) => {
  try {
    // spawn winecfg as a detached process so it keeps running independently
    const child = spawn("winecfg", [], {
      detached: true,
      stdio: "ignore",
    });

    // detach so the child keeps running after the app exits
    child.unref();

    event.sender.send("open-winecfg-result", { success: true });
  } catch (err) {
    event.sender.send("open-winecfg-result", { success: false, error: err.message });
  }
});
