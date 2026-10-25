"""Stage a public-only reader from committed blobs. Never uploads or publishes."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

FILES = ("courses-public.html", "courses-public.js", "data.js", "course-foundations.js",
         "course-race.js", "course-operations.js", "learning.js", "style.css")


def stage(sha, destination):
    # Resolve refs once, then read only this exact immutable revision.
    sha = subprocess.check_output(["git", "rev-parse", "--verify", sha + "^{commit}"], text=True).strip()
    destination = Path(destination)
    if destination.exists():
        raise ValueError("Destination must not exist; no existing files are replaced")
    content = {}
    for name in FILES:
        entry = subprocess.check_output(["git", "ls-tree", sha, "--", name], text=True).split()
        if len(entry) != 4 or entry[:2] != ["100644", "blob"]:
            raise ValueError("Missing regular public source: " + name)
        content["index.html" if name == "courses-public.html" else name] = subprocess.check_output(["git", "show", sha + ":" + name])
    destination.mkdir(parents=True)
    manifest = {"sha": sha, "kind": "public-courses-only", "files": {}}
    for name, data in content.items():
        (destination / name).write_bytes(data)
        manifest["files"][name] = hashlib.sha256(data).hexdigest()
    (destination / "public-provenance.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sha")
    parser.add_argument("destination")
    args = parser.parse_args()
    print(json.dumps(stage(args.sha, args.destination)))
