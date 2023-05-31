import os
import sys
import subprocess

install_dir = os.path.expanduser('~/.appmap/python')

if not os.path.exists(install_dir):
    os.makedirs(install_dir)

subprocess.check_call([
  sys.executable,
  "-m",
  "pip",
  "install",
  "--upgrade",
  "--target",
  install_dir,
  "appmap"
])

sys.path.insert(0, install_dir)

import appmap