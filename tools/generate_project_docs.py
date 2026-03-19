#!/usr/bin/env python3
"""Generate project reference docs from backend and frontend source files."""

from __future__ import annotations

import ast
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = ROOT / "backend"
FRONTEND_ROOT = ROOT / "frontend" / "src"
DOCS_DIR = ROOT / "docs"
GENERATED_DIR = DOCS_DIR / "generated"
BACKEND_DOC_PATH = GENERATED_DIR / "backend-reference.md"
FRONTEND_DOC_PATH = GENERATED_DIR / "frontend-reference.md"
INDEX_DOC_PATH = DOCS_DIR / "README.md"

EXCLUDED_DIRS = {
    ".venv",
    "__pycache__",
    "node_modules",
    ".pytest_cache",
    ".ruff_cache",
    ".git",
    "tmp_test_media",
    "migrations",
    "dist",
    "build",
}

TS_DECLARATION_RE = re.compile(
    r"^(?:export\s+)?(?:default\s+)?(?:(?:async\s+)?function|const|class)\s+([A-Za-z_]\w*)"
)


@dataclass
class PythonCallableDoc:
    name: str
    signature: str
    doc: str


@dataclass
class PythonClassDoc:
    name: str
    bases: str
    doc: str
    methods: list[PythonCallableDoc]


@dataclass
class PythonModuleDoc:
    path: str
    doc: str
    functions: list[PythonCallableDoc]
    classes: list[PythonClassDoc]


@dataclass
class TsDeclarationDoc:
    name: str
    signature: str
    doc: str


@dataclass
class TsModuleDoc:
    path: str
    declarations: list[TsDeclarationDoc]


def is_excluded(path: Path) -> bool:
    return any(part in EXCLUDED_DIRS for part in path.parts)


def iter_files(base: Path, extensions: tuple[str, ...]) -> Iterable[Path]:
    for path in base.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in extensions:
            continue
        if is_excluded(path.relative_to(ROOT)):
            continue
        yield path


def trim_doc(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(line.strip() for line in value.strip().splitlines() if line.strip())


def format_annotation(node: ast.AST | None) -> str:
    if node is None:
        return ""
    try:
        return ast.unparse(node)
    except Exception:
        return ""


def format_python_callable_signature(node: ast.FunctionDef | ast.AsyncFunctionDef) -> str:
    args = node.args
    parts: list[str] = []

    positional = list(args.posonlyargs) + list(args.args)
    positional_defaults = [None] * (len(positional) - len(args.defaults)) + list(args.defaults)
    for arg, default in zip(positional, positional_defaults):
        token = arg.arg
        annotation = format_annotation(arg.annotation)
        if annotation:
            token = f"{token}: {annotation}"
        if default is not None:
            token = f"{token}={format_annotation(default) or '...'}"
        parts.append(token)

    if args.vararg is not None:
        token = f"*{args.vararg.arg}"
        annotation = format_annotation(args.vararg.annotation)
        if annotation:
            token = f"{token}: {annotation}"
        parts.append(token)
    elif args.kwonlyargs:
        parts.append("*")

    for arg, default in zip(args.kwonlyargs, args.kw_defaults):
        token = arg.arg
        annotation = format_annotation(arg.annotation)
        if annotation:
            token = f"{token}: {annotation}"
        if default is not None:
            token = f"{token}={format_annotation(default) or '...'}"
        parts.append(token)

    if args.kwarg is not None:
        token = f"**{args.kwarg.arg}"
        annotation = format_annotation(args.kwarg.annotation)
        if annotation:
            token = f"{token}: {annotation}"
        parts.append(token)

    signature = f"{node.name}({', '.join(parts)})"
    returns = format_annotation(node.returns)
    if returns:
        signature = f"{signature} -> {returns}"
    return signature


def parse_python_module(path: Path) -> PythonModuleDoc | None:
    try:
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source)
    except Exception:
        return None

    module_doc = trim_doc(ast.get_docstring(tree))
    functions: list[PythonCallableDoc] = []
    classes: list[PythonClassDoc] = []

    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            functions.append(
                PythonCallableDoc(
                    name=node.name,
                    signature=format_python_callable_signature(node),
                    doc=trim_doc(ast.get_docstring(node)),
                )
            )
            continue

        if isinstance(node, ast.ClassDef):
            bases = ", ".join(format_annotation(base) for base in node.bases if format_annotation(base))
            methods: list[PythonCallableDoc] = []
            for child in node.body:
                if not isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    continue
                methods.append(
                    PythonCallableDoc(
                        name=child.name,
                        signature=format_python_callable_signature(child),
                        doc=trim_doc(ast.get_docstring(child)),
                    )
                )
            classes.append(
                PythonClassDoc(
                    name=node.name,
                    bases=bases,
                    doc=trim_doc(ast.get_docstring(node)),
                    methods=methods,
                )
            )

    rel_path = str(path.relative_to(ROOT)).replace("\\", "/")
    return PythonModuleDoc(path=rel_path, doc=module_doc, functions=functions, classes=classes)


def parse_jsdoc(lines: list[str], declaration_index: int) -> str:
    index = declaration_index - 1
    while index >= 0 and not lines[index].strip():
        index -= 1
    if index < 0 or not lines[index].strip().endswith("*/"):
        return ""

    doc_lines: list[str] = []
    while index >= 0:
        current = lines[index].strip()
        doc_lines.append(current)
        if current.startswith("/**"):
            break
        index -= 1

    if not doc_lines or not doc_lines[-1].startswith("/**"):
        return ""

    doc_lines.reverse()
    cleaned: list[str] = []
    for line in doc_lines:
        value = line
        value = value.removeprefix("/**").removesuffix("*/").strip()
        value = value.removeprefix("*").strip()
        if value:
            cleaned.append(value)
    return " ".join(cleaned)


def parse_typescript_module(path: Path) -> TsModuleDoc | None:
    try:
        source = path.read_text(encoding="utf-8")
    except Exception:
        return None

    lines = source.splitlines()
    declarations: list[TsDeclarationDoc] = []

    for index, raw_line in enumerate(lines):
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("import "):
            continue
        if line.startswith("type ") or line.startswith("export type "):
            continue
        if not TS_DECLARATION_RE.match(line):
            continue
        if line.startswith("const ") and "=>" not in line:
            continue

        signature = line
        next_index = index
        while next_index + 1 < len(lines) and ("(" in signature and ")" not in signature):
            next_index += 1
            signature = f"{signature} {lines[next_index].strip()}"
            if len(signature) > 240:
                break
        signature = re.sub(r"\s+", " ", signature).strip()

        match = TS_DECLARATION_RE.match(line)
        if match is None:
            continue
        declarations.append(
            TsDeclarationDoc(
                name=match.group(1),
                signature=signature,
                doc=parse_jsdoc(lines, index),
            )
        )

    rel_path = str(path.relative_to(ROOT)).replace("\\", "/")
    return TsModuleDoc(path=rel_path, declarations=declarations)


def render_backend_markdown(modules: list[PythonModuleDoc]) -> str:
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        "# Backend Reference",
        "",
        f"Generated: {generated_at}",
        "",
        f"Total modules: {len(modules)}",
        "",
    ]

    for module in modules:
        lines.append(f"## `{module.path}`")
        lines.append("")
        if module.doc:
            lines.append(f"- Description: {module.doc}")
        lines.append(f"- Functions: {len(module.functions)}")
        lines.append(f"- Classes: {len(module.classes)}")
        lines.append("")

        if module.functions:
            lines.append("### Functions")
            lines.append("")
            for item in module.functions:
                lines.append(f"- `{item.signature}`")
                if item.doc:
                    lines.append(f"  - {item.doc}")
            lines.append("")

        if module.classes:
            lines.append("### Classes")
            lines.append("")
            for cls in module.classes:
                header = f"- `{cls.name}`"
                if cls.bases:
                    header = f"{header} : `{cls.bases}`"
                lines.append(header)
                if cls.doc:
                    lines.append(f"  - {cls.doc}")
                lines.append(f"  - Methods: {len(cls.methods)}")
                for method in cls.methods:
                    lines.append(f"  - `{method.signature}`")
                    if method.doc:
                        lines.append(f"    - {method.doc}")
            lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def render_frontend_markdown(modules: list[TsModuleDoc]) -> str:
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        "# Frontend Reference",
        "",
        f"Generated: {generated_at}",
        "",
        f"Total modules: {len(modules)}",
        "",
    ]

    for module in modules:
        lines.append(f"## `{module.path}`")
        lines.append("")
        lines.append(f"- Top-level declarations: {len(module.declarations)}")
        lines.append("")
        if module.declarations:
            lines.append("### Declarations")
            lines.append("")
            for decl in module.declarations:
                lines.append(f"- `{decl.signature}`")
                if decl.doc:
                    lines.append(f"  - {decl.doc}")
            lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def render_index_markdown(backend_modules: int, frontend_modules: int) -> str:
    lines = [
        "# Project Documentation",
        "",
        "This directory contains generated code reference documentation.",
        "",
        "## Contents",
        "",
        f"- [Backend Reference](generated/backend-reference.md) ({backend_modules} modules)",
        f"- [Frontend Reference](generated/frontend-reference.md) ({frontend_modules} modules)",
        "",
        "## Regenerate",
        "",
        "```bash",
        "python tools/generate_project_docs.py",
        "```",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    backend_modules = [
        module
        for module in (
            parse_python_module(path) for path in sorted(iter_files(BACKEND_ROOT, (".py",)))
        )
        if module is not None
    ]
    frontend_modules = [
        module
        for module in (
            parse_typescript_module(path)
            for path in sorted(iter_files(FRONTEND_ROOT, (".ts", ".tsx")))
        )
        if module is not None
    ]

    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    BACKEND_DOC_PATH.write_text(render_backend_markdown(backend_modules), encoding="utf-8")
    FRONTEND_DOC_PATH.write_text(render_frontend_markdown(frontend_modules), encoding="utf-8")
    INDEX_DOC_PATH.write_text(
        render_index_markdown(len(backend_modules), len(frontend_modules)),
        encoding="utf-8",
    )

    print(f"Backend modules: {len(backend_modules)}")
    print(f"Frontend modules: {len(frontend_modules)}")
    print(f"Written: {BACKEND_DOC_PATH.relative_to(ROOT)}")
    print(f"Written: {FRONTEND_DOC_PATH.relative_to(ROOT)}")
    print(f"Written: {INDEX_DOC_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
