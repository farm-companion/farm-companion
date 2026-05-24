"""Unit tests for the pure helpers in scrape_sidecar. Run:
    .venv/bin/python -m unittest src.scrape_sidecar_test  (from farm-pipeline/)
or  .venv/bin/python -m unittest scrape_sidecar_test       (from farm-pipeline/src/)
"""
import unittest

from scrape_sidecar import (
    same_domain,
    pick_internal_links,
    build_artifact,
    clean_markdown,
)


class TestPureHelpers(unittest.TestCase):
    def test_same_domain_true_for_same_host(self):
        self.assertTrue(same_domain("https://dartsfarm.co.uk/", "https://dartsfarm.co.uk/about"))

    def test_same_domain_false_for_other_host(self):
        self.assertFalse(same_domain("https://dartsfarm.co.uk/", "https://facebook.com/darts"))

    def test_pick_internal_links_keeps_relevant_same_domain_capped(self):
        base = "https://dartsfarm.co.uk/"
        hrefs = [
            "https://dartsfarm.co.uk/about-us",
            "https://dartsfarm.co.uk/our-produce",
            "https://dartsfarm.co.uk/opening-times",
            "https://dartsfarm.co.uk/blog/2019/some-post",  # not a keyword page
            "https://twitter.com/darts",                     # off-domain
            "https://dartsfarm.co.uk/",                       # base itself
        ]
        out = pick_internal_links(base, hrefs, cap=2)
        self.assertEqual(len(out), 2)
        for u in out:
            self.assertTrue(u.startswith("https://dartsfarm.co.uk/"))
        self.assertNotIn(base, out)
        self.assertNotIn("https://twitter.com/darts", out)

    def test_build_artifact_shape(self):
        a = build_artifact(
            slug="darts-farm", website="https://dartsfarm.co.uk/", status="ok",
            markdown="hello world", http_status=200, final_url="https://dartsfarm.co.uk/", pages=2, error=None,
        )
        self.assertEqual(a["schemaVersion"], 1)
        self.assertEqual(a["slug"], "darts-farm")
        self.assertEqual(a["status"], "ok")
        self.assertEqual(a["markdownChars"], len("hello world"))
        self.assertEqual(a["pagesCrawled"], 2)
        self.assertTrue(a["fetchedAt"].endswith("Z"))

    def test_clean_markdown_collapses_blank_lines(self):
        out = clean_markdown("a\n\n\n\n\nb\n\n\n  \nc")
        self.assertNotIn("\n\n\n", out)
        self.assertTrue(out.startswith("a"))


if __name__ == "__main__":
    unittest.main()
