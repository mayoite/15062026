# Local backup mirror

Canonical repo: **`E:\16062026`**. Backup copy: **`E:\Goodsites\15062026`**.

## Commands

```bash
npm.cmd run backup:sync          # one-shot mirror (incl. deletions)
npm.cmd run backup:sync:install  # register scheduled task (every 5 min)
npm.cmd run backup:sync:watch    # live watcher (optional)
```

Log on backup copy: `E:\Goodsites\15062026\BACKUP-SYNC.log`

Do not edit the backup tree for feature work.