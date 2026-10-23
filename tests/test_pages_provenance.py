"""Behavioral checks for the release gate and byte-level artifact provenance."""
import copy
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("pages", ROOT / ".github/scripts/verify-pages.py")
pages = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(pages)


class Origin(unittest.TestCase):
    def setUp(self):
        self.sha = "a" * 40
        self.run = {"id": 101, "workflow_id": 202, "run_attempt": 1, "head_sha": self.sha,
                    "name": pages.WORKFLOW_NAME, "path": pages.WORKFLOW, "event": "push",
                    "head_branch": "main", "status": "completed", "conclusion": "success",
                    "repository": {"full_name": pages.REPOSITORY}, "head_repository": {"full_name": pages.REPOSITORY}}
        self.event = {"action": "completed", "repository": {"full_name": pages.REPOSITORY}, "workflow_run": copy.deepcopy(self.run)}
        self.jobs = {"total_count": 3, "jobs": [{"id": i, "name": name, "run_id": 101, "run_attempt": 1,
                      "head_sha": self.sha, "status": "completed", "conclusion": "success"}
                      for i, name in enumerate(sorted(pages.REQUIRED_JOBS))]}
        self.main = {"commit": {"sha": self.sha}}
        self.pulls = [{"merged_at": "2026-10-23T00:00:00Z", "merge_commit_sha": self.sha,
                       "base": {"ref": "main", "repo": {"full_name": pages.REPOSITORY}}}]

    def verify(self, event_name="workflow_run"):
        return pages.verify_origin(self.event, event_name, self.run, self.jobs, self.main, self.pulls)

    def test_exact_green_main_run_is_accepted(self):
        self.assertEqual(self.verify()["sha"], self.sha)

    def test_manual_and_pr_events_are_rejected(self):
        for event in ("workflow_dispatch", "pull_request", "push", ""):
            with self.subTest(event=event), self.assertRaises(ValueError):
                self.verify(event)

    def test_untrusted_or_incomplete_validation_is_rejected(self):
        for key, value in (("event", "pull_request"), ("head_branch", "feature"), ("status", "in_progress"),
                           ("conclusion", "failure"), ("conclusion", "cancelled"), ("conclusion", None),
                           ("head_sha", "b" * 40), ("path", ".github/workflows/other.yml"),
                           ("name", "Other CI"), ("id", 999), ("run_attempt", 2), ("workflow_id", 999),
                           ("head_repository", {"full_name": "fixture/fork"}), ("repository", {"full_name": "fixture/fork"})):
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                with patch.dict(self.run, {key: value}):
                    self.verify()

    def test_bad_trigger_and_stale_main_are_rejected(self):
        for mutate in (lambda: self.event.update(action="requested"),
                       lambda: self.event.update(repository={"full_name": "fixture/other"}),
                       lambda: self.event["workflow_run"].update(head_sha="not-a-sha"),
                       lambda: self.main["commit"].update(sha="b" * 40)):
            self.setUp(); mutate()
            with self.subTest(event=self.event), self.assertRaises(ValueError):
                self.verify()

    def test_required_jobs_must_all_be_completed_green_on_exact_attempt(self):
        for key, value in (("status", "in_progress"), ("conclusion", "failure"), ("conclusion", "skipped"),
                           ("conclusion", "cancelled"), ("head_sha", "b" * 40), ("run_id", 999), ("run_attempt", 2)):
            for index in range(3):
                self.setUp(); self.jobs["jobs"][index][key] = value
                with self.subTest(key=key, index=index), self.assertRaises(ValueError):
                    self.verify()

    def test_missing_duplicate_and_paginated_jobs_are_rejected(self):
        self.jobs["jobs"].pop(); self.jobs["total_count"] = 2
        with self.assertRaises(ValueError): self.verify()
        self.setUp(); self.jobs["jobs"].append(copy.deepcopy(self.jobs["jobs"][0])); self.jobs["total_count"] = 4
        with self.assertRaises(ValueError): self.verify()
        self.setUp(); self.jobs["total_count"] = 101
        with self.assertRaises(ValueError): self.verify()

    def test_association_without_exact_merge_commit_is_rejected(self):
        for mutate in (lambda: self.pulls.clear(), lambda: self.pulls[0].update(merged_at=None),
                       lambda: self.pulls[0].update(merge_commit_sha="b" * 40),
                       lambda: self.pulls[0]["base"].update(ref="other"),
                       lambda: self.pulls[0]["base"]["repo"].update(full_name="fixture/fork")):
            self.setUp(); mutate()
            with self.subTest(pulls=self.pulls), self.assertRaises(ValueError): self.verify()

    def test_authorization_fetches_exact_attempt_and_fails_closed_on_api_error(self):
        with patch.object(pages, "api", side_effect=[self.run, self.jobs, self.main, self.pulls]) as api:
            self.assertEqual(pages.authorize(self.event, "workflow_run")["validation_run_id"], 101)
            self.assertIn("/attempts/1/jobs?per_page=100", api.call_args_list[1].args[0])
        with patch.object(pages, "api", side_effect=OSError("fixture outage")), self.assertRaises(OSError):
            pages.authorize(self.event, "workflow_run")


class Artifact(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "site"
        self.proof = {"repository": pages.REPOSITORY, "sha": self.sha, "validation_run_id": 101,
                      "validation_run_attempt": 1, "validation_jobs": sorted(pages.REQUIRED_JOBS)}
        pages.stage(self.root, self.proof)

    def archive(self, extra=None):
        target = Path(self.temp.name) / "artifact.tar"
        with tarfile.open(target, "w") as tar:
            tar.add(self.root, arcname=".")
            if extra:
                item, body = extra
                tar.addfile(item, io.BytesIO(body) if body is not None else None)
        return target

    def test_committed_allowlist_only_and_exact_build_identity(self):
        files = pages.verify_site(self.root, self.proof)
        self.assertEqual(set(files), set(pages.PUBLIC_FILES) | {pages.MANIFEST})
        for name in ("index.html", "sw.js"):
            self.assertIn(self.sha.encode(), files[name]); self.assertNotIn(b"__BUILD_SHA__", files[name])
        self.assertEqual(json.loads(files[pages.MANIFEST])["sha"], self.sha)
        self.assertEqual(len(pages.verify_archive(self.archive(), self.root, self.proof)), 64)
        self.assertFalse((self.root / "package.json").exists())
        self.assertFalse((self.root / ".github").exists())

    def test_wrong_sha_and_manifest_are_rejected(self):
        with self.assertRaises((ValueError, subprocess.CalledProcessError)):
            pages.verify_site(self.root, {**self.proof, "sha": "b" * 40})
        (self.root / pages.MANIFEST).write_text("{}")
        with self.assertRaises(ValueError): pages.verify_site(self.root, self.proof)

    def test_missing_extra_and_modified_assets_are_rejected(self):
        for operation in (lambda: (self.root / "app.js").write_text("tampered fixture"),
                          lambda: (self.root / "index.html").unlink(),
                          lambda: (self.root / "private-fixture.json").write_text("synthetic only")):
            with self.subTest(operation=operation):
                operation()
                with self.assertRaises(ValueError): pages.verify_site(self.root, self.proof)
                self.temp.cleanup(); self.setUp()

    def test_symlink_rejected_without_following_it(self):
        (self.root / "linked-fixture").symlink_to(self.root / "app.js")
        with self.assertRaises(ValueError): pages.verify_site(self.root, self.proof)

    def test_archive_traversal_links_duplicates_and_extra_files_rejected(self):
        for name, kind in (("../escape", tarfile.REGTYPE), ("/absolute", tarfile.REGTYPE),
                           ("linked", tarfile.SYMTYPE), ("hardlinked", tarfile.LNKTYPE),
                           ("app.js", tarfile.REGTYPE), ("extra.json", tarfile.REGTYPE)):
            item = tarfile.TarInfo(name); item.type = kind
            body = b"x" if kind == tarfile.REGTYPE else None
            item.size = len(body) if body else 0
            if body is None: item.linkname = "app.js"
            with self.subTest(name=name), self.assertRaises(ValueError):
                pages.verify_archive(self.archive((item, body)), self.root, self.proof)

    def test_actual_archiver_used_by_pinned_composite_is_compatible(self):
        target = Path(self.temp.name) / "artifact.tar"
        subprocess.run(["tar", "--dereference", "--hard-dereference", "--directory", str(self.root),
                        "-cf", str(target), "--exclude=.git", "--exclude=.github", "--exclude=.[^/]*", "."], check=True)
        self.assertEqual(len(pages.verify_archive(target, self.root, self.proof)), 64)

    def test_uploaded_artifact_must_match_this_run_sha_id_name_and_digest(self):
        artifact = {"id": 303, "name": "reconversion-pages-" + self.sha, "expired": False,
                    "digest": "sha256:" + "c" * 64, "workflow_run": {"id": 404, "head_sha": self.sha, "head_branch": "main"}}
        self.assertEqual(pages.verify_uploaded(artifact, 303, 404, self.proof), artifact["digest"])
        for key, value in (("id", 999), ("name", "github-pages"), ("expired", True), ("digest", None)):
            with self.subTest(key=key), patch.dict(artifact, {key: value}), self.assertRaises(ValueError):
                pages.verify_uploaded(artifact, 303, 404, self.proof)

    def test_cli_authorize_stage_archive_and_uploaded_without_deploying(self):
        origin = Origin(); origin.setUp()
        origin.run["head_sha"] = self.sha
        origin.event["workflow_run"]["head_sha"] = self.sha
        origin.main["commit"]["sha"] = self.sha
        origin.pulls[0]["merge_commit_sha"] = self.sha
        for job in origin.jobs["jobs"]: job["head_sha"] = self.sha
        event_file = Path(self.temp.name) / "event.json"
        event_file.write_text(json.dumps(origin.event))
        artifact = {"id": 303, "name": "reconversion-pages-" + self.sha, "expired": False,
                    "digest": "sha256:" + "c" * 64, "workflow_run": {"id": 404, "head_sha": self.sha, "head_branch": "main"}}
        responses = [origin.run, origin.jobs, origin.main, origin.pulls] * 2 + [artifact]
        env = {"GITHUB_EVENT_PATH": str(event_file), "GITHUB_EVENT_NAME": "workflow_run",
               "RUNNER_TEMP": self.temp.name, "GITHUB_RUN_ID": "404", "ARTIFACT_ID": "303"}
        with patch.dict(os.environ, env), patch.object(pages, "api", side_effect=responses):
            for command in ("authorize", "stage", "archive", "uploaded"):
                if command == "archive":
                    subprocess.run(["tar", "--dereference", "--hard-dereference", "--directory",
                                    str(Path(self.temp.name) / "reconversion-site"), "-cf",
                                    str(Path(self.temp.name) / "artifact.tar"), "."], check=True)
                with patch.object(sys, "argv", ["verify-pages.py", command]): pages.main()
        for key, value in (("id", 999), ("head_sha", "b" * 40), ("head_branch", "feature")):
            with self.subTest(key=key), patch.dict(artifact["workflow_run"], {key: value}), self.assertRaises(ValueError):
                pages.verify_uploaded(artifact, 303, 404, self.proof)


if __name__ == "__main__":
    unittest.main()
