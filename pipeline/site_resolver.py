"""Site name resolver — maps spelling variants across spreadsheets to canonical IDs.

Demo template version. The 11 canonical IDs are kept identical to the source
IVG tool (austin-heath, gifford-lea, ...) so URL routes and committed JSON
keys stay stable; only the human-facing display + ref + variants are
re-skinned to school names for the fictional Westbrook Academies Trust.

Sonning Common and Edwalton Office (the 2 out-of-scope sites from the source
tool) are dropped — the demo runs as 11 schools, not 13.
"""

CANONICAL_SITES = {
    "austin-heath": {
        "display": "Beechgrove Primary School",
        "ref": "BPS",
        "variants": ["Beechgrove Primary School", "Beechgrove Primary"],
    },
    "gifford-lea": {
        "display": "Whitfield Secondary Academy",
        "ref": "WSA",
        "variants": ["Whitfield Secondary Academy", "Whitfield Secondary"],
    },
    "bramshott-place": {
        "display": "Holloway College",
        "ref": "HOC",
        "variants": ["Holloway College", "Holloway"],
    },
    "millbrook-village": {
        "display": "Marston Hill C of E Primary",
        "ref": "MHP",
        "variants": ["Marston Hill C of E Primary", "Marston Hill"],
    },
    "durrants-village": {
        "display": "Hartwell University Technical College",
        "ref": "HUT",
        "variants": ["Hartwell University Technical College", "Hartwell UTC"],
    },
    "great-alne-park": {
        "display": "St Margaret's Catholic Secondary",
        "ref": "STM",
        "variants": ["St Margaret's Catholic Secondary", "St Margaret's"],
    },
    "ledian-gardens": {
        "display": "Eastlea Federation",
        "ref": "EAF",
        "variants": ["Eastlea Federation", "Eastlea"],
    },
    "elderswell": {
        "display": "Riverdale Free School",
        "ref": "RVF",
        "variants": ["Riverdale Free School", "Riverdale"],
    },
    "millfield-green": {
        "display": "Penrith Community College",
        "ref": "PCC",
        "variants": ["Penrith Community College", "Penrith Community", "Penrith"],
    },
    "ampfield-meadows": {
        "display": "Aldergate Special Educational Needs School",
        "ref": "ASN",
        "variants": ["Aldergate Special Educational Needs School", "Aldergate SEN", "Aldergate"],
    },
    "blendworth-hills": {
        "display": "Pennington Pre-Prep & Junior",
        "ref": "PEP",
        "variants": ["Pennington Pre-Prep & Junior", "Pennington Prep", "Pennington"],
    },
}

# Build reverse lookup at module load
_VARIANT_TO_ID = {}
for site_id, info in CANONICAL_SITES.items():
    for variant in info["variants"]:
        _VARIANT_TO_ID[variant.lower().strip()] = site_id

# Known unmapped sites in source data — flag, don't fail.
# Sonning Common + Edwalton Office (the original 2 OOS sites) are listed
# here so any stale spreadsheet rows still in the source data get
# classified as "known OOS, expected" rather than "unmapped, surface for
# investigation."
KNOWN_UNMAPPED = {
    "edenbridge", "little mount farm", "portfolio total",
    "sonning common", "edwalton office", "head office",
    "edwalton business park",
}


def resolve(name):
    """Return canonical site ID for a name, or None if unmappable.

    Caller is responsible for handling None — typically by adding
    to an 'unmapped' list in the build log.
    """
    if name is None:
        return None
    key = str(name).lower().strip()
    if key in _VARIANT_TO_ID:
        return _VARIANT_TO_ID[key]
    return None


def is_known_unmapped(name):
    """True if a name is known to be unmapped (e.g. portfolio totals, out-of-scope sites)."""
    if name is None:
        return False
    return str(name).lower().strip() in KNOWN_UNMAPPED


def all_canonical_ids():
    return list(CANONICAL_SITES.keys())
