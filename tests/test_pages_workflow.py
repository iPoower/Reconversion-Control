"""Publication policy regressions; no GitHub or Pages writes."""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class WorkflowPolicy(unittest.TestCase):
    def test_no_manual_publication_bypass(self):
        source = (ROOT / ".github/workflows/pages.yml").read_text()
        self.assertNotIn("workflow_dispatch", source)
        for condition in ("workflow_run.event == 'push'", "workflow_run.head_branch == 'main'",
                          "workflow_run.head_repository.full_name == github.repository"):
            self.assertIn(condition, source)

    def test_actions_are_pinned(self):
        for file in (ROOT / ".github/workflows").glob("*.yml"):
            for action in re.findall(r"uses:\s*(\S+)", file.read_text()):
                self.assertRegex(action, r"^actions/[\w-]+@[0-9a-f]{40}$", str(file))

    def test_artifact_is_explicit_and_verified(self):
        source = (ROOT / ".github/workflows/pages.yml").read_text()
        self.assertIn("verify-pages.py authorize", source)
        self.assertIn("verify-pages.py stage", source)
        self.assertIn("verify-pages.py archive", source)
        self.assertIn("verify-pages.py uploaded", source)
        self.assertIn("artifact_name: reconversion-pages-${{ github.event.workflow_run.head_sha }}", source)
        self.assertNotRegex(source, r"path:\s*\.\s*\n")
        self.assertLess(source.index("verify-pages.py uploaded"), source.index("id: deployment"))

    def test_existing_permissions_are_preserved(self):
        expected = {"tests.yml": "permissions:\n  contents: read\n  pull-requests: read\n",
                    "pages.yml": "permissions:\n  contents: read\n  pages: write\n  id-token: write\n"}
        for name, block in expected.items():
            source = (ROOT / ".github/workflows" / name).read_text()
            self.assertEqual(re.findall(r"^permissions:\n(?:[ \t]+.*\n)+", source, re.MULTILINE), [block])
            self.assertNotRegex(source, re.compile(r"^[ \t]+permissions:", re.MULTILINE), name)


if __name__ == "__main__":
    unittest.main()
