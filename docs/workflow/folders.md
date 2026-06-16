# Local folders

*`public/cdn/` vs `asset-cdn/` — git vs cloud.*

---

## One sentence

**`public/cdn/` is small and deployed; `asset-cdn/` is the large local mirror for upload; never commit bulk catalog to git.**

---

## Folder map

```
public/cdn/                 # IN GIT — deployed (~5–10 MB)
├── vendor/
├── tldraw@x.y.z/           # target (today: public/tldraw-assets/)
└── env/                    # target (today: public/cdn/*.hdr)

asset-cdn/                  # GITIGNORE heavy trees (upload mirror → R2)
├── images/                 # target for catalog photos
├── models/                 # target for GLBs
└── README.md

public/cdn/                 # SDKs + HDR (in git, deployed)
public/tldraw-assets/       # planner SDK assets (in git, deployed)

public/images/              # LEGACY local copies (migrating → asset-cdn/images)
public/models/              # LEGACY local copies (migrating → asset-cdn/models)
```

---

## Git policy

| Path | In git? | Deployed? |
|------|---------|-----------|
| `public/cdn/` | Yes | Yes |
| `asset-cdn/images/`, `models/` | No | No |

---

## Naming

No `cache` in durable names — use **`asset-cdn`**, **`oando-asset-cdn`**, **`public/cdn/`**.

---

## Related

[`operations.md`](operations.md) · [`README.md`](README.md)