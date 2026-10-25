"""No deployment: verify the public distribution cannot include private modules."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("public_reader", ROOT / ".github/scripts/stage-public-courses.py")
public = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(public)


class PublicReader(unittest.TestCase):
    def test_exact_committed_allowlist_has_no_private_runtime(self):
        sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
        with tempfile.TemporaryDirectory() as temporary:
            destination = Path(temporary) / "public"
            result = public.stage(sha, destination)
            self.assertEqual(result["sha"], sha)
            self.assertEqual(set(p.name for p in destination.iterdir()),
                             {"index.html", "courses-public.js", "data.js", "course-foundations.js",
                              "course-race.js", "course-operations.js", "learning.js", "style.css", "public-provenance.json"})
            self.assertEqual(json.loads((destination / "public-provenance.json").read_text()), result)
            html = (destination / "index.html").read_text()
            self.assertIn("connect-src 'none'", html)
            for name in ("app.js", "cloud-ui.js", "cloud-transport.js", "sw.js", "access-mode.js"):
                self.assertNotIn(name, html)
            # Lesson text legitimately explains localStorage. Execute the catalog
            # with throwing APIs to distinguish teaching strings from real access.
            program = """
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const sandbox={};
for(const name of ['localStorage','sessionStorage','indexedDB','fetch','XMLHttpRequest','navigator'])
 Object.defineProperty(sandbox,name,{get(){throw Error('Forbidden public access: '+name);}});
vm.createContext(sandbox);
for(const file of JSON.parse(fs.readFileSync(0,'utf8')))
 vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
assert.equal(vm.runInContext('RC_LESSONS.length',sandbox),42);
"""
            scripts = [str(destination / name) for name in
                       ("data.js", "course-foundations.js", "course-race.js", "course-operations.js", "learning.js")]
            subprocess.run(["node", "-e", program], input=json.dumps(scripts), text=True, check=True, capture_output=True)

    def test_existing_destination_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as existing:
            marker = Path(existing) / "keep"
            marker.write_text("independent copy")
            with self.assertRaises(ValueError):
                public.stage("HEAD", existing)
            self.assertEqual(marker.read_text(), "independent copy")


if __name__ == "__main__":
    unittest.main()
