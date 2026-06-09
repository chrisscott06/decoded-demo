"""Site name resolver — maps spelling variants across spreadsheets to canonical IDs."""

CANONICAL_SITES = {
    "austin-heath": {
        "display": "Austin Heath",
        "ref": "AH",
        "variants": ["Austin Heath", "Austin Heath Village"],
    },
    "gifford-lea": {
        "display": "Gifford Lea",
        "ref": "GL",
        "variants": ["Gifford Lea"],
    },
    "bramshott-place": {
        "display": "Bramshott Place",
        "ref": "BP",
        "variants": ["Bramshott Place"],
    },
    "millbrook-village": {
        "display": "Millbrook Village",
        "ref": "MV",
        "variants": ["Millbrook Village"],
    },
    "durrants-village": {
        "display": "Durrants Village",
        "ref": "DV",
        "variants": ["Durrants Village"],
    },
    "great-alne-park": {
        "display": "Great Alne Park",
        "ref": "GAP",
        "variants": ["Great Alne Park"],
    },
    "ledian-gardens": {
        "display": "Ledian Gardens",
        "ref": "LG",
        "variants": ["Ledian Gardens"],
    },
    "elderswell": {
        "display": "Elderswell",
        "ref": "EW",
        "variants": ["Elderswell"],
    },
    "millfield-green": {
        "display": "Millfield Green",
        "ref": "MFG",
        "variants": ["Millfield Green"],
    },
    "ampfield-meadows": {
        "display": "Ampfield Meadows",
        "ref": "AM",
        "variants": ["Ampfield Meadows"],
    },
    "blendworth-hills": {
        "display": "Blendworth Hills",
        "ref": "BH",
        "variants": ["Blendworth Hills"],
    },
    "sonning-common": {
        "display": "Sonning Common",
        "ref": "SC",
        "variants": ["Sonning Common"],
    },
    "edwalton-office": {
        "display": "Edwalton Office",
        "ref": "HQ",
        "variants": ["Edwalton Office", "Head Office", "Edwalton Business Park"],
    },
}

# Build reverse lookup at module load
_VARIANT_TO_ID = {}
for site_id, info in CANONICAL_SITES.items():
    for variant in info["variants"]:
        _VARIANT_TO_ID[variant.lower().strip()] = site_id

# Known unmapped sites in source data — flag, don't fail
KNOWN_UNMAPPED = {"edenbridge", "little mount farm", "portfolio total"}


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
