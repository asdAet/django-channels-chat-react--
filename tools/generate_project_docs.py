#!/usr/bin/env python3
"""Generate detailed project reference docs from backend and frontend source files."""

from __future__ import annotations

import ast
import inspect
import re
from dataclasses import dataclass, field
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
    "tests",
    "media",
}

EXCLUDED_FILE_SUFFIXES = (
    ".test.ts",
    ".test.tsx",
    ".spec.ts",
    ".spec.tsx",
    ".test.py",
)

TS_DECLARATION_RE = re.compile(
    r"^(?:export\s+)?(?:default\s+)?(?:(?:async\s+)?function|const|class)\s+([A-Za-z_]\w*)"
)
PY_DOC_SECTION_RE = re.compile(r"^(Args?|Arguments?|Parameters?|Params?|Returns?|Yields?):\s*$")
PY_PARAM_RE = re.compile(r"^(\*{0,2}[A-Za-z_]\w*)(?:\s*\(([^)]*)\))?:\s*(.*)$")
TS_JSDOC_TAG_RE = re.compile(r"^@(\w+)\s*(.*)$")
TS_JSDOC_PARAM_RE = re.compile(r"^(?:\{([^}]*)\}\s*)?(\[[^\]]+\]|[A-Za-z_$][\w$.?]*)(?:\s+-\s+|\s+)?(.*)$")
TS_JSDOC_RETURN_RE = re.compile(r"^(?:\{([^}]*)\}\s*)?(.*)$")


@dataclass
class CallableParameterDoc:
    name: str
    type_name: str = ""
    default: str = ""
    kind: str = ""
    description: str = ""


@dataclass
class CallableReturnDoc:
    type_name: str = ""
    description: str = ""


@dataclass
class ParsedDocBlock:
    summary: str = ""
    details: str = ""
    params: dict[str, CallableParameterDoc] = field(default_factory=dict)
    returns: CallableReturnDoc = field(default_factory=CallableReturnDoc)


@dataclass
class PythonCallableDoc:
    name: str
    kind: str
    signature: str
    summary: str
    details: str
    parameters: list[CallableParameterDoc]
    returns: CallableReturnDoc | None
    decorators: list[str]


@dataclass
class PythonClassDoc:
    name: str
    bases: str
    summary: str
    details: str
    decorators: list[str]
    methods: list[PythonCallableDoc]


@dataclass
class PythonModuleDoc:
    path: str
    summary: str
    details: str
    functions: list[PythonCallableDoc]
    classes: list[PythonClassDoc]


@dataclass
class TsDeclarationDoc:
    name: str
    kind: str
    signature: str
    summary: str
    details: str
    parameters: list[CallableParameterDoc]
    returns: CallableReturnDoc | None


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
        if path.name.endswith(EXCLUDED_FILE_SUFFIXES):
            continue
        if is_excluded(path.relative_to(ROOT)):
            continue
        yield path


def trim_doc(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(line.strip() for line in value.strip().splitlines() if line.strip())


def join_sentence_parts(*parts: str) -> str:
    return " ".join(part.strip() for part in parts if part and part.strip())


def humanize_identifier(name: str) -> str:
    normalized = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", name)
    normalized = normalized.replace("_", " ").strip()
    return normalized.lower()


def split_identifier_tokens(name: str) -> list[str]:
    return [token for token in humanize_identifier(name).split() if token]


def contains_cyrillic(value: str) -> bool:
    return bool(re.search(r"[А-Яа-яЁё]", value))


def fallback_parameter_description(
    name: str,
    type_name: str,
    *,
    owner_name: str = "",
    kind: str = "",
    module_path: str = "",
) -> str:
    normalized_name = name.strip()
    normalized_type = type_name.strip()

    if normalized_name.startswith("{"):
        if normalized_type:
            return f"Объект параметров в формате `{normalized_type}`."
        return "Объект параметров, переданный через деструктуризацию."

    if normalized_name.startswith("on") and len(normalized_name) > 2:
        return f"Колбэк события `{humanize_identifier(normalized_name[2:])}`."
    if normalized_type.endswith("Props"):
        return f"Объект props в формате `{normalized_type}`."
    if normalized_type.endswith("Options"):
        return f"Объект опций в формате `{normalized_type}`."
    if normalized_type.endswith("ContextValue"):
        return f"Значение контекста в формате `{normalized_type}`."
    if kind == "произвольное число позиционных":
        format_name = normalized_type or "unknown"
        return f"Дополнительные позиционные аргументы в формате `{format_name}`."
    if kind == "произвольные именованные":
        format_name = normalized_type or "unknown"
        return f"Дополнительные именованные аргументы в формате `{format_name}`."
    if normalized_type == "unknown":
        return f"Параметр `{normalized_name}` произвольного формата."
    if normalized_type:
        return f"Параметр `{normalized_name}` в формате `{normalized_type}`."
    return f"Параметр `{normalized_name}`."


def fallback_return_description(
    type_name: str,
    owner_name: str,
    *,
    kind: str = "",
    module_path: str = "",
) -> str:
    if owner_name == "__str__":
        return "Человекочитаемое строковое представление объекта."
    if owner_name == "__init__":
        return "Ничего не возвращает; метод только инициализирует экземпляр."
    if owner_name[:1].isupper() and not type_name and kind in {"функция", "асинхронная функция"}:
        return f"React-элемент, который отрисовывает компонент `{owner_name}`."
    if owner_name.startswith("use") and not type_name:
        return "Состояние, вычисленные значения и колбэки, возвращаемые хуком."
    if type_name in {"void", "None"}:
        return "Ничего не возвращает; эффект достигается побочным действием."
    if type_name.startswith("Promise<void>"):
        return f"Промис, который завершается после успешного выполнения операции `{humanize_identifier(owner_name)}`."
    if type_name.startswith("Promise<") and type_name.endswith(">"):
        inner = type_name[len("Promise<") : -1].strip()
        return f"Промис с результатом операции в формате `{inner}`."
    if type_name.startswith("QuerySet["):
        return f"QuerySet с результатами операции в формате `{type_name}`."
    if type_name.startswith("list[") or type_name == "list":
        return f"Список значений, сформированный функцией, в формате `{type_name}`."
    if type_name.startswith("dict[") or type_name == "dict":
        return f"Словарь с результатами операции в формате `{type_name}`."
    if type_name.startswith("tuple[") or type_name == "tuple":
        return f"Кортеж со значениями результата в формате `{type_name}`."
    if type_name.startswith("set[") or type_name == "set":
        return f"Множество значений результата в формате `{type_name}`."
    if type_name in {"bool", "boolean"}:
        return "Булево значение, отражающее результат проверки."
    if type_name == "string":
        return "Строковое значение результата."
    if type_name == "str":
        return "Строковое значение результата."
    if type_name == "number":
        return "Числовое значение результата."
    if type_name:
        return f"Результат функции в формате `{type_name}`."
    return "Возвращает результат выполнения функции."


def fallback_summary(name: str, kind: str, *, module_path: str = "") -> str:
    if name == "__init__":
        return "Инициализирует экземпляр и подготавливает его внутреннее состояние."
    if name == "__str__":
        return "Возвращает человекочитаемое строковое представление объекта."
    if name == "__repr__":
        return "Возвращает техническое строковое представление объекта."
    if name == "__call__":
        return "Вызывает основную логику объекта как вызываемого обработчика."
    if name == "ready":
        return "Возвращает состояние готовности текущего сервиса или ресурса."
    if kind == "константа":
        return f"Хранит константное значение `{name}`."
    lower_name = name.lower()
    if "provider" in lower_name:
        return f"Провайдер `{name}`."
    if "context" in lower_name:
        return f"Контекст `{name}`."
    if name.startswith("use"):
        return f"Хук `{name}`."
    if kind == "класс":
        if name.endswith("Protocol"):
            return f"Протокол `{name}`."
        if "/models" in module_path:
            return f"Описывает модель или доменную сущность `{name}`."
        return f"Класс `{name}`."
    if name[:1].isupper() and kind in {"функция", "асинхронная функция"}:
        return f"React-компонент `{name}`."
    if name in {"get", "post", "put", "patch", "delete"}:
        return f"Обрабатывает {name.upper()}-запрос."
    if kind == "асинхронная функция":
        return f"Асинхронная функция `{name}`."
    if kind == "функция":
        return f"Функция `{name}`."
    return f"{kind.capitalize()} `{name}`."


def is_generic_summary(summary: str) -> bool:
    summary = summary.strip()
    if not summary:
        return True
    if not contains_cyrillic(summary) and re.search(r"[A-Za-z]", summary):
        return True
    generic_prefixes = (
        "Выполняет API-запрос для операции ",
        "React-компонент `",
        "React-хук `",
        "Функция `",
        "Метод для `",
        "Константа `",
        "Провайдер `",
        "Контекст `",
        "Класс `",
        "Создает `",
        "Разрешает `",
        "Возвращает `",
        "Проверяет `",
        "Форматирует `",
        "Считывает `",
    )
    if summary.startswith(generic_prefixes):
        return True
    generic_fragments = (
        "вспомогательную обработку для",
        "для отображения в админ-панели",
        "API-представление для",
        "значение ",
    )
    if any(fragment in summary for fragment in generic_fragments):
        return True
    english_tokens = re.findall(r"\b[A-Za-z]{2,}\b", summary)
    if len(english_tokens) >= 2 and contains_cyrillic(summary):
        return True
    return False


def is_generic_description(description: str) -> bool:
    description = description.strip()
    if not description:
        return True
    if not contains_cyrillic(description) and re.search(r"[A-Za-z]", description):
        return True
    generic_phrases = (
        "Параметр `",
        "Аргумент `",
        "Промис с данными, возвращаемыми этой функцией.",
        "Функция не возвращает значение.",
        "Объект типа ",
        "Сконфигурированный HTTP-клиент для выполнения запроса.",
        "Возвращает результат для сущности ",
        "Возвращает результат `",
    )
    return description.startswith(generic_phrases)


def split_intro_sections(lines: list[str]) -> tuple[str, str]:
    paragraphs: list[str] = []
    current: list[str] = []

    for raw_line in lines:
        stripped = raw_line.strip()
        if not stripped:
            if current:
                paragraphs.append(" ".join(current))
                current = []
            continue
        current.append(stripped)

    if current:
        paragraphs.append(" ".join(current))

    if not paragraphs:
        return "", ""
    if len(paragraphs) == 1:
        return paragraphs[0], ""
    return paragraphs[0], " ".join(paragraphs[1:])


def format_annotation(node: ast.AST | None) -> str:
    if node is None:
        return ""
    try:
        return ast.unparse(node)
    except Exception:
        return ""


def format_default(node: ast.AST | None) -> str:
    if node is None:
        return ""
    try:
        return ast.unparse(node)
    except Exception:
        return "..."


def normalize_python_doc_section(line: str) -> str | None:
    match = PY_DOC_SECTION_RE.match(line.strip())
    if match is None:
        return None

    token = match.group(1).lower()
    if token.startswith(("arg", "param")):
        return "params"
    return "returns"


def parse_python_docstring(value: str | None) -> ParsedDocBlock:
    if not value:
        return ParsedDocBlock()

    cleaned = inspect.cleandoc(value)
    intro_lines: list[str] = []
    parsed = ParsedDocBlock()
    section: str | None = None
    current_param_name: str | None = None
    in_intro = True

    for raw_line in cleaned.splitlines():
        stripped = raw_line.strip()
        next_section = normalize_python_doc_section(stripped)
        if next_section is not None:
            section = next_section
            current_param_name = None
            in_intro = False
            continue

        if in_intro:
            intro_lines.append(raw_line)
            continue

        if section == "params":
            if not stripped:
                continue
            param_match = PY_PARAM_RE.match(stripped)
            if param_match is not None:
                raw_name, doc_type, description = param_match.groups()
                name = raw_name.lstrip("*")
                parsed.params[name] = CallableParameterDoc(
                    name=name,
                    type_name=(doc_type or "").strip(),
                    description=description.strip(),
                )
                current_param_name = name
                continue
            if current_param_name is not None:
                current = parsed.params[current_param_name]
                current.description = join_sentence_parts(current.description, stripped)
            continue

        if section == "returns":
            if not stripped:
                continue
            if not parsed.returns.type_name and ":" in stripped:
                maybe_type, maybe_desc = stripped.split(":", 1)
                if maybe_type.strip():
                    parsed.returns.type_name = maybe_type.strip()
                    parsed.returns.description = maybe_desc.strip()
                    continue
            parsed.returns.description = join_sentence_parts(parsed.returns.description, stripped)

    parsed.summary, parsed.details = split_intro_sections(intro_lines)
    return parsed


def normalize_parameter_kind(kind: str) -> str:
    return {
        "positional_only": "только позиционный",
        "positional_or_keyword": "позиционный или именованный",
        "var_positional": "произвольное число позиционных",
        "keyword_only": "только именованный",
        "var_keyword": "произвольные именованные",
        "required": "обязательный",
        "optional": "необязательный",
        "rest": "rest-параметр",
    }.get(kind, kind)


def format_python_callable_signature(node: ast.FunctionDef | ast.AsyncFunctionDef) -> str:
    args = node.args
    parts: list[str] = []

    positional = list(args.posonlyargs) + list(args.args)
    positional_defaults = [None] * (len(positional) - len(args.defaults)) + list(args.defaults)
    posonly_count = len(args.posonlyargs)
    inserted_slash = False

    for index, (arg, default) in enumerate(zip(positional, positional_defaults), start=1):
        token = arg.arg
        annotation = format_annotation(arg.annotation)
        if annotation:
            token = f"{token}: {annotation}"
        if default is not None:
            token = f"{token}={format_default(default) or '...'}"
        parts.append(token)
        if not inserted_slash and posonly_count and index == posonly_count:
            parts.append("/")
            inserted_slash = True

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
            token = f"{token}={format_default(default) or '...'}"
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


def build_python_parameters(
    node: ast.FunctionDef | ast.AsyncFunctionDef,
    doc_block: ParsedDocBlock,
    *,
    is_method: bool,
    module_path: str,
) -> list[CallableParameterDoc]:
    args = node.args
    parameters: list[CallableParameterDoc] = []

    def append_parameter(
        arg: ast.arg,
        default: ast.AST | None,
        *,
        kind: str,
        raw_name: str | None = None,
    ) -> None:
        name = raw_name or arg.arg
        if is_method and not parameters and name in {"self", "cls"}:
            return

        doc_entry = doc_block.params.get(name)
        type_name = format_annotation(arg.annotation) or (doc_entry.type_name if doc_entry else "")
        description = doc_entry.description if doc_entry else ""
        parameters.append(
            CallableParameterDoc(
                name=name,
                type_name=type_name,
                default=format_default(default),
                kind=normalize_parameter_kind(kind),
                description=(
                    fallback_parameter_description(
                        name,
                        type_name,
                        owner_name=node.name,
                        kind="метод" if is_method else "функция",
                        module_path=module_path,
                    )
                    if is_generic_description(description)
                    else description
                )
                or fallback_parameter_description(
                    name,
                    type_name,
                    owner_name=node.name,
                    kind="метод" if is_method else "функция",
                    module_path=module_path,
                ),
            )
        )

    positional = list(args.posonlyargs) + list(args.args)
    positional_defaults = [None] * (len(positional) - len(args.defaults)) + list(args.defaults)
    posonly_count = len(args.posonlyargs)

    for index, (arg, default) in enumerate(zip(positional, positional_defaults)):
        kind = "positional_only" if index < posonly_count else "positional_or_keyword"
        append_parameter(arg, default, kind=kind)

    if args.vararg is not None:
        append_parameter(args.vararg, None, kind="var_positional", raw_name=args.vararg.arg)

    for arg, default in zip(args.kwonlyargs, args.kw_defaults):
        append_parameter(arg, default, kind="keyword_only")

    if args.kwarg is not None:
        append_parameter(args.kwarg, None, kind="var_keyword", raw_name=args.kwarg.arg)

    return parameters


def build_python_return(
    node: ast.FunctionDef | ast.AsyncFunctionDef,
    doc_block: ParsedDocBlock,
    *,
    is_method: bool,
    module_path: str,
) -> CallableReturnDoc | None:
    type_name = format_annotation(node.returns) or doc_block.returns.type_name
    raw_description = doc_block.returns.description
    description = (
        fallback_return_description(type_name, node.name, kind="метод" if is_method else "функция", module_path=module_path)
        if is_generic_description(raw_description)
        else raw_description
    )
    if not description and type_name:
        description = fallback_return_description(type_name, node.name, kind="метод" if is_method else "функция", module_path=module_path)
    if not type_name and not description:
        return None
    return CallableReturnDoc(type_name=type_name, description=description)


def parse_python_callable(
    node: ast.FunctionDef | ast.AsyncFunctionDef,
    *,
    is_method: bool,
    module_path: str,
) -> PythonCallableDoc:
    doc_block = parse_python_docstring(ast.get_docstring(node))
    decorators = [item for item in (format_annotation(decorator) for decorator in node.decorator_list) if item]
    callable_kind = "асинхронный метод" if is_method and isinstance(node, ast.AsyncFunctionDef) else (
        "метод" if is_method else "асинхронная функция" if isinstance(node, ast.AsyncFunctionDef) else "функция"
    )
    return PythonCallableDoc(
        name=node.name,
        kind=callable_kind,
        signature=format_python_callable_signature(node),
        summary=fallback_summary(node.name, callable_kind, module_path=module_path)
        if is_generic_summary(doc_block.summary)
        else doc_block.summary,
        details=doc_block.details,
        parameters=build_python_parameters(node, doc_block, is_method=is_method, module_path=module_path),
        returns=build_python_return(node, doc_block, is_method=is_method, module_path=module_path),
        decorators=decorators,
    )


def parse_python_module(path: Path) -> PythonModuleDoc | None:
    rel_path = str(path.relative_to(ROOT)).replace("\\", "/")
    try:
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source)
    except Exception:
        return None

    module_doc = parse_python_docstring(ast.get_docstring(tree))
    functions: list[PythonCallableDoc] = []
    classes: list[PythonClassDoc] = []

    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            functions.append(parse_python_callable(node, is_method=False, module_path=rel_path))
            continue

        if isinstance(node, ast.ClassDef):
            class_doc = parse_python_docstring(ast.get_docstring(node))
            bases = ", ".join(format_annotation(base) for base in node.bases if format_annotation(base))
            decorators = [item for item in (format_annotation(decorator) for decorator in node.decorator_list) if item]
            methods: list[PythonCallableDoc] = []
            for child in node.body:
                if not isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    continue
                methods.append(parse_python_callable(child, is_method=True, module_path=rel_path))
            classes.append(
                PythonClassDoc(
                    name=node.name,
                    bases=bases,
                    summary=fallback_summary(node.name, "класс", module_path=rel_path)
                    if is_generic_summary(class_doc.summary)
                    else class_doc.summary,
                    details=class_doc.details,
                    decorators=decorators,
                    methods=methods,
                )
            )

    return PythonModuleDoc(
        path=rel_path,
        summary=module_doc.summary,
        details=module_doc.details,
        functions=functions,
        classes=classes,
    )


def parse_ts_jsdoc(lines: list[str], declaration_index: int) -> ParsedDocBlock:
    index = declaration_index - 1
    while index >= 0 and not lines[index].strip():
        index -= 1
    if index < 0 or not lines[index].strip().endswith("*/"):
        return ParsedDocBlock()

    doc_lines: list[str] = []
    while index >= 0:
        current = lines[index].strip()
        doc_lines.append(current)
        if current.startswith("/**"):
            break
        index -= 1

    if not doc_lines or not doc_lines[-1].startswith("/**"):
        return ParsedDocBlock()

    cleaned_lines: list[str] = []
    for line in reversed(doc_lines):
        value = line.removeprefix("/**").removesuffix("*/").strip()
        value = value.removeprefix("*").strip()
        cleaned_lines.append(value)

    intro_lines: list[str] = []
    parsed = ParsedDocBlock()
    current_tag: tuple[str, str] | None = None
    before_tags = True

    for raw_line in cleaned_lines:
        if not raw_line:
            if before_tags:
                intro_lines.append("")
            continue

        tag_match = TS_JSDOC_TAG_RE.match(raw_line)
        if tag_match is None:
            if before_tags:
                intro_lines.append(raw_line)
                continue

            if current_tag is None:
                continue

            section, name = current_tag
            if section == "param":
                param = parsed.params[name]
                param.description = join_sentence_parts(param.description, raw_line)
            elif section == "returns":
                parsed.returns.description = join_sentence_parts(parsed.returns.description, raw_line)
            continue

        before_tags = False
        tag_name = tag_match.group(1).lower()
        payload = tag_match.group(2).strip()

        if tag_name == "param":
            param_match = TS_JSDOC_PARAM_RE.match(payload)
            if param_match is None:
                continue
            type_name, raw_name, description = param_match.groups()
            normalized_name = raw_name.strip("[]")
            normalized_name = normalized_name.split("=", 1)[0].rstrip("?")
            parsed.params[normalized_name] = CallableParameterDoc(
                name=normalized_name,
                type_name=(type_name or "").strip(),
                description=description.strip(),
            )
            current_tag = ("param", normalized_name)
            continue

        if tag_name in {"returns", "return"}:
            return_match = TS_JSDOC_RETURN_RE.match(payload)
            if return_match is not None:
                parsed.returns.type_name = (return_match.group(1) or "").strip()
                parsed.returns.description = return_match.group(2).strip()
                current_tag = ("returns", "__return__")
            continue

        current_tag = None

    parsed.summary, parsed.details = split_intro_sections(intro_lines)
    return parsed


def collect_multiline_signature(lines: list[str], start_index: int) -> str:
    signature = lines[start_index].strip()
    next_index = start_index
    while next_index + 1 < len(lines):
        if signature.count("(") <= signature.count(")") and ("=>" in signature or "{" in signature or signature.endswith(";")):
            break
        next_index += 1
        signature = f"{signature} {lines[next_index].strip()}"
        if len(signature) > 320:
            break
    return re.sub(r"\s+", " ", signature).strip()


def split_top_level(text: str, delimiter: str) -> list[str]:
    parts: list[str] = []
    current: list[str] = []
    depth = 0
    quote: str | None = None
    pairs = {"(": ")", "[": "]", "{": "}", "<": ">"}
    closing = set(pairs.values())

    for char in text:
        if quote is not None:
            current.append(char)
            if char == quote:
                quote = None
            continue

        if char in {"'", '"', "`"}:
            quote = char
            current.append(char)
            continue

        if char in pairs:
            depth += 1
            current.append(char)
            continue

        if char in closing:
            depth = max(0, depth - 1)
            current.append(char)
            continue

        if char == delimiter and depth == 0:
            parts.append("".join(current).strip())
            current = []
            continue

        current.append(char)

    tail = "".join(current).strip()
    if tail:
        parts.append(tail)
    return parts


def extract_parenthesized_block(signature: str) -> tuple[str, int] | None:
    start = signature.find("(")
    if start < 0:
        return None

    depth = 0
    for index in range(start, len(signature)):
        char = signature[index]
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return signature[start + 1:index], index
    return None


def split_top_level_once(text: str, delimiter: str) -> tuple[str, str]:
    parts = split_top_level(text, delimiter)
    if len(parts) <= 1:
        return text.strip(), ""
    head = parts[0].strip()
    tail = delimiter.join(part.strip() for part in parts[1:]).strip()
    return head, tail


def normalize_ts_name(raw_name: str) -> tuple[str, str]:
    token = raw_name.strip()
    kind = "required"

    if token.startswith("..."):
        token = token[3:].strip()
        kind = "rest"

    token = token.removeprefix("readonly ").strip()
    for modifier in ("public ", "private ", "protected "):
        token = token.removeprefix(modifier)

    if token.endswith("?"):
        token = token[:-1]
        kind = "optional"

    return token, normalize_parameter_kind(kind)


def extract_ts_return_type(signature: str, closing_paren_index: int, *, kind: str) -> str:
    if kind == "класс":
        return ""

    tail = signature[closing_paren_index + 1 :].strip()
    if not tail.startswith(":"):
        return ""

    tail = tail[1:].strip()
    for separator in ("=>", "{"):
        if separator in tail:
            tail = tail.split(separator, 1)[0].strip()
    return tail.rstrip(";").strip()


def build_ts_parameters(
    signature: str,
    doc_block: ParsedDocBlock,
    *,
    kind: str,
    owner_name: str,
    module_path: str,
) -> list[CallableParameterDoc]:
    if kind == "класс":
        return []

    param_block = extract_parenthesized_block(signature)
    if param_block is None:
        return []
    raw_params, _ = param_block
    if not raw_params.strip():
        return []

    parameters: list[CallableParameterDoc] = []
    for token in split_top_level(raw_params, ","):
        if not token:
            continue

        head, default = split_top_level_once(token, "=")
        raw_name, type_name = split_top_level_once(head, ":")
        name, param_kind = normalize_ts_name(raw_name)
        doc_entry = doc_block.params.get(name)
        doc_type_name = doc_entry.type_name if doc_entry is not None else ""
        doc_description = doc_entry.description if doc_entry is not None else ""
        parameters.append(
            CallableParameterDoc(
                name=name or raw_name.strip(),
                type_name=type_name or doc_type_name,
                default=default,
                kind=param_kind,
                description=(
                    fallback_parameter_description(
                        name or raw_name.strip(),
                        type_name or doc_type_name,
                        owner_name=owner_name,
                        kind=kind,
                        module_path=module_path,
                    )
                    if is_generic_description(doc_description)
                    else doc_description
                )
                or fallback_parameter_description(
                    name or raw_name.strip(),
                    type_name or doc_type_name,
                    owner_name=owner_name,
                    kind=kind,
                    module_path=module_path,
                ),
            )
        )

    return parameters


def build_ts_return(
    signature: str,
    doc_block: ParsedDocBlock,
    *,
    kind: str,
    module_path: str,
) -> CallableReturnDoc | None:
    param_block = extract_parenthesized_block(signature)
    closing_index = param_block[1] if param_block is not None else -1
    type_name = extract_ts_return_type(signature, closing_index, kind=kind) if closing_index >= 0 else ""
    type_name = type_name or doc_block.returns.type_name
    match = TS_DECLARATION_RE.match(signature.strip())
    owner_name = match.group(1) if match is not None else (
        signature.split("(", 1)[0].split()[-1] if "(" in signature else signature.split()[-1]
    )
    description = (
        fallback_return_description(type_name, owner_name, kind=kind, module_path=module_path)
        if is_generic_description(doc_block.returns.description)
        else doc_block.returns.description
    ) or (
        fallback_return_description(type_name, owner_name, kind=kind, module_path=module_path)
        if type_name or owner_name
        else ""
    )
    if not type_name and not description:
        return None
    return CallableReturnDoc(type_name=type_name, description=description)


def infer_ts_declaration_kind(signature: str) -> str:
    stripped = signature.strip()
    if " class " in f" {stripped} " or stripped.startswith("class ") or " export class " in f" {stripped} ":
        return "класс"
    if "function " in stripped and "async" in stripped.split("function", 1)[0]:
        return "асинхронная функция"
    if "function " in stripped or "=>" in stripped:
        return "функция"
    return "константа"


def parse_typescript_module(path: Path) -> TsModuleDoc | None:
    rel_path = str(path.relative_to(ROOT)).replace("\\", "/")
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
        if not line.startswith("export "):
            continue
        if not TS_DECLARATION_RE.match(line):
            continue
        if line.startswith("const ") and "=>" not in line:
            continue

        signature = collect_multiline_signature(lines, index)
        match = TS_DECLARATION_RE.match(line)
        if match is None:
            continue

        doc_block = parse_ts_jsdoc(lines, index)
        kind = infer_ts_declaration_kind(signature)
        declarations.append(
            TsDeclarationDoc(
                name=match.group(1),
                kind=kind,
                signature=signature,
                summary=fallback_summary(match.group(1), kind, module_path=rel_path)
                if is_generic_summary(doc_block.summary)
                else doc_block.summary,
                details=doc_block.details,
                parameters=build_ts_parameters(
                    signature,
                    doc_block,
                    kind=kind,
                    owner_name=match.group(1),
                    module_path=rel_path,
                ),
                returns=build_ts_return(signature, doc_block, kind=kind, module_path=rel_path),
            )
        )

    return TsModuleDoc(path=rel_path, declarations=declarations)


def append_parameters_markdown(lines: list[str], parameters: list[CallableParameterDoc], *, indent: str = "") -> None:
    if not parameters:
        lines.append(f"{indent}- Параметры: нет")
        return

    lines.append(f"{indent}- Параметры: {len(parameters)}")
    for param in parameters:
        lines.append(f"{indent}  - `{param.name}`")
        lines.append(f"{indent}    - Формат: `{param.type_name}`" if param.type_name else f"{indent}    - Формат: не указан")
        lines.append(f"{indent}    - Вид: {param.kind or 'не указан'}")
        if param.default:
            lines.append(f"{indent}    - Значение по умолчанию: `{param.default}`")
        if param.description:
            lines.append(f"{indent}    - Описание: {param.description}")


def append_return_markdown(lines: list[str], return_doc: CallableReturnDoc | None, *, indent: str = "") -> None:
    if return_doc is None:
        lines.append(f"{indent}- Возвращает: нет")
        return

    lines.append(
        f"{indent}- Возвращает: `{return_doc.type_name}`"
        if return_doc.type_name
        else f"{indent}- Возвращает: не указан"
    )
    if return_doc.description:
        lines.append(f"{indent}  - Описание: {return_doc.description}")


def append_python_callable_markdown(lines: list[str], item: PythonCallableDoc, *, heading: str) -> None:
    lines.append(f"{heading} `{item.signature}`")
    lines.append("")
    lines.append(f"- Вид: {item.kind}")
    if item.summary:
        lines.append(f"- Кратко: {item.summary}")
    if item.details:
        lines.append(f"- Детали: {item.details}")
    if item.decorators:
        lines.append(f"- Декораторы: {', '.join(f'`{decorator}`' for decorator in item.decorators)}")
    append_parameters_markdown(lines, item.parameters)
    append_return_markdown(lines, item.returns)
    lines.append("")


def append_ts_declaration_markdown(lines: list[str], decl: TsDeclarationDoc, *, heading: str) -> None:
    lines.append(f"{heading} `{decl.signature}`")
    lines.append("")
    lines.append(f"- Вид: {decl.kind}")
    if decl.summary:
        lines.append(f"- Кратко: {decl.summary}")
    if decl.details:
        lines.append(f"- Детали: {decl.details}")
    append_parameters_markdown(lines, decl.parameters)
    append_return_markdown(lines, decl.returns)
    lines.append("")


def render_backend_markdown(modules: list[PythonModuleDoc]) -> str:
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        "# Справочник Backend",
        "",
        f"Сгенерировано: {generated_at}",
        "",
        f"Всего модулей: {len(modules)}",
        "",
    ]

    for module in modules:
        lines.append(f"## `{module.path}`")
        lines.append("")
        if module.summary:
            lines.append(f"- Кратко: {module.summary}")
        if module.details:
            lines.append(f"- Детали: {module.details}")
        lines.append(f"- Функции: {len(module.functions)}")
        lines.append(f"- Классы: {len(module.classes)}")
        lines.append("")

        if module.functions:
            lines.append("### Функции")
            lines.append("")
            for item in module.functions:
                append_python_callable_markdown(lines, item, heading="####")

        if module.classes:
            lines.append("### Классы")
            lines.append("")
            for cls in module.classes:
                header = f"#### `{cls.name}`"
                if cls.bases:
                    header = f"{header} : `{cls.bases}`"
                lines.append(header)
                lines.append("")
                if cls.summary:
                    lines.append(f"- Кратко: {cls.summary}")
                if cls.details:
                    lines.append(f"- Детали: {cls.details}")
                if cls.decorators:
                    lines.append(f"- Декораторы: {', '.join(f'`{decorator}`' for decorator in cls.decorators)}")
                lines.append(f"- Методы: {len(cls.methods)}")
                lines.append("")
                for method in cls.methods:
                    append_python_callable_markdown(lines, method, heading="#####")

    return "\n".join(lines).rstrip() + "\n"


def render_frontend_markdown(modules: list[TsModuleDoc]) -> str:
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        "# Справочник Frontend",
        "",
        f"Сгенерировано: {generated_at}",
        "",
        f"Всего модулей: {len(modules)}",
        "",
    ]

    for module in modules:
        lines.append(f"## `{module.path}`")
        lines.append("")
        lines.append(f"- Экспортируемые объявления: {len(module.declarations)}")
        lines.append("")
        if module.declarations:
            lines.append("### Объявления")
            lines.append("")
            for decl in module.declarations:
                append_ts_declaration_markdown(lines, decl, heading="####")

    return "\n".join(lines).rstrip() + "\n"


def render_index_markdown(backend_modules: int, frontend_modules: int) -> str:
    lines = [
        "# Документация Проекта",
        "",
        "В этой директории находится сгенерированная справочная документация по коду.",
        "",
        "## Содержимое",
        "",
        f"- [Справочник Backend](generated/backend-reference.md) ({backend_modules} модулей)",
        f"- [Справочник Frontend](generated/frontend-reference.md) ({frontend_modules} модулей)",
        "",
        "## Что Входит",
        "",
        "- Backend: Python-модули из `backend/**/*.py` и `backend/**/*.pyi` без тестов и медиа-артефактов.",
        "- Frontend: экспортируемые TypeScript-модули из `frontend/src/**/*.ts` и `frontend/src/**/*.tsx` без тестов.",
        "- Исключаются кеши, виртуальные окружения, build-вывод, миграции и vendor-каталоги.",
        "",
        "## Как Перегенерировать",
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
            parse_python_module(path) for path in sorted(iter_files(BACKEND_ROOT, (".py", ".pyi")))
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
    BACKEND_DOC_PATH.write_text(render_backend_markdown(backend_modules), encoding="utf-8-sig")
    FRONTEND_DOC_PATH.write_text(render_frontend_markdown(frontend_modules), encoding="utf-8-sig")
    INDEX_DOC_PATH.write_text(
        render_index_markdown(len(backend_modules), len(frontend_modules)),
        encoding="utf-8-sig",
    )

    print(f"Backend modules: {len(backend_modules)}")
    print(f"Frontend modules: {len(frontend_modules)}")
    print(f"Written: {BACKEND_DOC_PATH.relative_to(ROOT)}")
    print(f"Written: {FRONTEND_DOC_PATH.relative_to(ROOT)}")
    print(f"Written: {INDEX_DOC_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
