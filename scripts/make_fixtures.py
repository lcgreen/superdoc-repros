"""Builds the three synthetic documents under docs/. No third-party packages."""
import zipfile
from pathlib import Path

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
CONTENT_TYPES = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    "</Types>"
)
RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    "</Relationships>"
)
REV = 'w:author="Reviewer" w:date="2026-01-01T00:00:00Z"'
SECT = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>'


def p(text: str) -> str:
    return f'<w:p><w:r><w:t xml:space="preserve">{text}</w:t></w:r></w:p>'


def write(name: str, body: str) -> None:
    document = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<w:document xmlns:w="{W}"><w:body>{body}{SECT}</w:body></w:document>'
    )
    path = Path(__file__).resolve().parent.parent / "docs" / f"{name}.docx"
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("_rels/.rels", RELS)
        z.writestr("word/document.xml", document)
    print(path.name, path.stat().st_size, "bytes")


def deleted_entry(n: int, text: str) -> str:
    """A contents entry (HYPERLINK field wrapping a PAGEREF field) deleted as a tracked change, paragraph mark included."""
    fld = lambda kind: f'<w:r><w:fldChar w:fldCharType="{kind}"/></w:r>'
    instr = lambda t: f'<w:r><w:delInstrText xml:space="preserve"> {t} </w:delInstrText></w:r>'
    dt = lambda t: f"<w:r><w:delText>{t}</w:delText></w:r>"
    return (
        f'<w:p><w:pPr><w:rPr><w:del w:id="{900 + 2 * n - 1}" {REV}/></w:rPr></w:pPr><w:del w:id="{900 + 2 * n}" {REV}>'
        + fld("begin") + instr(f'HYPERLINK \\l "_Toc90000000{n}"') + fld("separate")
        + dt(f"{8 + n}.") + "<w:r><w:tab/></w:r>" + dt(text) + "<w:r><w:tab/></w:r>"
        + fld("begin") + instr(f"PAGEREF _Toc90000000{n} \\h") + fld("separate") + dt(str(7 + n)) + fld("end")
        + fld("end") + "</w:del></w:p>"
    )


def deleted_field() -> str:
    return (
        p("Contents of the deleted field fixture, one plain line to drag from.")
        + deleted_entry(1, "A contents entry that the redline removed from the table")
        + p("Schedule 1. A plain paragraph after the deleted contents entry.")
        + p("A second plain paragraph, so there is somewhere else to click.")
    )


LOREM = (
    "The Tenant shall pay the Annual Rent and any VAT in respect of it by four equal instalments in advance "
    "on or before the Rent Payment Dates, and shall not exercise any right of set-off or counterclaim. "
)


def long_document(paragraphs: int = 900) -> str:
    """Plain text only: long enough that one transaction takes a while to render."""
    return "".join(p(f"{n}. {LOREM * 3}") for n in range(1, paragraphs + 1))


def deleted_rows() -> str:
    """One table with several rows deleted as tracked changes by the same author at the same time."""
    ids = iter(range(1000, 2000))

    def cell(text: str, deleted: bool) -> str:
        run = (
            f'<w:del w:id="{next(ids)}" {REV}><w:r><w:delText>{text}</w:delText></w:r></w:del>'
            if deleted
            else f"<w:r><w:t>{text}</w:t></w:r>"
        )
        return f'<w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p>{run}</w:p></w:tc>'

    def row(label: str, deleted: bool) -> str:
        tr_pr = f'<w:trPr><w:del w:id="{next(ids)}" {REV}/></w:trPr>' if deleted else ""
        return f"<w:tr>{tr_pr}{''.join(cell(f'{label} {c}', deleted) for c in 'ABC')}</w:tr>"

    rows = [row("Kept one", False), row("Deleted one", True), row("Deleted two", True), row("Kept two", False), row("Deleted three", True)]
    table = '<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="3000"/><w:gridCol w:w="3000"/><w:gridCol w:w="3000"/></w:tblGrid>' + "".join(rows) + "</w:tbl>"
    return p("A plain paragraph before the table, to type into.") + table + p("A plain paragraph after the table.")


if __name__ == "__main__":
    write("deleted-field", deleted_field())
    write("long-document", long_document())
    write("deleted-rows", deleted_rows())
    write("plain", "".join(p(f"{n}. {LOREM}") for n in range(1, 6)))
