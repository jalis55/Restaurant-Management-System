# bill_pdf_builder.py
# ─────────────────────────────────────────────────────────────────────────────
# All PDF-building helpers for the restaurant bill.
# Import and call `build_bill_pdf(order)` → returns a BytesIO buffer.
# ─────────────────────────────────────────────────────────────────────────────

from dis import disco
from io import BytesIO

from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ── Constants ─────────────────────────────────────────────────────────────────

MARGIN = 18 * mm
PAGE_W, _ = A4
CONTENT_W = PAGE_W - 2 * MARGIN

# ── Colour palette ────────────────────────────────────────────────────────────

C = {
    "header_bg":    colors.HexColor("#0f172a"),
    "header_fg":    colors.white,
    "header_sub":   colors.HexColor("#cbd5e1"),
    "header_muted": colors.HexColor("#94a3b8"),
    "label":        colors.HexColor("#64748b"),
    "value":        colors.HexColor("#101828"),
    "meta_bg":      colors.HexColor("#f8fafc"),
    "meta_border":  colors.HexColor("#d0d5dd"),
    "table_hdr":    colors.HexColor("#e2e8f0"),
    "table_hdr_fg": colors.HexColor("#0f172a"),
    "row_alt":      colors.HexColor("#f8fafc"),
    "divider":      colors.HexColor("#e5e7eb"),
    "note":         colors.HexColor("#667085"),
    "total_bg":     colors.HexColor("#f1f5f9"),
    "footer":       colors.HexColor("#94a3b8"),
    "accent":       colors.HexColor("#0f172a"),
}

# ── Paragraph style factory ───────────────────────────────────────────────────

def make_style(name, *, font="Helvetica", size=10, color=None,
               align=TA_LEFT, leading=None) -> ParagraphStyle:
    return ParagraphStyle(
        name,
        fontName=font,
        fontSize=size,
        textColor=color or C["value"],
        alignment=align,
        leading=leading or size * 1.35,
    )


# Pre-built styles
S = {
    "label":      make_style("label",      font="Helvetica-Bold",    size=8,  color=C["label"]),
    "value":      make_style("value",      size=10,                           color=C["value"]),
    "item_name":  make_style("item_name",  font="Helvetica-Bold",    size=10, color=C["value"]),
    "note":       make_style("note",       font="Helvetica-Oblique", size=9,  color=C["note"]),
    "th_l":       make_style("th_l",       font="Helvetica-Bold",    size=10, color=C["table_hdr_fg"]),
    "th_c":       make_style("th_c",       font="Helvetica-Bold",    size=10, color=C["table_hdr_fg"], align=TA_CENTER),
    "th_r":       make_style("th_r",       font="Helvetica-Bold",    size=10, color=C["table_hdr_fg"], align=TA_RIGHT),
    "td_c":       make_style("td_c",       size=10,                           color=C["value"],        align=TA_CENTER),
    "td_r":       make_style("td_r",       size=10,                           color=C["value"],        align=TA_RIGHT),
    "money_lbl":  make_style("money_lbl",  size=10,                           color=C["accent"]),
    "money_val":  make_style("money_val",  size=10,                           color=C["accent"],       align=TA_RIGHT),
    "money_lbl_b":make_style("money_lbl_b",font="Helvetica-Bold",    size=12, color=C["accent"]),
    "money_val_b":make_style("money_val_b",font="Helvetica-Bold",    size=12, color=C["accent"],       align=TA_RIGHT),
    "footer_l":   make_style("footer_l",   size=8,                            color=C["footer"]),
    "footer_r":   make_style("footer_r",   size=8,                            color=C["footer"],       align=TA_RIGHT),
}

# ── Low-level helpers ─────────────────────────────────────────────────────────

def p(text, style_key: str) -> Paragraph:
    """Shorthand: create a Paragraph from a style key in S."""
    return Paragraph(str(text) if text else "-", S[style_key])


def flat_table(data, col_widths, style_commands) -> Table:
    """Build a Table with a TableStyle in one call."""
    tbl = Table(data, colWidths=col_widths)
    tbl.setStyle(TableStyle(style_commands))
    return tbl


def no_padding_style() -> list:
    """Zero-padding TableStyle commands (reusable base)."""
    return [
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
    ]


def inner_cell_style() -> TableStyle:
    """Padding style for nested meta-card cells."""
    return TableStyle([
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 5 * mm),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 5 * mm),
    ])


# ── Section builders ──────────────────────────────────────────────────────────

def build_header(order) -> Table:
    """Dark banner with title on the left, order number + timestamp on the right."""
    billed_at = timezone.localtime(order.billed_at).strftime("%Y-%m-%d %H:%M")

    title_style    = make_style("h_title", font="Helvetica-Bold", size=18, color=C["header_fg"])
    subtitle_style = make_style("h_sub",   size=10, color=C["header_sub"])
    ordnum_style   = make_style("h_ord",   font="Helvetica-Bold", size=12, color=C["header_fg"], align=TA_RIGHT)
    ts_style       = make_style("h_ts",    size=9, color=C["header_muted"], align=TA_RIGHT)

    data = [
        [Paragraph("Restaurant Bill", title_style),
         Paragraph(order.order_number, ordnum_style)],
        [Paragraph("Finalized order receipt and billing summary", subtitle_style),
         Paragraph(billed_at, ts_style)],
    ]
    return flat_table(data, [CONTENT_W * 0.65, CONTENT_W * 0.35], [
        ("BACKGROUND",    (0, 0), (-1, -1), C["header_bg"]),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 7),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6 * mm),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6 * mm),
        ("ROUNDEDCORNERS", [5 * mm]),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ])


def build_meta_card(order) -> Table:
    """2×2 grid card: order type, table, created-by, billed-by."""
    half = CONTENT_W / 2 - 2 * mm

    def meta_cell(label: str, value: str) -> Table:
        return flat_table(
            [[p(label.upper(), "label")], [p(value or "-", "value")]],
            [half],
            inner_cell_style().getCommands(),
        )

    created_by = order.created_by.get_full_name() or order.created_by.username
    billed_by  = (order.billed_by.get_full_name() or order.billed_by.username) if order.billed_by else "-"
    table_no   = str(order.table_number) if order.table_number else "-"

    data = [
        [meta_cell("Order Type", order.get_order_type_display()), meta_cell("Created By", created_by)],
        [meta_cell("Table",      table_no),                       meta_cell("Billed By",  billed_by)],
    ]
    return flat_table(data, [half + 2 * mm, half + 2 * mm], [
        ("BACKGROUND",    (0, 0), (-1, -1), C["meta_bg"]),
        ("BOX",           (0, 0), (-1, -1), 0.5, C["meta_border"]),
        ("ROUNDEDCORNERS", [4 * mm]),
        *no_padding_style(),
    ])


def build_notes_card(notes: str) -> Table:
    """Optional single-column card showing order notes."""
    return flat_table(
        [[p("ORDER NOTES", "label")], [p(notes, "value")]],
        [CONTENT_W],
        [
            ("BACKGROUND",    (0, 0), (-1, -1), colors.white),
            ("BOX",           (0, 0), (-1, -1), 0.5, C["meta_border"]),
            ("ROUNDEDCORNERS", [4 * mm]),
            ("TOPPADDING",    (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING",   (0, 0), (-1, -1), 5 * mm),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 5 * mm),
        ],
    )


def _build_item_cell(item_name: str, note: str | None, col_width: float):
    """Name + optional italic note stacked inside the item column."""
    if not note:
        return p(item_name, "item_name")
    return flat_table(
        [[p(item_name, "item_name")], [p(f"Note: {note}", "note")]],
        [col_width - 3 * mm],
        [
            ("TOPPADDING",    (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ("LEFTPADDING",   (0, 0), (-1, -1), 0),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ],
    )


def build_items_table(order) -> Table:
    """Header row + one data row per order item, with alternating backgrounds."""
    c_item, c_qty, c_price, c_total = (
        CONTENT_W * 0.50,
        CONTENT_W * 0.12,
        CONTENT_W * 0.19,
        CONTENT_W * 0.19,
    )

    rows = [[
        p("Item",       "th_l"),
        p("Qty",        "th_c"),
        p("Unit Price", "th_r"),
        p("Total",      "th_r"),
    ]]

    for item in order.items.all():
        line_total = item.quantity * item.unit_price
        rows.append([
            _build_item_cell(item.menu_item.name, item.notes, c_item),
            p(str(item.quantity),        "td_c"),
            p(f"${item.unit_price:.2f}", "td_r"),
            p(f"${line_total:.2f}",      "td_r"),
        ])

    return flat_table(rows, [c_item, c_qty, c_price, c_total], [
        # Header
        ("BACKGROUND",    (0, 0), (-1, 0),  C["table_hdr"]),
        ("TOPPADDING",    (0, 0), (-1, 0),  4 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, 0),  4 * mm),
        ("LEFTPADDING",   (0, 0), (0, 0),   4 * mm),
        ("RIGHTPADDING",  (-1, 0), (-1, 0), 4 * mm),
        # Data rows
        ("TOPPADDING",    (0, 1), (-1, -1), 3 * mm),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 3 * mm),
        ("LEFTPADDING",   (0, 1), (0, -1),  4 * mm),
        ("RIGHTPADDING",  (-1, 1), (-1, -1), 4 * mm),
        ("LEFTPADDING",   (1, 1), (-1, -1), 2),
        ("RIGHTPADDING",  (0, 1), (0, -1),  2),
        # Separators & backgrounds
        ("LINEBELOW",     (0, 0), (-1, -2), 0.5, C["divider"]),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, C["row_alt"]]),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ])


def build_totals_block(order) -> Table:
    """Right-aligned summary card: subtotal → discount → divider → final."""
    col_l = CONTENT_W * 0.55
    col_r = CONTENT_W * 0.45
    inner_l = col_r * 0.55
    inner_r = col_r * 0.45
    hr = HRFlowable(width="100%", thickness=0.5, color=C["meta_border"], spaceAfter=0)

    totals_inner = flat_table(
        [
            [p("Subtotal",     "money_lbl"), p(f"${order.total_amount:.2f}",    "money_val")],
            [p("Discount",     "money_lbl"), p(f"${order.discount_amount:.2f}", "money_val")],
            [hr, hr],
            [p("Final Amount", "money_lbl_b"), p(f"${order.final_amount:.2f}", "money_val_b")],
        ],
        [inner_l, inner_r],
        [
            ("TOPPADDING",    (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LEFTPADDING",   (0, 0), (-1, -1), 5 * mm),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 5 * mm),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ],
    )

    return flat_table(
        [[Spacer(col_l, 1), totals_inner]],
        [col_l, col_r],
        [
            ("BACKGROUND",    (1, 0), (1, 0), C["total_bg"]),
            ("BOX",           (1, 0), (1, 0), 0.5, C["meta_border"]),
            ("ROUNDEDCORNERS", [4 * mm]),
            *no_padding_style(),
        ],
    )


def build_footer(order) -> Table:
    """Two-column footer: discount info on the left, attribution on the right."""
    discount_info = (
        f"Discount Type: {order.discount_type.title()}  |  "
        f"Discount Value: {order.discount_value:.2f}"
    )
 
    return flat_table(
        [[p(discount_info, "footer_l"), p("Generated by KitchenSync v1.0", "footer_r")]],
        [CONTENT_W * 0.6, CONTENT_W * 0.4],
        no_padding_style(),
    )


# ── Public entry point ────────────────────────────────────────────────────────

def build_bill_pdf(order) -> BytesIO:
    """
    Render a complete bill PDF for `order` and return a seeked BytesIO buffer.
    Usage:
        buffer = build_bill_pdf(order)
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title=f"bill-{order.order_number}.pdf",
    )

    story = [
        build_header(order),        Spacer(1, 6 * mm),
        build_meta_card(order),     Spacer(1, 5 * mm),
    ]

    if order.notes:
        story += [build_notes_card(order.notes), Spacer(1, 5 * mm)]

    story += [
        build_items_table(order),   Spacer(1, 4 * mm),
        build_totals_block(order),  Spacer(1, 5 * mm),
        build_footer(order),
    ]

    doc.build(story)
    buffer.seek(0)
    return buffer