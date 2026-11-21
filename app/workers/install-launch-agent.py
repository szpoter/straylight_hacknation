"""Install the current user's queue consumer after install-queue.mts succeeds."""
import os
import plistlib
from pathlib import Path
import subprocess
import time

os.umask(0o077)
label = "pl.zusik.model-worker"
folder = Path.home() / "Library/Application Support/ZusikModel"
config = folder / "worker.json"
worker = folder / "worker.cjs"
if not config.is_file() or not worker.is_file() or config.stat().st_mode & 0o077:
    raise SystemExit("Install the restricted worker configuration first.")
node = subprocess.check_output(["node", "-p", "process.execPath"], text=True).strip()
plist = Path.home() / "Library/LaunchAgents" / (label + ".plist")
plist.parent.mkdir(parents=True, exist_ok=True)
domain = "gui/" + str(os.getuid())
settings = dict(Label=label, ProgramArguments=[node, str(worker), str(config)], KeepAlive=True,
                RunAtLoad=True, ThrottleInterval=10, StandardOutPath=str(folder / "attempts.log"),
                StandardErrorPath=str(folder / "errors.log"))
same = plist.exists() and plistlib.loads(plist.read_bytes()) == settings
service = domain + "/" + label
if same and subprocess.run(["launchctl", "print", service], capture_output=True).returncode == 0:
    subprocess.run(["launchctl", "kickstart", "-k", service], check=True)
    raise SystemExit(0)
with plist.with_suffix(".tmp").open("wb") as f:
    plistlib.dump(settings, f)
plist.with_suffix(".tmp").replace(plist)
if subprocess.run(["launchctl", "print", domain + "/" + label], capture_output=True).returncode == 0:
    subprocess.run(["launchctl", "bootout", domain + "/" + label], check=True)
for attempt in range(5):
    result = subprocess.run(["launchctl", "bootstrap", domain, str(plist)], capture_output=True)
    if result.returncode == 0:
        break
    time.sleep(1)
else:
    raise SystemExit("launchctl bootstrap failed: " + str(result.returncode))
print("Worker registered with launchd.")
