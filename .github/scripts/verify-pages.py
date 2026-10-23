"""Fail-closed Pages provenance. Standard library only; never changes GitHub settings."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tarfile
import urllib.request

REPOSITORY = "iPoower/Reconversion-Control"
WORKFLOW = ".github/workflows/tests.yml"
WORKFLOW_NAME = "Reconversion Control · tests mobiles"
REQUIRED_JOBS = {"provenance", "mobile (chromium)", "mobile (webkit)"}
PUBLIC_FILES = (
    "index.html", "project-plan.js", "app.js", "data.js", "course-foundations.js",
    "course-race.js", "course-operations.js", "learning.js", "english.js",
    "drive-learning.js", "daily-five.js", "deep-dives.js", "evidence-checks.js",
    "cloud-transport.js", "cloud-ui.js", "style.css", "sw.js", "manifest.webmanifest",
    "assets/icon-192.png", "assets/icon-512.png",
)
MANIFEST = "build-provenance.json"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def valid_sha(sha):
    require(isinstance(sha, str) and re.fullmatch(r"[0-9a-f]{40}", sha), "Invalid exact SHA")
    return sha


def api(path):
    # Public metadata, existing read token only. No added token permissions.
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "Reconversion-Pages-provenance"}
    if os.environ.get("GH_TOKEN"):
        headers["Authorization"] = "Bearer " + os.environ["GH_TOKEN"]
    request = urllib.request.Request("https://api.github.com/repos/" + REPOSITORY + path, headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def verify_origin(event, event_name, run, jobs, main, pulls):
    trigger = event.get("workflow_run", {})
    require(event_name == "workflow_run" and event.get("action") == "completed", "Not a completed workflow_run event")
    require(event.get("repository", {}).get("full_name") == REPOSITORY, "Wrong event repository")
    sha = valid_sha(trigger.get("head_sha"))
    for candidate in (trigger, run):
        require(candidate.get("name") == WORKFLOW_NAME and candidate.get("path") == WORKFLOW, "Wrong validation workflow")
        require(candidate.get("event") == "push" and candidate.get("head_branch") == "main", "Validation was not a main push")
        require(candidate.get("status") == "completed" and candidate.get("conclusion") == "success", "Validation not completed and green")
        require(candidate.get("head_repository", {}).get("full_name") == REPOSITORY, "Wrong validation source repository")
        require(candidate.get("repository", {}).get("full_name") == REPOSITORY, "Wrong validation repository")
        require(candidate.get("head_sha") == sha, "Validation SHA mismatch")
    for key in ("id", "workflow_id", "run_attempt"):
        require(isinstance(trigger.get(key), int) and trigger[key] > 0 and trigger[key] == run.get(key), "Run identity/attempt mismatch")
    require(main.get("commit", {}).get("sha") == sha, "Tested SHA is no longer main HEAD")
    require(jobs.get("total_count") == len(jobs.get("jobs", [])), "Incomplete job metadata")
    seen = set()
    for job in jobs.get("jobs", []):
        require(job.get("run_id") == run["id"] and job.get("run_attempt") == run["run_attempt"], "Wrong job run/attempt")
        require(job.get("head_sha") == sha, "Wrong job SHA")
        require(job.get("status") == "completed" and job.get("conclusion") == "success", "A validation job is unfinished or not green")
        require(job.get("name") not in seen, "Ambiguous duplicate job")
        seen.add(job["name"])
    require(REQUIRED_JOBS <= seen, "Required provenance/Chromium/WebKit jobs missing")
    require(any(pr.get("merged_at") and pr.get("merge_commit_sha") == sha
                and pr.get("base", {}).get("ref") == "main"
                and pr.get("base", {}).get("repo", {}).get("full_name") == REPOSITORY for pr in pulls),
            "Exact SHA is not the merge commit of a PR into this main")
    return {"repository": REPOSITORY, "sha": sha, "validation_run_id": run["id"],
            "validation_run_attempt": run["run_attempt"], "validation_jobs": sorted(seen)}


def authorize(event, event_name):
    trigger = event.get("workflow_run", {})
    run_id = trigger.get("id")
    require(isinstance(run_id, int) and run_id > 0, "Invalid triggering run ID")
    run = api("/actions/runs/" + str(run_id))
    sha = valid_sha(trigger.get("head_sha"))
    return verify_origin(event, event_name, run,
                         api("/actions/runs/" + str(run_id) + "/attempts/" + str(run["run_attempt"]) + "/jobs?per_page=100"),
                         api("/branches/main"), api("/commits/" + sha + "/pulls?per_page=100"))


def source_bytes(sha, name):
    valid_sha(sha)
    # Read committed blobs, never untracked workspace files or downloaded artifacts.
    entry = subprocess.check_output(["git", "ls-tree", sha, "--", name], text=True, stderr=subprocess.PIPE).split()
    require(len(entry) == 4 and entry[0] in ("100644", "100755") and entry[1] == "blob", "Missing/nonregular source: " + name)
    data = subprocess.check_output(["git", "show", sha + ":" + name])
    if name in ("index.html", "sw.js"):
        require(b"__BUILD_SHA__" in data, "Missing build placeholder: " + name)
        data = data.replace(b"__BUILD_SHA__", sha.encode("ascii"))
    return data


def expected_site(provenance):
    require(provenance.get("repository") == REPOSITORY, "Wrong manifest repository")
    result = {name: source_bytes(provenance["sha"], name) for name in PUBLIC_FILES}
    manifest = {**provenance, "assets_sha256": {name: hashlib.sha256(data).hexdigest() for name, data in result.items()}}
    result[MANIFEST] = (json.dumps(manifest, sort_keys=True, indent=2) + "\n").encode()
    return result


def stage(root, provenance):
    require(not root.exists(), "Staging directory must be new")
    for name, data in expected_site(provenance).items():
        target = root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    verify_site(root, provenance)


def verify_site(root, provenance):
    expected = expected_site(provenance)
    files = {}
    for target in root.rglob("*"):
        require(not target.is_symlink(), "Symlink in staged site")
        if target.is_dir():
            require(target.relative_to(root).as_posix() == "assets", "Unexpected staged directory")
        else:
            require(target.is_file(), "Nonregular staged file")
            files[target.relative_to(root).as_posix()] = target.read_bytes()
    require(files == expected, "Staged bytes/manifest differ from the exact tested commit")
    return expected


def verify_archive(archive, root, provenance):
    expected = verify_site(root, provenance)
    files = {}
    with tarfile.open(archive, "r:") as tar:
        for item in tar:
            name = item.name.removeprefix("./")
            if item.isdir():
                require(name in (".", "", "assets"), "Unexpected archive directory")
                continue
            require(item.isfile() and name in expected and name not in files, "Unexpected/link/duplicate archive entry")
            require(item.size == len(expected[name]), "Wrong archive member size")
            files[name] = tar.extractfile(item).read()
    require(files == expected, "Archive bytes differ from verified site")
    return hashlib.sha256(archive.read_bytes()).hexdigest()


def verify_uploaded(artifact, artifact_id, deploy_run_id, provenance):
    require(artifact.get("id") == artifact_id and not artifact.get("expired", True), "Wrong/expired uploaded artifact")
    require(artifact.get("name") == "reconversion-pages-" + provenance["sha"], "Wrong artifact name")
    run = artifact.get("workflow_run", {})
    require(run.get("id") == deploy_run_id and run.get("head_sha") == provenance["sha"]
            and run.get("head_branch") == "main", "Artifact is not from this deployment run/SHA")
    require(isinstance(artifact.get("digest"), str) and re.fullmatch(r"sha256:[0-9a-f]{64}", artifact["digest"]), "Missing platform artifact digest")
    return artifact["digest"]


def main():
    command = sys.argv[1]
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    proof_path = Path(os.environ["RUNNER_TEMP"]) / "reconversion-provenance.json"
    site = Path(os.environ["RUNNER_TEMP"]) / "reconversion-site"
    if command == "authorize":
        proof = authorize(event, os.environ["GITHUB_EVENT_NAME"])
        require(subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip() == proof["sha"], "Checkout differs from tested SHA")
        proof_path.write_text(json.dumps(proof))
    else:
        proof = json.loads(proof_path.read_text())
        if command == "stage":
            stage(site, proof)
        elif command == "archive":
            digest = verify_archive(Path(os.environ["RUNNER_TEMP"]) / "artifact.tar", site, proof)
            print("Verified Pages archive SHA-256: " + digest)
        elif command == "uploaded":
            require(authorize(event, os.environ["GITHUB_EVENT_NAME"]) == proof, "Provenance changed before deployment")
            verify_archive(Path(os.environ["RUNNER_TEMP"]) / "artifact.tar", site, proof)
            artifact_id = int(os.environ["ARTIFACT_ID"])
            digest = verify_uploaded(api("/actions/artifacts/" + str(artifact_id)), artifact_id, int(os.environ["GITHUB_RUN_ID"]), proof)
            print("Verified same-run artifact " + str(artifact_id) + " " + digest + " for " + proof["sha"])
        else:
            raise ValueError("Unknown verification command")


if __name__ == "__main__":
    main()
